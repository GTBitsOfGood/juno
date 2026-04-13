import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Post,
  Get,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiTags,
  ApiHeader,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ApiKeyProto,
  AuthCommonProto,
  CommonProto,
  JwtProto,
  ProjectProto,
  UserProto,
} from 'juno-proto';
import { lastValueFrom, Observable } from 'rxjs';
import { User } from 'src/decorators/user.decorator';
import {
  GetAllApiKeysResponse,
  IssueApiKeyRequest,
  IssueApiKeyResponse,
  IssueJWTResponse,
} from 'src/models/auth.dto';
import {
  RequestNewAccountModel,
  NewAccountRequestResponse,
  NewAccountRequestsResponse,
  AcceptAccountRequestResponseModel,
  userTypeStringToProto,
} from 'src/models/registration.dto';
import { userLinkedToProject } from 'src/user_project_validator';

const { JWT_SERVICE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME } = ApiKeyProto;
const { PROJECT_SERVICE_NAME } = ProjectProto;
const { ACCOUNT_REQUEST_SERVICE_NAME } = UserProto;

@ApiTags('auth')
@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtProto.JwtServiceClient;
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;
  private projectService: ProjectProto.ProjectServiceClient;
  private accountRequestService: UserProto.AccountRequestServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
    @Inject(PROJECT_SERVICE_NAME) private projectClient: ClientGrpc,
    @Inject(ACCOUNT_REQUEST_SERVICE_NAME)
    private accountRequestClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.jwtService =
      this.jwtClient.getService<JwtProto.JwtServiceClient>(JWT_SERVICE_NAME);
    this.apiKeyService =
      this.apiClient.getService<ApiKeyProto.ApiKeyServiceClient>(
        API_KEY_SERVICE_NAME,
      );
    this.projectService =
      this.projectClient.getService<ProjectProto.ProjectServiceClient>(
        PROJECT_SERVICE_NAME,
      );
    this.accountRequestService =
      this.accountRequestClient.getService<UserProto.AccountRequestServiceClient>(
        ACCOUNT_REQUEST_SERVICE_NAME,
      );
  }

  @Post('/api_key/jwt')
  @ApiOperation({
    summary:
      'Generates a temporary JWT for the project tied to a specified API key.',
    description:
      'JSON Web Tokens are used for the vast majority of API-gateway calls. The Juno SDK provides the means of automatically authenticating through this route given a valid API key.',
  })
  @ApiCreatedResponse({
    description: 'Successfully created a JWT.',
    type: IssueJWTResponse,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'A valid API key',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiBearerAuth('API_Key')
  async getApiKeyJWT(@Headers('Authorization') apiKey?: string) {
    const key = apiKey?.split(' ').at(1);
    if (!key) {
      throw new UnauthorizedException('API Key is required');
    }
    const jwt = await lastValueFrom(
      this.jwtService.createApiKeyJwt({ apiKey: key }),
    );
    return new IssueJWTResponse(jwt);
  }

  @Post('/user/jwt')
  @ApiOperation({
    summary: 'Generates a temporary JWT tied to a specified user.',
    description:
      'Generates a user identity token that can be used to authenticate admin and management endpoints in place of email/password credentials.',
  })
  @ApiCreatedResponse({
    description: 'Successfully created a JWT.',
    type: IssueJWTResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Invalid User Credentials',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of a user',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the user',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiBearerAuth('API_Key')
  async getUserJWT(@User() user: CommonProto.User) {
    const jwt = await lastValueFrom(this.jwtService.createUserJwt({ user }));
    return new IssueJWTResponse(jwt);
  }

  @ApiOperation({
    summary:
      'Issues a new API key for the project tied to the specified environment.',
  })
  @ApiCreatedResponse({
    description: 'The API Key has been successfully created',
    type: IssueApiKeyResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Invalid User Credentials',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of the user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiBody({ type: IssueApiKeyRequest })
  @Post('/key')
  async createApiKey(
    @User() user: CommonProto.User,
    @Body() issueApiKeyRequest: IssueApiKeyRequest,
  ) {
    if (!user) {
      throw new UnauthorizedException(
        "You must provide the user's email/password or use an ID token",
      );
    }
    const linked = await userLinkedToProject({
      project: issueApiKeyRequest.project,
      user,
      projectClient: this.projectService,
    });
    if (!linked || user.type == CommonProto.UserType.USER) {
      throw new UnauthorizedException(
        'Only Superadmins & Linked Admins can create API Keys',
      );
    }
    const obs = this.apiKeyService.issueApiKey({
      description: issueApiKeyRequest.description,
      environment: issueApiKeyRequest.environment,
      project: issueApiKeyRequest.project,
    });

    return new IssueApiKeyResponse(await lastValueFrom(obs));
  }

  @ApiOperation({
    summary: 'Revokes an API key, detaching it from its project.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API Key or insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Successful API Key revocation',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of the user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'x-user-jwt',
    description: "The user's ID token",
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the API key to delete',
    type: String,
  })
  @ApiBearerAuth('API_Key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/key/:id')
  async deleteApiKeyById(
    @User() user: CommonProto.User,
    @Param('id') idStr: string,
  ) {
    const id = +idStr;
    if (Number.isNaN(id)) {
      throw new HttpException('Invalid API Key ID', HttpStatus.BAD_REQUEST);
    }

    if (!user) {
      throw new UnauthorizedException(
        "You must provide the user's email/password or use an ID token",
      );
    }

    const response = await lastValueFrom(this.apiKeyService.getApiKey({ id }));

    if (!response.key) {
      throw new HttpException('API Key not found', HttpStatus.NOT_FOUND);
    }

    if (!response.key.project) {
      throw new HttpException(
        'API Key has no associated project',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const projectId = response.key.project.id;
    const linked = await userLinkedToProject({
      project: { id: projectId },
      user,
      projectClient: this.projectService,
    });

    if (!linked || user.type == CommonProto.UserType.USER) {
      throw new UnauthorizedException(
        'Only Superadmins & Linked Admins can delete API Keys',
      );
    }
    const deleteResponse = await lastValueFrom(
      this.apiKeyService.deleteApiKey({ id }),
    );
    if (!deleteResponse.success) {
      throw new HttpException(
        'API Key deletion failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return;
  }

  @ApiOperation({
    summary: 'Lists all API keys',
  })
  @ApiOkResponse({
    description: 'Paginated list of all API keys successfully returned',
    type: GetAllApiKeysResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API Key or insufficient permissions',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of records to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum records to return (default 10)',
    example: 10,
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of the user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @Get('key/all')
  async getAllApiKeys(
    @User() user: CommonProto.User,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit <= 0) {
      throw new HttpException(
        'limit must be a positive integer',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user) {
      throw new UnauthorizedException('User ID token is required');
    }

    let obs: Observable<ApiKeyProto.GetAllApiKeysResponse>;
    if (user.type == CommonProto.UserType.SUPERADMIN) {
      // superadmins can list all keys — pass empty projects to skip filtering
      obs = this.apiKeyService.getAllApiKeys({
        offset,
        limit,
        projects: [],
      });
    } else if (user.type == CommonProto.UserType.ADMIN && user.projectIds) {
      // regular users can only list keys for projects which they are an admin for
      obs = this.apiKeyService.getAllApiKeys({
        offset,
        limit,
        projects: user.projectIds.map((projId) => ({
          id: projId,
        })),
      });
    } else {
      return new GetAllApiKeysResponse({
        keys: [],
        links: {
          first: encodeURI(`/auth/key/all?offset=0&limit=0`),
          prev: encodeURI(`/auth/key/all?offset=0&limit=0`),
          next: encodeURI(`/auth/key/all?offset=0&limit=0`),
          last: encodeURI(`/auth/key/all?offset=0&limit=0`),
        },
      });
    }

    const data: { keys: AuthCommonProto.ApiKey[]; count: number } =
      await lastValueFrom(obs);

    const lastOffset =
      data.count > 0 ? Math.floor((data.count - 1) / limit) * limit : 0;
    const nextOffset = Math.min(lastOffset, offset + limit);
    const links = {
      first: encodeURI(`/auth/key/all?offset=${0}&limit=${limit}`),
      prev: encodeURI(
        `/auth/key/all?offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
      ),
      next: encodeURI(`/auth/key/all?offset=${nextOffset}&limit=${limit}`),
      last: encodeURI(`/auth/key/all?offset=${lastOffset}&limit=${limit}`),
    };
    return new GetAllApiKeysResponse({
      keys: data.keys,
      links,
    });
  }

  @Get('/test-auth')
  @ApiOperation({
    summary: 'Validates user JWT and returns user data',
    description:
      'This endpoint validates a user JWT token and returns the associated user information if valid',
  })
  @ApiResponse({
    status: 200,
    description: 'JWT is valid, returns user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired JWT',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token (User JWT)',
    required: true,
  })
  @ApiBearerAuth('API_Key')
  async testAuth(@User() user: CommonProto.User) {
    if (!user) {
      throw new HttpException('Invalid JWT', HttpStatus.UNAUTHORIZED);
    }
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        projectIds: user.projectIds,
      },
    };
  }

  @Post('/account-request')
  @ApiOperation({
    summary: 'Submit a new account request',
    description:
      'Allows a prospective user to submit a request for a new account. The request is stored and can be reviewed by an admin.',
  })
  @ApiCreatedResponse({
    description: 'Account request successfully created',
    type: NewAccountRequestResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiBody({ type: RequestNewAccountModel })
  async createAccountRequest(
    @Body() body: RequestNewAccountModel,
  ): Promise<NewAccountRequestResponse> {
    const created = await lastValueFrom(
      this.accountRequestService.createAccountRequest({
        email: body.email,
        name: body.name,
        password: body.password,
        userType: userTypeStringToProto(body.userType),
        projectName: body.projectName,
      }),
    );
    return new NewAccountRequestResponse(created);
  }

  @Get('/account-request')
  @ApiOperation({
    summary: 'Retrieve all account requests',
    description:
      'Returns all pending account requests. Requires admin or superadmin credentials.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All account requests returned',
    type: NewAccountRequestsResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: { type: 'string' },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: { type: 'string' },
  })
  @ApiBearerAuth('API_Key')
  async getAllAccountRequests(
    @User() user: CommonProto.User,
  ): Promise<NewAccountRequestsResponse> {
    if (!user || user.type === CommonProto.UserType.USER) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const result = await lastValueFrom(
      this.accountRequestService.getAllAccountRequests({}),
    );
    return new NewAccountRequestsResponse(result);
  }

  @Delete('/account-request/:id')
  @ApiOperation({
    summary: 'Delete an account request by ID',
    description:
      'Deletes an account request by its ID. Requires admin or superadmin credentials.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the account request to delete',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account request successfully deleted',
    type: NewAccountRequestResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account request not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: { type: 'string' },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: { type: 'string' },
  })
  @ApiBearerAuth('API_Key')
  async deleteAccountRequest(
    @User() user: CommonProto.User,
    @Param('id') idStr: string,
  ): Promise<NewAccountRequestResponse> {
    if (!user || user.type === CommonProto.UserType.USER) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const removed = await lastValueFrom(
      this.accountRequestService.deleteAccountRequest({ id }),
    );
    return new NewAccountRequestResponse(removed);
  }

  @Post('/account-request/:id/accept')
  @ApiOperation({
    summary: 'Accept an account request',
    description:
      'Accepts a pending account request: creates the user, optionally creates/links a project (for ADMIN requests with a projectName), and deletes the pending request. Requires admin or superadmin credentials.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the account request to accept',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account request accepted and user created',
    type: AcceptAccountRequestResponseModel,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account request not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: { type: 'string' },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: { type: 'string' },
  })
  @ApiBearerAuth('API_Key')
  async acceptAccountRequest(
    @User() user: CommonProto.User,
    @Param('id') idStr: string,
  ): Promise<AcceptAccountRequestResponseModel> {
    if (!user || user.type === CommonProto.UserType.USER) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const result = await lastValueFrom(
      this.accountRequestService.acceptAccountRequest({ id }),
    );
    return new AcceptAccountRequestResponseModel(result);
  }
}

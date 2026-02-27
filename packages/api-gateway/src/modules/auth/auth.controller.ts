import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Get,
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
} from '@nestjs/swagger';
import {
  ApiKeyProto,
  CommonProto,
  JwtProto,
  ProjectProto,
  UserProto,
} from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { User } from 'src/decorators/user.decorator';
import {
  IssueApiKeyRequest,
  IssueApiKeyResponse,
  IssueJWTResponse,
} from 'src/models/auth.dto';
import {
  RequestNewAccountModel,
  NewAccountRequestResponse,
  NewAccountRequestsResponse,
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
      'JSON Web Tokens are used for the vast majority of API-gateway calls. The Juno SDK provides the means of automatically authenticating through this route given valid user credentials.',
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
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: true,
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
    summary: 'Deletes an API key, detaching it from its project.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API Key',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful API Key deletion',
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
  @Delete('/key')
  async deleteApiKey(@Headers('Authorization') apiKey?: string) {
    const key = apiKey?.replace('Bearer ', '');
    if (key === undefined) {
      throw new UnauthorizedException('API Key is required');
    }
    const response = await lastValueFrom(
      this.apiKeyService.revokeApiKey({
        apiKey: key,
      }),
    );

    if (!response.success) {
      throw new HttpException('API Key revoke failed', 500);
    }

    return;
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
    required: true,
    schema: { type: 'string' },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: true,
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
    required: true,
    schema: { type: 'string' },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: true,
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
}

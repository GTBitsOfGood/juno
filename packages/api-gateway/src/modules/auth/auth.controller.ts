import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
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
} from '@nestjs/swagger';
import { ApiKeyProto, CommonProto, JwtProto, ProjectProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { User } from 'src/decorators/user.decorator';
import {
  IssueApiKeyRequest,
  IssueApiKeyResponse,
  IssueJWTResponse,
} from 'src/models/auth.dto';
import { userLinkedToProject } from 'src/user_project_validator';

const { JWT_SERVICE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME } = ApiKeyProto;
const { PROJECT_SERVICE_NAME } = ProjectProto;

@ApiTags('auth')
@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtProto.JwtServiceClient;
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;
  private projectService: ProjectProto.ProjectServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
    @Inject(PROJECT_SERVICE_NAME) private projectClient: ClientGrpc,
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
    const key = apiKey?.replace('Bearer ', '');
    if (key === undefined) {
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
}

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
import { ApiKeyProto, JwtProto } from 'juno-proto';
import { ApiKeyServiceClient } from 'juno-proto/dist/gen/api_key';
import { JwtServiceClient } from 'juno-proto/dist/gen/jwt';
import { lastValueFrom } from 'rxjs';
import {
  IssueApiKeyRequest,
  IssueApiKeyResponse,
  IssueJWTResponse,
} from 'src/models/auth.dto';

const { JWT_SERVICE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME } = ApiKeyProto;

@ApiTags('auth')
@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtServiceClient;
  private apiKeyService: ApiKeyServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.jwtService =
      this.jwtClient.getService<JwtServiceClient>(JWT_SERVICE_NAME);
    this.apiKeyService =
      this.apiClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
  }

  @Post('/jwt')
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
  @ApiBearerAuth()
  async getJWT(@Headers('Authorization') apiKey?: string) {
    const key = apiKey?.replace('Bearer ', '');
    if (key === undefined) {
      throw new UnauthorizedException('API Key is required');
    }
    const jwt = await lastValueFrom(this.jwtService.createJwt({ apiKey: key }));
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
  @ApiBody({ type: IssueApiKeyRequest })
  @Post('/key')
  async createApiKey(@Body() issueApiKeyRequest: IssueApiKeyRequest) {
    const obs = this.apiKeyService.issueApiKey({
      email: issueApiKeyRequest.email,
      password: issueApiKeyRequest.password,
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
  @ApiBearerAuth()
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

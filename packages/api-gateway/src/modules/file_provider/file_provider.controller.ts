import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthCommonProto, CommonProto, FileProviderProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ApiKey } from 'src/decorators/api_key.decorator';
import { ProjectId } from 'src/decorators/project_id.decorator';
import { User } from 'src/decorators/user.decorator';
import {
  FileProvider,
  FileProviderPartial,
  RegisterFileProviderModel,
} from 'src/models/file_provider.dto';

const { FILE_PROVIDER_FILE_SERVICE_NAME, FILE_PROVIDER_DB_SERVICE_NAME } =
  FileProviderProto;

// @ProjectId() can hand back the API key's project id as a protobuf Long
// ({ low, high }); the provider protos use int32, where a Long would encode
// as 0, so normalize to a plain number.
function toConfigId(projectId: unknown): number {
  if (projectId !== null && typeof projectId === 'object') {
    const { low, high } = projectId as { low: number; high: number };
    return (high ?? 0) * 2 ** 32 + (low >>> 0);
  }
  return Number(projectId);
}

// A file config's id is its project's id, so a provider belongs to the
// caller's project (x-project-id, checked against x-user-jwt, or the API
// key's project) in the API key's environment.
@ApiBearerAuth('API_Key')
@ApiTags('file_provider')
@ApiHeader({
  name: 'x-project-id',
  required: false,
  description:
    "Project to act on. Defaults to the API key's project; with x-user-jwt the user must be linked to it.",
})
@Controller('file')
export class FileProviderController implements OnModuleInit {
  private fileProviderService: FileProviderProto.FileProviderFileServiceClient;
  private fileProviderDbService: FileProviderProto.FileProviderDbServiceClient;

  constructor(
    @Inject(FILE_PROVIDER_FILE_SERVICE_NAME)
    private fileProviderClient: ClientGrpc,
    @Inject(FILE_PROVIDER_DB_SERVICE_NAME)
    private fileProviderDbClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileProviderService =
      this.fileProviderClient.getService<FileProviderProto.FileProviderFileServiceClient>(
        FILE_PROVIDER_FILE_SERVICE_NAME,
      );
    this.fileProviderDbService =
      this.fileProviderDbClient.getService<FileProviderProto.FileProviderDbServiceClient>(
        FILE_PROVIDER_DB_SERVICE_NAME,
      );
  }

  @Post('provider')
  @ApiOperation({
    summary: 'Register provider',
    description:
      "Registers (or updates) a File Provider in the caller's project file config.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the file provider associated with the given data',
    type: FileProviderPartial,
  })
  async registerFileProvider(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Body('') params: RegisterFileProviderModel,
  ): Promise<FileProviderPartial> {
    let type: FileProviderProto.ProviderType;
    switch (params.type.toUpperCase()) {
      case 'S3':
        type = FileProviderProto.ProviderType.S3;
        break;
      case 'AZURE':
        type = FileProviderProto.ProviderType.AZURE;
        break;
      default:
        type = FileProviderProto.ProviderType.UNRECOGNIZED;
        break;
    }
    const fileProvider = this.fileProviderService.registerProvider({
      baseUrl: params.baseUrl,
      providerName: params.providerName,
      privateAccessKey: params.accessKey.privateAccessKey,
      publicAccessKey: params.accessKey.publicAccessKey,
      type: type,
      configId: toConfigId(projectId),
      configEnv: apiKey.environment,
    });

    try {
      return new FileProviderPartial(await lastValueFrom(fileProvider));
    } catch (error) {
      if (error?.code === status.FAILED_PRECONDITION) {
        throw new BadRequestException(error.details ?? error.message);
      }
      throw error;
    }
  }

  @Get('provider/all')
  @ApiOperation({
    summary: 'List all providers',
    description:
      'Get every File Provider across all projects. Superadmins only (pass a superadmin x-user-jwt); use GET /file/provider/config/{configId} for a project.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Caller is not a superadmin' })
  @ApiOkResponse({
    description: 'Returned all file providers',
    type: FileProvider,
    isArray: true,
  })
  async getAllFileProviders(
    @User() user?: CommonProto.User,
  ): Promise<FileProvider[]> {
    if (user?.type !== CommonProto.UserType.SUPERADMIN) {
      throw new ForbiddenException(
        'Only superadmins can list file providers across projects',
      );
    }

    const grpcResponse = this.fileProviderDbService.getAllProviders({});

    const providersData = await lastValueFrom(grpcResponse);

    return (
      providersData.providers?.map((provider) => new FileProvider(provider)) ??
      []
    );
  }

  @Get('provider/config/:configId')
  @ApiOperation({
    summary: 'List providers by config',
    description:
      "Get the File Providers linked to a file config (the config id is the project id) in the API key's environment.",
  })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: "The config does not belong to the caller's project",
  })
  @ApiOkResponse({
    description: 'Returned the file providers linked to the file config',
    type: FileProvider,
    isArray: true,
  })
  async getFileProvidersByConfigId(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Param('configId') configIdParam: string,
  ): Promise<FileProvider[]> {
    const configId = Number(configIdParam);
    if (!Number.isInteger(configId) || configId < 0) {
      throw new BadRequestException(
        'configId must be an int greater than or equal to 0',
      );
    }
    if (configId !== toConfigId(projectId)) {
      throw new ForbiddenException(
        "File config does not belong to the caller's project",
      );
    }

    const providersData = await lastValueFrom(
      this.fileProviderService.getProvidersByConfigId({
        configId,
        configEnv: apiKey.environment,
      }),
    );

    return (
      providersData.providers?.map((provider) => new FileProvider(provider)) ??
      []
    );
  }

  @Delete('provider/:name')
  @ApiOperation({
    summary: 'Delete provider',
    description:
      "Delete a File Provider from the caller's project file config.",
  })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Deleted and returned file provider with specified name',
    type: FileProviderPartial,
  })
  async deleteFileProvider(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Param('name') name: string,
  ): Promise<FileProviderPartial> {
    const grpcResponse = this.fileProviderService.removeProvider({
      providerName: name,
      configId: toConfigId(projectId),
      configEnv: apiKey.environment,
    });

    return new FileProviderPartial(await lastValueFrom(grpcResponse));
  }
}

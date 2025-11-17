import {
  Body,
  Controller,
  Delete,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthCommonProto, FileBucketProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ApiKey } from 'src/decorators/api_key.decorator';
import {
  DeleteFileBucketModel,
  FileBucket,
  RegisterFileBucketModel,
} from 'src/models/file_bucket.dto';

const { BUCKET_FILE_SERVICE_NAME } = FileBucketProto;

@ApiBearerAuth('API_Key')
@ApiTags('file_bucket')
@Controller('file')
export class FileBucketController implements OnModuleInit {
  private fileBucketService: FileBucketProto.BucketFileServiceClient;

  constructor(
    @Inject(BUCKET_FILE_SERVICE_NAME)
    private fileBucketClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileBucketService =
      this.fileBucketClient.getService<FileBucketProto.BucketFileServiceClient>(
        BUCKET_FILE_SERVICE_NAME,
      );
  }

  @Post('bucket')
  @ApiOperation({ summary: 'Registers a File Bucket.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedResponse({
    description: 'Returned the file bucket associated with the given data',
    type: FileBucket,
  })
  async registerFileBucket(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body() params: RegisterFileBucketModel,
  ): Promise<FileBucket> {
    const grpcResponse = this.fileBucketService.registerBucket({
      name: params.name,
      configId: params.configId,
      fileProviderName: params.fileProviderName,
      FileServiceFile: params.FileServiceFile,
      configEnv: apiKey.environment,
    });

    const bucketData = await lastValueFrom(grpcResponse);

    return new FileBucket(bucketData);
  }

  @Delete('bucket')
  @ApiOperation({ summary: 'Delete a File Bucket.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Deleted and returned the file bucket',
    type: FileBucket,
  })
  async deleteFileBucket(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body() params: DeleteFileBucketModel,
  ): Promise<FileBucket> {
    const grpcResponse = this.fileBucketService.removeBucket({
      name: params.name,
      configId: params.configId,
      fileProviderName: params.fileProviderName,
      configEnv: apiKey.environment,
    });

    const bucketData = await lastValueFrom(grpcResponse);

    return new FileBucket(bucketData);
  }
}

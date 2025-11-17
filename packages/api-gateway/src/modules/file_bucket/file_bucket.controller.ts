import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
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

const { BUCKET_FILE_SERVICE_NAME, BUCKET_DB_SERVICE_NAME } = FileBucketProto;

@ApiBearerAuth('API_Key')
@ApiTags('file_bucket')
@Controller('file')
export class FileBucketController implements OnModuleInit {
  private fileBucketService: FileBucketProto.BucketFileServiceClient;
  private fileBucketDBService: FileBucketProto.BucketDbServiceClient;

  constructor(
    @Inject(BUCKET_FILE_SERVICE_NAME)
    private fileBucketClient: ClientGrpc,
    @Inject(BUCKET_DB_SERVICE_NAME)
    private fileBucketDBClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileBucketService =
      this.fileBucketClient.getService<FileBucketProto.BucketFileServiceClient>(
        BUCKET_FILE_SERVICE_NAME,
      );
    this.fileBucketDBService =
      this.fileBucketDBClient.getService<FileBucketProto.BucketDbServiceClient>(
        BUCKET_DB_SERVICE_NAME,
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

  @Get('bucket/:configId')
  @ApiOperation({ summary: 'Get File Buckets by Config Id and Config Env.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned file buckets with Config Id and Config Env',
    type: Array<FileBucket>,
  })
  async getBucketsByConfigIdAndEnv(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('configId') configId: string,
  ): Promise<FileBucket[]> {
    const id = parseInt(configId);
    if (Number.isNaN(id) || id < 0) {
      throw new BadRequestException(
        'Id must be an int greater than or equal to 0',
      );
    }
    const grpcResponse = this.fileBucketDBService.getBucketsByConfigIdAndEnv({
      configId: id,
      configEnv: apiKey.environment,
    });

    const bucketsData = await lastValueFrom(grpcResponse);

    return bucketsData.buckets.map((bucket) => new FileBucket(bucket));
  }
}

import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthCommonProto, FileBucketProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  RegisterFileBucketModel,
  FileBucket,
} from 'src/models/file_bucket.dto';
import { ApiKey } from 'src/decorators/api_key.decorator';

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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
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
}

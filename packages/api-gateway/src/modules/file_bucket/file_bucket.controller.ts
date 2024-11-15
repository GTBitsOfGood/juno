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
import { FileBucketProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterFileBucketModel } from 'src/models/file_bucket.dto';
import { FileBucketResponse } from 'src/models/file_bucket.dto';

const { BUCKET_FILE_SERVICE_NAME } = FileBucketProto;

@ApiBearerAuth('api_key')
@ApiTags('file_bucket')
@Controller('file-bucket')
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
    type: FileBucketResponse,
  })
  async registerFileBucket(
    @Body() params: RegisterFileBucketModel,
  ): Promise<FileBucketResponse> {
    console.log(`params: ${JSON.stringify(params)}`);

    const fileBucket = this.fileBucketService.registerBucket({
      name: params.name,
      configId: params.configId,
      fileProviderName: params.fileProviderName,
      FileServiceFile: params.FileServiceFile,
    });

    console.log(`bucket: ${JSON.stringify(fileBucket)}`);

    return new FileBucketResponse(await lastValueFrom(fileBucket));
  }
}

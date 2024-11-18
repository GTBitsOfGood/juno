import { IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { FileProto } from 'juno-proto';

export class UploadFileModel {
  @ApiProperty({
    type: 'string',
    description: 'Name of file',
  })
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    type: 'string',
    description: 'Name of bucket.',
  })
  @IsNotEmpty()
  bucketName: string;

  @ApiProperty({
    type: 'string',
    example: 'AWS S3',
    description: 'Name of file provider',
  })
  @IsNotEmpty()
  providerName: string;

  @ApiProperty({
    type: 'number',
    description: `File's configId`,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  configId: number;

  @ApiProperty({
    type: 'string',
    description: `File provider's region`,
  })
  @IsNotEmpty()
  @IsOptional()
  region?: string | undefined;
}

export class UploadFileResponse {
  @ApiProperty({ description: 'Pre-signed URL used in file upload' })
  url: string;

  constructor(fileUpload: FileProto.UploadFileResponse) {
    this.url = fileUpload.url;
  }
}

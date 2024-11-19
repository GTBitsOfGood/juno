import { IsNotEmpty, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { FileProto } from 'juno-proto';

export class DownloadFileModel {
  @ApiProperty({
    type: 'string',
    description: 'The name of the bucket to use for downloading',
  })
  @IsNotEmpty()
  bucketName: string;

  @ApiProperty({
    type: 'number',
    description: 'The config id of the file to use for downloading',
  })
  @IsNotEmpty()
  configId: number;

  @ApiProperty({
    type: 'string',
    description: 'The name of the file to use for downloading',
  })
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    type: 'string',
    description: 'The name of the provider to connect to for downloading',
  })
  @IsNotEmpty()
  providerName: string;

  @ApiProperty({
    type: 'string',
    description: 'The region to use for downloading',
  })
  @IsOptional()
  region?: string;
}

export class DownloadFileResponse {
  @ApiProperty({ description: 'The url for file download' })
  url: string;

  constructor(res: FileProto.DownloadFileResponse) {
    this.url = res.url;
  }
}

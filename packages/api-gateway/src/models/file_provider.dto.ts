import { IsEmail, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { FileProviderProto } from 'juno-proto';

class AccessKey {
  @ApiProperty({
    type: 'string',
    description: 'Client public access key',
  })
  @IsNotEmpty()
  publicAccessKey: string;

  @ApiProperty({
    type: 'string',
    description: 'Client private access key',
  })
  @IsNotEmpty()
  privateAccessKey: string;
}

export class RegisterFileProviderModel {
  @ApiProperty({
    type: [AccessKey],
    format: 'email',
    description: 'The access key to register with',
  })
  @IsNotEmpty()
  @IsEmail()
  accessKey: AccessKey;

  @ApiProperty({
    type: 'string',
    example: 'https://s3.us-west-004.backblazeb2.com',
    description: 'The base url associated with file provider.',
  })
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({
    type: 'string',
    example: 'AWS S3',
    description: 'The file provider name being registered.',
  })
  @IsNotEmpty()
  providerName: string;
}

export class FileProviderResponse {
  @ApiProperty({ description: 'The unique provider name of the file provider' })
  providerName: string;

  @ApiProperty({ description: 'The public access key of the file provider' })
  publicAccessKey: string;

  @ApiProperty({ description: 'The metadata of the file provider' })
  metadata: string;

  constructor(fileProvider: FileProviderProto.FileProvider) {
    this.providerName = fileProvider.providerName;
    this.publicAccessKey = fileProvider.publicAccessKey;
    this.metadata = fileProvider.metadata;
  }
}

import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { FileProviderProto } from 'juno-proto';
import { Transform, Type } from 'class-transformer';

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
    type: AccessKey,
    description: 'The access key to register with',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AccessKey)
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

  @IsNotEmpty()
  @Transform(toEnum)
  @ApiProperty({
    type: 'string',
    description: 'File provider type (one of S3 or AZURE)',
    example: 'S3',
  })
  type: FileProviderProto.ProviderType;
}

export class FileProviderResponse {
  @ApiProperty({ description: 'The unique provider name of the file provider' })
  providerName: string;

  @ApiProperty({ description: 'The metadata of the file provider' })
  metadata: string;

  constructor(fileProvider: FileProviderProto.FileProvider) {
    this.providerName = fileProvider.providerName;
    this.metadata = fileProvider.metadata;
  }
}

function toEnum(params: {
  value: string;
}): FileProviderProto.ProviderType | undefined {
  switch (params.value) {
    case 'S3':
      return FileProviderProto.ProviderType.S3;
    case 'AZURE':
      return FileProviderProto.ProviderType.AZURE;
    default:
      return undefined;
  }
}

import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @ApiProperty({
    type: 'string',
    description: 'File provider type (one of S3 or AZURE)',
    example: 'S3',
  })
  type: string;
}

export class FileProvider {
  @ApiProperty({ type: 'number', description: 'Unique id of the provider' })
  id: number;

  @ApiProperty({
    type: 'number',
    description: 'Id of the file config (and project) that owns the provider',
  })
  configId: number;

  @ApiProperty({
    type: 'string',
    description: 'Environment of the file config that owns the provider',
  })
  configEnv: string;

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
  @ApiProperty({
    type: 'string',
    description: 'File provider type (one of S3 or AZURE)',
    example: 'S3',
  })
  type: string;

  constructor(fileProvider: FileProviderProto.FileProvider) {
    this.id = fileProvider.id;
    this.configId = fileProvider.configId;
    this.configEnv = fileProvider.configEnv;
    this.providerName = fileProvider.providerName;
    this.type = fromEnum(fileProvider.providerType);

    try {
      this.baseUrl = JSON.parse(fileProvider.metadata)?.endpoint;

      const parsedAccessKey = JSON.parse(fileProvider.accessKey);
      this.accessKey = {
        publicAccessKey:
          parsedAccessKey?.accessKeyId || parsedAccessKey?.accountName,
        privateAccessKey:
          parsedAccessKey?.secretAccessKey || parsedAccessKey?.accountKey,
      };
    } catch {
      this.baseUrl = 'N/A';
      this.accessKey = { publicAccessKey: 'N/A', privateAccessKey: 'N/A' };
    }
  }
}

export class FileProviderPartial {
  @ApiProperty({ type: 'number', description: 'Unique id of the provider' })
  id: number;

  @ApiProperty({
    description: "The provider's name, unique within its file config",
  })
  providerName: string;

  @ApiProperty({ description: 'The metadata of the file provider' })
  metadata: string;

  @ApiProperty({
    type: 'number',
    description: 'Id of the file config (and project) that owns the provider',
  })
  configId: number;

  @ApiProperty({
    type: 'string',
    description: 'Environment of the file config that owns the provider',
  })
  configEnv: string;

  constructor(fileProvider: FileProviderProto.FileProvider) {
    this.id = fileProvider.id;
    this.providerName = fileProvider.providerName;
    this.metadata = fileProvider.metadata;
    this.configId = fileProvider.configId;
    this.configEnv = fileProvider.configEnv;
  }
}

function fromEnum(value: FileProviderProto.ProviderType): string {
  switch (value) {
    case FileProviderProto.ProviderType.S3:
      return 'S3';
    case FileProviderProto.ProviderType.AZURE:
      return 'Azure';
    default:
      return 'Not supported';
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { FileBucketProto, FileConfigProto, FileProto } from 'juno-proto';

export class FileConfigResponse {
  @ApiProperty({
    type: 'number',
    description: 'File Configuration ID',
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    type: 'string',
    description: 'The configured environment',
  })
  @IsNotEmpty()
  @IsString()
  environment: string;

  @ApiProperty({
    type: [Object],
    description: 'The list of files associated with the config',
  })
  @IsArray()
  files: FileProto.File[];

  @ApiProperty({
    type: [Object],
    description: 'The list of buckets associated with the config',
  })
  @IsArray()
  buckets: FileBucketProto.Bucket[];

  constructor(fileConfig: FileConfigProto.FileServiceConfig) {
    this.id = fileConfig.id;
    this.environment = fileConfig.environment;
    this.files = fileConfig.files;
    this.buckets = fileConfig.buckets;
  }
}

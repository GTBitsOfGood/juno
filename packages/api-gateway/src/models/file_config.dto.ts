import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FileConfigProto } from 'juno-proto';
import { File } from './file.dto';
import { FileBucket } from './file_bucket.dto';
import { Type } from 'class-transformer';

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
    type: [File],
    description: 'The list of files associated with the config',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => File)
  files: File[];

  @ApiProperty({
    type: [FileBucket],
    description: 'The list of buckets associated with the config',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileBucket)
  buckets: FileBucket[];

  constructor(fileConfig: FileConfigProto.FileServiceConfig) {
    this.id = fileConfig.id;
    this.environment = fileConfig.environment;
    this.files = fileConfig.files;
    this.buckets = fileConfig.buckets;
  }
}

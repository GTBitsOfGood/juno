import { IsNotEmpty, IsString, IsInt, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileBucketProto, IdentifierProto } from 'juno-proto';

export class RegisterFileBucketModel {
  @ApiProperty({
    type: 'string',
    description: 'The unique name of the bucket',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: 'number',
    description: 'Configuration ID for the bucket',
  })
  @IsNotEmpty()
  @IsInt()
  configId: number;

  @ApiProperty({
    type: 'string',
    description: 'The file provider name associated with the bucket',
  })
  @IsNotEmpty()
  @IsString()
  fileProviderName: string;

  @ApiProperty({
    type: [Object],
    description: 'The file identifiers linked to this bucket',
  })
  @IsArray()
  FileServiceFile: IdentifierProto.FileIdentifier[];
}

export class FileBucketResponse {
  @ApiProperty({
    type: 'string',
    description: 'The unique name of the registered bucket',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: 'number',
    description: 'Configuration ID associated with the registered bucket',
  })
  @IsNotEmpty()
  @IsInt()
  configId: number;

  @ApiProperty({
    type: 'string',
    description: 'The name of the file provider associated with the bucket',
  })
  @IsNotEmpty()
  @IsString()
  fileProviderName: string;

  @ApiProperty({
    type: [Object],
    description: 'The list of file identifiers associated with the bucket',
  })
  @IsArray()
  FileServiceFile: IdentifierProto.FileIdentifier[];

  constructor(fileBucket: FileBucketProto.Bucket) {
    this.name = fileBucket.name;
    this.configId = fileBucket.configId;
    this.fileProviderName = fileBucket.fileProviderName;
    this.FileServiceFile = fileBucket.FileServiceFile;
  }
}

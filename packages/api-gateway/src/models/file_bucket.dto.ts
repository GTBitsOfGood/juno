import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileIdentifier } from 'identifiers';

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
    type: [FileIdentifier],
    description: 'The file identifiers linked to this bucket',
  })
  FileServiceFile: FileIdentifier[];
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
    type: [FileIdentifier],
    description: 'The list of file identifiers associated with the bucket',
  })
  FileServiceFile: FileIdentifier[];

  constructor(bucketData: {
    name: string;
    configId: number;
    fileProviderName: string;
    FileServiceFile: FileIdentifier[];
  }) {
    this.name = bucketData.name;
    this.configId = bucketData.configId;
    this.fileProviderName = bucketData.fileProviderName;
    this.FileServiceFile = bucketData.FileServiceFile;
  }
}

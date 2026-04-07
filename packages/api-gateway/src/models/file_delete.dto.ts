import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { FileProto } from 'juno-proto';

export class DeleteFilesModel {
  @ApiProperty({
    type: 'string',
    description: 'Name of the bucket containing the files',
  })
  @IsNotEmpty()
  @IsString()
  bucketName: string;

  @ApiProperty({
    type: 'number',
    description: 'Configuration ID for the bucket',
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  configId: number;

  @ApiProperty({
    type: [String],
    description: 'List of file names to delete',
  })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  fileNames: string[];
}

export class DeleteFilesResponse {
  @ApiProperty({
    type: 'string',
    description: 'The name of the bucket from which files were deleted',
  })
  bucketName: string;

  @ApiProperty({
    type: [String],
    description: 'List of file names that were deleted',
  })
  fileNames: string[];

  constructor(res: FileProto.DeleteFilesResponse) {
    this.bucketName = res.bucketName;
    this.fileNames = res.fileNames;
  }
}

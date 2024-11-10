import { IsEmail, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

class AccessKey {
  @ApiProperty({
    type: 'string',
    description: 'Client public access key',
  })
  @IsNotEmpty()
  accessKey: string;

  @ApiProperty({
    type: 'string',
    description: 'Client private access key',
  })
  @IsNotEmpty()
  secretAccessKey: string;
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

/* eslint-disable prettier/prettier */
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { CommonProto } from 'juno-proto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserModel {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ description: 'User email' })
  email: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'User name' })
  name: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'User password' })
  password: string;
}

export class SetUserTypeModel {
  @ApiProperty({ description: 'User email' })
  email?: string | undefined;
  @ApiProperty({ description: 'User id' })
  id?: number | undefined;

  @IsNotEmpty()
  @Transform(toEnum)
  @ApiProperty({ description: 'New user type' })
  type: CommonProto.UserType;
}

export class LinkProjectModel {
  @ApiProperty({ description: 'ID of project to be linked' })
  id?: number;
  @ApiProperty({ description: 'Name of project to be linked' })
  name?: string;
}

export class UserResponse {
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'User id' })
  id: number;

  @ApiProperty({ description: 'User email', example: 'user@email.com' })
  email: string;

  @ApiProperty({ description: 'User name', example: 'John' })
  name: string;

  @Transform(fromEnum)
  @ApiProperty({
    description: 'User type',
    example: CommonProto.UserType.ADMIN,
  })
  type: CommonProto.UserType;

  // Protobuf's Long requires extra transformation
  @Transform(({ value }) => value?.map((v: any) => v.low))
  @ApiProperty({
    description: 'Project IDs associated with user',
    type: [Number],
  })
  projectIds: number[];

  constructor(user: CommonProto.User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.type = user.type;
    this.projectIds = user.projectIds;
  }
}

function toEnum(params: { value: string }): CommonProto.UserType | undefined {
  switch (params.value) {
    case 'SUPERADMIN':
      return CommonProto.UserType.SUPERADMIN;
    case 'ADMIN':
      return CommonProto.UserType.ADMIN;
    case 'USER':
      return CommonProto.UserType.USER;
    default:
      return undefined;
  }
}

function fromEnum(params: {
  value: CommonProto.UserType;
}): 'SUPERADMIN' | 'ADMIN' | 'USER' {
  switch (params.value) {
    case CommonProto.UserType.SUPERADMIN:
      return 'SUPERADMIN';
    case CommonProto.UserType.ADMIN:
      return 'ADMIN';
    default:
      return 'USER';
  }
}

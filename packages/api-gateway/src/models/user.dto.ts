import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { UserProto } from 'juno-proto';
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
  type: UserProto.UserType;
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
  @ApiProperty({ description: 'User type', example: UserProto.UserType.ADMIN })
  type: UserProto.UserType;

  constructor(user: UserProto.User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.type = user.type;
  }
}

export class LinkProjectModel {
  @ApiProperty({ description: 'ID of project to be linked' })
  id?: number;
  @ApiProperty({ description: 'Name of project to be linked' })
  name?: string;
}

function toEnum(params: { value: string }): UserProto.UserType | undefined {
  switch (params.value) {
    case 'SUPERADMIN':
      return UserProto.UserType.SUPERADMIN;
    case 'ADMIN':
      return UserProto.UserType.ADMIN;
    case 'USER':
      return UserProto.UserType.USER;
    default:
      return undefined;
  }
}

function fromEnum(params: {
  value: UserProto.UserType;
}): 'SUPERADMIN' | 'ADMIN' | 'USER' {
  switch (params.value) {
    case UserProto.UserType.SUPERADMIN:
      return 'SUPERADMIN';
    case UserProto.UserType.ADMIN:
      return 'ADMIN';
    default:
      return 'USER';
  }
}

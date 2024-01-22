import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { UserProto } from 'juno-proto';

export class CreateUserModel {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  password: string;
}

export class SetUserTypeModel {
  email?: string | undefined;
  id?: number | undefined;

  @IsNotEmpty()
  @Transform(toEnum)
  type: UserProto.UserType;
}

export class UserResponse {
  @Transform(({ value }) => Number(value))
  id: number;
  email: string;
  name: string;
  @Transform(fromEnum)
  type: UserProto.UserType;

  constructor(user: UserProto.User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.type = user.type;
  }
}

export class LinkProjectModel {
  id?: number;
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

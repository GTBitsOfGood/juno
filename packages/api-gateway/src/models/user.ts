import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { UserType } from 'src/auth-service/gen/user';
import { User } from 'src/db-service/gen/user';

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
  type: UserType;
}

export class UserResponse {
  @Transform(({ value }) => Number(value))
  id: number;
  email: string;
  name: string;
  @Transform(fromEnum)
  type: UserType;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.type = user.type;
  }
}

function toEnum(params: { value: string }): UserType | undefined {
  switch (params.value) {
    case 'SUPERADMIN':
      return UserType.SUPERADMIN;
    case 'ADMIN':
      return UserType.ADMIN;
    case 'USER':
      return UserType.USER;
    default:
      return undefined;
  }
}

function fromEnum(params: {
  value: UserType;
}): 'SUPERADMIN' | 'ADMIN' | 'USER' {
  switch (params.value) {
    case UserType.SUPERADMIN:
      return 'SUPERADMIN';
    case UserType.ADMIN:
      return 'ADMIN';
    default:
      return 'USER';
  }
}

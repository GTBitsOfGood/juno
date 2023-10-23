import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { UserType } from 'src/auth-service/gen/user';

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
  @Transform(transform)
  type: UserType;
}

function transform(params: { value: string }): UserType | undefined {
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

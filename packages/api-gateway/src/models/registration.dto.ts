import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { CommonProto, UserProto } from 'juno-proto';

export class RequestNewAccountModel {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ description: 'Email for the new account' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Name of the requester' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @ApiProperty({ description: 'Password for the new account' })
  password: string;

  @IsNotEmpty()
  @IsIn(['SUPERADMIN', 'ADMIN', 'USER'], {
    message: 'userType must be one of: SUPERADMIN, ADMIN, USER',
  })
  @ApiProperty({
    description: 'Requested user type / role',
    enum: ['SUPERADMIN', 'ADMIN', 'USER'],
  })
  userType: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Optional project name to associate' })
  projectName?: string;
}

export class NewAccountRequestResponse {
  @ApiProperty({ description: 'Request ID' })
  id: number;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Name' })
  name: string;

  @ApiProperty({
    description: 'Requested user type',
    enum: ['SUPERADMIN', 'ADMIN', 'USER'],
  })
  userType: string;

  @ApiPropertyOptional({ description: 'Project name' })
  projectName?: string;

  @ApiProperty({ description: 'Timestamp of request creation' })
  createdAt: string;

  constructor(req: UserProto.NewAccountRequest) {
    this.id = req.id;
    this.email = req.email;
    this.name = req.name;
    this.userType = fromUserType(req.userType);
    this.projectName = req.projectName;
    this.createdAt = req.createdAt;
  }
}

export class NewAccountRequestsResponse {
  @ApiProperty({
    description: 'List of new account requests',
    type: [NewAccountRequestResponse],
  })
  requests: NewAccountRequestResponse[];

  constructor(res: UserProto.NewAccountRequests) {
    this.requests =
      res?.requests?.map((r) => new NewAccountRequestResponse(r)) || [];
  }
}

export function userTypeStringToProto(value: string): CommonProto.UserType {
  switch (value) {
    case 'SUPERADMIN':
      return CommonProto.UserType.SUPERADMIN;
    case 'ADMIN':
      return CommonProto.UserType.ADMIN;
    case 'USER':
      return CommonProto.UserType.USER;
    default:
      return CommonProto.UserType.USER;
  }
}

function fromUserType(type: CommonProto.UserType): string {
  switch (type) {
    case CommonProto.UserType.SUPERADMIN:
      return 'SUPERADMIN';
    case CommonProto.UserType.ADMIN:
      return 'ADMIN';
    default:
      return 'USER';
  }
}

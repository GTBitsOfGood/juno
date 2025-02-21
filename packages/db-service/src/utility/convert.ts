import { Role } from '@prisma/client';
import { CommonProto } from 'juno-proto';

export function mapPrismaRoleToRPC(role: Role): CommonProto.UserType {
  switch (role) {
    case Role.USER:
      return CommonProto.UserType.USER;
    case Role.ADMIN:
      return CommonProto.UserType.ADMIN;
    case Role.SUPERADMIN:
      return CommonProto.UserType.SUPERADMIN;
    default:
      return CommonProto.UserType.UNRECOGNIZED;
  }
}

export function mapRPCRoleToPrisma(role: CommonProto.UserType): Role {
  switch (role) {
    case CommonProto.UserType.ADMIN:
      return Role.ADMIN;
    case CommonProto.UserType.SUPERADMIN:
      return Role.SUPERADMIN;
    case CommonProto.UserType.USER:
    default:
      return Role.USER;
  }
}

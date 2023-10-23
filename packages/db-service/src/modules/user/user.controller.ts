import { Controller } from '@nestjs/common';
import {
  CreateUserRequest,
  UserServiceController,
  UserServiceControllerMethods,
  UserType,
  User as RPCUser,
  UserIdentifier,
  UpdateUserRequest,
} from 'src/gen/user';
import { UserService } from './user.service';
import { Prisma, Role, User } from '@prisma/client';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
  constructor(private readonly userService: UserService) { }

  private mapPrismaRoleToRPC(role: Role): UserType {
    switch (role) {
      case Role.USER:
        return UserType.USER;
      case Role.ADMIN:
        return UserType.ADMIN;
      case Role.SUPERADMIN:
        return UserType.SUPERADMIN;
      default:
        return UserType.UNRECOGNIZED;
    }
  }

  private mapRPCRoleToPrisma(role: UserType): Role {
    switch (role) {
      case UserType.ADMIN:
        return Role.ADMIN;
      case UserType.SUPERADMIN:
        return Role.SUPERADMIN;
      case UserType.USER:
      default:
        return Role.USER;
    }
  }

  private validateIdentifier(identifier: UserIdentifier) {
    if (identifier.id && identifier.email) {
      throw new Error('Only one of id or email can be provided');
    } else if (!identifier.id && !identifier.email) {
      throw new Error('Neither id nor email are provided');
    }
  }

  async getUser(identifier: UserIdentifier): Promise<RPCUser> {
    this.validateIdentifier(identifier);
    let userFind: Prisma.UserWhereUniqueInput;
    if (identifier.id) {
      userFind = {
        id: Number(identifier.id),
      };
    } else {
      userFind = {
        email: identifier.email,
      };
    }
    const user = await this.userService.user(userFind);
    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async createUser(request: CreateUserRequest): Promise<RPCUser> {
    const user = await this.userService.createUser({
      name: request.name,
      email: request.email,
      password: request.password,
      type: this.mapRPCRoleToPrisma(request.type),
    });
    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async updateUser(request: UpdateUserRequest): Promise<RPCUser> {
    this.validateIdentifier(request.userIdentifier);
    let userFind: Prisma.UserWhereUniqueInput;
    if (request.userIdentifier.id) {
      userFind = {
        id: request.userIdentifier.id,
      };
    } else {
      userFind = {
        email: request.userIdentifier.email,
      };
    }
    const user = await this.userService.updateUser(userFind, {
      name: request.updateParams.name,
      email: request.updateParams.email,
      password: request.updateParams.password,
      type: this.mapRPCRoleToPrisma(request.updateParams.type),
    });
    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async deleteUser(request: UserIdentifier): Promise<RPCUser> {
    this.validateIdentifier(request);
    let user: User;
    if (request.id) {
      user = await this.userService.deleteUser({
        id: request.id,
      });
    } else {
      user = await this.userService.deleteUser({
        email: request.email,
      });
    }

    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }
}

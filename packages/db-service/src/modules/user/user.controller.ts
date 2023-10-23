import { Controller } from '@nestjs/common';
import {
  CreateUserRequest,
  UserServiceController,
  UserServiceControllerMethods,
  UserType,
  User as RPCUser,
  UpdateUserRequest,
  LinkProjectToUserRequest,
} from 'src/gen/user';
import { UserService } from './user.service';
import { Role } from '@prisma/client';
import {
  validateProjectIdentifier,
  validateUserIdentifier,
} from 'src/utility/validate';
import { UserIdentifier } from 'src/gen/shared/identifiers';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
  constructor(private readonly userService: UserService) {}

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

  async getUser(identifier: UserIdentifier): Promise<RPCUser> {
    const userFind = validateUserIdentifier(identifier);
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
    const identifier = validateUserIdentifier(request.userIdentifier);
    const user = await this.userService.updateUser(identifier, {
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
    const identifier = validateUserIdentifier(request);

    const user = await this.userService.deleteUser(identifier);

    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async linkProject(request: LinkProjectToUserRequest): Promise<RPCUser> {
    const user = validateUserIdentifier(request.user);
    const updated = await this.userService.updateUser(user, {
      allowedProjects: {
        connect: validateProjectIdentifier(request.project),
      },
    });
    return {
      ...updated,
      type: this.mapPrismaRoleToRPC(updated.type),
    };
  }
}

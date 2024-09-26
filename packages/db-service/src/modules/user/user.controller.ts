import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { Role } from '@prisma/client';
import * as validate from 'src/utility/validate';
import { IdentifierProto, UserProto } from 'juno-proto';
import * as bcrypt from 'bcrypt';

@Controller()
@UserProto.UserServiceControllerMethods()
export class UserController implements UserProto.UserServiceController {
  constructor(private readonly userService: UserService) {}

  private mapPrismaRoleToRPC(role: Role): UserProto.UserType {
    switch (role) {
      case Role.USER:
        return UserProto.UserType.USER;
      case Role.ADMIN:
        return UserProto.UserType.ADMIN;
      case Role.SUPERADMIN:
        return UserProto.UserType.SUPERADMIN;
      default:
        return UserProto.UserType.UNRECOGNIZED;
    }
  }

  private mapRPCRoleToPrisma(role: UserProto.UserType): Role {
    switch (role) {
      case UserProto.UserType.ADMIN:
        return Role.ADMIN;
      case UserProto.UserType.SUPERADMIN:
        return Role.SUPERADMIN;
      case UserProto.UserType.USER:
      default:
        return Role.USER;
    }
  }

  async getUser(
    identifier: IdentifierProto.UserIdentifier,
  ): Promise<UserProto.User> {
    const userFind = validate.validateUserIdentifier(identifier);
    const user = await this.userService.user(userFind);
    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async getUserPasswordHash(
    identifier: IdentifierProto.UserIdentifier,
  ): Promise<UserProto.UserPasswordHash> {
    const userFind = validate.validateUserIdentifier(identifier);
    const user = await this.userService.user(userFind);
    return {
      hash: user.password,
    };
  }

  async createUser(
    request: UserProto.CreateUserRequest,
  ): Promise<UserProto.User> {
    const user = await this.userService.createUser({
      name: request.name,
      email: request.email,
      password: await bcrypt.hash(request.password, 10),
      type: this.mapRPCRoleToPrisma(request.type),
    });
    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async updateUser(
    request: UserProto.UpdateUserRequest,
  ): Promise<UserProto.User> {
    const identifier = validate.validateUserIdentifier(request.userIdentifier);
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

  async deleteUser(
    request: IdentifierProto.UserIdentifier,
  ): Promise<UserProto.User> {
    const identifier = validate.validateUserIdentifier(request);

    const user = await this.userService.deleteUser(identifier);

    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
    };
  }

  async linkProject(
    request: UserProto.LinkProjectToUserRequest,
  ): Promise<UserProto.User> {
    const user = validate.validateUserIdentifier(request.user);
    const updated = await this.userService.updateUser(user, {
      allowedProjects: {
        connect: validate.validateProjectIdentifier(request.project),
      },
    });
    return {
      ...updated,
      type: this.mapPrismaRoleToRPC(updated.type),
    };
  }
}

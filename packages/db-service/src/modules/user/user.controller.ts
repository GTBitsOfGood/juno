import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { Role } from '@prisma/client';
import * as validate from 'src/utility/validate';
import { CommonProto, IdentifierProto, UserProto } from 'juno-proto';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Controller()
@UserProto.UserServiceControllerMethods()
export class UserController implements UserProto.UserServiceController {
  constructor(private readonly userService: UserService) {}

  private mapPrismaRoleToRPC(role: Role): CommonProto.UserType {
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

  private mapRPCRoleToPrisma(role: CommonProto.UserType): Role {
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

  async getUser(
    identifier: IdentifierProto.UserIdentifier,
  ): Promise<CommonProto.User> {
    const userFind = validate.validateUserIdentifier(identifier);
    const user = await this.userService.user(userFind);

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
      projectIds: user.allowedProjects.map((project) => project.id),
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
  ): Promise<CommonProto.User> {
    const user = await this.userService.createUser({
      name: request.name,
      email: request.email,
      password: await bcrypt.hash(request.password, 10),
      type: this.mapRPCRoleToPrisma(request.type),
    });
    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
      projectIds: [1],
    };
  }

  async updateUser(
    request: UserProto.UpdateUserRequest,
  ): Promise<CommonProto.User> {
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
      projectIds: user.allowedProjects.map((project) => project.id),
    };
  }

  async deleteUser(
    request: IdentifierProto.UserIdentifier,
  ): Promise<CommonProto.User> {
    const identifier = validate.validateUserIdentifier(request);

    const user = await this.userService.deleteUser(identifier);

    return {
      ...user,
      type: this.mapPrismaRoleToRPC(user.type),
      projectIds: user.allowedProjects.map((project) => project.id),
    };
  }

  async linkProject(
    request: UserProto.LinkProjectToUserRequest,
  ): Promise<CommonProto.User> {
    const user = validate.validateUserIdentifier(request.user);
    const updated = await this.userService.updateUser(user, {
      allowedProjects: {
        connect: validate.validateProjectIdentifier(request.project),
      },
    });
    return {
      ...updated,
      type: this.mapPrismaRoleToRPC(updated.type),
      projectIds: updated.allowedProjects.map((project) => project.id),
    };
  }
}

import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import * as validate from 'src/utility/validate';
import { CommonProto, IdentifierProto, UserProto } from 'juno-proto';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GetAllUsersRequest } from 'juno-proto/dist/gen/user';
import { mapPrismaRoleToRPC, mapRPCRoleToPrisma } from 'src/utility/convert';
@Controller()
@UserProto.UserServiceControllerMethods()
export class UserController implements UserProto.UserServiceController {
  constructor(private readonly userService: UserService) {}

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
      type: mapPrismaRoleToRPC(user.type),
      projectIds: user.allowedProjects.map((project) => project.id),
    };
  }

  async getAllUsers(_: GetAllUsersRequest): Promise<CommonProto.Users> {
    void _; //Indicates to linter input not used
    const users = await this.userService.getUsers();
    return {
      users: users.map((user) => {
        return {
          ...user, //Should this field be present?
          type: mapPrismaRoleToRPC(user.type),
          projectIds: user.allowedProjects.map((project) => project.id),
        };
      }),
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
      type: mapRPCRoleToPrisma(request.type),
    });
    return {
      ...user,
      type: mapPrismaRoleToRPC(user.type),
      projectIds: null,
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
      type: mapRPCRoleToPrisma(request.updateParams.type),
    });
    return {
      ...user,
      type: mapPrismaRoleToRPC(user.type),
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
      type: mapPrismaRoleToRPC(user.type),
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
      type: mapPrismaRoleToRPC(updated.type),
      projectIds: updated.allowedProjects.map((project) => project.id),
    };
  }
}

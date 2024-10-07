import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

const userWithProjectIds = {
  include: {
    allowedProjects: {
      select: {
        id: true,
      },
    },
  },
};

type UserWithProjectIds = Prisma.UserGetPayload<typeof userWithProjectIds>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async users(
    skip?: number,
    take?: number,
    cursor?: Prisma.UserWhereUniqueInput,
    where?: Prisma.UserWhereInput,
    orderBy?: Prisma.UserOrderByWithRelationInput,
  ): Promise<User[]> {
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async user(lookup: Prisma.UserWhereUniqueInput): Promise<UserWithProjectIds> {
    return this.prisma.user.findUnique({
      where: lookup,
      ...userWithProjectIds,
    });
  }

  async createUser(input: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: input,
    });
  }

  async updateUser(
    user: Prisma.UserWhereUniqueInput,
    update: Prisma.UserUpdateInput,
  ): Promise<UserWithProjectIds> {
    return this.prisma.user.update({
      where: user,
      data: update,
      ...userWithProjectIds,
    });
  }

  async deleteUser(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithProjectIds> {
    return this.prisma.user.delete({
      where,
      ...userWithProjectIds,
    });
  }
}

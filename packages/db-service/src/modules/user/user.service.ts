import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

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

  async user(lookup: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.findUnique({
      where: lookup,
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
  ): Promise<User> {
    return this.prisma.user.update({
      where: user,
      data: update,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async authenticateUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user: User = await this.prisma.user.findFirst({ where });
    if (user.password !== where.password) {
      throw new Error('The password is invalid.');
    }
    return user;
  }
}

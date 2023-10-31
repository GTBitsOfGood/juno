import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import bcrypt from 'bcrypt';

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
    try {
      input.password = await bcrypt.hash(input.password, 10);
      return this.prisma.user.create({
        data: input,
      });
    } catch (e) {
      throw e; // handle
    }
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
}

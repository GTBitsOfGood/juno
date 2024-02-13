import { Prisma } from '@prisma/client';
import { IdentifierProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export function validateProjectIdentifier(
  identifier: IdentifierProto.ProjectIdentifier,
): Prisma.ProjectWhereUniqueInput {
  if (identifier.id && identifier.name) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Only one of id or name can be provided',
    });
  } else if (!identifier.id && !identifier.name) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Neither id nor name are provided',
    });
  }

  if (identifier.id) {
    return {
      id: Number(identifier.id),
    };
  } else {
    return {
      name: identifier.name,
    };
  }
}

export function validateUserIdentifier(
  identifier: IdentifierProto.UserIdentifier,
): Prisma.UserWhereUniqueInput {
  if (identifier.id && identifier.email) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Only one of id or email can be provided',
    });
  } else if (!identifier.id && !identifier.email) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Neither id nor email are provided',
    });
  }

  if (identifier.id) {
    return {
      id: Number(identifier.id),
    };
  } else {
    return {
      email: identifier.email,
    };
  }
}

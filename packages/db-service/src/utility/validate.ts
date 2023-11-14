import { Prisma } from '@prisma/client';
import {
  ApiKeyIdentifier,
  ProjectIdentifier,
  UserIdentifier,
} from 'src/gen/shared/identifiers';

export function validateProjectIdentifier(
  identifier: ProjectIdentifier,
): Prisma.ProjectWhereUniqueInput {
  if (identifier.id && identifier.name) {
    throw new Error('Only one of id or name can be provided');
  } else if (!identifier.id && !identifier.name) {
    throw new Error('Neither id nor name are provided');
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
  identifier: UserIdentifier,
): Prisma.UserWhereUniqueInput {
  if (identifier.id && identifier.email) {
    throw new Error('Only one of id or email can be provided');
  } else if (!identifier.id && !identifier.email) {
    throw new Error('Neither id nor email are provided');
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

export function validateApiKeyIdentifier(
  identifier: ApiKeyIdentifier,
): Prisma.ApiKeyWhereUniqueInput {
  if (identifier.id && identifier.hash) {
    throw new Error('Only one of id or hash can be provided');
  } else if (!identifier.id && !identifier.hash) {
    throw new Error('Neither id nor hash are provided');
  }

  if (identifier.id) {
    return {
      id: Number(identifier.id),
    };
  } else {
    return {
      hash: identifier.hash,
    };
  }
}

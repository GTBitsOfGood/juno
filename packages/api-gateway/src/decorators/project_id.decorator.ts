import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CommonProto } from 'juno-proto';

export const ProjectId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const apiKey = request.apiKey;

    const user = request.user;

    const headers = request.headers || {};

    const headerKeys = Object.keys(headers);

    const headerKey = headerKeys.find(
      (key) => key.toLowerCase() === 'x-project-id',
    );

    const headerValue = headerKey ? headers[headerKey] : undefined;

    const projectIdFromHeader = headerValue
      ? Array.isArray(headerValue)
        ? String(headerValue[0])
        : String(headerValue)
      : undefined;

    const projectIdParam =
      request.query?.projectId ||
      projectIdFromHeader ||
      request.params?.projectId;

    if (
      projectIdParam !== undefined &&
      projectIdParam !== null &&
      projectIdParam !== '' &&
      String(projectIdParam).trim() !== ''
    ) {
      const projectId = parseInt(String(projectIdParam));
      if (Number.isNaN(projectId) || projectId < 0) {
        throw new BadRequestException(
          'project id must be a non-negative integer',
        );
      }

      if (user) {
        const hasAccess =
          user.type === CommonProto.UserType.SUPERADMIN ||
          user.projectIds.map((id: unknown) => Number(id)).includes(projectId);

        if (!hasAccess) {
          throw new UnauthorizedException(
            'user does not have access to the specified project',
          );
        }
      }

      return projectId;
    }

    if (!apiKey || !apiKey.project) {
      throw new UnauthorizedException('API key missing');
    }

    return apiKey.project.id;
  },
);

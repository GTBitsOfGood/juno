export * as ApiKeyProto from './gen/api_key';
export * as JwtProto from './gen/jwt';
export * as ProjectProto from './gen/project';
export * as UserProto from './gen/user';
export * as IdentifierProto from './gen/identifiers';
export * as HealthProto from './gen/health';
export * as ResetProto from './gen/reset_db';
export * as EmailProto from './gen/email';

import { join } from 'path';

function getProtoFilePath(name: string) {
  return join(__dirname, '../../', 'juno-proto/dist/definitions', name);
}

export const ApiKeyProtoFile = getProtoFilePath('api_key.proto');
export const JwtProtoFile = getProtoFilePath('jwt.proto');
export const ProjectProtoFile = getProtoFilePath('project.proto');
export const UserProtoFile = getProtoFilePath('user.proto');
export const IdentifiersProtoFile = getProtoFilePath('identifiers.proto');
export const HealthProtoFile = getProtoFilePath('health.proto');
export const ResetProtoFile = getProtoFilePath('reset_db.proto');
export const EmailProtoFile = getProtoFilePath('email.proto');

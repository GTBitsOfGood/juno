export * as ApiKeyProto from './gen/api_key';
export * as JwtProto from './gen/jwt';
export * as ProjectProto from './gen/project';
export * as UserProto from './gen/user';
export * as IdentifierProto from './gen/identifiers';
export * as HealthProto from './gen/health';
export * as ResetProto from './gen/reset_db';
export * as EmailProto from './gen/email';
export * as LoggingProto from './gen/logging';
export * as AuthCommonProto from './gen/auth_common';
export * as FileProto from './gen/file';

import { join } from 'path';

function getProtoFilePath(name: string) {
  return join(__dirname, 'definitions', name);
}

export const ApiKeyProtoFile = getProtoFilePath('api_key.proto');
export const JwtProtoFile = getProtoFilePath('jwt.proto');
export const ProjectProtoFile = getProtoFilePath('project.proto');
export const UserProtoFile = getProtoFilePath('user.proto');
export const IdentifiersProtoFile = getProtoFilePath('identifiers.proto');
export const HealthProtoFile = getProtoFilePath('health.proto');
export const ResetProtoFile = getProtoFilePath('reset_db.proto');
export const EmailProtoFile = getProtoFilePath('email.proto');
export const LoggingProtoFile = getProtoFilePath('logging.proto');
export const AuthCommonProtoFile = getProtoFilePath('auth_common.proto');
export const FileProtoFile = getProtoFilePath('file.proto');

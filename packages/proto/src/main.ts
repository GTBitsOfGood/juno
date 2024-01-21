export * as ApiKeyProto from './gen/api_key';
export * as JwtProto from './gen/jwt';
export * as ProjectProto from './gen/project';
export * as UserProto from './gen/user';
export * as IdentifierProto from './gen/identifiers';

import { join } from 'path';

function getProtoFilePath(name: string) {
  return join(__dirname, '../../', 'juno-proto/definitions', name);
}

export const ApiKeyProtoFile = getProtoFilePath('api_key.proto');
export const JwtProtoFile = getProtoFilePath('jwt.proto');
export const ProjectProtoFile = getProtoFilePath('project.proto');
export const UserProtoFile = getProtoFilePath('user.proto');
export const IdentifiersProtoFile = getProtoFilePath('identifiers.proto');

/* eslint-disable */

export const protobufPackage = 'dbservice.shared.identifiers';

export interface ProjectIdentifier {
  id?: number | undefined;
  name?: string | undefined;
}

export interface UserIdentifier {
  id?: number | undefined;
  email?: string | undefined;
}

export interface ApiKeyIdentifier {
  id?: number | undefined;
  hash?: string | undefined;
}

export const DBSERVICE_SHARED_IDENTIFIERS_PACKAGE_NAME =
  'dbservice.shared.identifiers';

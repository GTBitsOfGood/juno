/* eslint-disable */

export const protobufPackage = 'juno.identifiers';

export interface ProjectIdentifier {
  id?: number | undefined;
  name?: string | undefined;
}

export interface UserIdentifier {
  id?: number | undefined;
  email?: string | undefined;
}

export interface EmailIdentifier {
  projectId: number;
  name: string;
}

export const JUNO_IDENTIFIERS_PACKAGE_NAME = 'juno.identifiers';

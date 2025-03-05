import { FileProto, IdentifierProto } from 'juno-proto';

export class File implements FileProto.File {
  fileId: IdentifierProto.FileIdentifier | undefined;
  metadata: string;
}

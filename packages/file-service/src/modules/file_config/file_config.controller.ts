import { Controller } from '@nestjs/common';
import { FileConfigProto } from 'juno-proto';
import { FileConfigService } from './file_config.service';

@Controller()
@FileConfigProto.FileServiceConfigServiceControllerMethods()
export class FileConfigController
  implements FileConfigProto.FileServiceConfigServiceController
{
  constructor(private readonly fileConfigService: FileConfigService) {}

  async setup(
    request: FileConfigProto.SetupRequest,
  ): Promise<FileConfigProto.SetupResponse> {
    return this.fileConfigService.setup(request);
  }

  async deleteConfig(
    request: FileConfigProto.DeleteFileServiceConfigRequest,
  ): Promise<FileConfigProto.FileServiceConfig> {
    return this.fileConfigService.deleteConfig(request);
  }
}

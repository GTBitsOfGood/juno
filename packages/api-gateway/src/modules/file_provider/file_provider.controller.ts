import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { LinkUserModel, ProjectResponse } from 'src/models/project.dto';
import { AuthCommonProto, FileProviderProto } from 'juno-proto';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKey } from 'src/decorators/api_key.decorator';
import { RegisterFileProviderModel } from 'src/models/file_provider.dto';

const { FILE_PROVIDER_FILE_SERVICE_NAME } = FileProviderProto;

@ApiTags('project')
@Controller('project')
export class FileProviderController implements OnModuleInit {
  private fileProviderService: FileProviderProto.FileProviderFileServiceClient;

  constructor(
    @Inject(FILE_PROVIDER_FILE_SERVICE_NAME) private projectClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileProviderService =
      this.projectClient.getService<FileProviderProto.FileProviderFileServiceClient>(
        FILE_PROVIDER_FILE_SERVICE_NAME,
      );
  }

  @Post('')
  @ApiOperation({ summary: 'Registers a File Provider.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the file provider associated with the given data',
    type: ProjectResponse,
  })
  async registerFileProvider(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body('') params: RegisterFileProviderModel,
  ): Promise<ProjectResponse> {
    // const project = this.fileProviderService.registerProvider();
    // return new ProjectResponse(await lastValueFrom(project));
  }
}

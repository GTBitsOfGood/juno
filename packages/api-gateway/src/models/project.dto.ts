import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { CommonProto, AuthCommonProto, ApiKeyProto } from 'juno-proto';

export class CreateProjectModel {
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the project' })
  name: string;
}

export class ProjectResponse {
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'The ID of the project' })
  id: number;

  @ApiProperty({ description: 'The name of the project' })
  name: string;

  constructor(project: CommonProto.Project) {
    this.id = project.id;
    this.name = project.name;
  }
}

export class ProjectResponses {
  @ApiProperty({ description: 'List of projects' })
  projects: ProjectResponse[];

  constructor(projectsResponse: CommonProto.Projects) {
    this.projects = projectsResponse.projects.map(
      (project) => new ProjectResponse(project),
    );
  }
}

export class LinkUserModel {
  @Transform(({ value }) => parseInt(value))
  @ApiProperty({ description: 'The ID of the user' })
  id?: number;

  @ApiProperty({ description: 'The email of the user' })
  email?: string;
}

export class GetAllApiKeysResponse {
  @ApiProperty({
    isArray: true,
    description: 'List of API keys belonging to a project',
  })
  keys: AuthCommonProto.ApiKey[];

  constructor(res: ApiKeyProto.GetAllApiKeysResponse) {
    this.keys = res.keys.map((key) => ({
      ...key,
      project: key.project
        ? { id: Number(key.project.id), name: key.project.name }
        : undefined,
    }));
  }
}

import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { ProjectProto } from 'juno-proto';

export class CreateProjectModel {
  @IsNotEmpty()
  name: string;
}

export class ProjectResponse {
  @Transform(({ value }) => Number(value))
  id: number;
  name: string;

  constructor(project: ProjectProto.Project) {
    this.id = project.id;
    this.name = project.name;
  }
}

export class LinkUserModel {
  id?: number;
  email?: string;
}

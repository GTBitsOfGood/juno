import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { Project } from 'src/db-service/gen/project';

export class CreateProjectModel {
  @IsNotEmpty()
  name: string;
}

export class ProjectResponse {
  @Transform(({ value }) => Number(value))
  id: number;
  name: string;

  constructor(project: Project) {
    this.id = project.id;
    this.name = project.name;
  }
}

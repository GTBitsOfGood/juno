import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { ProjectProto } from 'juno-proto';

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

  constructor(project: ProjectProto.Project) {
    this.id = project.id;
    this.name = project.name;
  }
}

export class LinkUserModel {
  @ApiProperty({ description: 'The ID of the user' })
  id?: number;

  @ApiProperty({ description: 'The email of the user' })
  email?: string;
}

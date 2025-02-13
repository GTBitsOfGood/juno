import { CommonProto, IdentifierProto } from 'juno-proto';
import { ProjectServiceClient } from 'juno-proto/dist/gen/project';
import { lastValueFrom } from 'rxjs';

export async function userLinkedToProject(options: {
  project: IdentifierProto.ProjectIdentifier;
  user: CommonProto.User;
  projectClient: ProjectServiceClient;
}) {
  const { project, user, projectClient } = options;
  if (user.type == CommonProto.UserType.SUPERADMIN) {
    return true;
  }

  const projectResponse = await lastValueFrom(
    projectClient.getProject(project),
  );

  return user.projectIds
    .map((id) => Number(id))
    .includes(Number(projectResponse.id));
}

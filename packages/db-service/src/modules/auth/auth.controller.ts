import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeyProto, AuthCommonProto, UserProto } from 'juno-proto';
import { ApiKeyIdentifier } from 'juno-proto/dist/gen/identifiers';
import { validateApiKeydentifier } from 'src/utility/validate';
import * as bcrypt from 'bcrypt';
import { mapPrismaRoleToRPC, mapRPCRoleToPrisma } from 'src/utility/convert';

@Controller()
@ApiKeyProto.ApiKeyDbServiceControllerMethods()
@UserProto.AccountRequestServiceControllerMethods()
export class ApiKeyDbController
  implements
    ApiKeyProto.ApiKeyDbServiceController,
    UserProto.AccountRequestServiceController
{
  constructor(private readonly apiKeyService: AuthService) {}

  getApiKey(request: ApiKeyIdentifier): Promise<AuthCommonProto.ApiKey> {
    return this.apiKeyService.findApiKey(validateApiKeydentifier(request));
  }

  async createApiKey(
    request: ApiKeyProto.CreateApiKeyParams,
  ): Promise<AuthCommonProto.ApiKey> {
    const prepareCreateApiKey = {
      ...request.apiKey,
      // scopes: request.apiKey.scopes?.map((scope) => ApiScope[scope]),
      scopes: [],
      project: {
        connect: {
          id: request.apiKey.project.id,
          name: request.apiKey.project.name,
        },
      },
      environment: request.apiKey.environment,
    };

    const apiKey = this.apiKeyService.createApiKey(prepareCreateApiKey);
    return apiKey;
  }

  async deleteApiKey(
    request: ApiKeyIdentifier,
  ): Promise<AuthCommonProto.ApiKey> {
    return this.apiKeyService.deleteApiKey(validateApiKeydentifier(request));
  }

  async createAccountRequest(
    request: UserProto.CreateNewAccountRequestMessage,
  ): Promise<UserProto.NewAccountRequest> {
    const created = await this.apiKeyService.createAccountRequest({
      email: request.email,
      name: request.name,
      password: await bcrypt.hash(request.password, 10),
      userType: mapRPCRoleToPrisma(request.userType),
      projectName: request.projectName ?? null,
    });
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      userType: mapPrismaRoleToRPC(created.userType),
      projectName: created.projectName ?? undefined,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getAllAccountRequests(
    _: UserProto.GetAllNewAccountRequestsMessage,
  ): Promise<UserProto.NewAccountRequests> {
    void _;
    const requests = await this.apiKeyService.getAllAccountRequests();
    return {
      requests: requests.map((req) => ({
        id: req.id,
        email: req.email,
        name: req.name,
        userType: mapPrismaRoleToRPC(req.userType),
        projectName: req.projectName ?? undefined,
        createdAt: req.createdAt.toISOString(),
      })),
    };
  }

  async deleteAccountRequest(
    request: UserProto.RemoveNewAccountRequestByIdMessage,
  ): Promise<UserProto.NewAccountRequest> {
    const removed = await this.apiKeyService.deleteAccountRequest(request.id);
    return {
      id: removed.id,
      email: removed.email,
      name: removed.name,
      userType: mapPrismaRoleToRPC(removed.userType),
      projectName: removed.projectName ?? undefined,
      createdAt: removed.createdAt.toISOString(),
    };
  }
}

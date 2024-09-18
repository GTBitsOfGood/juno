<div align="center">
  
  <a href="">![E2E Tests](https://img.shields.io/github/actions/workflow/status/GTBitsOfGood/juno/e2e-tests.yml?style=for-the-badge)</a> 
  <a href="">![GitHub Releases](https://img.shields.io/github/v/release/GTBitsOfGood/juno?include_prereleases&style=for-the-badge)</a>
  <a href="">![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)</a>
  
</div>
  
<h3 align="center">
  Juno
</h3>

<div align="center">
  
[Bits of Good](https://bitsofgood.org/)'s central infrastructure API, integrating several in-house services to simplify and streamline project development.

</div>

## Project Description

Juno is a monorepo using a combination of NestJS, [gRPC](https://grpc.io/), Protobuf, Prisma, and Postgres for API endpoints, interservice communication, and object storage/modeling.

Packages are managed through [Yarn Workspaces](https://yarnpkg.com/features/workspaces). The current packages are as follows:

- [api-gateway](./packages/api-gateway/): The publicly visible API routes and their first-layer validation + logic. Decides what services to utilize per-request via [Remote Procedure Call](https://en.wikipedia.org/wiki/Remote_procedure_call) (RPC) based on the API route and given information
- [auth-service](./packages/auth-service/): An internal service used to handle all API authentication necessities. Provides RPC endpoints for API key generation/validation/revocation and JWT generation/validation. Used in some endpoints but primarily as middleware within the gateway to ensure authorized access to other services

- [db-service](./packages/db-service/): An internal service that interfaces with the database layer (Postgres). Handles all schema structuring and object relations (users, projects, api keys, etc.). This was kept as a single service to provide an interface for all other services to perform CRUD operations on the data they work with without needing to know the underlying storage internals
- [email-service](./packages/email-service/): A SendGrid-based central service for managing per-project mailing functionality with support for all major mailing providers.
- [logging-service](./packages/logging-service/): A dedicated logging service for error and audit logs, including traces, metrics information, and sentry.io integration.

## Getting Started

> [!WARNING]
> Due to several of the initialization and configuration scripts requiring Unix-specific functionality, building on Windows is currently not supported. However, you can still install Juno onto Windows via [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install). When later installing Docker Desktop, follow the [official instructions](https://docs.docker.com/desktop/wsl/) to ensure Docker Desktop WSL 2 is enabled.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v4.24+
- [protoc](https://github.com/protocolbuffers/protobuf)
- WSL2 if running on a Windows OS

### Using Docker

As this repository contains multiple packages, [Docker](https://www.docker.com/) is used to spin up all microservices in order with their respective dependencies. For more details regarding the docker process and its internal networking mechanism, take a look at the `docker-dev-compose.yml` and `Dockerfile` file.

Most of the docker-related functionality has been abstracted away into yarn commands.

### Installation

All package dependencies must first be installed by using the following command in the root directory:

```
yarn
```

## Development

For spinning up the stack and automatically updating as changes are made to files:

```
yarn start:dev:live-all
```

### Making requests

Requests can be made at the endpoint `localhost:3000/some/request/path`.

### Testing

Juno currently has support for E2E tests via [Jest](https://jestjs.io/).

To run tests a single time for a particular service:

- api-gateway: `yarn test:e2e:api-gateway`
- auth-service: `yarn test:e2e:auth-service`
- db-service: `yarn test:e2e:db-service`

To continoulsy run tests for a service as file changes are made:

- api-gateway: `yarn test:e2e:api-gateway-live`
- auth-service: `yarn test:e2e:auth-service-live`
- db-service: `yarn test:e2e:db-service-live`

## Troubleshooting

### Windows

Make sure **everything** is done through the Windows Subsystem for Linux (WSL).

Some common issues:

- Forgetting to install `protoc`
- Incorrect line endings in `.sh` files (should be `LF`, not `CRLF`)
- Error message `additional property <> is not allowed`: Docker Desktop should be updated to v4.24+
- Error message `db-service is unhealthy`: Make sure all shell scripts have correct `chmod` permissions
- Error message `<>.sh: Permission denied`: Make sure all shell scripts have correct `chmod` permissions

If VSCode outputs `Failed to connect. Is Docker running?`:

- First, ensure Docker Desktop is actually running.
- If it is, Docker Desktop most likely decided to nuke your settings, re-enable WSL in **Settings** > **Resources** > **WLS integration**

To add `chmod` permissions to all shell scripts:

```
chmod +x docker/get_grpc_probe.sh
chmod +x packages/db-service/entrypoint.sh
```

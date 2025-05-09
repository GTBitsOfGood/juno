<div align="center">
  
  
  <a href="">![GitHub Releases](https://img.shields.io/github/v/release/GTBitsOfGood/juno?include_prereleases&style=for-the-badge)</a>
  <a href="">![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)</a>
  <a href="">![NestJS](https://img.shields.io/badge/Nest.js-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)</a>

</div>
  
<h3 align="center">
  Juno
</h3>

<div align="center">
  
[Bits of Good](https://bitsofgood.org/)'s central infrastructure API, integrating several in-house services to simplify and streamline project development.

</div>

## Project Description

Juno is a monorepo using a combination of NestJS, [gRPC](https://grpc.io/), Protobuf, Prisma, and Postgres for API endpoints, interservice communication, and object storage/modeling.

![Juno Diagram](figures/junodiagram.png)

Packages are managed through [PNPM Workspaces](https://pnpm.io/workspaces). The current packages are as follows:

- [api-gateway](./packages/api-gateway/): The publicly visible API routes and their first-layer validation + logic. Decides what services to utilize per-request via [Remote Procedure Calls](https://en.wikipedia.org/wiki/Remote_procedure_call) (RPC) based on the API route and given information.
- [auth-service](./packages/auth-service/): An internal service used to handle all API authentication necessities. Provides RPC endpoints for API key generation/validation/revocation and JWT generation/validation. Used in some endpoints but primarily as middleware within the gateway to ensure authorized access to other services.

- [db-service](./packages/db-service/): An internal service that interfaces with the database layer (Postgres). Handles all schema structuring and object relations (users, projects, api keys, etc.) via [Prisma](https://www.prisma.io/). This was kept as a single service to provide an interface for all other services to perform CRUD operations on the data they work with without needing to know the underlying storage internals
- [email-service](./packages/email-service/): A SendGrid-based central service for managing per-project mailing functionality with support for all major mailing providers.
- [logging-service](./packages/logging-service/): A dedicated logging service for error and audit logs, including traces, metrics information, and sentry.io integration.

## OpenAPI Documentation

We utilize Nest's [OpenAPI](https://docs.nestjs.com/openapi/introduction) support to autogenerate web documentation for all Juno HTTP endpoints.

When running Juno locally, the documentation can be found under `localhost:<api-gateway port from docker>/docs`. If using the deployment version of Juno, engineering leadership will provide you with a valid documentation page. Note that the api-gateway port is _not_ the isolated docker port (e.g. port 3000) but the exposed host port.

For updating the JunoSDK, see the developer instructions below.

## Getting Started

> [!WARNING]
> Due to several of the initialization and configuration scripts requiring Unix-specific functionality, building on Windows is currently not supported. However, you can still install Juno onto Windows via [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install). When later installing Docker Desktop, follow the [official instructions](https://docs.docker.com/desktop/wsl/) to ensure Docker Desktop WSL 2 is enabled.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v4.24+
- [protoc](https://github.com/protocolbuffers/protobuf) v28.2
- WSL2 if running on a Windows OS

> [!WARNING]
> Homebrew is likely to contain an older `protoc` version incompatible with Juno. To avoid any potential incompatibilities, it is recommended to install the binaries from protoc's [releases page](https://github.com/protocolbuffers/protobuf/releases).

### Using Docker

As this repository contains multiple packages, [Docker](https://www.docker.com/) is used to spin up all microservices in order with their respective dependencies. For more details regarding the docker process and its internal networking mechanism, take a look at the `docker-dev-compose.yml` and `Dockerfile` file.

Most of the docker-related functionality has been abstracted away into pnpm commands.

### Installation

All package dependencies must first be installed by using the following command in the root directory:

```
pnpm install
```

## Development

For spinning up the stack and automatically updating as changes are made to files:

```
pnpm start:dev:live-all
```

### Making requests

The `api-gateway` service contains interactive documentation at the endpoint `localhost:<exposed docker port>/docs` for easily sending requests. Direct requests to the gateway can be made via `localhost:3000/some/request/path`.

### Testing

Juno currently has support for E2E tests via [Jest](https://jestjs.io/).

To run tests a single time for a particular service:

- api-gateway: `pnpm test:e2e:api-gateway`
- auth-service: `pnpm test:e2e:auth-service`
- db-service: `pnpm test:e2e:db-service`

To continuously run tests for a service as file changes are made:

- api-gateway: `pnpm test:e2e:api-gateway-live`
- auth-service: `pnpm test:e2e:auth-service-live`
- db-service: `pnpm test:e2e:db-service-live`

### Modifying/creating Proto Files

After creating or modifying a `.proto` definition, the types must be built and synced to all Juno services. You can achieve this with the following commands:

```sh
pnpm gen-proto
pnpm sync-protos
```

### Updating the JunoSDK from OpenAPI

With [OpenAPI](https://docs.nestjs.com/openapi/introduction), much of the internal implementation of [juno-sdk](https://github.com/GTBitsOfGood/juno-sdk) is generated automatically. There are two options for triggering the SDK generation:

**Automatic** - Upon a new tagged release of Juno, a GitHub action will automatically create a PR in the JunoSDK repository with the new changes.

**Manual** - If the SDK needs to be updated locally for testing Juno before release, you can follow these steps:

- With Juno currently running, execute the scripts/doc-extract.sh. This downloads the contents of localhost:/API_GATEWAY_URL/docs-yaml where the OpenAPI yaml specification is located, runs the OpenAPI SDK generator, and places the output into juno-client-sdk.
- Copy the `api.ts` file and `api`, `model` folders into the SDK repository
- Ensure the changes still build (`bun run build` in the SDK repository) and fix any errors that might've been caused with the update
- Add any additional needed methods to the SDK to use new routes (e.g. your unlink user)
- Submit a PR with the changes

### Modifying database schemas

We use [Prisma](https://www.prisma.io/) in `db-service` as an ORM to define all database schemas/relationships. After a change has been made to the Prisma schema, a migration must be made. There are two options:

1. While Juno is running, run `DATABASE_URL=postgresql://user:password@localhost:<port> pnpm prisma migrate` to generate the migration
2. Verify a new migration has been created under the `migrations` folder

### Force rebuilding docker containers

In some situations it might be beneficial to override Docker Compose's cache and completely rebuild all docker containers. This is possible by appending `--build` to end of your `pnpm` command:

```sh
pnpm test:e2e:api-gateway-live --build
```

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
chmod +x packages/db-service/entrypoint.sh
```

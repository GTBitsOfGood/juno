
<h1 align="center">
  Juno
</h1>

Juno is [Bits of Good](https://bitsofgood.org/)'s central infrastructure API, integrating several in-house services to simplify and streamline project development.

## Repo Structure
The project is a monorepo using a combination of NestJS, gRPC, Protobuf, Prisma, and Postgres for API endpoints, interservice communication, and object storage/modeling.

Packages are managed through [Yarn Workspaces](https://yarnpkg.com/features/workspaces). The current packages are as follows:

- [api-gateway](./packages/api-gateway/): The publicly visible API routes and their first-layer validation + logic. Decides what services to utilize per-request via RPC based on the API route and given information
- [auth-service](./packages/auth-service/): An internal service used to handle all API authentication necessities. Provides RPC endpoints for API key generation/validation/revocation and JWT generation/validation. Used in some endpoints but primarily as middleware within the gateway to ensure authorized access to other services
- [db-service](./packages/db-service/): An internal service that interfaces with the database layer (Postgres). Handles all schema structuring and object relations (users, projects, api keys, etc.). This was kept as a single service to provide an interface for all other services to perform CRUD operations on the data they work with without needing to know the underlying storage internals

## Building

### Prerequisites

- Docker Desktop v4.24+
- WSL if running on a Windows OS
- [protoc](https://github.com/protocolbuffers/protobuf)

### Using Docker

As this repository contains multiple packages, [Docker](https://www.docker.com/) is used to spin up all microservices in order with their respective dependencies. For more details regarding the docker process and its internal networking mechanism, take a look at the `docker-compose.yml` file.

Most of the docker-related functionality has been abstracted away into yarn commands.

### Install needed dependencies

All package dependencies must first be installed by using the following command in the root directory:
```
yarn
```

### For development
For spinning up the entire stack (not watching for changes):
```
yarn start:dev
```

For spinning up the stack and automatically updating as changes are made to files: 
```
yarn start:dev:live-all
```


### Making requests


Requests can be made at the endpoint `localhost:3000/some/request/path`.

## Testing

Juno currently has support for E2E tests via [Jest](https://jestjs.io/).

### Run tests for specific microservice

(In root directory)

- api-gateway: `yarn test:e2e:api-gateway`
- auth-service: `yarn test:e2e:auth-service`
- db-service: `yarn test:e2e:db-service`

If you're working on juno and wish to test with your updates in live time (watched tests), run the prior command suffixed with `-live`. This looks like the following for each service:

- api-gateway: `yarn test:e2e:api-gateway-live`
- auth-service: `yarn test:e2e:auth-service-live`
- db-service: `yarn test:e2e:db-service-live`

## Windows Troubleshooting
- Make sure **everything** is done through the Windows Subsystem for Linux (WSL).
- `protoc` must be installed.

`.sh` related problems - switch line endings to `LF`

`additional property <> is not allowed>` - update docker

`db-service is unhealthy` - wget script likely failed to install, make sure all `.sh` files have correct line endings **and permissions (chmod)**

![image](https://github.com/GTBitsOfGood/juno/assets/36551149/eff13fd4-f7a5-4acc-b3a6-d17399fefd4b)
- First, ensure Docker Desktop is actually running.
- If it is, Docker Desktop most likely decided to nuke your settings, re-enable WSL in **Settings** > **Resources** > **WLS integration**

`./get_grpc_probe.sh: Permission denied` - add permission to get_grpc_probe using chmod:

```
chmod +x docker/get_grpc_probe.sh
chmod +x packages/db-service/entrypoint.sh
```

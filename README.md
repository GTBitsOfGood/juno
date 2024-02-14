# BoG API

## Overview

Bits of Good's United Infrastructure API to accelerate deveopment and provide simple setup and integration of various services. This project was ideated and created with the input of various project teams and leads and aims to simplify commonly known tedious workflows and setups, supercharging development throughout and reducing tedious setup.

This project was build with scale in-mind, hence the microservice-based architecture and vastly difference from general Bits of Good project repos. It utilizes a custom monorepo structure that's further explained below.

## Repo Structure

This repo uses a combination of NestJS, gRPC, Protobuf, Prisma, and Postgres for API endpoints, inter-service communication, and object storage/modeling.

The reoo is structured as a monorepo using yarn's workspaces. The current packages are as follows:

- [api-gateway](./packages/api-gateway/): The publicly visible API routes and their first-layer validation + logic. Decides what services to utilize per-request via RPC based on the API route and given information
- [auth-service](./packages/auth-service/): An internal service used to handle all API authentication necessities. Provides RPC endpoints for API key generation/validation/revocation and JWT generation/validation. Used in some endpoints but primarily as middleware within the gateway to ensure authorized access to other services
- [db-service](./packages/db-service/): An internal service that interfaces with our database layer (Postgres). Handles all schema structuring and object relations (users, projects, api keys, etc.). This was kept as a single service to provide an interface for all other services to perform CRUD operations on the data they work with without needing to know the underlying storage internals

## Building

To build this repo for development/testing, I highly recommend using docker. A `docker-compose-dev.yml` file has been provided that will create containers for each microservice (plus postgres) and configures internal networking between services.

To spin up the container make sure docker is installed. You will need at least docker desktop v4.24.

Run the command `yarn start:dev` in the project root to spin up the entire stack. If you're building to develop on Juno and want live-updates of protos and package changes, run the command `yarn start:dev:live-all` instead.

**NOTE: In order to run the `live-all` command, you must have the `protoc` command avaialble and be in an environment that can run bash shell scripts. Prior to running `live-all` run `yarn` in the root directory to setup protos & dependencies for the live mounting**

Run requests at the endpoint `localhost:3000/some/request/path`

## Testing

Juno currently has support for e2e tests via jest. I recommend these be run via docker again.

To run tests in a one-off fashion, run the command `yarn test:e2e:[service-name]` in the project root. For each service this looks as follows:

- api-gateway: `yarn test:e2e:api-gateway`
- auth-service: `yarn test:e2e:auth-service`
- db-service: `yarn test:e2e:db-service`

If you're working on juno and wish to test with your updates in live time (watched tests), run the prior command suffixed with `-live`. This looks like the following for each service:

- api-gateway: `yarn test:e2e:api-gateway-live`
- auth-service: `yarn test:e2e:auth-service-live`
- db-service: `yarn test:e2e:db-service-live`

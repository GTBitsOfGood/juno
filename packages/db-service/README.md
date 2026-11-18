<div align="center">
  
  <a href="">![E2E Tests](https://img.shields.io/github/actions/workflow/status/GTBitsOfGood/juno/e2e-tests.yml?style=for-the-badge)</a> 
  <a href="">![GitHub Releases](https://img.shields.io/github/v/release/GTBitsOfGood/juno?include_prereleases&style=for-the-badge)</a>
  <a href="">![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)</a>
  
</div>

<h3 align="center">
  @juno/db-service
</h3>

<div align="center">
  
[Bits of Good](https://bitsofgood.org/)'s central infrastructure API, integrating several in-house services to simplify and streamline project development.

<br />
<a href="https://github.com/GTBitsOfGood/juno"><strong>« Back to main README</strong></a>

</div>


## DB Service

An internal service that interfaces with the database layer (Postgres). Handles all schema structuring and object relations (users, projects, api keys, etc.) via [Prisma](https://www.prisma.io/). This was kept as a single service to provide an interface for all other services to perform CRUD operations on the data they work with without needing to know the underlying storage internals.

## Package Structure

Juno packages are built with [Nest.js](https://docs.nestjs.com/). Internal services expose gRPC controllers; the api-gateway exposes HTTP routes. A package is split into modules (`.module.ts`), with controllers, a service layer, and tests under `test/`. Shared request and response types usually come from the [proto](https://github.com/GTBitsOfGood/juno/tree/main/packages/proto) package.

### Folder Structure

```
├── prisma
├── src
│   ├── modules
│   │   ├── analytics_config
│   │   ├── analytics_event
│   │   ├── auth
│   │   ├── email
│   │   ├── file
│   │   ├── file_bucket
│   │   ├── file_config
│   │   ├── file_provider
│   │   ├── health
│   │   ├── project
│   │   ├── reset
│   │   └── user
│   └── utility
└── test
```

## Database Overview

![prisma-editor](https://github.com/user-attachments/assets/7e747dae-216c-4976-950b-9949ee9f5c86)


## Development

Make sure to check out the [main installation instructions](https://github.com/GTBitsOfGood/juno) first. The [local development guide](https://juno.bitsofgood.org/docs/local-development) covers running the full Docker stack.

Run E2E tests in watch mode from the repository root:

```
pnpm test:e2e:db-service-live
```

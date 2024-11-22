<div align="center">
  
  <a href="">![E2E Tests](https://img.shields.io/github/actions/workflow/status/GTBitsOfGood/juno/e2e-tests.yml?style=for-the-badge)</a> 
  <a href="">![GitHub Releases](https://img.shields.io/github/v/release/GTBitsOfGood/juno?include_prereleases&style=for-the-badge)</a>
  <a href="">![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)</a>
  
</div>
  
<h3 align="center">
  @juno/api-gateway
</h3>

<div align="center">
  
[Bits of Good](https://bitsofgood.org/)'s central infrastructure API, integrating several in-house services to simplify and streamline project development.

<br />
<a href="https://github.com/GTBitsOfGood/juno/blob/ryder/documentation-overhaul/README.md"><strong>« Back to main README</strong></a>

</div>

## DB Service

An internal service that interfaces with the database layer (Postgres). Handles all schema structuring and object relations (users, projects, api keys, etc.). This was kept as a single service to provide an interface for all other services to perform CRUD operations on the data they work with without needing to know the underlying storage internals.

## Package Structure

Juno packages are built with [Nest.js](https://docs.nestjs.com/) and follow a standard 3-tier architecture: controllers, service layer, and data access layer. The documentation is fairly comprehensive and a recommended read, but here are the highlights:

- **Modules** - `.module.ts` files splitting the package into capabilities, allowing feature encapsulation. There will always be a root module within the package importing all other modules.

- **Controllers** - `.controller.ts` files for handling and sending HTTP requests .

- **Middleware** - `.middleware.ts` files for intercepting a client request before it gets routed to a controller. An example for this would be logging middleware, where a request could be sent to a logging mechanism before reaching the route handler.

- **Models** - files defining the data used in all nest files, typically taking a proto as an input. For more information on proto files, see the [proto](https://github.com/GTBitsOfGood/juno/tree/ryder/documentation-overhaul/packages/proto) package.

- **E2E Tests** - `.*.spec.ts` specification files testing a particular model or behavior.

### Folder Structure

```
├── src
│   ├── middleware
│   ├── models
│   └── modules
│       ├── auth
│       ├── email
│       ├── project
│       └── user
└── test
```

## Database Overview
![prisma-editor](https://github.com/user-attachments/assets/7e747dae-216c-4976-950b-9949ee9f5c86)

## Development

Make sure to check out the [main installation instructions](https://github.com/GTBitsOfGood/juno/tree/ryder/documentation-overhaul) first!

Run E2E tests in watch mode:


```
api-gateway: `yarn test:e2e:api-gateway-live`
```

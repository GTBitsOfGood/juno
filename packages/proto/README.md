<div align="center">
  
  <a href="">![E2E Tests](https://img.shields.io/github/actions/workflow/status/GTBitsOfGood/juno/e2e-tests.yml?style=for-the-badge)</a> 
  <a href="">![GitHub Releases](https://img.shields.io/github/v/release/GTBitsOfGood/juno?include_prereleases&style=for-the-badge)</a>
  <a href="">![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)</a>
  
</div>

<h3 align="center">
  @juno/proto
</h3>

<div align="center">
  
[Bits of Good](https://bitsofgood.org/)'s central infrastructure API, integrating several in-house services to simplify and streamline project development.

<br />
<a href="https://github.com/GTBitsOfGood/juno"><strong>« Back to main README</strong></a>

</div>


## Proto

Juno's `proto` directory holds the [protobuf](https://grpc.io/docs/what-is-grpc/introduction/) definitions and generated TypeScript types used for gRPC between services. Generation and distribution are handled by `gen_protos.sh` and `copy_protos.sh`. From the repository root, run:

```sh
pnpm gen-proto
pnpm sync-protos
```

### Adding a new proto to Juno

To add a new proto to Juno, there are two primary files required:

- A `.proto` file in the `definitions` folder describing the proto schemas
- A corresponding file in `src/gen` exporting types for the proto file.

### Folder Structure

```
├── definitions
├── src
│   └── gen
├── copy_protos.sh
└── gen_protos.sh
```

## Development

Make sure to check out the [main installation instructions](https://github.com/GTBitsOfGood/juno) first. This package has no E2E test script of its own; proto changes are covered by the service tests that depend on them.

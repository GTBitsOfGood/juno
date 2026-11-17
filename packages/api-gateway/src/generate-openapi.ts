// Writes the gateway's OpenAPI spec to docs/openapi.json for the Mintlify API
// reference. Preview mode builds the route metadata without starting the gRPC
// clients, so no other Juno service needs to be running. Run it through
// `nest start` (pnpm gen:openapi) so the @nestjs/swagger compiler plugin in
// nest-cli.json fills in DTO properties, as it does for the running gateway.
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { buildOpenApiConfig } from './openapi';

async function generate() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  const document = SwaggerModule.createDocument(
    app,
    buildOpenApiConfig('https://api.juno.bitsofgood.org'),
  );
  // pnpm runs package scripts from packages/api-gateway
  const out = join(process.cwd(), '../../docs/openapi.json');
  writeFileSync(out, JSON.stringify(document));
  await app.close();
}

generate();

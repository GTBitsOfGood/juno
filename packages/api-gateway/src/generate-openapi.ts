// Writes the gateway's OpenAPI spec to docs/openapi.json for the Mintlify API
// reference. Preview mode builds the route metadata without starting the gRPC
// clients, so no other Juno service needs to be running.
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
  const out = join(__dirname, '../../../docs/openapi.json');
  writeFileSync(out, JSON.stringify(document));
  await app.close();
  console.log(`Wrote ${out}`);
}

generate();

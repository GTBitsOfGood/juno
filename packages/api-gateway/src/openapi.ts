import { DocumentBuilder } from '@nestjs/swagger';

export const buildOpenApiConfig = (server: string) =>
  new DocumentBuilder()
    .setTitle('Juno')
    .setDescription('Juno Public API Docs')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'API_Key' },
      'API_Key',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addServer(server)
    .build();

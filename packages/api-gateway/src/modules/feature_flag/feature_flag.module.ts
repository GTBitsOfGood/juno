import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';
import { FeatureFlagController } from './feature_flag.controller';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  FeatureFlagProto,
  FeatureFlagProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const { FEATURE_FLAG_SERVICE_NAME, JUNO_FEATURE_FLAG_PACKAGE_NAME } = FeatureFlagProto;
const { API_KEY_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;


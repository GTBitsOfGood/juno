FROM alpine AS grpc-probe

ARG TARGETARCH

COPY ./docker/get_grpc_probe.sh /get_grpc_probe.sh

RUN --mount=type=cache,target=/var/cache/apk apk add --update wget

RUN chmod +x ./get_grpc_probe.sh
RUN TARGETARCH=$TARGETARCH ./get_grpc_probe.sh

# TODO: Switch over to minimal node installation
FROM node:18 AS deps

ARG TARGETARCH

# pnpm needs to be added to the global path
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@10.0.0 --activate

COPY ./docker/get_protoc.sh /get_protoc.sh
RUN chmod +x /get_protoc.sh
RUN TARGETARCH=$TARGETARCH /get_protoc.sh
RUN cp /protoc/bin/protoc /usr/local/bin/protoc

WORKDIR /app

COPY . .

RUN chmod +x /app/packages/proto/gen_protos.sh

WORKDIR /app/packages/proto

RUN pnpm --filter juno-proto install --frozen-lockfile
RUN pnpm --filter juno-proto build

WORKDIR /app

RUN --mount=type=cache,sharing=locked,id=pnpm,target=/pnpm/store pnpm install -r --frozen-lockfile --ignore-scripts

RUN mkdir /deploy

RUN pnpm deploy --filter=api-gateway --prod /deploy/api-gateway 
RUN pnpm deploy --filter=auth-service --prod /deploy/auth-service
RUN pnpm deploy --filter=db-service --prod /deploy/db-service
RUN pnpm deploy --filter=email-service --prod /deploy/email-service
RUN pnpm deploy --filter=logging-service --prod /deploy/logging-service
RUN pnpm deploy --filter=file-service --prod /deploy/file-service
RUN pnpm deploy --filter=analytics-service --prod /deploy/analytics-service

# TODO: Switch over to a minimal node installation
FROM node:18 AS base-service

ARG SENTRY_AUTH_TOKEN
# TODO: Move over to a direct wget (no more npm usage)
RUN npm install -g pnpm @nestjs/cli

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@10.0.0 --activate

COPY --from=grpc-probe /grpc_health_probe /bin/grpc_health_probe

RUN chmod a+x /bin/grpc_health_probe

FROM base-service AS api-gateway

WORKDIR /app

COPY --from=deps /deploy/api-gateway/ ./api-gateway/

WORKDIR /app/api-gateway

EXPOSE 3000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service AS auth-service

WORKDIR /app

COPY --from=deps /deploy/auth-service/ ./auth-service/

WORKDIR /app/auth-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service AS email-service

WORKDIR /app

COPY --from=deps /deploy/email-service/ ./email-service/

WORKDIR /app/email-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service AS file-service

WORKDIR /app

COPY --from=deps /deploy/file-service/ ./file-service/

WORKDIR /app/file-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service AS analytics-service

WORKDIR /app

COPY --from=deps /deploy/analytics-service/ ./analytics-service/

WORKDIR /app/analytics-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service AS logging-service

WORKDIR /app

COPY --from=deps /deploy/logging-service/ ./logging-service/

WORKDIR /app/logging-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service AS db-service

WORKDIR /app

COPY --from=deps /deploy/db-service/ ./db-service/

WORKDIR /app/db-service

EXPOSE 5000

RUN pnpm install -g prisma

RUN prisma generate

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

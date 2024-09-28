FROM alpine as grpc-probe

ARG TARGETARCH

COPY ./docker/get_grpc_probe.sh /get_grpc_probe.sh

RUN --mount=type=cache,target=/var/cache/apk apk add --update wget

RUN chmod +x ./get_grpc_probe.sh
RUN TARGETARCH=$TARGETARCH ./get_grpc_probe.sh

# TODO: Switch over to minimal node installation
FROM node:18 as deps

# TODO: move over to direct wget (no more npm usage)
RUN npm install -g pnpm

# pnpm needs to be added to the global path
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


WORKDIR /app

COPY . .

RUN --mount=type=cache,sharing=locked,target=/var/cache/apt apt update && apt install -y python3 make g++ protobuf-compiler

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

# TODO: Switch over to a minimal node installation
FROM node:18 as base-service

ARG SENTRY_AUTH_TOKEN
# TODO: Move over to a direct wget (no more npm usage)
RUN npm install -g pnpm @nestjs/cli

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY --from=grpc-probe /grpc_health_probe /bin/grpc_health_probe

RUN chmod a+x /bin/grpc_health_probe

FROM base-service as api-gateway

WORKDIR /app

COPY --from=deps /deploy/api-gateway/ ./api-gateway/

WORKDIR /app/api-gateway

EXPOSE 3000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service as auth-service

WORKDIR /app

COPY --from=deps /deploy/auth-service/ ./auth-service/

WORKDIR /app/auth-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service as email-service

WORKDIR /app

COPY --from=deps /deploy/email-service/ ./email-service/

WORKDIR /app/email-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service as logging-service

WORKDIR /app

COPY --from=deps /deploy/logging-service/ ./logging-service/

WORKDIR /app/logging-service

EXPOSE 5000

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

FROM base-service as db-service

WORKDIR /app

COPY --from=deps /deploy/db-service/ ./db-service/

WORKDIR /app/db-service

EXPOSE 5000

RUN pnpm install -g prisma

RUN prisma generate

RUN pnpm build

ENTRYPOINT ["pnpm", "start:prod"]

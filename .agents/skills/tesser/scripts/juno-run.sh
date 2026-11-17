#!/usr/bin/env bash
# Runs the same stack as `pnpm start:dev`; db-service migrates on start. Plain `migrate dev` never
# seeds an existing database, so once db-service is healthy we run its (upsert-only) prisma seed:
# superadmin test-superadmin@test.com / test-password and project test-seed-project.
set -euo pipefail
cd "$(dirname "$0")/../../../.."
COMPOSE=(docker compose -f docker-compose-dev.yml -p juno)
(
  for _ in $(seq 180); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' juno-db-service-1 2>/dev/null)" = healthy ] && break
    sleep 5
  done
  "${COMPOSE[@]}" exec -T db-service pnpm prisma db seed && echo "tesser: juno seed applied"
) &
exec "${COMPOSE[@]}" up --build --remove-orphans

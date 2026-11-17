#!/usr/bin/env bash
# Build the dev images ahead of `up` so the dev step starts fast; cached when nothing changed.
set -euo pipefail
cd "$(dirname "$0")/../../../.."
docker compose -f docker-compose-dev.yml -p juno build

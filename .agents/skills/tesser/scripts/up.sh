#!/usr/bin/env bash
# up.sh: start (or reuse) this worktree's juno-api box and print `juno-api <box_id> <url>` once healthy.
set -euo pipefail
cd "$(dirname "$0")/../../../.."
box=$(tesser dev --detach juno-api | tail -1)
tesser wait "$box" --timeout 9m >/dev/null
echo "juno-api $box http://${box/_/-}.localhost:8888"

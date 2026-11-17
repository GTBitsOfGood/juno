#!/usr/bin/env bash
# db.sh <juno-api box> [psql args...]: psql on that box's postgres, e.g. db.sh <box> -c 'select * from "User"'.
set -euo pipefail
box=${1:?usage: db.sh <juno-api box> [psql args]}; shift
tesser ssh "$box" -- docker exec -i juno-db-1 psql -U user -d postgres "$@"

#!/usr/bin/env bash
# login.sh <juno-api box> [name]: create (first call) dev+<name>@example.com, an ADMIN linked to project
# dev-<name>, and print a fresh juno JWT as {"token": ...}. Default name: this worktree's folder.
set -euo pipefail
cd "$(dirname "$0")/../../../.."
box=${1:?usage: login.sh <juno-api box> [name]}
name=$(echo "${2:-$(basename "$PWD")}" | tr -c 'a-zA-Z0-9\n' '-' | tr 'A-Z' 'a-z')
email="dev+$name@example.com" pass=dev-password project="dev-$name"
j() { local m=$1 p=$2 b=${3:-} e=${4:-test-superadmin@test.com} pw=${5:-test-password}
  tesser ssh "$box" -- curl -sS --fail-with-body -X "$m" "http://localhost:8888$p" -H 'Content-Type: application/json' \
    -H "X-User-Email: $e" -H "X-User-Password: $pw" ${b:+-d "$b"}; }
# Creates fail once the user/project exists; the JWT mint and link below fail if they really are missing.
j POST /user "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\"}" >/dev/null 2>&1 || true
j POST /user/type "{\"email\":\"$email\",\"type\":\"ADMIN\"}" >/dev/null
j POST /project "{\"name\":\"$project\"}" >/dev/null 2>&1 || true
tok=$(j POST /auth/user/jwt "" "$email" "$pass" | jq -r '.token // empty')
[ -n "$tok" ] || { echo "login.sh: no JWT for $email" >&2; exit 1; }
uid=$(tesser ssh "$box" -- curl -sS --fail-with-body http://localhost:8888/auth/test-auth -H "Authorization: Bearer $tok" |
  jq -r '.user.id | if type=="object" then .low else . end')
j PUT "/user/id/$uid/project" "{\"name\":\"$project\"}" >/dev/null
j POST /auth/user/jwt "" "$email" "$pass" | jq -c '{token}'

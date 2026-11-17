---
name: tesser
description: Run juno's e2e tests and the backend stack on tesser boxes, get a JWT as your own dev user, and query its postgres. Use for any test, typecheck, running API, signed-in check or test data in juno, or when a juno-api box misbehaves.
---

# tesser

For tesser itself, `tesser --help`. Pick the cheapest path that proves your task.

| service  | manifest        | port | shared instance | what it is                                                         |
| -------- | --------------- | ---- | --------------- | ------------------------------------------------------------------ |
| juno-api | `juno-api.toml` | 8888 | none            | `docker-compose-dev.yml`: gateway on 8888, gRPC services, postgres |

The dashboard (GTBitsOfGood/juno-dashboard, service `dashboard-web`) depends on juno-api. There are no
always-on shared instances: start your own box, and `tesser rm` it when done.

## Waiting

Run every command below in the foreground with your tool's timeout raised to 10 minutes
(`timeout: 600000`). If one times out, `tesser wait <box> --timeout 9m`; never background it and poll.

## Focused checks

The workbench starts from the snapshot, with the dev images built. The e2e scripts run `docker compose up`
without `--build` and the images bake the source, so build first or you test the snapshot's code. Each
suite brings up its own compose stack with `RUN_MODE=test`, exactly as CI does:

- `tesser exec -- bash -lc 'docker compose -f docker-compose-dev.yml build && pnpm test:e2e:analytics-service'` (also `api-gateway`, `auth-service`, `db-service`, `email-service`, `logging-service`; `file-service` needs Azure secrets)
- `tesser exec -- bash -lc 'pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm nx run-many --target=tsc --no-cloud'` (plain `pnpm tsc` fails on Nx Cloud auth)

## Up

`bash .agents/skills/tesser/scripts/up.sh` starts (or reuses) this worktree's juno-api box and prints
`juno-api <box_id> <url>` once `/docs` answers. A restart with built images takes 1–3.5 min. db-service
migrates on start, and the run script applies the upsert-only prisma seed. Swagger: `<url>/docs`.

## Sign in

`bash .agents/skills/tesser/scripts/login.sh <box_id>` creates (on the first call) `dev+<worktree>@example.com`
(password `dev-password`), an ADMIN linked to its own project `dev-<worktree>`, and prints
`{"token": "<juno JWT>"}`. Each call mints a new JWT. The seed superadmin is `test-superadmin@test.com` /
`test-password`; use it only to set things up.

## Data

- Seed: superadmin above, project `test-seed-project`, and its email config.
- `bash .agents/skills/tesser/scripts/db.sh <box_id> -c 'select …'`; main tables are `"User"`, `"Project"`,
  `"ApiKey"`, and the analytics event tables in `packages/db-service/prisma/schema.prisma`.
- Write only in your own project unless the box is yours alone.

## Iterate

Images bake the source, so after an
edit run `tesser sync <box> --restart` (it rebuilds changed images). A schema change needs a new prisma
migration, applied by db-service on restart; do that on your own box.

## When it breaks

Check one layer at a time: `tesser status <box>`, `tesser logs <box>`, then your data.

- `Invalid user credentials` for the superadmin: the seed did not run; look for `juno seed applied` in `tesser logs <box>`.
- `GET / gets no answer` / 404 on `/`: normal; health is `/docs`.

## Hand-off

Worktree and sha, each box and its role, your dev user, the command, its log and exit code.
`tesser rm` the boxes you made when the task is done.

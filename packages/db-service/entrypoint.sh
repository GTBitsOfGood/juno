#!/bin/bash

if [[ ${RUN_MODE} == *"test"* || ${RUN_MODE} == *"reseed"* ]]; then
    echo "Resetting database..."
    pnpm prisma migrate reset --force
fi

pnpm prisma migrate dev

pnpm --filter db-service ${DB_COMMAND-start:dev} 

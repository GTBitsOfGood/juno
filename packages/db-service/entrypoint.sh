#!/bin/bash

if [[ ${RUN_MODE} == *"test"* ]]; then
    echo "Resetting database for test..."
    pnpm prisma migrate reset --force
fi

pnpm prisma migrate dev

pnpm --filter db-service ${DB_COMMAND-start:dev} 

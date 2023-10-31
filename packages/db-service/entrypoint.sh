#!/bin/bash

if [[ ${RUN_MODE} == *"test"* ]]; then
    echo "Resetting database for test..."
    prisma migrate reset --force
fi

prisma migrate dev 

yarn ${DB_COMMAND-start:dev} 

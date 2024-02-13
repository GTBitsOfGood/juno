#!/bin/bash

if [[ ${RUN_MODE} == *"test"* ]]; then
    echo "Resetting database for test..."
    yarn prisma migrate reset --force
fi

yarn prisma migrate dev 

yarn ${DB_COMMAND-start:dev} 

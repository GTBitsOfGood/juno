#!/bin/sh

# Launches prisma studio given the current db-service port. 

# extract db information from running juno instance
db_container_id=$(docker ps -q --filter "ancestor=postgres")
db_container_port=$(docker port $db_container_id)

db_public_port=$(echo "$db_container_port" | grep -oP "0.0.0.0:\K\d+")

# run prisma studio 
cd packages/db-service

DATABASE_URL="postgresql://user:password@localhost:$db_public_port/postgres" pnpm prisma studio 

#!/bin/bash

yarn prisma migrate deploy

yarn prisma generate

yarn start:dev

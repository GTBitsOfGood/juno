#!/bin/bash

# Add the names of any services that have proto definitions to auto-genetate
# 
# NOTE: The proto project's subdirectory MUST match the directory name of the 
# service in packages/
PROTO_SERVICE_NAMES=("auth-service" "db-service")

for service in ${PROTO_SERVICE_NAMES[@]}; do

    mkdir -p ./packages/${service}/src/gen

    protoc \
        --plugin=./node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out=./packages/${service}/src/gen \
        --ts_proto_opt=nestJs=true \
        --ts_proto_opt=returnObservable=false \
        -I ./packages/proto/${service}/ \
        ./packages/proto/${service}/*.proto
done

# Add the names of any services that have proto definitions to auto-genetate that 
# will be used in the API Gateway
# 
# NOTE: The proto project's subdirectory MUST match the directory name of the service in packages/
PROTO_GW_SERVICES=("auth-service" "db-service")

for service in ${PROTO_GW_SERVICES[@]}; do

    mkdir -p ./packages/api-gateway/src/${service}/gen

    protoc \
        --plugin=./node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out=./packages/api-gateway/src/${service}/gen \
        --ts_proto_opt=nestJs=true \
        --ts_proto_opt=returnObservable=false \
        -I ./packages/proto/${service}/ \
        ./packages/proto/${service}/*.proto
done

# Add the names of any services that have proto definitions to auto-genetate that 
# will be used in the Auth Service 
# 
# NOTE: The proto project's subdirectory MUST match the directory name of the service in packages/
PROTO_AUTH_USED_SERVICES=()

for service in ${PROTO_AUTH_USED_SERVICES[@]}; do

    mkdir -p ./packages/auth-service/src/${service}/gen

    protoc \
        --plugin=./node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out=./packages/auth-service/src/${service}/gen \
        --ts_proto_opt=nestJs=true \
        --ts_proto_opt=returnObservable=false \
        -I ./packages/proto/${service}/ \
        ./packages/proto/${service}/*.proto
done


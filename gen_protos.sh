#!/bin/bash

EXEC_PATH=${EXEC_PATH-.}

# Add the names of any services that have proto definitions to auto-genetate
# 
# NOTE: The proto project's subdirectory MUST match the directory name of the 
# service in packages/
PROTO_SERVICE_NAMES=("auth-service" "db-service")

for service in ${PROTO_SERVICE_NAMES[@]}; do

    mkdir -p ${EXEC_PATH}/packages/${service}/src/gen

    protoc \
        --plugin=${EXEC_PATH}/node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out=${EXEC_PATH}/packages/${service}/src/gen \
        --ts_proto_opt=nestJs=true \
        --ts_proto_opt=returnObservable=false \
        -I ${EXEC_PATH}/packages/proto/${service}/ \
        ${EXEC_PATH}/packages/proto/${service}/*.proto
done

# Add the names of any services that have proto definitions to auto-genetate that 
# will be used in the API Gateway
# 
# NOTE: The proto project's subdirectory MUST match the directory name of the service in packages/
PROTO_GW_SERVICES=("auth-service" "db-service")

for service in ${PROTO_GW_SERVICES[@]}; do

    mkdir -p ${EXEC_PATH}/packages/api-gateway/src/${service}/gen

    protoc \
        --plugin=${EXEC_PATH}/node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out=${EXEC_PATH}/packages/api-gateway/src/${service}/gen \
        --ts_proto_opt=nestJs=true \
        --ts_proto_opt=returnObservable=false \
        -I ${EXEC_PATH}/packages/proto/${service}/ \
        ${EXEC_PATH}/packages/proto/${service}/*.proto
done

# Add the names of any services that have proto definitions to auto-generate that 
# will be used in the Auth Service 
# 
# NOTE: The proto project's subdirectory MUST match the directory name of the service in packages/
PROTO_AUTH_USED_SERVICES=("db-service")

for service in ${PROTO_AUTH_USED_SERVICES[@]}; do

    mkdir -p ${EXEC_PATH}/packages/auth-service/src/${service}/gen

    protoc \
        --plugin=${EXEC_PATH}/node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out=${EXEC_PATH}/packages/auth-service/src/${service}/gen \
        --ts_proto_opt=nestJs=true \
        --ts_proto_opt=returnObservable=false \
        -I ${EXEC_PATH}/packages/proto/${service}/ \
        ${EXEC_PATH}/packages/proto/${service}/*.proto
done


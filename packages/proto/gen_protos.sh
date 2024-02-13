#!/bin/bash

EXEC_PATH=${EXEC_PATH-.}

mkdir -p ${EXEC_PATH}/src/gen

protoc \
    --plugin=${EXEC_PATH}/node_modules/.bin/protoc-gen-ts_proto \
    --ts_proto_out=${EXEC_PATH}/src/gen \
    --ts_proto_opt=nestJs=true \
    --ts_proto_opt=returnObservable=false \
    --ts_proto_opt=lowerCaseServiceMethods=false \
    -I ${EXEC_PATH}/definitions/ \
    ${EXEC_PATH}/definitions/*.proto

rm -rf ../${EXEC_PATH}/api-gateway/node_modules/juno-proto
rm -rf ../${EXEC_PATH}/auth-service/node_modules/juno-proto
rm -rf ../${EXEC_PATH}/db-service/node_modules/juno-proto

mkdir -p ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/dist
mkdir -p ../${EXEC_PATH}/auth-service/node_modules/juno-proto/dist
mkdir -p ../${EXEC_PATH}/db-service/node_modules/juno-proto/dist

mkdir -p ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/definitions
mkdir -p ../${EXEC_PATH}/auth-service/node_modules/juno-proto/definitions
mkdir -p ../${EXEC_PATH}/db-service/node_modules/juno-proto/definitions

cp -r ${EXEC_PATH}/dist/* ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/dist
cp -r ${EXEC_PATH}/dist/* ../${EXEC_PATH}/auth-service/node_modules/juno-proto/dist
cp -r ${EXEC_PATH}/dist/* ../${EXEC_PATH}/db-service/node_modules/juno-proto/dist

cp -r ${EXEC_PATH}/definitions/* ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/definitions
cp -r ${EXEC_PATH}/definitions/* ../${EXEC_PATH}/auth-service/node_modules/juno-proto/definitions
cp -r ${EXEC_PATH}/definitions/* ../${EXEC_PATH}/db-service/node_modules/juno-proto/definitions

cp -r ${EXEC_PATH}/package.json ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/
cp -r ${EXEC_PATH}/package.json ../${EXEC_PATH}/auth-service/node_modules/juno-proto/
cp -r ${EXEC_PATH}/package.json ../${EXEC_PATH}/db-service/node_modules/juno-proto/

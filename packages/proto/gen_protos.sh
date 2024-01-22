#!/bin/bash

EXEC_PATH=${EXEC_PATH-.}

mkdir -p ${EXEC_PATH}/src/gen

protoc \
    --plugin=${EXEC_PATH}/node_modules/.bin/protoc-gen-ts_proto \
    --ts_proto_out=${EXEC_PATH}/src/gen \
    --ts_proto_opt=nestJs=true \
    --ts_proto_opt=returnObservable=false \
    -I ${EXEC_PATH}/definitions/ \
    ${EXEC_PATH}/definitions/*.proto

EXEC_PATH=${EXEC_PATH-.}

mkdir -p ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/dist
mkdir -p ../${EXEC_PATH}/auth-service/node_modules/juno-proto/dist
mkdir -p ../${EXEC_PATH}/db-service/node_modules/juno-proto/dist

cp -r ${EXEC_PATH}/dist/* ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/dist
cp -r ${EXEC_PATH}/dist/* ../${EXEC_PATH}/auth-service/node_modules/juno-proto/dist
cp -r ${EXEC_PATH}/dist/* ../${EXEC_PATH}/db-service/node_modules/juno-proto/dist

cp -r ${EXEC_PATH}/package.json ../${EXEC_PATH}/api-gateway/node_modules/juno-proto/
cp -r ${EXEC_PATH}/package.json ../${EXEC_PATH}/auth-service/node_modules/juno-proto/
cp -r ${EXEC_PATH}/package.json ../${EXEC_PATH}/db-service/node_modules/juno-proto/

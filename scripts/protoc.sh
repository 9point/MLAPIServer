#!/bin/bash

mkdir -p ./src/static_codegen

PROTO_DIR=./proto/
CODEGEN_DIR=../src/static_codegen

cd ${PROTO_DIR}
PROTO_FILES=$(ls .)

for PROTO_FILE in $PROTO_FILES
do
echo "Compiling ${PROTO_FILE}..."
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:${CODEGEN_DIR} --grpc_out=${CODEGEN_DIR} --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` ${PROTO_FILE}
done

cd ..
#!/bin/bash
#!/usr/bin/env bash

# NOTE: This script assumes environment variables AWS_ACCESS_KEY_ID
# and AWS_SECRET_ACCESS_KEY are properly set for storage access.

SERVICE_NAME=$(cat package.json \
	| grep name \
	| head -1 \
	| awk -F: '{ print $2 }' \
	| sed 's/[",]//g' \
	| tr -d '[[:space:]]')


ENDPOINT=https://${CREDENTIALS_SPACES_REGION}.digitaloceanspaces.com
SRC=s3://${CREDENTIALS_SPACES_BUCKET}/${SERVICE_NAME}
TARGET=credentials/

rm -rf ${TARGET}
mkdir -p ${TARGET}
aws s3 cp --endpoint=${ENDPOINT} ${SRC} ${TARGET} --recursive

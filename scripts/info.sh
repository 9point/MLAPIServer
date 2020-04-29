#!/bin/bash

SERVICE_NAME=$(cat package.json \
	| grep name \
	| head -1 \
	| awk -F: '{ print $2 }' \
	| sed 's/[",]//g' \
	| tr -d '[[:space:]]')

VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

IMAGE_NAME=${DOCKER_ORG}/${SERVICE_NAME}

echo "Service Name: ${SERVICE_NAME}"
echo "Version: ${VERSION}"
echo "Docker Image: ${IMAGE_NAME}"
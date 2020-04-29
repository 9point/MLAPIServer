#!/usr/bin/env bash

set -e

echo "Building Docker image..."

SERVICE_NAME=$(cat package.json \
	| grep name \
	| head -1 \
	| awk -F: '{ print $2 }' \
	| sed 's/[",]//g' \
	| tr -d '[[:space:]]')

IMAGE_NAME=${DOCKER_ORG}/${SERVICE_NAME}

# Do not push if there are unstaged git changes
CHANGED=$(git status --porcelain)
if [ -n "$CHANGED" ]; then
  echo "Please commit git changes before pushing to a registry"
  exit 1
fi


GIT_SHA=$(git rev-parse HEAD)

IMAGE_TAG_WITH_SHA="${IMAGE_NAME}:${GIT_SHA}"

RELEASE_SEMVER=$(git describe --tags --exact-match "$GIT_SHA" 2>/dev/null) || true

if [ -n "$RELEASE_SEMVER" ]; then
  IMAGE_TAG_WITH_SEMVER="${IMAGE_NAME}:${RELEASE_SEMVER}${IMAGE_TAG_SUFFIX}"
fi

# build the image
docker build --file ${DOCKERFILE} -t "$IMAGE_TAG_WITH_SHA" -t "$IMAGE_NAME:latest" --build-arg IMAGE_TAG="${IMAGE_TAG_WITH_SHA}" .
echo "${IMAGE_TAG_WITH_SHA} built locally."


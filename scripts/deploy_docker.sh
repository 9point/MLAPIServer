#!/usr/bin/env bash

echo "Deploying Docker image..."

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


if [ -n "${DOCKER_REGISTRY_PASSWORD}" ]; then
  docker login --username="$DOCKER_REGISTRY_USERNAME" --password="$DOCKER_REGISTRY_PASSWORD"
fi

docker tag "$IMAGE_TAG_WITH_SHA" "${IMAGE_TAG_WITH_SHA}"

docker push "${IMAGE_TAG_WITH_SHA}"
docker push "${IMAGE_NAME}:latest"
echo "${IMAGE_TAG_WITH_SHA} pushed to remote."

# If the current commit has a semver tag, also push the images with the semver tag
if [ -n "$RELEASE_SEMVER" ]; then

  docker tag "$IMAGE_TAG_WITH_SHA" "${IMAGE_TAG_WITH_SEMVER}"
  docker push "${IMAGE_TAG_WITH_SEMVER}"
  echo "${IMAGE_TAG_WITH_SEMVER} pushed to remote."

fi

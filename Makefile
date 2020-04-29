TEST="$(cat package.json)"

DOCKER_ORG=9point

info:
	DOCKER_ORG=${DOCKER_ORG} bash scripts/info.sh

build_docker:
	DOCKER_ORG=${DOCKER_ORG} DOCKERFILE=Dockerfile bash scripts/build_docker.sh

deploy_docker:
	DOCKER_ORG=${DOCKER_ORG} DOCKERFILE=Dockerfile bash scripts/deploy_docker.sh

install_credentials:
	DOCKER_ORG=${DOCKER_ORG} bash scripts/install_credentials.sh

protoc:
	bash scripts/protoc.sh

tag_version:
	bash scripts/tag_version.sh
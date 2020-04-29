# ML Service API

## Install

- [Node](https://nodejs.org/en/download/)
- Docker

## Run

Before this project can be run locally, the following must be done:

- Define the following environment variables:

  - `AWS_ACCESS_KEY_ID`: The access key for the spaces bucket.

  - `AWS_SECRET_ACCESS_KEY`: The secret for the spaces bucket.

  - `CREDENTIALS_SPACES_BUCKET`: The identifier for the Digital Ocean
    spaces bucket containing the credentials for this service.

  - `CREDENTIALS_SPACES_REGION`: The region for the Digital Ocean
    space bucket containing the credentials for this service.

  - `FIREBASE_SERVICE_ACCOUNT`: This is the path to the Firebase
    Service Account.

  - `FIREBASE_PROJECT_ID`: This is the project id for the Firebase Service.

Run the following commands from inside the repo:

```
make install_credentials
make protoc
npm install
npm start
```

## Deploy

Before this projet can be deployed, the following must be done:

- The following environment variables must be defined:

  - `DOCKER_REGISTRY_USERNAME`: This is the username for access to
    the DockerHub registry.

  - `DOCKER_REGISTRY_PASSWORD`: This is the password for access to
    the DockerHub Registry.

We need to deploy this project as a docker image:

- Make sure you are on the master branch. Docker images should only be
  generated off of the master branch.

- Make sure all changes are committed. The build and deploy scripts will
  fail if there are pending git changes.

- Add a git version tag to the current commit hash. Go into
  the `package.json` and increment the version variable.
  Then call `make tag_version`.

- Build the new image: `make build_docker`.

- Deploy the new image: `make deploy_docker`.

To deploy this to Kubernetes, access to the kubernetes 9point
deployment repo is required. In that repo, the following needs to
be done:

- In the mlapiservice deployment definition, the version of the image
  being referenced needs to be updated to the new docker image. This
  will automatically pull the docker image from the docker registry.

- See instruction in the deployment repo on how to deploy an update to
  the kubernetes cluster.

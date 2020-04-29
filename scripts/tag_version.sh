
VERSION=$(cat package.json \
	| grep version \
	| head -1 \
	| awk -F: '{ print $2 }' \
	| sed 's/[",]//g' \
	| tr -d '[[:space:]]')

GIT_TAG=v${VERSION}

for tag in $(git tag)
do
  if [ "$GIT_TAG" == "$tag" ]; then
    echo "Version ${VERSION} already exists. Need to increment version."
    exit 1
  fi
done

echo "Setting version ${VERSION}"

git tag ${GIT_TAG}

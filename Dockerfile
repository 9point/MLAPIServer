# TODO: This build phase assumes that protobufs were built before hand. Need
# to fix this later.

FROM node:13-alpine as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --no-cache --virtual .gyp python make g++ protoc bash && npm ci
ADD . /usr/src/app
RUN npm run build:ts


FROM node:13-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --no-cache --virtual .gyp python make g++ && npm ci
COPY --from=builder /usr/src/app/build/ ./build/
COPY credentials/ ./credentials/
CMD ["npm", "start"]


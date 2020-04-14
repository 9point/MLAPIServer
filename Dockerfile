FROM node:13-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
ADD . /usr/src/app
RUN npm run build

FROM node:13-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/www ./
RUN npm ci
CMD ["npm", "start"]


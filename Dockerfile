FROM node:13-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY credentials/ ./credentials/
CMD ["npm", "start"]


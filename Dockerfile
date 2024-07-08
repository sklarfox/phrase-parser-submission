FROM node:19-bullseye-slim

WORKDIR /usr/src/app
COPY parse-phrases.js .
COPY package.json .
RUN npm install

ENTRYPOINT [ "node", "parse-phrases.js" ]
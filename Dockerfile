# syntax=docker/dockerfile:1
FROM node:16-bullseye as build
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY . .
RUN yarn install && yarn build

FROM node:16-bullseye as base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/build ./
COPY yarn.lock package.json ./
COPY migrations ./migrations
COPY sql ./sql
RUN npm rebuild bcrypt --build-from-source && \
    yarn install --production

FROM node:16-bullseye-slim as prod
RUN apt-get update && apt-get -y install openssl tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app /app
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
CMD ["node", "app.js"]

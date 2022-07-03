FROM node:16-bullseye as base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production
ADD yarn.lock package.json ./
COPY actual-app-api-v4.1.0.tgz /app
COPY actual-app-web-v4.1.0.tgz /app
RUN yarn add file:actual-app-web-v4.1.0.tgz
RUN yarn add file:actual-app-api-v4.1.0.tgz
RUN npm rebuild bcrypt --build-from-source
RUN yarn install --production

FROM node:16-bullseye-slim as prod
RUN apt-get update && apt-get install openssl tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app /app
ADD . .
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
CMD ["node", "app.js"]

FROM node:16-bullseye as base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production
ADD yarn.lock package.json ./
RUN npm rebuild bcrypt --build-from-source
RUN yarn install --production

FROM node:16-bullseye as frontend
RUN apt-get update && apt-get install -y openssl
WORKDIR /frontend
RUN git clone --depth=1 https://github.com/actualbudget/actual /frontend
RUN yarn install
RUN ./bin/package-browser

FROM node:16-bullseye-slim as prod
RUN apt-get update && apt-get install openssl tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app /app
COPY --from=frontend /frontend/packages/desktop-client/build /public
ADD . .
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
ENV ACTUAL_WEB_ROOT=/public
CMD ["node", "app.js"]

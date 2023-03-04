FROM alpine as base
RUN apk add --no-cache nodejs yarn npm python3 openssl build-base
WORKDIR /app
ADD .yarn ./.yarn
ADD yarn.lock package.json .yarnrc.yml ./
RUN yarn workspaces focus --all --production

FROM alpine as prod
RUN apk add --no-cache nodejs yarn openssl tini
WORKDIR /app
COPY --from=base /app/node_modules /app/node_modules
ADD package.json app.js ./
ADD src ./src
ENTRYPOINT ["/sbin/tini","-g",  "--"]
CMD ["node", "app.js"]

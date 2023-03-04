FROM alpine as base
RUN apk add --no-cache nodejs yarn npm python3 openssl build-base
WORKDIR /app
ADD .yarn ./.yarn
ADD yarn.lock package.json .yarnrc.yml ./
RUN yarn workspaces focus --all --production

FROM alpine as prod
RUN apk add --no-cache nodejs yarn openssl tini
WORKDIR /app
COPY --from=base /app /app
ADD . .
ENTRYPOINT ["/sbin/tini","-g",  "--"]
CMD ["node", "app.js"]

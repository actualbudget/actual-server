FROM node:18-bookworm as base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY .yarn ./.yarn
COPY yarn.lock package.json .yarnrc.yml ./
RUN yarn workspaces focus --all --production

FROM node:18-bookworm-slim as prod

ARG USERNAME=actual
ARG USER_UID=1001
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME
RUN mkdir /data && chown -R ${USERNAME}:${USERNAME} /data

WORKDIR /app
ENV NODE_ENV production
COPY --from=base /app/node_modules /app/node_modules
COPY package.json app.js ./
COPY src ./src
COPY migrations ./migrations
EXPOSE 5006
CMD ["node", "app.js"]

FROM node:18-bullseye as base
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ADD .yarn ./.yarn
ADD yarn.lock package.json .yarnrc.yml ./
RUN yarn workspaces focus --all --production

FROM node:18-bullseye-slim as prod
RUN apt-get update && apt-get install tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*

ARG USERNAME=appuser
ARG USER_UID=1001
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME
RUN mkdir /data && chown -R ${USERNAME}:${USERNAME} /data

WORKDIR /app
COPY --from=base --chown=${USER_UID}:${USER_GID} /app/node_modules /app/node_modules
ADD --chown=${USER_UID}:${USER_GID} package.json app.js ./
ADD --chown=${USER_UID}:${USER_GID} src ./src
ADD --chown=${USER_UID}:${USER_GID} migrations ./migrations
USER ${USERNAME}
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
EXPOSE 5006
CMD ["node", "app.js"]

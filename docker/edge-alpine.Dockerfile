FROM alpine:3.17 as base
RUN apk add --no-cache nodejs yarn npm python3 openssl build-base jq curl
WORKDIR /app
ADD .yarn ./.yarn
ADD yarn.lock package.json .yarnrc.yml ./
RUN yarn workspaces focus --all --production
RUN if [ "$(uname -m)" = "armv7l" ]; then npm install bcrypt better-sqlite3 --build-from-source; fi

RUN mkdir /public
ADD artifacts.json /tmp/artifacts.json
RUN jq -r '[.artifacts[] | select(.workflow_run.head_branch == "master" and .workflow_run.head_repository_id == .workflow_run.repository_id)][0]' /tmp/artifacts.json > /tmp/latest-build.json

ARG GITHUB_TOKEN
RUN curl -L -o /tmp/desktop-client.zip --header "Authorization: Bearer ${GITHUB_TOKEN}" $(jq -r '.archive_download_url' /tmp/latest-build.json)
RUN unzip /tmp/desktop-client.zip -d /public

FROM alpine:3.17 as prod
RUN apk add --no-cache nodejs tini

ARG USERNAME=appuser
ARG USER_UID=1001
ARG USER_GID=$USER_UID
RUN addgroup -S ${USERNAME} -g ${USER_GID} && adduser -S ${USERNAME} -G ${USERNAME} -u ${USER_UID}
RUN mkdir /data && chown -R ${USERNAME}:${USERNAME} /data

WORKDIR /app
COPY --from=base --chown=${USER_UID}:${USER_GID} /app/node_modules /app/node_modules
COPY --from=base --chown=${USER_UID}:${USER_GID} /public /public
ADD --chown=${USER_UID}:${USER_GID} package.json app.js ./
ADD --chown=${USER_UID}:${USER_GID} src ./src
ADD --chown=${USER_UID}:${USER_GID} migrations ./migrations
USER ${USERNAME}
ENTRYPOINT ["/sbin/tini","-g",  "--"]
ENV ACTUAL_WEB_ROOT=/public
EXPOSE 5006
CMD ["node", "app.js"]

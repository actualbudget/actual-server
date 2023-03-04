FROM alpine as base
RUN apk add --no-cache nodejs yarn npm python3 openssl build-base
WORKDIR /app
ENV NODE_ENV=production
ADD yarn.lock package.json ./
RUN npm rebuild bcrypt --build-from-source
RUN yarn install --production

FROM alpine as frontend
RUN apk add --no-cache nodejs yarn npm python3 openssl build-base
WORKDIR /frontend
# Rebuild whenever there are new commits to the frontend
ADD "https://api.github.com/repos/actualbudget/actual/commits" /tmp/actual-commit.json
RUN git clone --depth=1 https://github.com/actualbudget/actual /frontend
RUN yarn install
RUN ./bin/package-browser

FROM alpine as prod
RUN apk add --no-cache nodejs yarn openssl tini
WORKDIR /app
COPY --from=base /app /app
COPY --from=frontend /frontend/packages/desktop-client/build /public
ADD . .
ENTRYPOINT ["/sbin/tini","-g",  "--"]
ENV ACTUAL_WEB_ROOT=/public
CMD ["node", "app.js"]

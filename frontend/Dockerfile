# Built from the monorepo root context (see docker-compose.yml). Installs all workspaces so the
# shared @mosaiq/nsm-common package resolves locally from source, then builds the UI and copies
# the static bundle into the bind-mounted /www directory.
FROM node:20

ENV PRODUCTION=true

WORKDIR /app

COPY . /app

RUN npm ci

WORKDIR /app/frontend

CMD ["npm", "run", "build:prod"]

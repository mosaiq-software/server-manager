# Built from the monorepo root context (see docker-compose.yml). Installs all workspaces so the
# shared @mosaiq/nsm-common package resolves locally from source, then runs the backend with tsx.
FROM node:20

WORKDIR /app

COPY . /app

RUN npm ci

RUN npm install -g tsx

WORKDIR /app/backend

CMD ["tsx", "src/index.ts"]

FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @soc-soar/shared build
RUN pnpm --filter @soc-soar/api build

EXPOSE 3001

CMD ["pnpm", "--filter", "@soc-soar/api", "start"]

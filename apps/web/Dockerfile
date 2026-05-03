FROM node:22-alpine

WORKDIR /app

RUN corepack enable

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @soc-soar/shared build
RUN pnpm --filter @soc-soar/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@soc-soar/web", "start"]

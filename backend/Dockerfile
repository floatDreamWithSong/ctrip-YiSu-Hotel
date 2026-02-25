FROM node:22-alpine
WORKDIR /app

RUN npm install -g pnpm

# --- 依赖层（源码不变时可复用）---

# 根级包管理配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts/prepare.mjs scripts/

# 工作区各包的 package.json
COPY packages/typescript-config/ packages/typescript-config/
COPY packages/shared/package.json packages/shared/
COPY backend/package.json backend/

# postinstall 所需源码：
#   @yisu/shared postinstall 执行 tsc build，需要 src + tsconfig
#   backend   postinstall 执行 prisma generate，需要 prisma/schema.prisma
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/tsup.config.ts packages/shared/
COPY packages/shared/src/          packages/shared/src/
COPY backend/prisma/               backend/prisma/

# 删除lefthook prepare
RUN pnpm pkg delete scripts.prepare
# 安装依赖（自动触发 shared build + prisma generate）
RUN pnpm install --frozen-lockfile

# --- 构建层 ---

COPY backend/src/                  backend/src/
COPY backend/tsconfig.json         backend/tsconfig.json
COPY backend/nest-cli.json         backend/nest-cli.json
COPY backend/prisma.config.ts      backend/prisma.config.ts
COPY backend/docker-entrypoint.sh  backend/docker-entrypoint.sh

RUN pnpm --filter backend build

# --- 运行层 ---
WORKDIR /app/backend

EXPOSE 8000

CMD ["pnpm", "start:prod"]

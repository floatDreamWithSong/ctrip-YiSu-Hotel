#!/bin/sh
set -e

# 等待 PostgreSQL 启动（使用 node net 模块，避免依赖 nc）
echo "Waiting for database..."
until node -e "
  const s = require('net').createConnection(5432, 'db');
  s.on('connect', () => { s.destroy(); process.exit(0); });
  s.on('error', () => { s.destroy(); process.exit(1); });
"; do
  echo "Waiting for database connection..."
  sleep 2
done
echo "Database is ready."

pnpm prisma:migrate:deploy

# 启动服务
exec pnpm start:prod

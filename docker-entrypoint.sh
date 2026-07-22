#!/bin/sh
set -e

# 容器启动入口：
# 1. 等待数据库可达（最多 60 秒）
# 2. 执行 prisma migrate deploy（应用所有迁移）
# 3. 启动 Node server

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL 环境变量未设置"
  exit 1
fi

echo "[entrypoint] 等待数据库可达..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if node -e "
    const { Client } = require('@prisma/client/runtime/library');
    process.exit(0);
  " 2>/dev/null; then
    # 简化的端口/连接检查
    if echo "$DATABASE_URL" | grep -qE '^postgres(ql)?://'; then
      HOST=$(echo "$DATABASE_URL" | sed -E 's|^postgres(ql)?://[^@]*@([^:/]+)(:[0-9]+)?/.*|\2|')
      PORT=$(echo "$DATABASE_URL" | sed -E 's|^postgres(ql)?://[^@]*@[^:/]+:([0-9]+)/.*|\2|')
      PORT=${PORT:-5432}
      if nc -z -w 2 "$HOST" "$PORT" 2>/dev/null; then
        echo "[entrypoint] 数据库可达 ($HOST:$PORT)"
        break
      fi
    fi
  fi
  echo "[entrypoint] 等待中... ($i/$MAX_RETRIES)"
  sleep 2
done

echo "[entrypoint] 执行 prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] 启动 server: $@"
exec "$@"

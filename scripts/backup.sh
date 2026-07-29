#!/usr/bin/env bash
# ============================================
# Compass 数据库备份脚本
# ============================================
# 用法：
#   ./scripts/backup.sh                    # 手动备份
#   ./scripts/backup.sh --rotate 7         # 备份并保留最近 7 个文件
#
# 通过 crontab 自动运行：
#   0 3 * * * cd /app && ./scripts/backup.sh --rotate 7
#   （每天凌晨 3 点备份，保留 7 天）
#
# 环境变量（可选，默认从 .env 读取）：
#   DATABASE_URL    PostgreSQL 连接串
#   BACKUP_DIR      备份目录（默认 ./backups）
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
ROTATE_COUNT=""

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --rotate)
      ROTATE_COUNT="${2:-}"
      shift 2
      ;;
    *)
      echo "未知参数: $1"
      echo "用法: $0 [--rotate N]"
      exit 1
      ;;
  esac
done

# 读取 DATABASE_URL
# 优先环境变量，否则尝试从 .env / .env.local 读取
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$PROJECT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    source "$PROJECT_DIR/.env" 2>/dev/null || true
  fi
  if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_DIR/.env.local" ]; then
    # shellcheck disable=SC1091
    source "$PROJECT_DIR/.env.local" 2>/dev/null || true
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backup] 错误: DATABASE_URL 未设置"
  exit 1
fi

# 从 DATABASE_URL 解析连接参数
# 格式: postgresql://user:pass@host:port/dbname?params
parse_db_url() {
  local url="$1"
  local tmp="${url#*://}"
  PGUSER="${tmp%%:*}"
  tmp="${tmp#*:}"
  PGPASSWORD="${tmp%%@*}"
  tmp="${tmp#*@}"
  PGHOST="${tmp%%:*}"
  tmp="${tmp#*:}"
  PGPORT="${tmp%%/*}"
  tmp="${tmp#*/}"
  PGDATABASE="${tmp%%\?*}"
}

parse_db_url "$DATABASE_URL"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/compass_${TIMESTAMP}.sql.gz"

echo "[backup] 开始备份 → $BACKUP_FILE"

# 执行 pg_dump
if command -v pg_dump &>/dev/null; then
  pg_dump --no-owner --no-acl --compress=6 > "$BACKUP_FILE" 2>&1
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'compass-db\|postgres'; then
  # Docker 模式：使用容器内的 pg_dump
  CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'compass-db|postgres' | head -1)
  docker exec "$CONTAINER" pg_dump -U "$PGUSER" --no-owner --no-acl "$PGDATABASE" \
    | gzip > "$BACKUP_FILE"
else
  echo "[backup] 错误: pg_dump 未找到，且未检测到 Docker 容器"
  exit 1
fi

echo "[backup] 备份完成 ($(du -h "$BACKUP_FILE" | cut -f1))"

# 轮转旧备份
if [ -n "$ROTATE_COUNT" ] && [ "$ROTATE_COUNT" -gt 0 ] 2>/dev/null; then
  COUNT=$(ls -1 "$BACKUP_DIR"/compass_*.sql.gz 2>/dev/null | wc -l)
  if [ "$COUNT" -gt "$ROTATE_COUNT" ]; then
    DELETE_COUNT=$((COUNT - ROTATE_COUNT))
    echo "[backup] 轮转: 删除 $DELETE_COUNT 个旧备份（保留最近 $ROTATE_COUNT 个）"
    ls -1t "$BACKUP_DIR"/compass_*.sql.gz | tail -n "$DELETE_COUNT" | xargs rm -f
  fi
fi

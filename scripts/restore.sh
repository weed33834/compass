#!/usr/bin/env bash
# ============================================
# Compass 数据库恢复脚本
# ============================================
# 用法：
#   ./scripts/restore.sh backups/compass_20260729_030000.sql.gz
#
# 注意事项：
#   1. 恢复会覆盖当前数据库，请先确认备份
#   2. 建议在低峰期操作
#   3. Docker 环境会自动检测并复用容器
# ============================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: $0 <备份文件路径>"
  echo "示例: $0 backups/compass_20260729_030000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[restore] 错误: 文件不存在 → $BACKUP_FILE"
  exit 1
fi

# 确认操作
echo "============================================"
echo "  即将恢复数据库: $(basename "$BACKUP_FILE")"
echo "  备份时间: $(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f %Sm "$BACKUP_FILE")"
echo "  大小: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "============================================"
echo ""
echo "警告: 此操作将覆盖当前数据库的所有数据！"
read -rp "输入 'yes' 确认继续: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "[restore] 已取消"
  exit 0
fi

# 读取 DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env" 2>/dev/null || true
  fi
  if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_DIR/.env.local" ]; then
    source "$PROJECT_DIR/.env.local" 2>/dev/null || true
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[restore] 错误: DATABASE_URL 未设置"
  exit 1
fi

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

echo "[restore] 开始恢复 → $PGDATABASE"

if command -v psql &>/dev/null; then
  gunzip -c "$BACKUP_FILE" | psql -v ON_ERROR_STOP=1
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -qE 'compass-db|postgres'; then
  CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'compass-db|postgres' | head -1)
  gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$PGUSER" -v ON_ERROR_STOP=1 "$PGDATABASE"
else
  echo "[restore] 错误: psql 未找到，且未检测到 Docker 容器"
  exit 1
fi

echo "[restore] 恢复完成"

# 提示重启应用
echo "[restore] 建议重启 Compass 应用以刷新连接池: docker compose restart compass"

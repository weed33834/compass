# Docker Compose 快速部署指南

## 前置条件

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 24.0+ | `docker --version` |
| Docker Compose | v2.20+ | `docker compose version`（非 v1 `docker-compose`） |
| 内存 | ≥ 1 GB | PostgreSQL + Next.js 最小需求 |
| 磁盘 | ≥ 2 GB | 含镜像、卷、日志 |

## 快速开始（本地测试）

```bash
# 1. 克隆项目
git clone gitcode.com/badhope/compass.git
cd compass

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，将 NEXTAUTH_SECRET 改为强随机值
openssl rand -base64 32

# 3. 构建并启动
docker compose up -d

# 4. 查看日志（等待 migrate + server 就绪）
docker compose logs -f app

# 5. 访问
open http://localhost:3000/register
```

启动过程中：
1. `db` 容器先启动，执行 pg_isready 健康检查
2. `app` 容器等待 db healthy 后启动
3. 入口脚本自动执行 `prisma migrate deploy`（数据库迁移）
4. Next.js server 在 3000 端口监听

## 环境变量参考

必需项（不填则启动失败）：

| 变量 | 说明 | 生成方式 |
|------|------|----------|
| `NEXTAUTH_SECRET` | JWT 签名密钥 | `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | 数据库密码 | 自行设定强密码 |
| `NEXTAUTH_URL` | 站点对外 URL | 本地 `http://localhost:3000`；生产用域名 |

可选项：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `POSTGRES_USER` | `compass` | 数据库用户名 |
| `POSTGRES_DB` | `compass` | 数据库名 |
| `APP_PORT` | `3000` | 宿主机暴露端口 |
| `SMTP_URL` | 空（不启用） | SMTP 连接串，用于忘记密码邮件 |
| `GITHUB_ID` / `GITHUB_SECRET` | 空 | GitHub OAuth 登录 |
| `GOOGLE_ID` / `GOOGLE_SECRET` | 空 | Google OAuth 登录 |
| `NEXT_PUBLIC_OAUTH_PROVIDERS` | 空 | 启用哪些 OAuth 入口，如 `github,google` |
| `TRUSTED_PROXY_IPS` | 空 | 反向代理 IP（Caddy/Nginx 部署时填写） |

## 架构

```
┌──────────────────────────────────────┐
│  docker compose                       │
│  ┌──────────┐    ┌───────────────┐   │
│  │    db    │    │      app      │   │
│  │ PG17     │◄───│ Next.js 16    │   │
│  │ :5432    │    │ :3000         │   │
│  └──────────┘    └───────────────┘   │
│       │                 │            │
│  compass-pgdata    (可选)Caddy       │
│  (Docker Volume)   :80/:443         │
└──────────────────────────────────────┘
```

- `db` — PostgreSQL 17 Alpine，端口仅对内暴露（安全），数据卷持久化
- `app` — 多阶段构建（deps → builder → runner），standalone 模式输出，非 root 用户运行
- 健康检查：db 用 `pg_isready`，app 用 `/api/health` HTTP 端点

## 常用操作

```bash
# 启动
docker compose up -d

# 查看日志
docker compose logs -f app
docker compose logs --tail=50 db

# 重启
docker compose restart app

# 停止
docker compose down

# 停止并清理数据卷（⚠ 不可恢复）
docker compose down -v

# 重新构建（代码/依赖变更后）
docker compose build --no-cache app
docker compose up -d

# 查看容器状态
docker compose ps
```

## 数据备份与恢复

```bash
# 备份数据库（导出 SQL 到宿主机）
docker compose exec db pg_dump -U compass compass > backup_$(date +%Y%m%d).sql

# 恢复
docker compose exec -T db psql -U compass compass < backup_20260729.sql

# 备份整个数据卷（含 WAL 日志，适合完整恢复）
docker run --rm -v compass_compass-pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata_backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v compass_compass-pgdata:/data -v $(pwd):/backup alpine tar xzf /backup/pgdata_backup.tar.gz -C /data
```

## 生产环境部署（HTTPS + Caddy）

### 1. 准备文件

创建 `Caddyfile`：

```caddyfile
{$DOMAIN:compass.local} {
    reverse_proxy app:3000
    encode gzip

    # 安全头
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }
}
```

### 2. 配置 .env

```ini
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
POSTGRES_PASSWORD=<strong-password>
DOMAIN=your-domain.com
TRUSTED_PROXY_IPS=172.16.0.0/12
```

### 3. 启用 Caddy 服务

```bash
# 编辑 docker-compose.yml，取消 caddy 服务和相关 volume 的注释
# 或执行：
sed -i 's/^  # caddy:/  caddy:/' docker-compose.yml
# （根据实际情况调整）

docker compose up -d
```

Caddy 自动申请 Let's Encrypt 证书并续期。确保域名 DNS 已解析到服务器 IP，且 80/443 端口可从公网访问。

## 故障排查

### app 容器反复重启

```bash
docker compose logs app | tail -50
```

常见原因：
- `NEXTAUTH_SECRET` 未设置或为空 → 检查 `.env`
- 数据库连接失败 → 确认 `db` 容器 healthy，端口 5432 可达
- 迁移失败 → `docker compose exec app prisma migrate status` 查看状态

### 数据库连接超时

```bash
# 确认 db 容器状态
docker compose ps db

# 进入 app 容器测试连通性
docker compose exec app nc -z db 5432
```

### 端口冲突

```bash
# 3000 端口已被占用时，在 .env 中修改
APP_PORT=3001
docker compose up -d
```

### 检查健康状态

```bash
# HTTP 健康检查
curl -f http://localhost:3000/api/health

# 容器健康状态
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

### 重置数据

```bash
# 完全清除并重建（数据卷也删除）
docker compose down -v
docker compose up -d
```

## 安全建议

1. **密码强度**：`POSTGRES_PASSWORD` 和 `NEXTAUTH_SECRET` 必须使用强随机值，不得使用 `changeme` 或 `replace-with-xxx`
2. **数据库端口**：不要将 db 的 5432 端口暴露到宿主机（docker-compose 默认不暴露）
3. **非 root 运行**：app 容器以 `nextjs` 用户（uid 1001）运行
4. **信任代理**：Caddy/Nginx 反代时必须设置 `TRUSTED_PROXY_IPS`，否则客户端 IP 获取不准确
5. **定期备份**：建议 cron 定时执行 pg_dump 备份
6. **日志轮转**：Docker 日志默认无限制，建议配置 `/etc/docker/daemon.json`：
   ```json
   {
     "log-driver": "json-file",
     "log-opts": { "max-size": "10m", "max-file": "3" }
   }
   ```

## 升级

```bash
# 拉取最新代码
git pull origin main

# 重新构建并重启
docker compose build --no-cache app
docker compose up -d
```

迁移由 `docker-entrypoint.sh` 在每次启动时自动执行 `prisma migrate deploy`，无需手动处理。

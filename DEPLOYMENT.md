# Compass 部署指南

Compass 是一个标准 **Next.js 16（App Router）+ PostgreSQL + Prisma** 应用，鉴权使用 **NextAuth（JWT 会话）**。项目已为自托管做好准备：`next.config.mjs` 开启了 `output: 'standalone'`，并外置了 Prisma / bcryptjs / nodemailer 等含原生逻辑的包。

本文给出三种部署方案，并标注两个**必须先知道的运行时坑**。

---

## 0. 先读：两个部署坑（影响方案选择）

> **坑一：媒体上传不持久（Serverless 致命）**
> 题目里的图片 / 音频通过 `POST /api/upload` 写入 `public/uploads/`（运行时磁盘）。在 **Vercel 这类 Serverless** 上，函数文件系统是临时的，上传文件会在冷启动 / 实例回收后丢失。
> - **自托管（Docker / VPS）**：挂一个卷到 `public/uploads` 即可永久保存 ✅
> - **Vercel**：要么接受上传不持久，要么改造成对象存储（S3 / Cloudflare R2）❌（需改代码）

> **坑二：官方题库导入机制（Vercel 可用）**
> 工坊页是**客户端** `fetch` 静态资源 `/official-banks/*.md` 后，再以 `multipart` 上传走导入 API —— **不依赖服务端 `fs` 读盘**，因此在 Vercel 上也能正常导入官方题库 ✅

**结论**：想完整功能（含用户上传图片/音频）→ 选自托管；只想快速展示 + 用官方题库刷题 → Vercel 也行（上传不持久而已）。

---

## 1. 环境变量清单

复制 `.env.example` 为 `.env` 后填写。带 `*` 为必填：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` * | Prisma 连接串 | `postgresql://user:pass@host:5432/compass?schema=public` |
| `NEXTAUTH_URL` * | 回调/ Cookie 域名，必须 `https` | `https://your-domain.com` |
| `NEXTAUTH_SECRET` * | 会话签名密钥，`openssl rand -base64 32` | — |
| `NEXT_PUBLIC_SITE_URL` * | SEO 根地址（metadataBase/canonical/sitemap） | `https://your-domain.com` |
| `APP_PORT` | 监听端口 | `3000` |
| `TRUSTED_PROXY_IPS` | 反代后填可信 IP，影响限流取真实 IP | `127.0.0.1` |
| `NEXT_PUBLIC_OAUTH_PROVIDERS` | OAuth 提供方，`github,google` | 留空=仅密码 |
| `GITHUB_*` / `GOOGLE_*` | 对应 OAuth 凭据（启用时填） | — |
| `SMTP_*` | 忘记密码发信（不填则发信失败，但不影响登录） | — |
| `OPENAI_*` / `AI_*` | AI 出题功能（不填则隐藏该能力） | — |
| `LOG_LEVEL` | 日志级别 | `info` |

---

## 2. 方案 A：Vercel + Neon（推荐，最快上线）

适合：快速公开上线、后续接变现、不想运维。

**步骤**
1. 代码推到 GitHub / GitCode，Vercel 导入仓库。
2. **Build & Output**
   - Framework Preset 选 `Next.js`（自动识别）。
   - Build Command：`pnpm build`（已含 `prisma generate`？见下）。
   - 在 *Project Settings → Build & Deploy* 确认 Node 版本 `22`。
3. **数据库**：在 [Neon](https://neon.tech) 建 PostgreSQL，复制连接串（带 `?sslmode=require`）填到 `DATABASE_URL`。
4. **环境变量**：把上表 `*` 必填项 + `NEXTAUTH_URL`/`NEXT_PUBLIC_SITE_URL` 填到 Vercel → Environment Variables。
5. **Prisma**：Vercel 构建时需 `prisma generate` + 运行时 `prisma migrate deploy`：
   - `package.json` 的 `build` 已执行 `next build`；建议在构建前加 `prisma generate`。可在 Vercel 的 *Build Command* 改为 `pnpm prisma generate && pnpm build`，或在 `next.config` 用 `generateBuildId` 之类钩子（更简单是直接改 build 命令）。
   - 数据库迁移：用 Vercel 的 **Build Step** 或一次性 `npx vercel env pull` 后本地 `pnpm prisma migrate deploy`。
6. 部署完成后访问域名，注册账号即可。

**注意**
- 上传图片/音频**不持久**（坑一），如需此能力请改对象存储或选自托管。
- `NEXTAUTH_URL` 必须与域名完全一致（含 `https`，无末尾斜杠）。

---

## 3. 方案 B：Railway / Render（自带 Postgres，一键）

适合：想要「一个服务带数据库」的简单托管，又不想自己管服务器。

**Railway 步骤**
1. 新建 Project → Deploy from GitHub repo。
2. 添加 PostgreSQL 插件，Railway 会自动注入 `DATABASE_URL`。
3. 在 Variables 里补 `NEXTAUTH_URL` / `NEXTAUTH_SECRET` / `NEXT_PUBLIC_SITE_URL`。
4. Build Command：`pnpm prisma generate && pnpm build`；Start：`pnpm start`。
5. 生成域名后，把该域名回填到 `NEXTAUTH_URL` 等变量（Railway 域名形如 `xxx.up.railway.app`）。

**Render 步骤**基本一致：Web Service（Docker 或 Node）＋ PostgreSQL 插件，Start 用 `pnpm start`。

> 这两个平台本质也是容器化运行，**上传文件在实例重启后同样可能丢失**（除非挂持久卷）。Railway 可挂 Volume 到 `/app/public/uploads` 解决。

---

## 4. 方案 C：自建 VPS + Docker（完全可控，首选自托管）

适合：数据私有、成本最低、想要完整功能（含上传持久化）、契合「自托管」卖点。

仓库已提供 `Dockerfile`、`docker-compose.yml`、`Caddyfile`。

**步骤**
```bash
# 1. 准备配置
cp .env.example .env
#   编辑 .env：DATABASE_URL 用 db 服务名，NEXTAUTH_URL / NEXT_PUBLIC_SITE_URL 填你的域名

# 2. 构建并启动（含 Postgres）
docker compose up -d --build

# 3. 初始化数据库（首次）
docker compose up -d db            # 先起数据库等它 healthy
docker compose run --rm app pnpm prisma migrate deploy

# 4. （可选）灌入官方题库
docker compose exec app node scripts/import-official-banks.mjs

# 5. 反代 + TLS：把 Caddyfile 的 your-domain.com 改成你的域名，
#    放到 /etc/caddy/Caddyfile 后 `caddy reload`（自动签发证书）
```

- **上传持久化**：`docker-compose.yml` 已把 `uploads` 卷挂到 `/app/public/uploads` ✅
- **数据库备份**：`docker compose exec db pg_dump -U compass compass > backup.sql`
- **升级**：`git pull` → `docker compose up -d --build` → 若 schema 变更再跑 `prisma migrate deploy`

---

## 5. 通用注意事项

- **NextAuth JWT 会话**：已在 `src/lib/auth.ts` 配 `strategy: 'jwt'`，**无需数据库存会话**，对 Serverless / 多实例水平扩展天然友好。只要 `NEXTAUTH_SECRET` 一致即可。
- **Prisma 迁移**：仓库已含 `prisma/migrations`，部署后执行 `prisma migrate deploy`（勿用 `migrate dev`，那是开发命令）。
- **PWA 已就绪**：`manifest.json` / `sw.js` / `icons/` 都在 `public/`，构建后自动可安装。
- **安全响应头**：`next.config.mjs` 已下发 HSTS / X-Frame-Options 等；反代层（Caddy）再补一层纵深防御。
- **SEO**：`app/robots.ts` 与 `app/sitemap.ts` 已读 `NEXT_PUBLIC_SITE_URL`，上线前务必把它设成真实域名（已修复原先指向 GitCode 仓库的 bug）。
- **限流与真实 IP**：若放在反代后，设置 `TRUSTED_PROXY_IPS` 让 `rateLimit` 拿到真实客户端 IP，否则会按反代 IP 误限流。

---

## 6. 后续变现提示

落地页已埋好 **免费版 / 进阶版（¥29/月）** 定价区与 FAQ。真正收费前还需：
1. 接入支付（如 Stripe / 微信支付 / 支付宝）；
2. 在 `User` 模型加 `plan` 字段，进阶能力按 `plan` 鉴权；
3. 定价文案当前为静态展示，需在注册/账户页接订阅状态。

> 当前代码未含支付与订阅鉴权，定价区为营销展示。需要我接着做订阅系统可以单独开任务。

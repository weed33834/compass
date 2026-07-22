# syntax=docker/dockerfile:1.7

# ===== Stage 1: deps =====
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 启用 pnpm via corepack
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# 仅复制清单文件，最大化缓存命中
# pnpm-workspace.yaml 含 allowBuilds 白名单（pnpm 11 用法），缺失会报 ERR_PNPM_IGNORED_BUILDS
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ===== Stage 2: builder =====
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 生成客户端（standalone 构建需要）
RUN npx prisma generate

# Next.js 采集遥测关闭
ENV NEXT_TELEMETRY_DISABLED=1

# 构建时占位环境变量（next build 静态分析会读取，不需要真实 DB 连接）
# CI / docker build 可通过 --build-arg 覆盖
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=placeholder-secret-not-used-in-runtime
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# 构建生产产物（output: 'standalone' 在 next.config.mjs 中已启用）
RUN pnpm build

# ===== Stage 3: runner =====
FROM node:22-alpine AS runner
# netcat-openbsd: docker-entrypoint.sh 用 nc -z 探测 DB 端口可达
RUN apk add --no-cache libc6-compat openssl tini netcat-openbsd
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 非 root 用户运行
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Prisma CLI 仅用于容器启动时执行 prisma migrate deploy。
# standalone 输出只含运行时依赖（@prisma/client + 生成的 .prisma/client），
# 但 prisma CLI 是 devDependency 不会被打进 standalone，需单独装。
# 必须在 USER nextjs 之前装（npm install -g 需要 root）。
RUN npm install --global prisma@5.22.0

USER nextjs

# 拷贝 standalone 产物（已含 @prisma/client 运行时 + .pnpm 嵌套结构 + 生成的客户端）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 迁移文件（容器启动时执行 prisma migrate deploy）
COPY --chown=nextjs:nodejs prisma ./prisma

# 启动脚本：先 migrate deploy 再启动 server
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]

# Compass 自托管镜像（Next.js standalone + Prisma）
# 用法见 docker-compose.yml 或：
#   docker build -t compass .
#   docker run -p 3000:3000 --env-file .env compass

# ---- 依赖阶段 ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- 构建阶段 ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate
RUN pnpm build

# ---- 运行阶段 ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# standalone 产物（server.js + 精简 node_modules）
COPY --from=builder /app/.next/standalone ./
# 静态资源与公开目录
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 完整 node_modules：@prisma/client / bcryptjs / nodemailer 在 next.config 中
# 被标记为 serverExternalPackages，不会被打进 standalone，须显式带入运行时
COPY --from=builder /app/node_modules ./node_modules
# Prisma 迁移文件（供 `prisma migrate deploy` 初始化数据库）
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

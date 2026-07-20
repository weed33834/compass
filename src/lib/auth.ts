import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/client-ip";
import bcrypt from "bcryptjs";

// 运行时校验：生产环境"运行时"（非构建期）必须配置 NEXTAUTH_SECRET
// 必须跳过 phase-production-build —— next build 在 "Collecting page data"
// 阶段会静态导入所有路由模块（含 _not-found），那时 NEXTAUTH_SECRET 通常
// 尚未注入（仅在运行容器中由 .env 提供）。如果在此处抛错，整个构建会失败。
// NEXT_PHASE 由 Next.js 注入：phase-production-build / phase-production-server / phase-development-server
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.NEXTAUTH_SECRET
) {
  throw new Error(
    "NEXTAUTH_SECRET 环境变量未设置。请运行: openssl rand -base64 32"
  );
}

// NextAuth 配置：
// - 凭证登录（邮箱 + 密码）+ 可选 OAuth（GitHub / Google）
// - 采用 JWT 会话策略，不引入 Prisma Adapter
// - OAuth 通过 signIn 回调做 account linking（按邮箱关联/创建用户），无需 Account 表
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  // 显式声明 session cookie 安全属性（CSRF 纵深防御）
  // SameSite=Lax 阻断跨站 fetch 携带 cookie（覆盖状态变更类 PATCH/POST/DELETE）
  // secure 仅生产环境启用（开发环境为 http）
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials, req) {
        // 限流：防密码爆破（每 IP 每分钟 10 次登录尝试）
        // 安全：getClientIP 兼容 NextRequest（Route Handler）与 Node IncomingMessage（NextAuth authorize 的 req）
        const reqObj = req as unknown as { headers: any };
        const ip = reqObj?.headers ? getClientIP(reqObj) : "unknown";
        const loginLimit = rateLimit(`login:${ip}`, 10, 60_000);
        if (!loginLimit.success) {
          throw new Error("登录尝试过于频繁，请稍后再试");
        }

        // 入参缺失直接拒绝
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 通过 Prisma 按邮箱查询用户
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 用户不存在或未设置密码（如仅 OAuth 用户）时返回 null
        if (!user || !user.passwordHash) {
          return null;
        }

        // bcryptjs 校验密码，不匹配返回 null
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) {
          return null;
        }

        // 返回写入 token 的用户信息
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    // GitHub OAuth：仅在配置了 client id/secret 时启用，保证未配置时项目仍可运行
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    // Google OAuth：仅在配置了 client id/secret 时启用
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    // JWT 回调：登录时将 DB userId 写入 token
    // - credentials 登录：authorize 返回的 user.id 即 DB userId，直接写入
    // - OAuth 登录：user.id 是 provider 侧用户 id（如 GitHub 数字 id），需查 DB 拿真实 userId
    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        (token as { userId?: string }).userId = user.id;
      }
      if (
        user?.email &&
        account?.provider &&
        account.provider !== "credentials"
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        });
        if (dbUser) {
          (token as { userId?: string }).userId = dbUser.id;
        }
      }
      return token;
    },
    // Session 回调：将 userId 暴露到客户端 session
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = (
          token as { userId?: string }
        ).userId;
      }
      return session;
    },
    // OAuth 登录的 signIn 回调：安全 account linking
    // - 邮箱不存在 → 自动创建新用户（安全）
    // - 邮箱已存在且无密码（已是 OAuth 用户）→ 允许登录（安全）
    // - 邮箱已存在且有密码（credentials 注册用户）→ 拒绝 OAuth 登录，
    //   防止攻击者用受害者邮箱预注册后劫持其 OAuth 账号
    // - 仅对 OAuth provider 处理；credentials 已在 authorize 中校验
    async signIn({ user, account }) {
      if (
        account?.provider &&
        account.provider !== "credentials" &&
        user?.email
      ) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, passwordHash: true },
          });
          if (!existing) {
            // 邮箱不存在：创建新 OAuth 用户（安全）
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? user.email.split("@")[0],
                passwordHash: null,
              },
            });
          } else if (existing.passwordHash) {
            // 邮箱已被 credentials 注册：拒绝 OAuth 自动 linking，防止账号劫持
            // 用户需先用密码登录，在设置页手动绑定 OAuth 账号
            console.warn(
              `[OAuth signIn] 拒绝 OAuth linking：邮箱 ${user.email} 已有密码账号`
            );
            return false;
          }
          // existing 无 passwordHash = 已是 OAuth 用户，允许登录
          return true;
        } catch (error) {
          console.error(
            `[OAuth signIn] account linking 失败 (${account.provider}):`,
            error
          );
          return false;
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

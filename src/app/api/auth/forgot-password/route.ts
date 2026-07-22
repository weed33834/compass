import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/parse-body";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/client-ip";
import { sendPasswordResetEmail } from "@/lib/mail";

// 忘记密码接口限流：每 IP 每 15 分钟 5 次
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  // 限流
  const ip = getClientIP(request);
  const limited = rateLimit(`forgot-password:${ip}`, LIMIT, WINDOW_MS);
  if (!limited.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  try {
    const body = await parseJsonBody(request);
    if (body === null) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    // 入参校验
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    // 查找用户：不存在也返回成功，防止邮箱枚举攻击
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // 生成随机 token
      const token = crypto.randomUUID();
      // 过期时间：30 分钟后
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // 事务包裹 deleteMany + create，避免两步之间被并发请求利用旧 token
      await prisma.$transaction(async (tx) => {
        // 失效该用户既有未使用 token（防多 token 共存被任一泄露利用）
        await tx.passwordReset.deleteMany({
          where: { userId: user.id, used: false },
        });

        // 创建密码重置记录
        await tx.passwordReset.create({
          data: {
            userId: user.id,
            token,
            expiresAt,
          },
        });
      });

      // 发送重置邮件
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({
      message: "如果该邮箱已注册，你将收到重置邮件",
    });
  } catch (error) {
    console.error("[forgot-password] 处理失败:", error);
    // M-11 修复：服务端异常应返回 500 而非 400（400 是客户端请求错误）
    return NextResponse.json(
      { error: "处理失败，请稍后再试" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/client-ip";

// 重置密码接口限流：每 IP 每 15 分钟 10 次
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  // 限流（与 forgot-password/register 对齐，防爆破重置接口）
  const ip = getClientIP(request);
  const limited = rateLimit(`reset-password:${ip}`, LIMIT, WINDOW_MS);
  if (!limited.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "输入不合法" },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  // 先查 token 是否存在：不存在 → 404（不泄露 user 信息）
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
  });
  if (!resetRecord) {
    return NextResponse.json(
      { error: "重置链接无效" },
      { status: 404 }
    );
  }
  // token 已过期 → 410 Gone
  if (resetRecord.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "重置链接已过期，请重新申请" },
      { status: 410 }
    );
  }

  // 事务 + 原子占位：updateMany where used=false 是 CAS，防并发竞态
  // 两个并发请求同一 token：只有第一个能 count=1，第二个 count=0 → 410
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.passwordReset.updateMany({
        where: { id: resetRecord.id, used: false },
        data: { used: true },
      });
      if (updated.count === 0) return null; // 已被并发占用
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });
      return true;
    });
    if (!result) {
      // token 已被使用（CAS 占位失败）→ 410 Gone（永久失效）
      return NextResponse.json(
        { error: "该重置链接已被使用，请重新申请" },
        { status: 410 }
      );
    }
    return NextResponse.json({ message: "密码重置成功" });
  } catch (error) {
    console.error("[reset-password] 重置失败:", error);
    return NextResponse.json(
      { error: "重置失败，请稍后再试" },
      { status: 500 }
    );
  }
}

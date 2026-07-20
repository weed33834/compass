import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/client-ip";
import { Prisma } from "@prisma/client";

// 注册接口限流：每 IP 每 15 分钟 5 次
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  // 限流：取客户端 IP 作为标识（防爆破注册接口）
  const ip = getClientIP(request);
  const limited = rateLimit(`register:${ip}`, LIMIT, WINDOW_MS);
  if (!limited.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  // 解析 + 校验请求体
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "输入不合法" },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  // 反邮箱枚举：不预先 findUnique，直接 create 依赖 DB 唯一约束兜底
  // 即便邮箱已存在也返回与成功一致的中性响应，避免泄露存在性
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });
    return NextResponse.json({ message: "注册成功" }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // 邮箱已存在：返回与成功一致的中性响应
      return NextResponse.json({ message: "注册成功" }, { status: 201 });
    }
    console.error("[register] 注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    );
  }
}

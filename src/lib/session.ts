import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// 从 NextAuth session 中提取当前登录用户 ID
// 在 API 路由中调用，返回 userId 或 null（未登录）
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

// 集中鉴权：未登录 redirect 到 /login，登录则返回 userId
// 替代各页面重复的 if (!userId) redirect("/login") 模式（middleware 已兜底，此处纵深防御）
export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");
  return userId;
}

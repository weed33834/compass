"use client";

import { signOut } from "next-auth/react";

// 客户端统一 fetch 封装：401 时跳登录页（token 失效），其余原样返回 Response
// 仅用于客户端组件的 /api/* 调用；server-side fetch 不应使用此封装
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    // token 失效，跳登录页
    signOut({ callbackUrl: "/login", redirect: true }).catch(() => {});
    throw new Error("未登录");
  }
  return res;
}

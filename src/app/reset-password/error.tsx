"use client";
import { PageError } from "@/components/ui/PageError";
export default function ResetPasswordError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} fullScreen title="页面加载失败" description="页面渲染时出现异常，请刷新或稍后重试" />;
}

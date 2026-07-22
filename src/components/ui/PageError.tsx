"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Illustration } from "@/components/Illustration";

interface PageErrorProps {
  title: string;
  description: string;
  error: Error & { digest?: string };
  reset: () => void;
  logLabel?: string;
  fullScreen?: boolean;
}

// 统一页面错误边界，替代 16 个雷同模板
export function PageError({ title, description, error, reset, logLabel, fullScreen }: PageErrorProps) {
  useEffect(() => {
    if (logLabel) console.error(`[${logLabel}] 页面错误:`, error);
  }, [error, logLabel]);

  const containerClass = fullScreen
    ? "flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-abyss"
    : "flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center";

  return (
    <div className={containerClass}>
      <Illustration name="not-found" className="h-40 w-40 text-coral/50" />
      <div className="space-y-2">
        <h2 className="font-serif text-2xl text-ivory">{title}</h2>
        <p className="max-w-md text-sm text-ivory/60">{description}</p>
      </div>
      <Button onClick={reset} variant="primary">
        重新加载
      </Button>
    </div>
  );
}

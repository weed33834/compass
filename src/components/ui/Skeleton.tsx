import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

// 骨架屏基础组件层：纯展示、无 "use client"（server-safe，可作 Suspense fallback）
// 视觉：星光银低透 + animate-pulse，延续深海底色，不引入通用灰阶

interface SkeletonProps {
  className?: string;
}

// 基础骨架块：className 控制形状/尺寸（条形、圆形、整块）
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-starlight/10", className)}
      aria-hidden="true"
    />
  );
}

// 今日聚焦卡片骨架：进度环占位 + 标题 + 待办列表
export function FocusCardSkeleton() {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-5">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );
}

// 进度总览卡片骨架：2×2 网格（图标行 + 数字行）
export function StatsCardSkeleton() {
  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// 罗盘目标卡片骨架：色点 + 标题 + 进度条 + 底部信息行
export function GoalCardSkeleton() {
  return (
    <div className="rounded-lg border border-starlight/15 bg-abyss-300/50 p-3 backdrop-blur-sm">
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1.5 h-2 w-2 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <Skeleton className="h-1.5 flex-1 rounded-full" />
        <Skeleton className="h-3 w-8" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// 最近日志卡片骨架：标题行 + 3 条日志占位（图标 + 内容 + 时间）
export function LogCardSkeleton() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

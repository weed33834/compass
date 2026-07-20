import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children?: ReactNode;
}

// 卡片组件：深色半透明背景 + 星光银细边框，
// hover 时沿 Y 轴上浮 4px 并扩散阴影
export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-starlight/15 bg-abyss-300/50 p-6 backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-brass/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {children}
    </div>
  );
}

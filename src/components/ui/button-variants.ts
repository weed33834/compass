import { cn } from "@/lib/utils";

// 此文件不含 "use client"，可在 Server Component 中安全 import
// 避免从 client 模块（Button.tsx）导入非组件导出导致服务端 undefined

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

// 变体样式表
const variantStyles: Record<ButtonVariant, string> = {
  // 主按钮：黄铜边框 + 深色填充，hover 泛黄铜微光
  primary:
    "bg-abyss-500 border border-brass text-brass hover:border-brass-light hover:shadow-[0_0_20px_rgba(201,162,39,0.35)]",
  // 次按钮：透明描边，hover 背景泛 10% 金色
  secondary:
    "bg-transparent border border-starlight/40 text-ivory hover:bg-brass/10 hover:border-brass/60",
  // 幽灵按钮：无边框，hover 微亮
  ghost:
    "bg-transparent border border-transparent text-starlight hover:bg-white/5 hover:text-ivory",
};

// 尺寸样式表
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-8 text-base",
};

// 按钮样式工具：返回按钮 className 字符串，供 Button 组件与 <Link> 复用
// 避免在 <Link> 内嵌套 <Button> 造成非法 HTML（交互元素不能嵌套交互元素）
export function buttonVariants({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none",
    variantStyles[variant],
    sizeStyles[size]
  );
}

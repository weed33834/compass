"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// 输入框组件：深色背景 + 象牙白文字，focus 时黄铜描边，
// 支持 label 与 error 文案
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-starlight">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            "h-11 w-full rounded-md border bg-abyss-700 px-4 text-ivory transition-colors duration-200",
            "placeholder:text-starlight/40",
            "focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass",
            error ? "border-coral" : "border-starlight/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-coral">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

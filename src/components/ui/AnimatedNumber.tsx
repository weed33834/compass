"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

// 数字滚动动画组件：从 old→new 平滑过渡
// - 用 framer-motion 的 animate(number, number) 驱动，onUpdate 写入文本，稳定不闪烁
// - useReducedMotion 时直接显示终值无动画
// - format 用 ref 持有，避免内联函数身份变化导致 effect 重跑
// 字体由父级 className 控制（通常 font-mono 等宽避免跳动）

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

// 默认格式化：四舍五入为整数，避免动画过程中小数抖动；需要小数请传自定义 format
const defaultFormat = (n: number) => String(Math.round(n));

export function AnimatedNumber({
  value,
  duration = 0.8,
  format,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = !!useReducedMotion();
  // 初始即显示终值，避免首屏从 0 闪一下
  const [display, setDisplay] = useState(() => (format ?? defaultFormat)(value));
  const prev = useRef(value);
  // format 在 effect 内同步到 ref，避免 render 阶段写 ref（React 19 严格规则）
  const formatRef = useRef(format ?? defaultFormat);

  useEffect(() => {
    formatRef.current = format ?? defaultFormat;
  }, [format]);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(formatRef.current(value));
      prev.current = value;
      return;
    }
    const from = prev.current;
    prev.current = value;
    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplay(formatRef.current(latest));
      },
    });
    // 卸载或 value 再变时停止旧动画，防止竞态写入
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return <span className={className}>{display}</span>;
}

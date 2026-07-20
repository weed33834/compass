"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast 通知系统：基于 React Context + framer-motion AnimatePresence 实现
// 不依赖 sonner/react-hot-toast 等额外库，延续航海主题（glass-panel + 黄铜/潮汐/珊瑚色条）
// 队列上限 3 条，自动 4s 消失（可配置），支持手动关闭

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string, duration?: number) => number;
  error: (title: string, description?: string, duration?: number) => number;
  info: (title: string, description?: string, duration?: number) => number;
  dismiss: (id?: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// 队列上限：超出时丢弃最旧的，避免堆叠刷屏
const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

// 各类型视觉元数据：左边色条 + 图标 + a11y role（错误用 alert 断言式，其余 status 礼貌式）
const TOAST_META: Record<
  ToastType,
  { bar: string; Icon: typeof CheckCircle; iconClass: string; role: "status" | "alert" }
> = {
  success: { bar: "bg-brass", Icon: CheckCircle, iconClass: "text-brass", role: "status" },
  error: { bar: "bg-coral", Icon: AlertCircle, iconClass: "text-coral", role: "alert" },
  info: { bar: "bg-tide", Icon: Info, iconClass: "text-tide-light", role: "status" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  // 跟踪每条 toast 的自动消失定时器，dismiss/unmount 时清理避免泄漏
  const timersRef = useRef<Map<number, number>>(new Map());
  const reduceMotion = !!useReducedMotion();

  const dismiss = useCallback((id?: number) => {
    setToasts((prev) => (id === undefined ? [] : prev.filter((t) => t.id !== id)));
    if (id === undefined) {
      // dismiss all：清理全部定时器
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    } else {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }
  }, []);

  const push = useCallback(
    (type: ToastType, title: string, description: string | undefined, duration: number) => {
      const id = ++idRef.current;
      const next: ToastItem = { id, type, title, description };
      setToasts((prev) => [...prev, next].slice(-MAX_TOASTS));
      if (duration > 0) {
        // 自动消失：到点后从队列移除（已不在队列则为 no-op）
        const timer = window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          timersRef.current.delete(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    []
  );

  // 卸载时清理所有未触发的定时器
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d, dur) => push("success", t, d, dur ?? DEFAULT_DURATION),
      error: (t, d, dur) => push("error", t, d, dur ?? DEFAULT_DURATION),
      info: (t, d, dur) => push("info", t, d, dur ?? DEFAULT_DURATION),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* 容器：固定屏幕右上角（桌面）/ 顶部居中（移动端），不拦截背后的点击 */}
      <div
        role="region"
        aria-label="通知"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end sm:px-0 sm:pt-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const meta = TOAST_META[t.type];
            const Icon = meta.Icon;
            return (
              <motion.div
                key={t.id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                role={meta.role}
                className="glass-panel pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden py-3 pl-4 pr-3 sm:w-96"
              >
                {/* 左侧 4px 色条：success=brass / error=coral / info=tide */}
                <span
                  className={cn("absolute inset-y-0 left-0 w-1", meta.bar)}
                  aria-hidden="true"
                />
                <Icon
                  className={cn("mt-0.5 h-4 w-4 shrink-0", meta.iconClass)}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm text-ivory">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-starlight">{t.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="关闭通知"
                  className="shrink-0 rounded p-0.5 text-starlight/60 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// useToast：在 ToastProvider 内任意 client 组件中调用，返回命令式 toast API
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast 必须在 ToastProvider 内使用");
  }
  return ctx;
}

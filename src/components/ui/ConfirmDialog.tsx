"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

// 确认弹窗：基于 Radix Dialog，替代 window.confirm
// - useConfirm() 以 Promise 模式供命令式调用：const ok = await confirm({...})
// - 也可直接受控使用 <ConfirmDialog open onOpenChange ... />
// 危险操作用 coral 色调（border-coral/40 + coral 确认按钮），default 用 brass
// a11y：Radix 内置焦点陷阱 / Esc 关闭 / Title-Description 关联

type ConfirmVariant = "default" | "danger";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-abyss/80 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[70] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-lg bg-abyss-600 p-6 shadow-2xl",
            "data-[state=open]:animate-fade-in-up",
            isDanger ? "border border-coral/40" : "border border-brass/20"
          )}
        >
          <Dialog.Title className="font-serif text-lg text-ivory">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-starlight">
              {description}
            </Dialog.Description>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className={buttonVariants({ variant: "ghost", size: "md" })}
                onClick={onCancel}
              >
                {cancelText}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                buttonVariants({ size: "md" }),
                isDanger
                  ? "border-coral bg-coral/10 text-coral hover:bg-coral/20"
                  : "border-brass bg-abyss-500 text-brass hover:border-brass-light"
              )}
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// useConfirm：返回 { confirm, dialog }
// - confirm(options) 返回 Promise<boolean>，确认 resolve(true)，取消/Esc/遮罩点击 resolve(false)
// - dialog 需在组件 JSX 中渲染一次（ConfirmDialog 自带 Portal，位置不影响视觉）
// Promise 模式关键：useRef 存 resolver，关闭时 resolve 并清空，保证每次只 resolve 一次
export function useConfirm(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: ReactNode;
} {
  const [state, setState] = useState<{ open: boolean; options: ConfirmOptions }>({
    open: false,
    options: { title: "" },
  });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(result);
  }, []);

  // Radix onOpenChange：仅在外部关闭（Esc/遮罩）时触发为 false，此时按取消处理
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) close(false);
    },
    [close]
  );

  const { options } = state;
  const dialog: ReactNode = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, dialog };
}

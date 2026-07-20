"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject, TouchEvent as ReactTouchEvent } from "react";

interface TouchDragOptions<TSourceId extends string, TTargetId> {
  /** data-* 属性名，用于 elementFromPoint 查找目标（如 "data-quadrant"、"data-status"） */
  dataAttribute: string;
  /** 是否正在移动中（per-task 锁，true 时阻止开始新的触摸拖拽） */
  isMovingRef: RefObject<boolean>;
  /** 拖拽释放时调用（复用组件的 handleMove） */
  onMove: (sourceId: TSourceId, targetId: TTargetId) => void;
  /** 设置当前拖拽中的 ID（驱动高亮） */
  setDraggingId: (id: string | null) => void;
  /** 设置 hover 目标（驱动落点高亮） */
  setHoverTarget: (target: TTargetId | null) => void;
  /** 设置错误信息 */
  setMoveError: (error: string | null) => void;
}

interface TouchState {
  timer: ReturnType<typeof setTimeout> | null;
  isDragging: boolean;
  draggedId: string | null;
  startX: number;
  startY: number;
}

const LONG_PRESS_MS = 300;
const MOVE_THRESHOLD_PX = 10;

/**
 * 触摸拖拽 hook —— 抽取自 CompassCanvas 和 TaskKanban 的通用逻辑
 * 支持长按 300ms 进入拖拽模式，移动 10px 取消，释放时 drop 到目标
 */
export function useTouchDrag<TSourceId extends string, TTargetId>(
  options: TouchDragOptions<TSourceId, TTargetId>
) {
  const {
    dataAttribute,
    isMovingRef,
    onMove,
    setDraggingId,
    setHoverTarget,
    setMoveError,
  } = options;

  const touchStateRef = useRef<TouchState>({
    timer: null,
    isDragging: false,
    draggedId: null,
    startX: 0,
    startY: 0,
  });
  // 驱动 document touchmove 监听的挂载/卸载（与原实现一致：仅拖拽激活时挂载）
  const [isTouchDrag, setIsTouchDrag] = useState(false);

  const clearTouchTimer = useCallback(() => {
    const ts = touchStateRef.current;
    if (ts.timer !== null) {
      clearTimeout(ts.timer);
      ts.timer = null;
    }
  }, []);

  // 通过坐标查找手指所在目标（elementFromPoint + data-* 标记）
  const findTargetFromPoint = useCallback(
    (clientX: number, clientY: number): TTargetId | null => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      if (!el) return null;
      const targetEl = el.closest<HTMLElement>(`[${dataAttribute}]`);
      if (!targetEl) return null;
      // dataset 用驼峰键，data-quadrant → dataset.quadrant
      const key = dataAttribute.startsWith("data-")
        ? dataAttribute.slice(5)
        : dataAttribute;
      return (targetEl.dataset[key] as TTargetId | undefined) ?? null;
    },
    [dataAttribute]
  );

  // 触摸开始：启动 300ms 长按计时器（手指明显移动则取消，避免误触）
  const onTouchStart = useCallback(
    (sourceId: string, e: ReactTouchEvent) => {
      // 多指触摸忽略
      if (e.touches.length !== 1) return;
      // 正在移动时不允许开始（per-task 锁）
      if (isMovingRef.current) return;

      const touch = e.touches[0];
      clearTouchTimer();
      const ts = touchStateRef.current;
      ts.draggedId = sourceId;
      ts.isDragging = false;
      ts.startX = touch.clientX;
      ts.startY = touch.clientY;
      ts.timer = setTimeout(() => {
        ts.isDragging = true;
        // 触觉反馈（支持的设备）
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(30);
        }
        setDraggingId(sourceId);
        setMoveError(null);
        // 立即检测当前目标（与原始实现一致）
        const target = findTargetFromPoint(ts.startX, ts.startY);
        setHoverTarget(target);
        setIsTouchDrag(true);
      }, LONG_PRESS_MS);
    },
    [
      clearTouchTimer,
      findTargetFromPoint,
      isMovingRef,
      setDraggingId,
      setHoverTarget,
      setMoveError,
    ]
  );

  // 触摸移动（React passive）：仅用于长按未触发时检测手指明显移动并取消计时器
  const onTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      const ts = touchStateRef.current;
      if (ts.isDragging || ts.timer === null) return;
      const t = e.touches[0];
      if (!t) return;
      const moved = Math.hypot(t.clientX - ts.startX, t.clientY - ts.startY);
      if (moved > MOVE_THRESHOLD_PX) clearTouchTimer();
    },
    [clearTouchTimer]
  );

  // 触摸结束：长按已触发则落点（复用 onMove）
  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      const ts = touchStateRef.current;
      clearTouchTimer();
      if (ts.isDragging) {
        // 注意：touchend 时 touches 为空，用 changedTouches 获取最后位置
        const touch = e.changedTouches[0];
        const target = touch
          ? findTargetFromPoint(touch.clientX, touch.clientY)
          : null;
        const draggedId = ts.draggedId;
        if (draggedId && target) {
          onMove(draggedId as TSourceId, target);
        }
      }
      ts.isDragging = false;
      ts.draggedId = null;
      setDraggingId(null);
      setHoverTarget(null);
      setIsTouchDrag(false);
    },
    [clearTouchTimer, findTargetFromPoint, onMove, setDraggingId, setHoverTarget]
  );

  // 拖拽激活时挂载非 passive 的 document touchmove 监听：
  // 1) preventDefault 阻止页面滚动（React onTouchMove 为 passive，无法阻止）
  // 2) 实时高亮手指所在目标
  useEffect(() => {
    if (!isTouchDrag) return;
    const docTouchMove = (e: TouchEvent) => {
      if (!touchStateRef.current.isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const target = findTargetFromPoint(touch.clientX, touch.clientY);
        setHoverTarget(target);
      }
    };
    document.addEventListener("touchmove", docTouchMove, { passive: false });
    return () => document.removeEventListener("touchmove", docTouchMove);
  }, [isTouchDrag, findTargetFromPoint, setHoverTarget]);

  // 组件卸载时清理长按计时器，避免泄漏 / 误触落点回调
  useEffect(() => () => clearTouchTimer(), [clearTouchTimer]);

  // onTouchCancel 与 onTouchEnd 行为一致（原代码 onTouchCancel={handleCardTouchEnd}）
  const onTouchCancel = onTouchEnd;

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
}

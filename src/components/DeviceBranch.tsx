"use client";

import { type ReactNode } from "react";
import { useDevice } from "./DeviceProvider";

// 页面级分支：同一路由下，按设备渲染移动版或桌面版子树。
// 两个子树都是独立组件（各自持有自己的 hooks），因此不会出现
// 「条件跳过 hook」导致的 rules-of-hooks 违规。
export function DeviceBranch({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  const { isMobile } = useDevice();
  return <>{isMobile ? mobile : desktop}</>;
}

"use client";

import { type ReactNode } from "react";
import type { DeviceType } from "@/lib/device";
import { DeviceProvider, useDevice } from "./DeviceProvider";
import { AppShell } from "./AppShell";
import { MobileShell } from "./mobile/MobileShell";

// 主布局根：根据设备渲染桌面壳层或移动壳层。
// 初始设备来自服务端 UA（避免首屏闪动），客户端 matchMedia 再校正。
export function DeviceRoot({
  initial,
  children,
}: {
  initial: DeviceType;
  children: ReactNode;
}) {
  return (
    <DeviceProvider initial={initial}>
      <ShellSwitch>{children}</ShellSwitch>
    </DeviceProvider>
  );
}

function ShellSwitch({ children }: { children: ReactNode }) {
  const { isMobile } = useDevice();
  return isMobile ? <MobileShell>{children}</MobileShell> : <AppShell>{children}</AppShell>;
}

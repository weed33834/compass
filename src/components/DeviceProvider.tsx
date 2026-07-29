"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DeviceType } from "@/lib/device";

interface DeviceContextValue {
  device: DeviceType;
  isMobile: boolean;
  isDesktop: boolean;
}

const DeviceContext = createContext<DeviceContextValue>({
  device: "desktop",
  isMobile: false,
  isDesktop: true,
});

// 设备上下文：初始值来自服务端 UA 判断，挂载后用 matchMedia 实时校正。
// 这样桌面浏览器缩放到移动宽度、或手机横竖屏切换时，都能正确切换两套 UI。
export function DeviceProvider({
  initial,
  children,
}: {
  initial: DeviceType;
  children: ReactNode;
}) {
  const [device, setDevice] = useState<DeviceType>(initial);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const apply = () => setDevice(mq.matches ? "mobile" : "desktop");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <DeviceContext.Provider
      value={{ device, isMobile: device === "mobile", isDesktop: device === "desktop" }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

// 全应用共享的设备钩子。组件内用它决定渲染桌面版还是移动版。
export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext);
}

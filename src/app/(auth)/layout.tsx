import { ReactNode } from "react";
import { isMobileUA } from "@/lib/device";
import { DeviceRoot } from "@/components/DeviceRoot";

// (auth) 路由组共享布局：为登录/注册/忘记密码/重置密码提供设备感知上下文，
// 使 DeviceBranch 能正确在移动端与桌面端组件之间切换。
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const mobile = await isMobileUA();
  return (
    <DeviceRoot initial={mobile ? "mobile" : "desktop"}>{children}</DeviceRoot>
  );
}

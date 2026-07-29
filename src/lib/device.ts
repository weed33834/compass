import { headers } from "next/headers";

// 设备识别：服务端根据 User-Agent 给出初始设备类型，
// 客户端再用 matchMedia 校正（处理桌面浏览器缩放到移动宽度等场景）。
// 注意：仅用于决定「渲染哪套 UI」，不替代响应式布局本身的无障碍需求。

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Windows Phone|harmonyos/i;

export type DeviceType = "mobile" | "desktop";

export async function getDeviceTypeFromUA(): Promise<DeviceType> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  return MOBILE_UA_RE.test(ua) ? "mobile" : "desktop";
}

export async function isMobileUA(): Promise<boolean> {
  return (await getDeviceTypeFromUA()) === "mobile";
}

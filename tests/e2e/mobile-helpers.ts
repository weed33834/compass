// 移动端 E2E 共享 helper
// 注意：本文件不是 *.spec.ts，不会被 Playwright 当作测试用例运行，仅作工具模块被 import。
import type { Page, BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
export const MOBILE_VIEWPORT = { width: 390, height: 844 };

export const DEMO_EMAIL = "captain@compass.dev";
export const DEMO_PASSWORD = "Compass-Test-2026!";

// 移动端底部主导航的 aria-label（仅 MobileShell 具备，桌面端无此元素）
export const MOBILE_NAV_LABEL = "主导航";

// 通过移动端 UI 完成登录，成功后落在 /compass 并渲染移动端底部导航
export async function loginMobile(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/compass/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await expectMobileShell(page);
}

// 断言当前页面处于移动端外壳（底部主导航可见）
export async function expectMobileShell(page: Page): Promise<void> {
  const { expect } = await import("@playwright/test");
  await expect(page.locator(`[aria-label="${MOBILE_NAV_LABEL}"]`)).toBeVisible({
    timeout: 15_000,
  });
}

// 确保某个官方题库已加载到当前账号（按 sourceRef 幂等，避免重复灌库）。
// 若已存在则跳过；否则用 multipart 直接调 /api/banks/import 灌入官方 .md 文件。
export async function ensureOfficialBank(
  context: BrowserContext,
  fileName: string,
  marker: string,
): Promise<void> {
  const getRes = await context.request.get("/api/banks");
  if (getRes.ok()) {
    const data = await getRes.json();
    const banks: any[] = Array.isArray(data) ? data : data?.banks ?? [];
    const exists = banks.some(
      (b) => (b.name ?? "").includes(marker) || (b.sourceRef ?? "").includes(marker),
    );
    if (exists) return;
  }
  const filePath = path.join(process.cwd(), "public", "official-banks", fileName);
  const buffer = fs.readFileSync(filePath);
  const postRes = await context.request.post("/api/banks/import", {
    multipart: {
      file: { name: fileName, mimeType: "text/markdown", buffer },
    },
  });
  if (!postRes.ok()) {
    const body = await postRes.text();
    throw new Error(`官方题库导入失败 ${postRes.status()}: ${body}`);
  }
}

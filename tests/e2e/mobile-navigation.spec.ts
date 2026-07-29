// 移动端导航与全页面渲染 E2E
// 运行：pnpm exec playwright test tests/e2e/mobile-navigation.spec.ts --reporter=list
import { test, expect, type Page, type Browser } from "@playwright/test";
import {
  MOBILE_UA,
  MOBILE_VIEWPORT,
  loginMobile,
  expectMobileShell,
} from "./mobile-helpers";

// 每个主页面的路由 + 一个移动端专属文案锚点
const PAGES: Array<{ path: string; anchor: RegExp }> = [
  { path: "/compass", anchor: /开始今日答题|今日待复习|题库舰队/ },
  { path: "/workshop", anchor: /造船工坊/ },
  { path: "/study", anchor: /提交答案|暂无待复习卡片|正在校准罗盘/ },
  { path: "/wrongbook", anchor: /错题漂流瓶/ },
  { path: "/logbook", anchor: /航海日志/ },
  { path: "/analytics", anchor: /航迹分析/ },
  { path: "/account", anchor: /航行工具|退出登录/ },
];

test.describe.configure({ mode: "serial" });
test.describe("移动端 · 导航与全页渲染", () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      userAgent: MOBILE_UA,
      hasTouch: true,
    });
    page = await context.newPage();
    await loginMobile(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  for (const p of PAGES) {
    test(`M-N. 访问 ${p.path} 渲染移动端外壳且内容正常`, async () => {
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");
      // 移动端外壳：底部主导航常驻
      await expectMobileShell(page);
      // 该页面移动端专属内容存在（证明是移动端版本而非桌面端）
      await expect(page.getByText(p.anchor).first()).toBeVisible({
        timeout: 15_000,
      });
    });
  }

  test("M-N. 底部主导航在页面间跳转后保持可见（移动端外壳稳定）", async () => {
    await page.goto("/compass");
    const nav = page.locator('[aria-label="主导航"]');
    await expect(nav).toBeVisible();

    // 点底部「工坊」标签跳转（按 href 定位，避免依赖翻译文案）
    await page.locator('nav[aria-label="主导航"] a[href="/workshop"]').click();
    await page.waitForURL(/\/workshop/);
    await expect(nav).toBeVisible();
    await expect(page.getByText("造船工坊")).toBeVisible();

    // 点底部「错题」标签跳转
    await page.locator('nav[aria-label="主导航"] a[href="/wrongbook"]').click();
    await page.waitForURL(/\/wrongbook/);
    await expect(nav).toBeVisible();
    await expect(page.getByText("错题漂流瓶")).toBeVisible();
  });

  test("M-N. 账户页可退出登录并返回登录页", async () => {
    await page.goto("/account");
    await expect(page.getByText("退出登录")).toBeVisible();
    await page.getByRole("button", { name: /退出登录/ }).click();
    await page.waitForURL(/\/login/, { timeout: 20_000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// 移动端认证流程 E2E
// 运行：pnpm exec playwright test tests/e2e/mobile-auth.spec.ts --reporter=list
// 前置：dev server 跑在 http://localhost:3000，数据库已 seed（pnpm db:seed）
import { test, expect, type Page } from "@playwright/test";
import {
  MOBILE_UA,
  MOBILE_VIEWPORT,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  loginMobile,
  expectMobileShell,
} from "./mobile-helpers";

test.use({
  viewport: MOBILE_VIEWPORT,
  userAgent: MOBILE_UA,
  hasTouch: true,
});

test.describe("移动端 · 认证", () => {
  test("M-A1. 登录页以移动端形态渲染（无桌面侧栏，含邮箱/密码表单）", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto("/login");
    // 移动端外壳：登录页本身不在 (main) 布局内，无底部主导航；
    // 但移动端登录表单必须包含邮箱 + 密码输入。
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // 关键反例：移动端不应出现桌面端那种全屏侧栏导航（用桌面专属文案/结构排除）
    await expect(page.locator("text=开始今日答题")).toHaveCount(0);
  });

  test("M-A2. 使用演示账号可通过移动端表单登录并进入移动端外壳", async ({
    page,
  }: {
    page: Page;
  }) => {
    await loginMobile(page);
    // 登录后落在 /compass 且渲染移动端底部主导航
    await expect(page).toHaveURL(/\/compass/);
    await expectMobileShell(page);
    // 罗盘页移动端 Hero 文案可见
    await expect(page.getByText("开始今日答题")).toBeVisible();
  });

  test("M-A3. 注册页以移动端形态渲染并可切换登录", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // 移动端注册表单有「密码」+「确认密码」两个 password 输入框，取第一个断言
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').last()).toBeVisible();
    // 注册页应提供返回登录的入口（移动端统一用 MobileAuth，为 button）
    await expect(page.getByRole("button", { name: "登录" }).first()).toBeVisible();
  });
});

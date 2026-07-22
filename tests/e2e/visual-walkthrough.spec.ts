// 完整视觉走查脚本：截图关键页面 + 完整答题流程
// 运行：pnpm exec playwright test tests/e2e/visual-walkthrough.spec.ts --reporter=list
// 截图保存到 tests/e2e/screenshots/

import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const DEMO_EMAIL = "captain@compass.dev";
const DEMO_PASSWORD = "Compass-Test-2026!";
const SCREENSHOT_DIR = "tests/e2e/screenshots";

const SHOTS = path.join(__dirname, "screenshots");

async function ensureDir() {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
}

async function shot(page: Page, name: string, opts: { fullPage?: boolean } = {}) {
  await ensureDir();
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  console.log(`  📸 ${name}.png`);
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(compass|account)/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

async function ensureBankLoaded(page: Page) {
  await login(page);
  await page.goto(`${BASE}/workshop`);
  await page.waitForLoadState("networkidle");
  const bankLink = page.locator('a[href*="/workshop/"]').first();
  if (await bankLink.isVisible({ timeout: 3_000 }).catch(() => false)) return;
  await page.getByRole("button", { name: /官方题库/ }).first().click();
  await expect(page.locator("h2", { hasText: "官方题库" })).toBeVisible({ timeout: 5_000 });
  const firstLoadBtn = page.getByRole("button", { name: /^加载$/ }).first();
  await firstLoadBtn.click();
  await expect(page.locator("text=/已加载.*题/")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2_000);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator('a[href*="/workshop/"]').first()).toBeVisible({ timeout: 10_000 });
}

test.describe.configure({ mode: "serial" });

test.describe("视觉走查", () => {
  test("01. 落地页", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await shot(page, "01-landing", { fullPage: true });
  });

  test("02. 登录页", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "02-login", { fullPage: true });
  });

  test("03. 注册页", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "03-register", { fullPage: true });
  });

  test("04. 罗盘首页（欢迎引导卡）", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/compass`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await shot(page, "04-compass-welcome", { fullPage: true });
  });

  test("05. 工坊空状态", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/workshop`);
    await page.waitForLoadState("networkidle");
    // 如果已有题库，截图当前状态；如果没有，截图空状态
    await page.waitForTimeout(500);
    await shot(page, "05-workshop", { fullPage: true });
  });

  test("06. 官方题库对话框", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/workshop`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /官方题库/ }).first().click();
    await expect(page.locator("h2", { hasText: "官方题库" })).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(800);
    await shot(page, "06-official-banks-dialog", { fullPage: false });
  });

  test("07. 工坊列表（加载题库后）", async ({ page }) => {
    await ensureBankLoaded(page);
    await page.goto(`${BASE}/workshop`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "07-workshop-loaded", { fullPage: true });
  });

  test("08. 题库详情页", async ({ page }) => {
    await ensureBankLoaded(page);
    await page.goto(`${BASE}/workshop`);
    await page.waitForLoadState("networkidle");
    const firstBank = page.locator('a[href*="/workshop/"]').first();
    await firstBank.click();
    await page.waitForURL(/\/workshop\/[a-f0-9-]+/i, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await shot(page, "08-workshop-detail", { fullPage: true });
  });

  test("09. 答题舱 - 题目展示", async ({ page }) => {
    await ensureBankLoaded(page);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 检测续答提示
    const resumePrompt = page.locator("text=检测到未完成的答题");
    if (await resumePrompt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('button:has-text("放弃")').click();
      await page.waitForTimeout(2000);
    }

    // 检测完成/空
    const completed = page.locator("text=学习画像").or(page.locator("text=完成"));
    if (await completed.isVisible({ timeout: 1000 }).catch(() => false)) {
      await shot(page, "09-study-completed-already", { fullPage: true });
      return;
    }

    await shot(page, "09-study-question", { fullPage: true });
  });

  test("10. 答题舱 - 提交后评分阶段", async ({ page }) => {
    await ensureBankLoaded(page);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const resumePrompt = page.locator("text=检测到未完成的答题");
    if (await resumePrompt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('button:has-text("放弃")').click();
      await page.waitForTimeout(2000);
    }

    const completed = page.locator("text=学习画像").or(page.locator("text=完成"));
    if (await completed.isVisible({ timeout: 1000 }).catch(() => false)) {
      await shot(page, "10-skipped-completed", { fullPage: true });
      return;
    }

    // 找提交按钮
    const submitBtn = page.locator('button:has-text("提交")');
    if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      await shot(page, "10-no-submit-btn", { fullPage: true });
      return;
    }

    // 选答案
    const radio = page.locator('input[type="radio"], button:has-text("A")').first();
    const tfBtn = page.locator('button:has-text("正确"), button:has-text("错误"), button:has-text("对"), button:has-text("错")').first();
    const checkbox = page.locator('input[type="checkbox"]').first();
    const fillInput = page.locator('input[type="text"], textarea').first();

    if (await radio.isVisible({ timeout: 500 }).catch(() => false)) {
      await radio.click();
    } else if (await tfBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await tfBtn.click();
    } else if (await checkbox.isVisible({ timeout: 500 }).catch(() => false)) {
      await checkbox.click();
    } else if (await fillInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await fillInput.fill("测试答案");
    }

    await page.waitForTimeout(300);
    await submitBtn.click();
    await page.waitForTimeout(2000);

    await shot(page, "10-study-submitted", { fullPage: true });
  });

  test("11. 错题漂流瓶", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/wrongbook`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "11-wrongbook", { fullPage: true });
  });

  test("12. 航海日志", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logbook`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "12-logbook", { fullPage: true });
  });

  test("13. 航迹分析", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/analytics`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await shot(page, "13-analytics", { fullPage: true });
  });

  test("14. 账户中心", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/account`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "14-account", { fullPage: true });
  });

  test("15. 404 页面", async ({ page }) => {
    await page.goto(`${BASE}/this-page-does-not-exist-xyz`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "15-404", { fullPage: true });
  });
});

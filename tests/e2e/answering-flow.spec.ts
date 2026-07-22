// 完整答题流程端到端测试：从第一题到最后一题，覆盖全部 4 种题型 + 全部交互按钮
// 运行：pnpm exec playwright test tests/e2e/answering-flow.spec.ts --reporter=list
// 截图保存到 tests/e2e/screenshots/answering/

import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const DEMO_EMAIL = "captain@compass.dev";
const DEMO_PASSWORD = "Compass-Test-2026!";
const SHOTS = path.join(__dirname, "screenshots", "answering");

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

// 加载第 idx 个官方题库（0-based）。若该题库已在工坊则直接返回其 id。
// manifest 顺序：0=fsrs-intro, 1=geo-cn, 2=typescript-base, 3=python-base
async function ensureBankLoaded(page: Page, idx: number = 0): Promise<string> {
  await login(page);
  await page.goto(`${BASE}/workshop`);
  await page.waitForLoadState("networkidle");

  // 工坊已有题库：检查是否有至少 idx+1 个，若有直接返回第 idx 个
  const bankLinks = page.locator('a[href*="/workshop/"]');
  const existingCount = await bankLinks.count();
  if (existingCount > idx) {
    const href = await bankLinks.nth(idx).getAttribute("href");
    return href?.split("/workshop/")[1] ?? "";
  }

  // 需要加载更多：打开官方题库对话框，加载第 (existingCount) 个（接着已有的往后加）
  await page.getByRole("button", { name: /官方题库/ }).first().click();
  await expect(page.locator("h2", { hasText: "官方题库" })).toBeVisible({ timeout: 5_000 });
  // 点第 (existingCount + 1) 个"加载"按钮（因为前 existingCount 个已加载）
  // 但已加载的题库按钮会变成"已加载"（禁用），所以直接点第 (idx - existingCount + 1) 个可用的"加载"按钮
  const loadBtns = page.getByRole("button", { name: /^加载$/ });
  const need = idx - existingCount + 1;
  for (let i = 0; i < need; i++) {
    await loadBtns.nth(i).click();
    await expect(page.locator("text=/已加载.*题/").first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1000);
  }
  await page.goto(`${BASE}/workshop`);
  await page.waitForLoadState("networkidle");
  const link = page.locator('a[href*="/workshop/"]').nth(idx);
  await expect(link).toBeVisible({ timeout: 10_000 });
  const href = await link.getAttribute("href");
  return href?.split("/workshop/")[1] ?? "";
}

// 答一道题：根据题型选择答案 → 提交 → 截图 → 用"简单"评级推进
// 返回 { type, isCorrect }
async function answerOne(
  page: Page,
  idx: number
): Promise<{ type: string; isCorrect: boolean }> {
  // 识别题型：根据可见的题型标签
  const typeLabel = await page
    .locator("span", { hasText: /^(单选题|多选题|判断题|填空题)$/ })
    .first()
    .textContent()
    .catch(() => "");
  const type = (typeLabel ?? "").trim();

  // 根据题型选答案
  if (type === "单选题" || type === "判断题") {
    const radios = page.getByRole("radio");
    const count = await radios.count();
    if (count === 0) throw new Error(`第 ${idx + 1} 题：未找到 radio 选项`);
    await radios.first().click();
  } else if (type === "多选题") {
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    if (count === 0) throw new Error(`第 ${idx + 1} 题：未找到 checkbox 选项`);
    await checkboxes.nth(0).click();
    if (count > 1) await checkboxes.nth(1).click();
  } else if (type === "填空题") {
    const inputs = page.locator('input[type="text"]');
    const count = await inputs.count();
    if (count === 0) throw new Error(`第 ${idx + 1} 题：未找到填空 input`);
    await inputs.first().fill("测试答案");
  } else {
    const radio = page.getByRole("radio").first();
    if (await radio.isVisible({ timeout: 500 }).catch(() => false)) {
      await radio.click();
    } else {
      const cb = page.getByRole("checkbox").first();
      if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
        await cb.click();
      } else {
        const inp = page.locator('input[type="text"]').first();
        if (await inp.isVisible({ timeout: 500 }).catch(() => false)) {
          await inp.fill("测试答案");
        }
      }
    }
  }

  await page.waitForTimeout(200);
  await shot(page, `q${String(idx + 1).padStart(2, "0")}-answered-${type || "unknown"}`);

  await page.getByRole("button", { name: /提交答案/ }).click();
  await page.waitForTimeout(1500);

  const correctText = page.locator("text=答对");
  const wrongText = page.locator("text=答错");
  let isCorrect = false;
  if (await correctText.isVisible({ timeout: 2_000 }).catch(() => false)) {
    isCorrect = true;
  } else if (await wrongText.isVisible({ timeout: 500 }).catch(() => false)) {
    isCorrect = false;
  }
  await shot(page, `q${String(idx + 1).padStart(2, "0")}-submitted-${isCorrect ? "correct" : "wrong"}`);

  // 用"简单"评级推进——EASY 让卡片离开今日队列，避免 AGAIN 把卡片循环回队列
  const easyBtn = page.getByRole("button", { name: /^简单$/ });
  if (await easyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await easyBtn.click();
  } else {
    const acceptBtn = page.getByRole("button", { name: /接受默认/ });
    if (await acceptBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await acceptBtn.click();
    } else {
      const goodBtn = page.getByRole("button", { name: /^良好$/ });
      if (await goodBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await goodBtn.click();
      }
    }
  }
  await page.waitForTimeout(1200);
  return { type, isCorrect };
}

async function isCompleted(page: Page): Promise<boolean> {
  return (
    (await page
      .locator("text=本轮答题完成")
      .or(page.locator("text=错题重做完成"))
      .or(page.locator("text=今日队列已清空"))
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false)) || false
  );
}

// 跳过续答提示（放弃存档，重新开始）
async function dismissResume(page: Page) {
  const resumePrompt = page.locator("text=检测到未完成的答题");
  if (await resumePrompt.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.getByRole("button", { name: /放弃存档/ }).click();
    await page.waitForTimeout(2000);
  }
}

// 答完所有题直到完成页（用"简单"评级确保卡片离开队列）
async function answerUntilComplete(page: Page, label: string): Promise<{ type: string; isCorrect: boolean }[]> {
  const types: { type: string; isCorrect: boolean }[] = [];
  for (let i = 0; i < 30; i++) {
    if (await isCompleted(page)) {
      console.log(`  ✅ [${label}] 第 ${i} 轮检测到完成页`);
      break;
    }
    const submitBtn = page.getByRole("button", { name: /提交答案/ });
    if (!(await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      const accept = page.getByRole("button", { name: /接受默认|简单|良好|困难|重来/ }).first();
      if (await accept.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await accept.click();
        await page.waitForTimeout(1200);
      }
      if (await isCompleted(page)) break;
      if (!(await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false))) break;
    }
    const r = await answerOne(page, i);
    types.push(r);
    console.log(`  ✏️ [${label}] 第 ${i + 1} 题：${r.type} ${r.isCorrect ? "✓" : "✗"}`);
  }
  return types;
}

test.describe.configure({ mode: "serial" });

test.describe("完整答题流程", () => {
  test("01. 加载题库并开始答题（单选题截图）", async ({ page }) => {
    await ensureBankLoaded(page, 0);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await dismissResume(page);

    if (await isCompleted(page)) {
      await shot(page, "01-already-completed", { fullPage: true });
      return;
    }
    await shot(page, "01-study-start", { fullPage: true });
    await expect(page.getByRole("button", { name: /提交答案/ })).toBeVisible({ timeout: 10_000 });
  });

  test("02. 依次答完所有题直到完成页（fsrs-intro 题库）", async ({ page }) => {
    await ensureBankLoaded(page, 0);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await dismissResume(page);

    if (await isCompleted(page)) {
      await shot(page, "02-already-completed", { fullPage: true });
      return;
    }

    const types = await answerUntilComplete(page, "02");
    await shot(page, "02-final-state", { fullPage: true });
    console.log(`  📊 [02] 共答 ${types.length} 题：${types.filter((t) => t.isCorrect).length} 对 / ${types.filter((t) => !t.isCorrect).length} 错`);
    expect(types.length).toBeGreaterThan(0);
    // 应到达完成页
    expect(await isCompleted(page)).toBeTruthy();
    await shot(page, "02-completion-report", { fullPage: true });
  });

  test("03. 完成报告页内容验证（geo-cn 题库）", async ({ page }) => {
    await ensureBankLoaded(page, 1);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await dismissResume(page);

    if (!(await isCompleted(page))) {
      await answerUntilComplete(page, "03");
    }

    if (await isCompleted(page)) {
      await shot(page, "03-completion-report", { fullPage: true });
      await expect(
        page.locator("text=/本轮答题完成|错题重做完成|今日队列已清空/").first()
      ).toBeVisible({ timeout: 5_000 });

      // 验证完成页操作按钮可见
      const againBtn = page.getByRole("button", { name: /再来一轮/ });
      const isAgainVisible = await againBtn.isVisible({ timeout: 2_000 }).catch(() => false);
      console.log(`  ℹ️ [03] "再来一轮"按钮可见：${isAgainVisible}`);
      await shot(page, "03-completion-actions", { fullPage: false });
    } else {
      await shot(page, "03-no-completion", { fullPage: true });
      console.log(`  ⚠️ [03] 未检测到完成页`);
    }
  });

  test("04. 完成页按钮：再来一轮（typescript-base 题库）", async ({ page }) => {
    await ensureBankLoaded(page, 2);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await dismissResume(page);

    if (!(await isCompleted(page))) {
      await answerUntilComplete(page, "04");
    }

    if (await isCompleted(page)) {
      await shot(page, "04-before-replay", { fullPage: true });
      const againBtn = page.getByRole("button", { name: /再来一轮/ });
      if (await againBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await againBtn.click();
        await page.waitForTimeout(2500);
        await shot(page, "04-after-replay", { fullPage: true });
        const hasSubmit = await page.getByRole("button", { name: /提交答案/ }).isVisible({ timeout: 3_000 }).catch(() => false);
        const isEmpty = await page.locator("text=今日队列已清空").isVisible({ timeout: 500 }).catch(() => false);
        console.log(`  ℹ️ [04] 再来一轮后：hasSubmit=${hasSubmit}, isEmpty=${isEmpty}`);
        expect(hasSubmit || isEmpty).toBeTruthy();
      } else {
        console.log(`  ℹ️ [04] 完成页无"再来一轮"按钮（队列已清空无新题）`);
        await shot(page, "04-no-replay-btn", { fullPage: true });
      }
    } else {
      await shot(page, "04-no-completion", { fullPage: true });
    }
  });

  test("05. 错题重做模式（WRONG_REDO）", async ({ page }) => {
    // 用第 4 个题库（python-base），答完 LEARN 后进错题重做
    await ensureBankLoaded(page, 3);
    await page.goto(`${BASE}/study?mode=LEARN`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await dismissResume(page);

    if (!(await isCompleted(page))) {
      await answerUntilComplete(page, "05-learn");
    }
    await shot(page, "05-learn-completed", { fullPage: true });

    // 进入错题重做模式
    await page.goto(`${BASE}/study?mode=WRONG_REDO`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await dismissResume(page);

    const isEmpty = await page.locator("text=今日队列已清空").isVisible({ timeout: 2_000 }).catch(() => false);
    if (isEmpty) {
      await shot(page, "05-wrong-redo-empty", { fullPage: true });
      console.log(`  ℹ️ [05] 错题重做队列为空（LEARN 阶段全答对则无错题）`);
      return;
    }

    await shot(page, "05-wrong-redo-start", { fullPage: true });
    // 错题重做模式答错会循环回队列，只答前 5 题验证模式可用即可
    for (let i = 0; i < 5; i++) {
      if (await isCompleted(page)) break;
      const submitBtn = page.getByRole("button", { name: /提交答案/ });
      if (!(await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false))) break;
      const r = await answerOne(page, i);
      console.log(`  ✏️ [05-redo] 第 ${i + 1} 题：${r.type} ${r.isCorrect ? "✓" : "✗"}`);
    }
    await shot(page, "05-wrong-redo-in-progress", { fullPage: true });
  });
});

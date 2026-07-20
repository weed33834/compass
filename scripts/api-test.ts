// API 烟雾测试脚本
// 用法：先启动 pnpm dev，然后在另一个终端运行：
//   pnpm tsx scripts/api-test.ts
//
// 覆盖：
//   1. 健康检查（未认证访问 /api/banks 应返回 401）
//   2. 登录获取 cookie
//   3. 题库 CRUD（创建 / 查询 / 删除）
//   4. 题目查询
//   5. 学习队列
//   6. 判分两阶段提交（grade + apply）
//   7. 错题本
//   8. 日志
//   9. 分析
//
// 退出码：0 = 全部通过，1 = 至少一项失败

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "captain@compass.dev";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Compass-Test-2026!";

interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const results: TestResult[] = [];

function log(name: string, pass: boolean, detail?: string) {
  const mark = pass ? "✓" : "✗";
  const color = pass ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(`  ${color}${mark}${reset} ${name}${detail ? ` — ${detail}` : ""}`);
  results.push({ name, pass, detail });
}

async function request(
  path: string,
  init: RequestInit = {},
  cookie?: string
): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (cookie) headers.Cookie = cookie;
  if (init.body && typeof init.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, body, setCookie };
}

function extractCookies(setCookie: string | null): string {
  if (!setCookie) return "";
  // 简化处理：取所有 cookie 的 name=value 部分，用 ; 连接
  return setCookie
    .split(/,(?=\s*[a-zA-Z_-]+=)/) // 多个 cookie 用逗号分隔（不是 expires 内的逗号）
    .map((c) => c.split(";")[0].trim())
    .join("; ");
}

async function main() {
  console.log(`\nCompass API 烟雾测试 — ${BASE}\n`);

  // === 1. 健康检查：未认证应返回 401/403 ===
  console.log("【1】未认证访问检查");
  {
    const r = await request("/api/banks");
    log(
      "GET /api/banks 未认证返回 4xx",
      r.status >= 400 && r.status < 500,
      `status=${r.status}`
    );
  }

  // === 2. 登录获取 session cookie ===
  console.log("\n【2】登录获取会话");
  let cookie: string = "";
  {
    // NextAuth 的 CSRF token 流程
    const csrfRes = await request("/api/auth/csrf");
    const csrfToken = (csrfRes.body as { csrfToken?: string })?.csrfToken;
    if (!csrfToken) {
      log("获取 CSRF token", false, "无 csrfToken 字段");
      return;
    }
    cookie = extractCookies(csrfRes.setCookie);
    log("GET /api/auth/csrf", true, `token=${csrfToken.slice(0, 8)}...`);

    // 登录
    const loginBody = new URLSearchParams({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      csrfToken,
      callbackUrl: "/compass",
      json: "true",
    });
    const loginRes = await request("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: loginBody.toString(),
      redirect: "manual",
    }, cookie);
    // 登录成功后 set-cookie 会带上 next-auth.session-token
    if (loginRes.setCookie) {
      cookie = extractCookies(loginRes.setCookie) + "; " + cookie;
    }
    // 验证登录态
    const meRes = await request("/api/auth/session", {}, cookie);
    const session = meRes.body as { user?: { email?: string } };
    log(
      "登录后 /api/auth/session 返回用户",
      !!session?.user?.email,
      `email=${session?.user?.email ?? "无"}`
    );
    if (!session?.user?.email) {
      console.log("\n登录失败，终止测试。");
      return;
    }
  }

  // === 3. 题库列表 + 创建 + 删除 ===
  console.log("\n【3】题库 CRUD");
  let testBankId: string | null = null;
  {
    const r = await request("/api/banks", {}, cookie);
    const body = r.body as { banks?: Array<{ id: string; name: string }> };
    log("GET /api/banks", r.status === 200 && Array.isArray(body?.banks), `共 ${body?.banks?.length ?? 0} 个题库`);

    // 创建测试题库
    const createRes = await request("/api/banks", {
      method: "POST",
      body: JSON.stringify({
        name: "API 测试临时题库",
        description: "由 scripts/api-test.ts 创建，应被自动删除",
        coverColor: "brass",
        tags: ["test", "临时"],
        newCardsPerDay: 5,
      }),
    }, cookie);
    const created = createRes.body as { id?: string; name?: string };
    testBankId = created?.id ?? null;
    log("POST /api/banks 创建题库", !!testBankId, `id=${testBankId}`);

    if (testBankId) {
      // 查询详情
      const detailRes = await request(`/api/banks/${testBankId}`, {}, cookie);
      log("GET /api/banks/:id", detailRes.status === 200);

      // 删除
      const delRes = await request(`/api/banks/${testBankId}`, { method: "DELETE" }, cookie);
      log("DELETE /api/banks/:id", delRes.status === 200 || delRes.status === 204);
      testBankId = null;
    }
  }

  // === 4. 取第一个已有题库，做后续流程 ===
  console.log("\n【4】学习队列 + 判分两阶段");
  let targetBank: { id: string; name: string } | null = null;
  let targetReviewItemId: string | null = null;
  {
    const r = await request("/api/banks", {}, cookie);
    const body = r.body as { banks?: Array<{ id: string; name: string; questionCount: number }> };
    targetBank = body?.banks?.find((b) => b.questionCount > 0) ?? null;
    if (!targetBank) {
      log("找到可用题库", false, "无题库可测，请先运行 pnpm db:seed");
      return;
    }
    log("找到测试题库", true, `name=${targetBank.name}`);

    // 学习队列
    const qRes = await request(
      `/api/study/queue?bankId=${targetBank.id}&mode=LEARN&limit=5`,
      {},
      cookie
    );
    const qBody = qRes.body as { items?: Array<{ reviewItemId: string; type: string }>; stats?: { totalCount: number } };
    log("GET /api/study/queue", qRes.status === 200 && Array.isArray(qBody?.items), `共 ${qBody?.items?.length ?? 0} 题`);
    targetReviewItemId = qBody?.items?.[0]?.reviewItemId ?? null;

    if (targetReviewItemId) {
      const firstType = qBody?.items?.[0]?.type ?? "";
      // 准备一个"故意答错"的答案，便于测试 AGAIN 评分
      let userAnswer: unknown = null;
      if (firstType === "SINGLE_CHOICE" || firstType === "TRUE_FALSE") {
        userAnswer = "__wrong__";
      } else if (firstType === "MULTI_CHOICE") {
        userAnswer = ["__wrong__"];
      } else if (firstType === "FILL_BLANK") {
        userAnswer = ["__wrong__"];
      }

      // grade
      const gradeRes = await request("/api/study/grade", {
        method: "POST",
        body: JSON.stringify({
          reviewItemId: targetReviewItemId,
          userAnswer,
          timeSpentSec: 5,
        }),
      }, cookie);
      const gradeBody = gradeRes.body as {
        isCorrect?: boolean;
        previews?: { again: { days: number } };
        appliedRating?: string;
      };
      log(
        "POST /api/study/grade",
        gradeRes.status === 200 && typeof gradeBody?.isCorrect === "boolean",
        `isCorrect=${gradeBody?.isCorrect}, appliedRating=${gradeBody?.appliedRating}`
      );

      // apply（用 AGAIN 评分，强制触发重学）
      const applyRes = await request("/api/study/apply", {
        method: "POST",
        body: JSON.stringify({
          reviewItemId: targetReviewItemId,
          rating: "AGAIN",
          timeSpentSec: 5,
        }),
      }, cookie);
      const applyBody = applyRes.body as { state?: string; dueAt?: string; nextIntervalLabel?: string };
      log(
        "POST /api/study/apply",
        applyRes.status === 200 && !!applyBody?.state,
        `state=${applyBody?.state}, next=${applyBody?.nextIntervalLabel}`
      );
    }
  }

  // === 5. 错题本 ===
  console.log("\n【5】错题本");
  {
    const r = await request("/api/wrongbook", {}, cookie);
    const body = r.body as { items?: unknown[] };
    log("GET /api/wrongbook", r.status === 200 && Array.isArray(body?.items), `共 ${body?.items?.length ?? 0} 条`);
  }

  // === 6. 日志 ===
  console.log("\n【6】日志");
  {
    const r = await request("/api/logbook?limit=20", {}, cookie);
    const body = r.body as { records?: unknown[] };
    log("GET /api/logbook", r.status === 200 && Array.isArray(body?.records), `共 ${body?.records?.length ?? 0} 条`);
  }

  // === 7. 分析 ===
  console.log("\n【7】分析");
  {
    const r = await request("/api/analytics?days=30", {}, cookie);
    const body = r.body as { overview?: { streak?: number } };
    log("GET /api/analytics", r.status === 200 && !!body?.overview, `streak=${body?.overview?.streak ?? 0}`);
  }

  // === 总结 ===
  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  通过：${passCount} / ${results.length}`);
  if (failCount > 0) {
    console.log(`  失败：${failCount}`);
    results.filter((r) => !r.pass).forEach((r) => {
      console.log(`    ✗ ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
    });
    process.exit(1);
  }
  console.log("  全部通过 ✓");
  process.exit(0);
}

main().catch((e) => {
  console.error("测试脚本异常：", e);
  process.exit(1);
});

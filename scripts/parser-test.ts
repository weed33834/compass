// 导入解析器单元测试 · 覆盖 12 种用户错误/复杂场景
//
// 运行：pnpm tsx scripts/parser-test.ts
//
// 设计：直接调用 parseQuestionFile，不依赖测试框架。
//       每个场景断言 questions 数量 / warnings 内容 / 抛错信息，
//       输出 PASS/FAIL 汇总，退出码 0=全过 / 1=有失败。

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseQuestionFile } from "../src/lib/quiz/import";

const FIXTURES = join(process.cwd(), "tests/fixtures/import");

interface CaseResult {
  name: string;
  pass: boolean;
  detail: string;
}

const results: CaseResult[] = [];

function assert(name: string, cond: boolean, detail: string) {
  results.push({ name, pass: cond, detail });
  console.log(`${cond ? "✓ PASS" : "✗ FAIL"}  ${name}`);
  if (!cond) console.log(`        ${detail}`);
}

async function load(name: string): Promise<Buffer> {
  return readFile(join(FIXTURES, name));
}

async function main() {
  // === 场景 1：合法 Markdown 四题型齐全 ===
  {
    const buf = await load("valid-multi-types.md");
    const r = await parseQuestionFile(buf, { fileName: "valid-multi-types.md" });
    assert(
      "场景01 · 合法 Markdown 解析 4 题",
      r.questions.length === 4,
      `期望 4 题，实际 ${r.questions.length}；warnings: ${r.warnings.join(" | ")}`
    );
    const types = r.questions.map((q) => q.type).join(",");
    assert(
      "场景01 · 四题型齐全",
      types === "SINGLE_CHOICE,MULTI_CHOICE,TRUE_FALSE,FILL_BLANK",
      `类型序列：${types}`
    );
  }

  // === 场景 2：空文件抛错 ===
  {
    const buf = await load("malformed-empty.md");
    try {
      await parseQuestionFile(buf, { fileName: "malformed-empty.md" });
      assert("场景02 · 空文件应抛错", false, "未抛错");
    } catch (e) {
      const msg = (e as Error).message;
      assert(
        "场景02 · 空文件抛错",
        msg.includes("文件为空"),
        `错误信息：${msg}`
      );
    }
  }

  // === 场景 3：旧版 .doc 格式拒绝 ===
  {
    const buf = await load("malformed-legacy.doc");
    try {
      await parseQuestionFile(buf, { fileName: "report.doc" });
      assert("场景03 · .doc 拒绝", false, "未抛错");
    } catch (e) {
      const msg = (e as Error).message;
      assert(
        "场景03 · .doc 旧版格式拒绝",
        msg.includes("不支持旧版 .doc 格式"),
        `错误信息：${msg}`
      );
    }
  }

  // === 场景 4：二进制伪装成 .md ===
  {
    const buf = await load("malformed-binary-as-md.md");
    try {
      await parseQuestionFile(buf, { fileName: "image.md" });
      assert("场景04 · 二进制伪装拒绝", false, "未抛错");
    } catch (e) {
      const msg = (e as Error).message;
      assert(
        "场景04 · 二进制伪装成 .md 拒绝",
        msg.includes("不是文本"),
        `错误信息：${msg}`
      );
    }
  }

  // === 场景 5：不支持的后缀 ===
  {
    const buf = Buffer.from("hello", "utf-8");
    try {
      await parseQuestionFile(buf, { fileName: "notes.pdf" });
      assert("场景05 · 未知后缀拒绝", false, "未抛错");
    } catch (e) {
      const msg = (e as Error).message;
      assert(
        "场景05 · 未知后缀拒绝",
        msg.includes("不支持的文件格式"),
        `错误信息：${msg}`
      );
    }
  }

  // === 场景 6：缺答案告警 ===
  {
    const buf = await load("malformed-no-answers.md");
    const r = await parseQuestionFile(buf, { fileName: "no-answers.md" });
    const hasWarn = r.warnings.some((w) => w.includes("缺少") && w.includes("答案"));
    const hasSkip = r.warnings.some((w) => w.includes("判断题答案无法识别") && w.includes("跳过"));
    assert(
      "场景06 · 选择题缺答案告警",
      hasWarn,
      `warnings: ${r.warnings.join(" | ")}`
    );
    assert(
      "场景06 · 判断题空答案跳过",
      hasSkip,
      `warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 7：答案不在选项中告警 ===
  {
    const buf = await load("malformed-answer-not-in-options.md");
    const r = await parseQuestionFile(buf, { fileName: "answer-not-in-options.md" });
    const hasWarn = r.warnings.some((w) => w.includes("不在选项"));
    assert(
      "场景07 · 答案不在选项中告警",
      hasWarn,
      `warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 8：判断题答案无法识别 → 跳过 ===
  {
    const buf = await load("malformed-bad-boolean.md");
    const r = await parseQuestionFile(buf, { fileName: "bad-boolean.md" });
    // 2 题：1 题"可能"应被跳过，剩 1 题
    assert(
      "场景08 · 无法识别布尔跳过",
      r.questions.length === 1,
      `期望剩 1 题（跳过 1），实际 ${r.questions.length}`
    );
    const hasWarn = r.warnings.some((w) => w.includes("可能") && w.includes("跳过"));
    assert(
      "场景08 · 跳过告警",
      hasWarn,
      `warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 9：单选题写多答案 → 取第一个 ===
  {
    const buf = await load("malformed-multi-as-single.md");
    const r = await parseQuestionFile(buf, { fileName: "multi-as-single.md" });
    const hasWarn = r.warnings.some((w) => w.includes("单选") && w.includes("多个"));
    const answer = r.questions[0]?.answer;
    assert(
      "场景09 · 单选多答案取第一个",
      hasWarn && answer === "A",
      `warn=${hasWarn}, answer=${JSON.stringify(answer)}`
    );
  }

  // === 场景 10：Word "第N题：" 编号格式（修复 regex + 分隔符 bug） ===
  // 用 word.ts 的 preprocessWordText + parseMarkdown 模拟 .docx 解析流程
  // （parseWord 内部调用 mammoth，无法在没有真实 .docx 的情况下测试，
  //   但预处理逻辑已导出为 preprocessWordText，可直接验证）
  {
    const { preprocessWordText } = await import("../src/lib/quiz/import/word");
    const { parseMarkdown } = await import("../src/lib/quiz/import/markdown");
    const text = `单选题

第1题：下列哪种算法是 Compass 使用的间隔重复算法？
A. SM-2
B. FSRS-6
C. Anki
D. SuperMemo
答案：B
解析：FSRS-6 是 ts-fsrs 实现。

第2题：Compass 用什么数据库？
A. MySQL
B. PostgreSQL
答案：B

多选题

第3题：下列哪些是支持的导入格式？
A. Markdown
B. Excel
C. Word
D. PDF
答案：ABC

判断题

第4题：FSRS 会动态调整复习间隔。
答案：正确
`;
    const mdText = preprocessWordText(text);
    const r = await parseMarkdown(mdText);
    assert(
      "场景10 · 第N题：编号格式解析 4 题",
      r.questions.length === 4,
      `期望 4 题，实际 ${r.questions.length}；warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 10b：第1题：不带顿号也能识别（regex 修复验证） ===
  {
    const { preprocessWordText } = await import("../src/lib/quiz/import/word");
    const { parseMarkdown } = await import("../src/lib/quiz/import/markdown");
    // 仅"第1题："（冒号无顿号）—— 旧 regex [:：]、 会失败
    const text = `单选题

第1题：测试题一？
A. a
B. b
答案：A

第2题：测试题二？
A. a
B. b
答案：B
`;
    const mdText = preprocessWordText(text);
    const r = await parseMarkdown(mdText);
    assert(
      "场景10b · 第1题：regex 修复（无顿号也能识别）",
      r.questions.length === 2,
      `期望 2 题，实际 ${r.questions.length}；warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 10c：第1题、（顿号无冒号）也能识别 ===
  {
    const { preprocessWordText } = await import("../src/lib/quiz/import/word");
    const { parseMarkdown } = await import("../src/lib/quiz/import/markdown");
    const text = `单选题

第1题、测试题一？
A. a
B. b
答案：A

第2题、测试题二？
A. a
B. b
答案：B
`;
    const mdText = preprocessWordText(text);
    const r = await parseMarkdown(mdText);
    assert(
      "场景10c · 第1题、（顿号分隔）也能识别",
      r.questions.length === 2,
      `期望 2 题，实际 ${r.questions.length}；warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 11：Excel/CSV 合法解析 ===
  {
    const buf = await load("valid-csv.csv");
    const r = await parseQuestionFile(buf, { fileName: "valid-csv.csv" });
    assert(
      "场景11 · 合法 CSV 解析 4 题",
      r.questions.length === 4,
      `期望 4 题，实际 ${r.questions.length}；warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 场景 12：CSV 未转义逗号告警 ===
  {
    const buf = await load("malformed-csv-unquoted-comma.csv");
    const r = await parseQuestionFile(buf, { fileName: "malformed.csv" });
    const hasWarn = r.warnings.some((w) => w.includes("未命名列") && w.includes("逗号"));
    assert(
      "场景12 · CSV 未转义逗号告警",
      hasWarn,
      `warnings: ${r.warnings.join(" | ")}`
    );
  }

  // === 汇总 ===
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log("");
  console.log(`合计：${passed} 通过 / ${failed} 失败 / ${results.length} 总计`);
  if (failed > 0) {
    console.log("\n失败用例：");
    results.filter((r) => !r.pass).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("测试运行异常：", e);
  process.exit(1);
});

# Compass 全场景测试计划

> 版本: v1.0 | 基准: v1.4.3 | 目标覆盖率: 95%+

---

## 测试策略总览

```
单元测试 (Unit)     → 纯函数：grading.ts / fsrs.ts / import/*.ts
集成测试 (Integration) → API + 数据库：queue→grade→apply 全链路
E2E 测试             → Playwright: 10 组 60+ cases (已有) + 新增 20
性能测试 (Performance) → 大题库导入 / 并发提交 / 全量到期
```

---

## A. 单元测试补充（已有 49 → 目标 80+）

### A1. grading.ts 补充

| ID | 测试用例 | 输入 | 期望 |
|----|---------|------|------|
| G-14 | 填空分隔符 | answer: "北京|Beijing"，user: "Beijing" | isCorrect=true |
| G-15 | 填空全角数字 | answer: "1"，user: "１" (全角) | isCorrect=true |
| G-16 | 多选无选项 | answer: ["A","B"]，user: [] | isCorrect=false, partialScore=0 |
| G-17 | 判断中文变体 | answer: "true"，user: "是" | isCorrect=true |
| G-18 | 单选大小写 | answer: "B"，user: "b" | isCorrect=true |
| G-19 | options 为空数组 | options: []，type: FILL_BLANK | 降级 fallback 到直接比较 answer |

### A2. fsrs.ts 补充

| ID | 测试用例 | 期望 |
|----|---------|------|
| F-20 | stability 为 null 时 calculatelnterval | 返回默认 1 天 |
| F-21 | lastReviewAt 为新日期时 R 计算 | retrievability 接近 1.0 |
| F-22 | State 边界：RELEARNING → 正确 → REVIEW | 状态转换路径正确 |
| F-23 | 空 ReviewLog 时 getFsrsParams 降级 | 返回默认参数 |
| F-24 | 极端 difficulty (1.0 / 10.0) | 不抛出异常，值被 clamp |

### A3. import 解析器补充

| ID | 测试用例 | 期望 |
|----|---------|------|
| I-18 | Excel 空行跳行 | warnings 包含空行计数 |
| I-19 | Markdown 无题型标题 | 自动推断题型 |
| I-20 | Word 含图片的 docx | mammoth 提取文本忽略图片 |
| I-21 | CSV BOM 头解析 | 正确识别 UTF-8 BOM |
| I-22 | 题干含 HTML 标签 | 保留或剥离取决于选项 |
| I-23 | 超大文件 11 MB | 在 route 层被 413 拦截 |

---

## B. 集成测试新增

### B1. 并发与幂等

| ID | 用例 | 步骤 | 期望 |
|----|------|------|------|
| IT-01 | 双 tab 同时 submit | 两请求相同 clientId 的 grade+apply | 后到达的 grade 正常、apply 幂等跳过 |
| IT-02 | grade 完成 apply 前队列变化 | grade 后另一设备答了同题 | apply 以最新 ReviewItem 为准 |
| IT-03 | 并发导入同文件 | 两个 POST /api/banks/import 同时 | 各创建一个题库，题目内容一致 |

### B2. 数据一致性

| ID | 用例 | 期望 |
|----|------|------|
| IT-04 | 答对→FSRS 调度→ReviewLog 记录 | ReviewLog.grade → AnswerRecord.grade 一致 |
| IT-05 | 删除题库 → 级联 | question + reviewItem + answerRecord 全部删除 |
| IT-06 | 错题移除后再答错 | reviewItem 重新出现在错题本 |
| IT-07 | 空 state NEW 卡答错 | state: NEW → LEARNING, lapses: 0, lastErrorAt 非空 |

### B3. 多用户隔离

| ID | 用例 | 期望 |
|----|------|------|
| IT-08 | 用户A创建题库"test" | 用户B看不到 |
| IT-09 | 用户A答错题 | 用户B错题本为空 |
| IT-10 | 用户A修改FSRS参数 | 用户B参数不变 |

---

## C. E2E 测试新增（20 条）

### C1. P0 级别（7条）

| ID | 场景 | Playwright 步骤 | 验证点 |
|----|------|----------------|--------|
| E2E-01 | 并发答题竞态 | 两个 page/browser context 同时进入 study | 两个都可以正常 submit，不出现 409 |
| E2E-02 | 全题库空状态 | 注册新用户 → 访问 /compass /workshop /study /wrongbook /analytics /logbook | 全部显示空状态引导，不报错 |
| E2E-03 | 未登录全拦截 | 直接访问 /compass /workshop /study /analytics /wrongbook | 全部 302 → /login |
| E2E-04 | 大题库导入稳定性 | 构造 2000 题 Markdown → 导入 | 成功完成不超时，题目数=2000 |
| E2E-05 | 网络中断恢复 | submit 时断网 → 恢复 → 刷新页面 | 提示 connect error → 刷新后可继续 |
| E2E-06 | 答题 session 过期 | 删除 localStorage → 回到 /study | 提示需要重新开始 |
| E2E-07 | 24 小时跨日答题 | 模拟修改系统时间 → dueAt 跨越 00:00 | streak 计算正确不跳天 |

### C2. P1 级别（8条）

| ID | 场景 | 验证点 |
|----|------|--------|
| E2E-08 | 键盘全操作答题 | tab/space/enter/数字键 完成一轮答题 |
| E2E-09 | 拖动难度滑块极值 | 两端 0.5 / 0.99 保存 → 刷新后仍为此值 |
| E2E-10 | 错题本分页翻到底 | 30+ 错题 → 翻到最后一页 → 翻回 |
| E2E-11 | 多题库混合答题 | 3个题库各有题 → study?mode=LEARN 无 bankId |
| E2E-12 | 主题切换全页面 | 深海切羊皮纸 → 每个主页面截图对比 |
| E2E-13 | 题库导出再导入 | 导出 CSV → 新题库导入 CSV → 题数一致 |
| E2E-14 | 浏览器后退/前进 | 答题中后退 → 前进 → resume prompt |
| E2E-15 | 连续 30 天 streak 热力图 | seed 30天答题记录 → analytics 热力图 30 格有颜色 |

### C3. P2 级别（5条）

| ID | 场景 | 验证点 |
|----|------|--------|
| E2E-16 | 移动端视口 375px | 全部页面不溢出 |
| E2E-17 | 屏幕阅读器 | VoiceOver/nvda 可以读出答题选项 |
| E2E-18 | 慢网络 3G throttle | 页面不白屏超 15s |
| E2E-19 | 打印/PDF 导出 | Ctrl+P → PDF 正确 |
| E2E-20 | 100 天连续登录 seed | analytics 能加载 365 天热力图不卡顿 |

---

## D. 性能测试基准

| 场景 | 目标 | 测试方法 |
|------|------|---------|
| 1000 题导入耗时 | <30s | 构造大文件 → 计时 |
| 200 题队列构建 | <500ms | prisma query 实测 |
| 365 天 analytics 查询 | <2s | 10万条 answerRecord 下实测 |
| 并发 50 user submit | p95 <1s | wrk/oha 压测 |
| 内存占用(空跑) | <200MB | pm2 monit |

---

## E. 执行顺序

```
Phase 1 (P0): A.G-14~19, A.F-20~24, A.I-18~23, IT-01~10, E2E-01~07
Phase 2 (P1): E2E-08~15, 性能基准全量
Phase 3 (P2): E2E-16~20, WCAG 审计
```

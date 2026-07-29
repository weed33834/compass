# Compass 企业级差距分析报告

> 生成时间: 2026-07-29 | 版本基准: v1.4.3 | 分析维度: 全链路因果逻辑 + 横向/纵向竞品对标

---

## 一、全链路因果逻辑审计

### 1.1 核心链路 (queue → grade → apply)

| 阶段 | 模块 | 因果逻辑 | 当前状态 |
|------|------|---------|---------|
| 队列构建 | `scheduler.ts → buildStudyQueue` | 到期复习卡 + 本日新卡配额，按 bank.newCardsPerDay 限制，复习优先穿插 | ✅ 完整 |
| 判分 | `grading.ts → gradeQuestion` | 单选/判断二元、多选漏选0.5错选0、填空逐空归一化 | ✅ 完整 |
| 提交 | `grade/route.ts` | 写入 AnswerRecord（含 isCorrect/partialScore/errorReason/timeSpentSec） | ✅ 完整 |
| FSRS调度 | `apply/route.ts` | 调 ts-fsrs 的 grade() / nextStates()，更新 ReviewItem 字段 + 写 ReviewLog | ✅ 完整 |
| 幂等保护 | `apply/route.ts` | clientId 去重，防止重复提交 | ✅ 完整 |
| 两阶段隔离 | grade + apply | grade 只写 AnswerRecord，apply 才执行 FSRS 状态变更；事务内操作 | ✅ 完整 |
| State 类型桥 | `fsrs.ts` | Prisma 字符串 State ↔ ts-fsrs 数字 State，6+ 辅映射函数 | ✅ 完整 |

### 1.2 辅助链路

| 链路 | 关键点 | 状态 |
|------|-------|------|
| 题库导入 | md/excel/word → ParsedQuestion → 事务建库建题建 ReviewItem → totalQuestions 回写 | ✅ |
| 错题本查询 | ReviewItem where lapses>0 OR lastErrorAt not null | ✅ |
| 错题本编辑 | PATCH: errorReason→AnswerRecord / errorTags/isSuspended/isBuried→ReviewItem | ✅ |
| 分析面板 | analytics: 总览+趋势+题型+错因+薄弱TOP10+热力图+记忆健康度+R衰减+7天预测 | ✅ |
| 导出 | CSV(BOM)/Anki TSV，空题库422 | ✅ |
| 官方题库 | manifest.json → 按需加载 dialog → 不占库直到点击 | ✅ |
| 中断恢复 | localStorage save → 7天过期 → continue/discard prompt | ✅ |
| 题库内编辑 | 题型/难度/收藏/软删除，含二次确认 | ✅ |

### 1.3 已修复的历史缺陷 (CHANGELOG 关键项)

- [x] FSRS State 转换：Prisma 字符串 vs ts-fsrs 数字（V1.4.1 修）
- [x] 外键级联：delete bank → cascade questions + reviewItems（V1.4.1 修）
- [x] apply 幂等：重复提交不会重复调度（V1.4.1 修）
- [x] N+1 查询：analytics 365 → 1 次查询（V1.4.1 修）
- [x] 错题本 errorReason 持久化（V1.4.1 修）
- [x] 重复计数：grade double-counting 修复（V1.4.1 修）
- [x] IP信任链安全（V1.4.1 修）
- [x] timeSpentSec 钳制（V1.4.1 修）
- [x] forgot-password 状态码（V1.4.1 修）
- [x] 错题本双重条件覆盖（V1.2 修）
- [x] 学习画像 + 完成报告升级（V1.1 修）

---

## 二、横向竞品对标（企业级能力矩阵）

对比基准: Anki / AnkiWeb / AnkiDroid / SuperMemo / Quizlet / RemNote

### 2.1 已完成对标

| 能力 | Anki | Compass | 匹配度 |
|------|------|---------|--------|
| FSRS-6 算法 | v24+ | ✅ ts-fsrs 5.4 | 完全 |
| 多题型判分 | 基础卡片 | ✅ 4种+P分 | 超越 |
| 间隔重复调度 | ✅ | ✅ | 达到 |
| 数据可视化 | 插件生态 | ✅ 热力图+衰减+预测 | 超越 |
| Docker 部署 | 非官方 | ✅ 一键 compose | 超越 |
| 多格式导入 | CSV/APKG | ✅ md/excel/word | 超越 |
| 主题切换 | 插件 | ✅ 深海/羊皮纸 | 达到 |
| 开源 | AGPL | ✅ MIT | 更宽松 |

### 2.2 企业级缺失项

| # | 缺失能力 | 竞品参照 | 影响等级 | 紧急度 |
|---|---------|---------|---------|--------|
| 1 | **学习计划系统** | Anki Filtered Decks / SuperMemo Plan | 🔴 高 | P0 |
| 2 | **通知与提醒** | AnkiDroid Push / iOS Local Notification | 🔴 高 | P0 |
| 3 | **社区题库共享** | AnkiWeb Shared Decks | 🟡 中 | P1 |
| 4 | **多端同步** | AnkiWeb | 🟡 中 | P1 |
| 5 | **媒体附件** | Anki Image/Audio/Video | 🟡 中 | P1 |
| 6 | **API 文档/OpenAPI** | 企业级标配 | 🟡 中 | P1 |
| 7 | **权限/团队协作** | Quizlet Teams | 🟡 中 | P2 |
| 8 | **国际化 i18n** | 企业级标配 | 🟢 低 | P2 |
| 9 | **监控/告警** | Sentry + Grafana | 🟢 低 | P2 |
| 10 | **离线 PWA** | AnkiDroid | 🟡 中 | P1 |
| 11 | **AI 题库生成** | - (V2 规划) | 🟡 中 | P1 |
| 12 | **数据导出 Anki APKG** | Anki | 🟢 低 | P2 |

---

## 三、纵向全栈对比（底层→顶层）

### 3.1 存储层

| 项目 | 当前 | 差距 |
|------|------|------|
| 数据库 | PostgreSQL 17 + Prisma ORM | ✅ |
| 缓存层 | 内存 Map (rate-limit) | ❌ 无 Redis 集成 |
| 文件存储 | 无 | ❌ 媒体附件需 S3/MinIO |
| 全文搜索 | LIKE/contains | ❌ 无 pgvector/全文索引 |
| 备份策略 | pg_dump 手动 | ⚠️ 无自动化备份脚本 |

### 3.2 应用层

| 项目 | 当前 | 差距 |
|------|------|------|
| 认证 | NextAuth v5 (Credentials) | ❌ 无 OAuth/SSO/OIDC |
| 会话管理 | JWT | ⚠️ 无 refresh token 轮转 |
| API 设计 | REST (Next.js Route Handlers) | ⚠️ 无版本化 / OpenAPI spec |
| 限流 | 内存 Map 令牌桶 | ❌ 多实例不共享 |
| 日志 | console | ❌ 无结构化日志/winston |
| 错误处理 | try/catch + NextResponse | ⚠️ 无统一错误码枚举 |
| 测试覆盖率 | 49 单元 + e2e(888行) | ⚠️ 无覆盖率报告/CI卡点 |

### 3.3 表现层

| 项目 | 当前 | 差距 |
|------|------|------|
| SSR/SSG | Next.js 16 App Router | ✅ |
| 状态管理 | React Context + useState | ⚠️ 无全局状态库 |
| 表单验证 | 无库 | ❌ 无 react-hook-form/zod |
| 无障碍 | 部分 aria-label | ❌ 无 WCAG 审计 |
| 响应式 | ✅ mobile/desktop | ⚠️ 无 PWA manifest |

---

## 四、全场景测试计划

### 4.1 现有测试覆盖

| 层级 | 文件 | 行数 | 覆盖范围 |
|------|------|------|---------|
| 单元-判分 | `grading-test.ts` | ~180 | 13 cases: 单选/多选/判断/填空P分/边界 |
| 单元-FSRS | `fsrs-test.ts` | ~200 | 19 cases: State映射/scheduling/reschedule/空状态 |
| 单元-解析器 | `parser-test.ts` | ~280 | 17 cases: md/excel/word格式/异常 |
| API烟幕 | `api-test.ts` | ~300 | 基础CRUD |
| E2E | `full-flow.spec.ts` | 888 | 10组主题 60+ cases |

### 4.2 缺失测试场景（需补充）

| 场景ID | 场景描述 | 类型 | 优先级 |
|--------|---------|------|--------|
| T01 | 并发答题：两个 tab 同时提交同题（幂等校验） | Integration | P0 |
| T02 | 大题库边界：10000+ 题导入的内存/耗时限界 | Performance | P0 |
| T03 | 网络中断恢复：submit 中途断网 → 重试 | E2E | P0 |
| T04 | 时区边界：UTC+8 vs UTC-5 的 dueAt/streak 计算 | Unit | P0 |
| T05 | 空状态全覆盖：0题库/0题/0复习/0错题 的所有页面 | E2E | P1 |
| T06 | 并发导入：同一文件同时上传两次 | Integration | P1 |
| T07 | FSRS 权重调优：极端 retention(0.5/0.99) 调度稳定性 | Unit | P1 |
| T08 | 跨题库答题：multi-bank study queue 混合题来源 | E2E | P1 |
| T09 | 会话过期：JWT 过期后操作 → 401 → 重新登录 | E2E | P1 |
| T10 | 数据库连接中断：Prisma 连接池耗尽/超时恢复 | Integration | P1 |
| T11 | 文件上传边界：空文件/非文本/超大10MB+/畸形docx | Unit | P1 |
| T12 | 错题移除再答错：remove后重新答错 → 是否再次进入错题本 | Integration | P1 |
| T13 | apply 竞态：grade 完成后 apply 前队列状态变化 | Integration | P1 |
| T14 | 全量题库同时到期：1000卡全部 due → 队列构建不OOM | Performance | P1 |
| T15 | 多用户隔离：两个用户同名题库/题目 → 互不干扰 | Integration | P0 |
| T16 | 学习计划到期提醒：计划时间到了但用户未登录 | Integration | P0 |
| T17 | 官方题库重复加载：同一题库 load 两次的幂等 | Integration | P1 |
| T18 | 分页边界：第1页→空页→翻页→0结果 | E2E | P2 |
| T19 | Keyboard only 答题全流程 | E2E | P2 |
| T20 | 暗色模式 vs 亮色模式热力图/图表对比 | E2E | P2 |

---

## 五、扩展修复计划（按优先级）

### P0 — 本周必须完成

**P0-1: 学习计划系统**
- 影响：无计划 = 无法按考试/学科安排复习优先级
- 方案：新增 `LearningPlan` 表（已存在于 schema），完善 CRUD + 与 scheduler 集成
- 依赖：无
- 估时：3d

**P0-2: 通知提醒系统**
- 影响：用户不记得打开网页 = 遗忘间隔加大
- 方案：Web Push API (Service Worker) + 可选邮件提醒
- 依赖：web-push 库
- 估时：2d

**P0-3: 全场景测试覆盖 (T01-T20)**
- 影响：当前测试以 happy-path 为主，边界和异常场景不足
- 方案：补充集成测试 + 性能测试 + 边界 E2E
- 依赖：无
- 估时：3d

### P1 — 下两周

**P1-1: Redis 缓存集成**
- 影响：多实例部署时限流不共享
- 方案：ioredis + rate-limit / session-store 替换内存 Map

**P1-2: API 文档与版本化**
- 影响：无文档难对接
- 方案：next-swagger-doc 或 OpenAPI Generator，自动生成 + 版本前缀 /api/v1/

**P1-3: 离线 PWA 支持**
- 影响：移动端无网络不可用
- 方案：next-pwa + manifest.json + Service Worker 缓存策略

**P1-4: 媒体附件支持**
- 影响：Anki 用户迁移困难
- 方案：S3/MinIO 存储 + Prisma 新增 media 字段 + 前端上传组件

**P1-5: 结构化日志**
- 影响：生产调试困难
- 方案：winston/pino + 请求ID追踪

### P2 — 一个月内

**P2-1: OAuth/SSO 集成**
**P2-2: 社区题库共享**
**P2-3: 国际化 i18n**
**P2-4: 监控告警 (Sentry)**
**P2-5: AI 题库生成 (V2)**

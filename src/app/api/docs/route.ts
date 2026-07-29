// Compass OpenAPI 3.1 Spec Endpoint
// GET /api/docs → 返回 JSON 格式的完整 API 文档
// 版本策略：当前所有路由均为 V1（无版本号前缀），通过 X-API-Version 响应头声明版本

import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(spec, {
    headers: { "X-API-Version": "v1" },
  });
}

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Compass API",
    version: "1.4.3",
    description:
      "Compass · 刷题罗盘 — 基于 FSRS-6 算法的自托管间隔重复刷题工具。RESTful API，认证方式为 NextAuth Session Cookie。",
    contact: { name: "Compass Contributors" },
    license: { name: "MIT" },
  },
  servers: [{ url: "/api", description: "相对路径（同源部署）" }],
  tags: [
    { name: "Auth", description: "认证：注册 / 登录 / 密码重置" },
    { name: "Banks", description: "题库管理：CRUD / 导入 / 导出" },
    { name: "Questions", description: "单题查询与编辑" },
    { name: "Study", description: "刷题核心：队列 / 判分 / FSRS 调度" },
    { name: "Sessions", description: "答题会话追踪" },
    { name: "Wrongbook", description: "错题漂流瓶" },
    { name: "Logbook", description: "答题日志查询" },
    { name: "Analytics", description: "学习分析面板" },
    { name: "Plans", description: "学习计划 CRUD" },
    { name: "Notifications", description: "通知提醒与扫描" },
    { name: "Health", description: "健康检查" },
  ],
  paths: {
    // ============ Auth ============
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "注册新用户",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string", minLength: 1, maxLength: 50 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "注册成功" },
          "400": { description: "参数校验失败 / 邮箱已存在" },
          "429": { description: "触发频率限制" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "发送密码重置邮件",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "已发送（存在与否均返回 200，防止邮箱枚举）" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "重置密码",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "密码已重置" },
          "400": { description: "Token 无效或已过期" },
        },
      },
    },

    // ============ Banks ============
    "/banks": {
      get: {
        tags: ["Banks"],
        summary: "列出当前用户的全部题库（带统计）",
        responses: {
          "200": {
            description: "题库列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    banks: {
                      type: "array",
                      items: { $ref: "#/components/schemas/BankSummary" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Banks"],
        summary: "创建题库（可一次性塞入题目）",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBank" },
            },
          },
        },
        responses: {
          "201": { description: "题库已创建", headers: { "X-API-Version": { schema: { type: "string" } } } },
          "400": { description: "题库名称为空或过长" },
          "429": { description: "频繁创建，请稍后重试" },
        },
      },
    },
    "/banks/{bankId}": {
      get: {
        tags: ["Banks"],
        summary: "获取单个题库详情",
        parameters: [{ name: "bankId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "题库详情" },
          "404": { description: "题库不存在" },
        },
      },
      patch: {
        tags: ["Banks"],
        summary: "更新题库元数据",
        parameters: [{ name: "bankId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", maxLength: 100 },
                  description: { type: "string" },
                  coverColor: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  newCardsPerDay: { type: "integer" },
                  maxReviewsPerDay: { type: "integer" },
                  desiredRetention: { type: "number", minimum: 0.5, maximum: 0.99 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "已更新" },
          "404": { description: "题库不存在" },
        },
      },
      delete: {
        tags: ["Banks"],
        summary: "删除题库（级联删除题目和复习卡）",
        parameters: [{ name: "bankId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "已删除" },
          "404": { description: "题库不存在" },
        },
      },
    },
    "/banks/{bankId}/export": {
      get: {
        tags: ["Banks"],
        summary: "导出题库为 CSV/TSV 文件",
        parameters: [
          { name: "bankId", in: "path", required: true, schema: { type: "string" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["csv", "tsv"], default: "csv" } },
        ],
        responses: {
          "200": { description: "文件下载" },
          "422": { description: "题库无题目" },
        },
      },
    },
    "/banks/{bankId}/questions": {
      get: {
        tags: ["Banks"],
        summary: "列出题库内所有题目（分页）",
        parameters: [
          { name: "bankId", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "q", in: "query", schema: { type: "string", description: "搜索关键词" } },
          { name: "type", in: "query", schema: { type: "string", description: "筛选题型" } },
          { name: "tag", in: "query", schema: { type: "string", description: "筛选知识点标签" } },
        ],
        responses: { "200": { description: "题目列表（分页）" } },
      },
    },
    "/banks/import": {
      post: {
        tags: ["Banks"],
        summary: "导入题库（Markdown/Excel/Word）",
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" }, bankName: { type: "string" } } } } },
        },
        responses: {
          "201": { description: "导入成功，返回题库 ID 与题目数" },
          "400": { description: "文件格式不支持或解析失败" },
        },
      },
    },

    // ============ Questions ============
    "/questions/{questionId}": {
      get: {
        tags: ["Questions"],
        summary: "查询单题详情",
        parameters: [{ name: "questionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "题目详情" }, "404": { description: "题目不存在" } },
      },
      patch: {
        tags: ["Questions"],
        summary: "更新题目（答案/解析/知识点/软删除）",
        parameters: [{ name: "questionId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "已更新" } },
      },
    },

    // ============ Study ============
    "/study/queue": {
      get: {
        tags: ["Study"],
        summary: "获取答题队列（FSRS 调度）",
        parameters: [
          { name: "bankId", in: "query", schema: { type: "string" }, description: "限定题库（可选）" },
          { name: "mode", in: "query", schema: { type: "string", enum: ["LEARN", "REVIEW_ONLY", "WRONG_REDO"], default: "LEARN" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 200, maximum: 500 } },
        ],
        responses: {
          "200": {
            description: "答题队列",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/QueueItem" } },
                    stats: { type: "object", properties: { total: { type: "integer" }, dueReviews: { type: "integer" }, newCards: { type: "integer" } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/study/grade": {
      post: {
        tags: ["Study"],
        summary: "判分（写 AnswerRecord，不应用 FSRS）",
        description: "两阶段提交第一步：仅判分 + 返回 4 键预览间隔。后续用户选择评分后调用 /study/apply。",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reviewItemId", "userAnswer"],
                properties: {
                  reviewItemId: { type: "string" },
                  userAnswer: {},
                  timeSpentSec: { type: "integer", minimum: 0, maximum: 3600 },
                  sessionId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "判分结果 + 评分预览" },
          "400": { description: "参数缺失" },
          "404": { description: "复习卡不存在" },
        },
      },
    },
    "/study/apply": {
      post: {
        tags: ["Study"],
        summary: "应用 FSRS 评分（写入调度 + ReviewLog）",
        description: "两阶段提交第二步：根据用户选择的评分，执行 FSRS 调度并更新 ReviewItem。内置幂等保护（5 分钟内同一卡不重复调度）。",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reviewItemId", "rating"],
                properties: {
                  reviewItemId: { type: "string" },
                  rating: { type: "string", enum: ["AGAIN", "HARD", "GOOD", "EASY"] },
                  timeSpentSec: { type: "integer", minimum: 0, maximum: 3600 },
                  sessionId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "FSRS 调度结果（含下次间隔）" },
          "400": { description: "参数缺失或无效 rating" },
          "404": { description: "复习卡不存在" },
        },
      },
    },

    // ============ Sessions ============
    "/study/sessions": {
      get: { tags: ["Sessions"], summary: "列出当前答题会话历史", responses: { "200": { description: "会话列表" } } },
      post: { tags: ["Sessions"], summary: "创建新答题会话", responses: { "201": { description: "会话已创建" } } },
    },
    "/study/sessions/{sessionId}": {
      get: {
        tags: ["Sessions"],
        summary: "查询单次会话详情（含答案记录）",
        parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "会话详情" }, "404": { description: "会话不存在" } },
      },
    },

    // ============ Wrongbook ============
    "/wrongbook": {
      get: {
        tags: ["Wrongbook"],
        summary: "错题漂流瓶列表（lapses>0 或 lastErrorAt 非空）",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "错题列表（分页）" } },
      },
      patch: {
        tags: ["Wrongbook"],
        summary: "标记「已掌握」或修改 errorTags",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reviewItemId"],
                properties: {
                  reviewItemId: { type: "string" },
                  isBuried: { type: "boolean", description: "置为已掌握（不再出现在错题本）" },
                  errorTags: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { "200": { description: "已更新" } },
      },
    },

    // ============ Logbook ============
    "/logbook": {
      get: {
        tags: ["Logbook"],
        summary: "答题日志查询（带分页 + 日期筛选）",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "from", in: "query", schema: { type: "string", format: "date", description: "开始日期" } },
          { name: "to", in: "query", schema: { type: "string", format: "date", description: "结束日期" } },
        ],
        responses: { "200": { description: "答题日志列表（分页）" } },
      },
    },

    // ============ Analytics ============
    "/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "学习分析面板（总览+趋势+题型+错因+薄弱TOP10+热力图+记忆健康度+R衰减+预测）",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "365d"], default: "30d" } },
        ],
        responses: { "200": { description: "分析数据包" } },
      },
    },

    // ============ Plans ============
    "/plans": {
      get: {
        tags: ["Plans"],
        summary: "列出当前用户的学习计划",
        responses: { "200": { description: "学习计划列表" } },
      },
      post: {
        tags: ["Plans"],
        summary: "创建学习计划",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "goalDate"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  goalDate: { type: "string", format: "date" },
                  targetBankId: { type: "string" },
                  dailyTarget: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        responses: { "201": { description: "计划已创建" } },
      },
    },
    "/plans/{planId}": {
      get: {
        tags: ["Plans"],
        summary: "查询单个学习计划",
        parameters: [{ name: "planId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "计划详情" }, "404": { description: "计划不存在" } },
      },
      patch: {
        tags: ["Plans"],
        summary: "更新学习计划",
        parameters: [{ name: "planId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "已更新" } },
      },
      delete: {
        tags: ["Plans"],
        summary: "删除学习计划",
        parameters: [{ name: "planId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "已删除" } },
      },
    },

    // ============ Notifications ============
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "列出通知（支持 ?unread=true）",
        parameters: [{ name: "unread", in: "query", schema: { type: "boolean" } }],
        responses: { "200": { description: "通知列表" } },
      },
      post: {
        tags: ["Notifications"],
        summary: "标记全部通知为已读",
        responses: { "200": { description: "已标记" } },
      },
    },
    "/notifications/scan": {
      post: {
        tags: ["Notifications"],
        summary: "触发通知扫描（复习到期/连续打卡/计划过期）",
        description: "5 分钟内限频，每人每类型每天一条。",
        responses: { "200": { description: "扫描完成" }, "429": { description: "扫描过于频繁" } },
      },
    },

    // ============ Health ============
    "/health": {
      get: {
        tags: ["Health"],
        summary: "健康检查（含数据库连通性）",
        responses: {
          "200": { description: "服务正常", content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } } },
          "503": { description: "服务降级（DB 不可达）" },
        },
      },
    },
  },

  components: {
    schemas: {
      BankSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          coverColor: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          visibility: { type: "string", enum: ["PRIVATE", "UNLISTED", "PUBLIC"] },
          totalQuestions: { type: "integer" },
          questionCount: { type: "integer" },
          dueCount: { type: "integer" },
          newCardsPerDay: { type: "integer" },
          maxReviewsPerDay: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateBank: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 100 },
          description: { type: "string" },
          coverColor: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          visibility: { type: "string", enum: ["PRIVATE", "UNLISTED", "PUBLIC"] },
          newCardsPerDay: { type: "integer" },
          questions: {
            type: "array",
            items: {
              type: "object",
              required: ["type", "stem"],
              properties: {
                type: { type: "string", enum: ["SINGLE_CHOICE", "MULTI_CHOICE", "TRUE_FALSE", "FILL_BLANK"] },
                stem: { type: "string" },
                options: {},
                answer: {},
                explanation: { type: "string" },
                knowledgePoints: { type: "array", items: { type: "string" } },
                difficulty: { type: "number", minimum: 0.5, maximum: 5 },
              },
            },
          },
        },
      },
      QueueItem: {
        type: "object",
        properties: {
          reviewItemId: { type: "string" },
          questionId: { type: "string" },
          bankId: { type: "string" },
          bankName: { type: "string" },
          type: { type: "string", enum: ["SINGLE_CHOICE", "MULTI_CHOICE", "TRUE_FALSE", "FILL_BLANK"] },
          stem: { type: "string" },
          options: {},
          knowledgePoints: { type: "array", items: { type: "string" } },
          difficulty: { type: "number" },
          state: { type: "string" },
          lapses: { type: "integer" },
          isNew: { type: "boolean" },
        },
      },
      Health: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded"] },
          timestamp: { type: "string", format: "date-time" },
          db: { type: "string", enum: ["ok", "down"] },
        },
      },
    },
  },
};

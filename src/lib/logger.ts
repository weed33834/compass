// 结构化日志模块
// 基于 pino 实现，输出 JSON 格式到 stdout，由外部采集器（如 fluentd/loki/datadog）汇总
// 设计要点：日志级别按 Pino 的 6 级（trace/debug/info/warn/error/fatal），
// 生产环境默认 info，开发环境 debug

import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

// 生产环境输出纯 JSON（单行），开发环境用 pino-pretty 人类可读
const transport = isProd
  ? undefined
  : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } };

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: ["password", "passwordHash", "token", "authorization"],
    censor: "[REDACTED]",
  },
  transport,
  // 为日志附加服务名和环境信息
  base: { service: "compass", env: process.env.NODE_ENV ?? "development" },
});

export { logger };
export type { Logger } from "pino";

// 便捷封装：生成带固定上下文的子 logger
// 用法：const log = logger.child({ module: "study-grading" });
export function createChildLogger(module: string, extra?: Record<string, unknown>) {
  return logger.child({ module, ...extra });
}

// 请求级 logger 工厂：每个 HTTP 请求生成一个独立 logger，自动附带 requestId
// 用法：const log = createRequestLogger("GET /api/banks");
export function createRequestLogger(route: string) {
  const requestId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
  return logger.child({ requestId, route });
}

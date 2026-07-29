// 统一 API 错误码体系
// 所有 Route Handler 使用 ApiError 抛出带标准化 error code 的响应，
// 前端根据 error.code 做差异化处理（如 401→跳登录，429→显示倒计时）
//
// 使用方式：
//   throw new ApiError(ErrorCode.INVALID_INPUT, "bankId 不能为空");
//
// 兼容现有模式（返回 NextResponse，非抛异常）：
//   return ApiError.toResponse(ErrorCode.NOT_FOUND, "题库不存在");

import { NextResponse } from "next/server";

// ─── 错误码枚举 ───────────────────────────────────────

export const ErrorCode = {
  // 4xx — 客户端错误
  BAD_REQUEST: "BAD_REQUEST",                 // 通用请求错误
  INVALID_INPUT: "INVALID_INPUT",             // 参数校验失败
  MISSING_FIELD: "MISSING_FIELD",             // 必填字段缺失
  NOT_FOUND: "NOT_FOUND",                     // 资源不存在
  CONFLICT: "CONFLICT",                       // 资源冲突（如重复导入）
  DUPLICATE: "DUPLICATE",                     // 唯一键冲突
  UNAUTHORIZED: "UNAUTHORIZED",               // 未登录
  FORBIDDEN: "FORBIDDEN",                     // 无权限
  RATE_LIMITED: "RATE_LIMITED",              // 频率限制
  FILE_TOO_LARGE: "FILE_TOO_LARGE",           // 文件过大
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",       // 不支持的文件/题型
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",     // 请求体过大

  // 5xx — 服务端错误
  INTERNAL_ERROR: "INTERNAL_ERROR",           // 通用服务端错误
  DB_ERROR: "DB_ERROR",                       // 数据库错误
  FSRS_ERROR: "FSRS_ERROR",                   // FSRS 调度算法错误
  AI_ERROR: "AI_ERROR",                       // AI 服务调用失败

  // 业务错误
  EMPTY_QUEUE: "EMPTY_QUEUE",                 // 答题队列为空
  DUPLICATE_GRADE: "DUPLICATE_GRADE",         // 重复判分（幂等拦截）
  BANK_NOT_EMPTY: "BANK_NOT_EMPTY",           // 题库非空不可删除
  IMPORT_PARSE_ERROR: "IMPORT_PARSE_ERROR",   // 导入文件解析失败
  EXPORT_EMPTY: "EXPORT_EMPTY",               // 导出时题库为空
  PLAN_NAME_TAKEN: "PLAN_NAME_TAKEN",         // 学习计划名称已存在
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── HTTP 状态码映射 ──────────────────────────────────

const CODE_TO_STATUS: Record<ErrorCodeType, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_FIELD]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.DUPLICATE]: 409,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.UNSUPPORTED_TYPE]: 415,
  [ErrorCode.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.FSRS_ERROR]: 500,
  [ErrorCode.AI_ERROR]: 502,
  [ErrorCode.EMPTY_QUEUE]: 200,
  [ErrorCode.DUPLICATE_GRADE]: 409,
  [ErrorCode.BANK_NOT_EMPTY]: 409,
  [ErrorCode.IMPORT_PARSE_ERROR]: 422,
  [ErrorCode.EXPORT_EMPTY]: 422,
  [ErrorCode.PLAN_NAME_TAKEN]: 409,
};

// ─── ApiError 类 ──────────────────────────────────────

export class ApiError extends Error {
  readonly code: ErrorCodeType;
  readonly status: number;

  constructor(code: ErrorCodeType, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = CODE_TO_STATUS[code] ?? 500;
  }

  /** 直接转 NextResponse */
  toResponse(): NextResponse {
    return NextResponse.json(
      { error: this.message, code: this.code },
      { status: this.status }
    );
  }

  /** 静态工厂：不抛异常，直接返回响应 */
  static toResponse(code: ErrorCodeType, message: string): NextResponse {
    const status = CODE_TO_STATUS[code] ?? 500;
    return NextResponse.json(
      { error: message, code },
      { status }
    );
  }
}

// ─── 辅助：from Prisma 错误 ────────────────────────────

/** 将 Prisma 已知错误转为 ApiError */
export function fromPrismaError(err: unknown): ApiError | null {
  if (!err || typeof err !== "object") return null;
  const anyErr = err as Record<string, unknown>;
  if (anyErr.code === "P2002") {
    return new ApiError(ErrorCode.DUPLICATE, "数据已存在，请勿重复创建");
  }
  if (anyErr.code === "P2025") {
    return new ApiError(ErrorCode.NOT_FOUND, "请求的资源不存在");
  }
  return null;
}

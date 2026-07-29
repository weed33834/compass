// 媒体文件上传端点
// POST /api/upload — 上传图片/音频到本地存储
// 返回公开 URL，供题目 stem/options/explanation 引用
//
// 安全约束：
//   - 仅允许 image/* 和 audio/* MIME 类型
//   - 单文件最大 10MB
//   - 用户级限流：60 次/小时
//   - 文件名随机化防遍历

import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { ErrorCode, ApiError } from "@/lib/errors";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`upload:${auth.userId}`, 60, 3600_000);
  if (limited) return limited;

  let buffer: ArrayBuffer;
  let fileName: string;
  let contentType: string;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return ApiError.toResponse(ErrorCode.MISSING_FIELD, "未找到上传文件");
    }

    contentType = file.type;
    if (!ALLOWED_TYPES.includes(contentType)) {
      return ApiError.toResponse(
        ErrorCode.UNSUPPORTED_TYPE,
        `不支持的文件类型: ${contentType}。允许: ${ALLOWED_TYPES.join(", ")}`
      );
    }

    if (file.size > MAX_SIZE) {
      return ApiError.toResponse(
        ErrorCode.FILE_TOO_LARGE,
        `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，最大 10MB`
      );
    }

    buffer = await file.arrayBuffer();
    const ext = contentTypeToExt(contentType, file.name);
    fileName = `${randomUUID()}${ext}`;
  } catch {
    return ApiError.toResponse(ErrorCode.BAD_REQUEST, "请求解析失败");
  }

  // 写入 public/uploads/（Next.js 直接对外提供静态文件）
  // 文件路径: /uploads/<uuid>.<ext>
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, fileName), Buffer.from(buffer));
  } catch (err) {
    console.error("[upload] 写文件失败:", err);
    return ApiError.toResponse(ErrorCode.INTERNAL_ERROR, "上传失败，请重试");
  }

  const url = `/uploads/${fileName}`;

  return NextResponse.json({
    url,
    type: contentType.startsWith("image/") ? "image" : "audio",
    size: buffer.byteLength,
  });
}

function contentTypeToExt(contentType: string, originalName: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/webm": ".weba",
  };
  if (map[contentType]) return map[contentType];

  // fallback: 取原始扩展名
  const lastDot = originalName.lastIndexOf(".");
  return lastDot >= 0 ? originalName.slice(lastDot) : "";
}

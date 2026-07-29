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
      return NextResponse.json({ error: "未找到上传文件" }, { status: 400 });
    }

    contentType = file.type;
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `不支持的文件类型: ${contentType}。允许: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，最大 10MB` },
        { status: 400 }
      );
    }

    buffer = await file.arrayBuffer();
    const ext = contentTypeToExt(contentType, file.name);
    fileName = `${randomUUID()}${ext}`;
  } catch {
    return NextResponse.json({ error: "请求解析失败" }, { status: 400 });
  }

  // 写入 public/uploads/（Next.js 直接对外提供静态文件）
  // 文件路径: /uploads/<uuid>.<ext>
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, fileName), Buffer.from(buffer));
  } catch (err) {
    console.error("[upload] 写文件失败:", err);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
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

// Zod 入参校验 schema（仅保留 auth 相关，原 profile 相关已删）
import { z } from "zod";

// 注册：name 1-50 字符，email 标准，password 8-128 含字母+数字
export const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-zA-Z]/, "密码须包含字母")
    .regex(/[0-9]/, "密码须包含数字"),
});

// 忘记密码：仅 email
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// 重置密码：token + 新密码
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-zA-Z]/, "密码须包含字母")
    .regex(/[0-9]/, "密码须包含数字"),
});

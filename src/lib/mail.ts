import nodemailer from "nodemailer";

// 从环境变量读取 SMTP 配置创建 transporter
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // 未配置 SMTP 时打印警告并返回 null（不抛错）
  if (!host || !user || !pass) {
    console.warn("[mail] SMTP 环境变量未配置，邮件发送功能不可用");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// 发送密码重置邮件
// 未配置 SMTP 时仅打印警告，不崩溃
export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const transporter = createTransport();
  const from = process.env.SMTP_FROM || "Compass <noreply@compass.local>";
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  if (!transporter) {
    console.warn(
      `[mail] 跳过发送密码重置邮件到 ${to}（SMTP 未配置）`
    );
    return;
  }

  // HTML 邮件内容，沿用深海墨蓝 + 黄铜金主题
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #0B1426; margin-bottom: 8px;">Compass · 重置你的密码</h2>
      <p style="color: #475569; line-height: 1.6;">我们收到了你重置密码的请求。点击下方按钮设置新密码：</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #C9A227; color: #0B1426; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">重置密码</a>
      </p>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6;">或复制此链接到浏览器：<br/>${resetUrl}</p>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">该链接 30 分钟内有效。如果你没有发起此请求，请忽略本邮件。</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Compass · 个人方向与目标导航系统</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: "Compass · 重置你的密码",
    html,
  });
}

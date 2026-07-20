// i18n 基础类型与工具函数
// 务实轻量方案：仅支持 zh-CN（默认）与 en，不引入 next-intl 等第三方依赖
// locale 持久化：cookie + User.locale 字段双重存储（见 layout/I18nProvider/LanguageSwitcher）

// 支持的语言列表
export type Locale = "zh-CN" | "en";

export const locales: Locale[] = ["zh-CN", "en"];

// 默认语言：读取 NEXT_PUBLIC_DEFAULT_LOCALE 环境变量，未设置或非法值时回退 zh-CN
// （项目原始文案为中文，向后兼容）
const envLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
export const defaultLocale: Locale =
  envLocale === "zh-CN" || envLocale === "en" ? envLocale : "zh-CN";

// 运行时类型守卫：从 cookie / DB / 请求体等不可信来源解析 locale
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

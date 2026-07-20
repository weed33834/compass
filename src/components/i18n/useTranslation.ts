// 翻译 hook 的对外入口：消费方统一用 useTranslation() 拿 { t, locale, setLocale }
// 内部仅 re-export useI18n，便于后续替换实现（如切换到 next-intl）时只改此文件
export { useI18n as useTranslation } from "./I18nProvider";

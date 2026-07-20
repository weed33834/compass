// 类名合并工具：过滤掉假值后用空格拼接，便于条件式组合 Tailwind 类名
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// 相对时间格式化：把 Date 转成"刚刚 / X分钟前 / X小时前 / X天前 / X月前 / X年前"
// 用于日志、活动流等场景；阈值均按整单位取大
export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  if (hour < 24) return `${hour} 小时前`;
  if (day < 30) return `${day} 天前`;
  if (day < 365) return `${Math.floor(day / 30)} 个月前`;
  return `${Math.floor(day / 365)} 年前`;
}

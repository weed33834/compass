// 简易内存令牌桶限流器
// 注意：适合单实例部署，多实例需替换为 Redis 实现

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 以 identifier 为 key 存储请求计数与窗口过期时间
const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目，避免内存无限增长
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
  lastCleanup = now;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

// 限流函数：在 windowMs 时间窗口内允许 limit 次请求
// 窗口过期后自动重置计数
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = store.get(identifier);

  // 无记录或窗口已过期：开启新窗口
  if (!existing || existing.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // 命中已有窗口：累加计数
  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    success: existing.count <= limit,
    remaining,
  };
}

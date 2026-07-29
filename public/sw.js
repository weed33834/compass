// Compass PWA Service Worker v2.0
// 策略：Shell 预缓存 + SWR 页面 + Network First API + Cache First 静态资源

const CACHE_NAME = "compass-v2";
const RUNTIME_CACHE = "compass-runtime-v2";

// 预缓存：安装时缓存核心 shell
const PRECACHE_URLS = [
  "/",
  "/compass",
  "/manifest.json",
  "/offline",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ====== Install：预缓存核心资源 ======
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ====== Activate：清理旧缓存 ======
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ====== Fetch：分层缓存策略 ======
self.addEventListener("fetch", (event) => {
  // 非 GET 请求不走缓存
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const { pathname } = url;

  // 1) 导航请求（HTML 页面）：Stale-While-Revalidate
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 2) API 请求：Network First，失败回退缓存
  if (pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3) 静态资源（JS/CSS/字体/图片）：Cache First，后台更新
  if (
    pathname.match(/\.(js|css|woff2?|png|svg|ico|json)$/) ||
    pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, response.clone()));
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4) 其他：Network First 兜底
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ====== 离线回退：导航失败时展示离线页 ======
// 注意：Event.waitUntil 不适用于 fetch handler，需在 respondWith 中处理

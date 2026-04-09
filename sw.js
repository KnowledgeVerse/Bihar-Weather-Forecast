/*
 * ================================================================
 *  बिहार मौसम पूर्वानुमान प्रणाली — Service Worker
 *  Bihar Weather Forecast System — PWA Service Worker
 *
 *  Author  : Lal Kamal
 *  Repo    : github.com/KnowledgeVerse/Bihar-Weather-Forecast
 *  Site    : biharmausam.com | knowledgeverse.github.io/Bihar-Weather-Forecast
 *  Version : 1.0.0
 *
 *  Cache Strategy:
 *    • HTML pages      → Network-First  (hamesha fresh content)
 *    • JS / CSS        → Cache-First    (fast load, offline support)
 *    • Images / Audio  → Cache-First    (bandwidth save)
 *    • Map Tiles       → Cache-First + 7-day expiry
 *    • GeoJSON / CSV   → Cache-First    (data files)
 * ================================================================
 */

const VERSION = "1.0.1";
const CACHE_CORE = `bm-core-${VERSION}`; // HTML, JS, CSS, data
const CACHE_ASSETS = `bm-assets-${VERSION}`; // Images, audio, icons
const CACHE_TILES = `bm-tiles-${VERSION}`; // Map tiles (7-day expiry)
const CACHE_CDN = `bm-cdn-${VERSION}`; // External libraries

/* ──────────────────────────────────────────────
   📋 EXACT FILE LIST FROM YOUR GITHUB REPO
   (aapke project ke sabhi files)
   ────────────────────────────────────────────── */

const HTML_PAGES = [
  "./index.html",
  "./Generate_Weather_Bulletin.html",
  "./Detailed_Weather_Forecast.html",
  "./Temperature_Forecast.html",
  "./Temperature_table.html",
  "./Weather_Map_Effects.html",
  "./Weather_Warning_Table.html",
  "./Weather_summary.html",
  "./Word_Generate_Bulletin.html",
  "./bulk_import.html",
  "./bulletin.html",
  "./bulletin_footer.html",
  "./display.html",
  "./editor.html",
  "./footer.html",
  "./forecast.html",
  "./header.html",
  "./humidity.html",
  "./live.html",
  "./max_min_rh.html",
  "./rain.html",
  "./synop.html",
  "./temp.html",
  "./warning.html",
  "./wind.html",
  "./offline.html",
  "./components/menu.html",
];

const JS_FILES = [
  "./js/main.js",
  "./js/forecast.js",
  "./js/warning.js",
  "./js/districts.js",
  "./js/display.js",
  "./js/weather-data.js",
  "./js/temp.js",
  "./js/rain.js",
  "./js/wind.js",
  "./js/humidity.js",
  "./js/menu.js",
  "./js/menu-loader.js",
  "./js/live.js",
  "./js/nowcast.js",
  "./js/bulk_import.js",
  "./js/detailed_forecast.js",
  "./js/temperature_forecast.js",
];

const CSS_FILES = ["./css/style.css", "./css/menu.css"];

const DATA_FILES = [
  "./assets/bihar_districts.geojson",
  "./data/bihar_districts.geojson",
  "./data/districts.csv",
  "./data/Bihar District Name.csv",
  "./manifest.json",
];

const IMAGE_FILES = [
  "./assets/logo.png",
  "./assets/IMD_150_Year_Logo.png",
  "./assets/North_Arrow.png",
  "./assets/background.png",
  "./logo/sign_in_logo.png",
  /* Weather icons */
  "./assets/weather-icons/thunderstorm.png",
  "./assets/weather-icons/heavyrain.png",
  "./assets/weather-icons/gustywind.png",
  "./assets/weather-icons/densefog.png",
  "./assets/weather-icons/rain.png",
  "./assets/weather-icons/heatwave.png",
  "./assets/weather-icons/coldwave.png",
  "./assets/weather-icons/coldday.png",
  "./assets/weather-icons/hailstorm.png",
  "./assets/weather-icons/warmnight.png",
  "./assets/weather-icons/frost.png",
  "./assets/weather-icons/snow.png",
  "./assets/weather-icons/dry.png",
  "./assets/weather-icons/hotday.png",
  "./assets/weather-icons/hotandhumid.png",
  "./assets/weather-icons/veryheavyrain.png",
  "./assets/weather-icons/extremelyveryheavyrain.png",
  "./assets/weather-icons/squall.png",
  "./assets/weather-icons/cyclone.png",
  "./assets/weather-icons/dust.png",
  "./assets/weather-icons/DustRaisingWinds.png",
  "./assets/weather-icons/strongsurfacewind.png",
  "./assets/weather-icons/sea.png",
  /* Temperature legends */
  "./assets/temerature_legends/Summer/max scale.jpeg",
  "./assets/temerature_legends/Summer/min scale.jpeg",
  "./assets/temerature_legends/Winter/max scale.jpeg",
  "./assets/temerature_legends/Winter/min scale.jpeg",
];

const AUDIO_FILES = [
  "./assets/audio/thunderstorm.mp3",
  "./assets/audio/heavyrain.mp3",
  "./assets/audio/gustywind.mp3",
];

/* CDN libraries your project uses */
const CDN_LIBRARIES = [
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
];

/* All core files combined (install on first load) */
const CORE_FILES = [...HTML_PAGES, ...JS_FILES, ...CSS_FILES, ...DATA_FILES];

/* Asset files (install separately, non-blocking) */
const ALL_ASSETS = [...IMAGE_FILES, ...AUDIO_FILES];

/* ══════════════════════════════════════════════
   📦 INSTALL — Core files cache karo
   ══════════════════════════════════════════════ */
self.addEventListener("install", (event) => {
  console.log(`[SW ${VERSION}] Installing...`);

  event.waitUntil(
    (async () => {
      /* 1. Cache core files (HTML, JS, CSS, data) */
      const coreCache = await caches.open(CACHE_CORE);
      let cached = 0,
        failed = 0;

      for (const url of CORE_FILES) {
        try {
          await coreCache.add(url);
          cached++;
        } catch (err) {
          failed++;
          console.warn(`[SW] Skip (not found): ${url}`);
        }
      }
      console.log(`[SW] Core cache: ${cached} ok, ${failed} skipped`);

      /* 2. Cache CDN libraries */
      const cdnCache = await caches.open(CACHE_CDN);
      for (const url of CDN_LIBRARIES) {
        try {
          const res = await fetch(url, { mode: "cors" });
          if (res.ok) await cdnCache.put(url, res);
        } catch {
          console.warn(`[SW] CDN skip: ${url}`);
        }
      }

      /* 3. Cache assets in background (non-blocking) */
      caches.open(CACHE_ASSETS).then(async (assetCache) => {
        for (const url of ALL_ASSETS) {
          try {
            await assetCache.add(url);
          } catch {
            /* silent */
          }
        }
        console.log("[SW] Assets cached.");
      });

      await self.skipWaiting();
      console.log(`[SW ${VERSION}] Install complete.`);
    })(),
  );
});

/* ══════════════════════════════════════════════
   🧹 ACTIVATE — Purane caches delete karo
   ══════════════════════════════════════════════ */
self.addEventListener("activate", (event) => {
  console.log(`[SW ${VERSION}] Activating...`);
  event.waitUntil(
    (async () => {
      const validCaches = [CACHE_CORE, CACHE_ASSETS, CACHE_TILES, CACHE_CDN];
      const allKeys = await caches.keys();

      await Promise.all(
        allKeys
          .filter((key) => !validCaches.includes(key))
          .map((key) => {
            console.log(`[SW] Deleted old cache: ${key}`);
            return caches.delete(key);
          }),
      );

      await self.clients.claim();
      console.log(`[SW ${VERSION}] Active. All clients claimed.`);

      /* Notify all open tabs */
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) =>
        c.postMessage({ type: "SW_ACTIVATED", version: VERSION }),
      );
    })(),
  );
});

/* ══════════════════════════════════════════════
   🌐 FETCH — Smart caching per request type
   ══════════════════════════════════════════════ */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  /* Ignore non-GET and browser extensions */
  if (req.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;
  if (url.protocol === "moz-extension:") return;

  /* ── Map Tiles → Cache-First + 7-day expiry ── */
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("mt0.google.com") ||
    url.hostname.includes("mt1.google.com") ||
    url.hostname.includes("mt2.google.com") ||
    url.hostname.includes("mt3.google.com") ||
    url.hostname.includes("opentopomap.org") ||
    url.hostname.includes("stamen") ||
    url.pathname.match(/\/\d+\/\d+\/\d+\.(png|jpg)$/)
  ) {
    event.respondWith(tileCache(req));
    return;
  }

  /* ── CDN Libraries → Cache-First ── */
  if (
    url.hostname.includes("cdnjs.cloudflare.com") ||
    url.hostname.includes("unpkg.com") ||
    url.hostname.includes("jsdelivr.net") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(cacheFirst(req, CACHE_CDN));
    return;
  }

  /* ── Images & Audio → Cache-First ── */
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp3|wav|ogg)$/i)) {
    event.respondWith(cacheFirst(req, CACHE_ASSETS));
    return;
  }

  /* ── JS & CSS → Cache-First ── */
  if (url.pathname.match(/\.(js|css)$/i)) {
    event.respondWith(cacheFirst(req, CACHE_CORE));
    return;
  }

  /* ── GeoJSON / CSV / Data → Cache-First ── */
  if (url.pathname.match(/\.(geojson|json|csv|dotm)$/i)) {
    event.respondWith(cacheFirst(req, CACHE_CORE));
    return;
  }

  /* ── HTML Pages → Network-First ── */
  if (
    req.headers.get("accept")?.includes("text/html") ||
    url.pathname.match(/\.html?$/i) ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith(networkFirst(req, CACHE_CORE));
    return;
  }

  /* ── Default → Network-First ── */
  event.respondWith(networkFirst(req, CACHE_CORE));
});

/* ══════════════════════════════════════════════
   🔧 CACHE STRATEGY HELPERS
   ══════════════════════════════════════════════ */

/** Cache-First: cache se lo, nahi mila to network */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return fallback(request);
  }
}

/** Network-First: pehle network, fail ho to cache */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || fallback(request);
  }
}

/** Map tiles: 7-din cache with date header */
async function tileCache(request) {
  const cache = await caches.open(CACHE_TILES);
  const cached = await cache.match(request);

  if (cached) {
    const dateStr = cached.headers.get("x-sw-cache-date");
    if (dateStr) {
      const ageInDays = (Date.now() - new Date(dateStr)) / 86400000;
      if (ageInDays < 7) return cached;
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("x-sw-cache-date", new Date().toISOString());
      const tileResponse = new Response(await response.blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, tileResponse.clone());
      return tileResponse;
    }
    return response;
  } catch {
    return cached || new Response("Tile unavailable offline", { status: 503 });
  }
}

/** Fallback response */
async function fallback(request) {
  if (request.headers.get("accept")?.includes("text/html")) {
    const offlinePage = await caches.match("./offline.html");
    if (offlinePage) return offlinePage;
    return new Response(OFFLINE_PAGE_HTML, {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }
  if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#0a1628"/>
        <text x="50%" y="50%" fill="#90CAF9" font-size="14" text-anchor="middle" dy=".3em">Offline</text>
       </svg>`,
      { headers: { "Content-Type": "image/svg+xml" } },
    );
  }
  return new Response("Offline", { status: 503 });
}

/* ══════════════════════════════════════════════
   💬 MESSAGE HANDLER
   ══════════════════════════════════════════════ */
self.addEventListener("message", (event) => {
  const { type } = event.data || {};

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (type === "GET_VERSION") {
    event.source?.postMessage({ type: "VERSION", version: VERSION });
  }

  if (type === "CLEAR_TILES") {
    caches
      .delete(CACHE_TILES)
      .then(() => event.source?.postMessage({ type: "TILES_CLEARED" }));
  }

  if (type === "CACHE_STATUS") {
    getCacheStatus().then((status) =>
      event.source?.postMessage({ type: "CACHE_STATUS_RESULT", status }),
    );
  }
});

async function getCacheStatus() {
  const status = {};
  for (const name of [CACHE_CORE, CACHE_ASSETS, CACHE_TILES, CACHE_CDN]) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  return status;
}

/* ══════════════════════════════════════════════
   🔔 PUSH NOTIFICATIONS (future weather alerts)
   ══════════════════════════════════════════════ */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "⚠️ बिहार मौसम चेतावनी", {
      body:
        data.body ||
        "नई मौसम चेतावनी जारी की गई है। / New weather warning issued.",
      icon: "./assets/logo.png",
      badge: "./assets/logo.png",
      tag: "weather-alert",
      renotify: true,
      requireInteraction: data.priority === "red",
      vibrate: [300, 100, 300, 100, 300],
      data: { url: data.url || "./index.html" },
      actions: [
        { action: "view", title: "📋 देखें / View" },
        { action: "dismiss", title: "✕ बंद करें / Dismiss" },
      ],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action !== "dismiss") {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || "./index.html"),
    );
  }
});

/* ══════════════════════════════════════════════
   📄 INLINE OFFLINE PAGE (emergency fallback)
   ══════════════════════════════════════════════ */
const OFFLINE_PAGE_HTML = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — बिहार मौसम</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:sans-serif;background:#0a1628;color:#fff;
    display:flex;flex-direction:column;align-items:center;
    justify-content:center;min-height:100vh;text-align:center;padding:20px}
  .icon{font-size:72px;margin-bottom:20px;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  h1{color:#90CAF9;font-size:22px;margin-bottom:8px}
  p{opacity:.75;font-size:14px;margin:4px 0;line-height:1.6}
  .card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);
    border-radius:14px;padding:20px 28px;margin:20px 0;max-width:380px;width:100%;text-align:left}
  .card h3{color:#64B5F6;font-size:14px;margin-bottom:10px}
  .card li{font-size:13px;opacity:.8;margin:5px 0;list-style:none}
  .card li::before{content:"✓  ";color:#81C784}
  button{margin-top:20px;padding:13px 30px;background:linear-gradient(135deg,#1565C0,#1976D2);
    color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer}
</style>
</head>
<body>
  <div class="icon">🌩️</div>
  <h1>आप ऑफलाइन हैं / You are Offline</h1>
  <p>इंटरनेट कनेक्शन नहीं है।</p>
  <p>No internet connection detected.</p>
  <div class="card">
    <h3>✅ ऑफलाइन में भी उपलब्ध:</h3>
    <ul>
      <li>7-दिन Forecast Entry</li>
      <li>District Selection & Warning Table</li>
      <li>Bulletin Generator</li>
      <li>Offline Export / Import</li>
      <li>पहले से सहेजा गया डेटा</li>
    </ul>
  </div>
  <button onclick="location.reload()">🔄 पुनः प्रयास / Retry</button>
  <script>
    window.addEventListener('online',()=>{
      location.href='./index.html';
    });
  </script>
</body>
</html>`;

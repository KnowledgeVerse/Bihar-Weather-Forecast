/**
 * ================================================================
 *  बिहार मौसम PWA — Registration & Install Script
 *  Bihar Weather Forecast System
 *
 *  इस file को अपने SABHI HTML pages ke </body> se pehle add karo:
 *  <script src="pwa-register.js"></script>
 *
 *  Author : Lal Kamal
 *  Repo   : github.com/KnowledgeVerse/Bihar-Weather-Forecast
 * ================================================================
 */

(function () {
  "use strict";

  /* ── Base path detection (works on localhost AND GitHub Pages) ── */
  const BASE = (() => {
    const p = location.pathname;
    // GitHub Pages: /Bihar-Weather-Forecast/...
    // localhost:    /...
    const match = p.match(/^(\/[^/]+\/)/);
    if (
      match &&
      !p.startsWith("/index") &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      return match[1];
    }
    return "/";
  })();

  if (location.protocol === "file:") {
    console.error(
      "❌ [PWA Error]: Install Banner will NEVER show on 'file://' protocol. Please use VS Code Live Server (http://127.0.0.1:5500).",
    );
  }

  /* ── 1. Register Service Worker ── */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const swPath = BASE + "sw.js";
        const reg = await navigator.serviceWorker.register(swPath, {
          scope: BASE,
        });

        console.log("[PWA] SW registered. Scope:", reg.scope);

        /* Auto-check updates every 30 min */
        setInterval(() => reg.update(), 30 * 60 * 1000);

        /* Update found → show banner */
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdateBanner(reg);
            }
          });
        });

        /* Messages from SW */
        navigator.serviceWorker.addEventListener("message", ({ data }) => {
          if (!data) return;
          if (data.type === "SW_ACTIVATED") {
            console.log("[PWA] SW activated, version:", data.version);
          }
          if (data.type === "CACHE_STATUS_RESULT") {
            console.table(data.status);
          }
        });

        /* Expose helpers globally */
        window.PWA = {
          install: async () => {
            if (!deferredPrompt) {
              alert(
                "⚠️ Install option is not ready!\n\nReasons:\n1. App is already installed.\n2. You are using 'file://' instead of Live Server (HTTPS/Localhost).\n3. Browser doesn't support PWA.",
              );
              return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log("[PWA] Manual Install User Choice:", outcome);
            deferredPrompt = null;
            hideInstallBanner();
          },
          version: () => {
            navigator.serviceWorker.controller?.postMessage({
              type: "GET_VERSION",
            });
          },
          cacheStatus: () => {
            navigator.serviceWorker.controller?.postMessage({
              type: "CACHE_STATUS",
            });
          },
          clearTiles: () => {
            navigator.serviceWorker.controller?.postMessage({
              type: "CLEAR_TILES",
            });
            showToast("🗺️ Map tile cache cleared!");
          },
          update: () =>
            reg.update().then(() => showToast("🔄 Update check complete")),
        };
      } catch (err) {
        console.error("[PWA] SW registration failed:", err);
      }
    });
  }

  /* ── 2. Install Prompt (Add to Home Screen / Desktop) ── */
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    console.log(
      "✅ [PWA] 'beforeinstallprompt' event fired! App is ready to install.",
    );
    e.preventDefault();
    deferredPrompt = e;

    /* Show the permanent install button if it exists */
    const manualBtn = document.getElementById("manualInstallBtn");
    if (manualBtn) manualBtn.style.display = "block";

    /* Don't show if dismissed in last 3 days */
    const dismissed = localStorage.getItem("pwa-dismissed-at");
    // if (dismissed) {
    //   const days = (Date.now() - parseInt(dismissed)) / 86400000;
    //   if (days < 3) return;
    // }

    showInstallBanner();
  });

  window.addEventListener("appinstalled", () => {
    hideInstallBanner();

    const manualBtn = document.getElementById("manualInstallBtn");
    if (manualBtn) manualBtn.style.display = "none";

    showToast(
      "✅ बिहार मौसम App Install हो गया! / App Installed!",
      4000,
      "#2e7d32",
    );
    deferredPrompt = null;
    localStorage.removeItem("pwa-dismissed-at");
  });

  /* ── 3. Online / Offline Detection ── */
  window.addEventListener("online", () => {
    showToast("🌐 इंटरनेट आ गया! / Back Online", 3000, "#1565C0");
    document.body.classList.remove("pwa-offline");
  });

  window.addEventListener("offline", () => {
    showToast(
      "📴 ऑफलाइन मोड / Offline Mode — Cached data available",
      5000,
      "#e65100",
    );
    document.body.classList.add("pwa-offline");
  });

  /* Show offline indicator on load if already offline */
  if (!navigator.onLine) {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.classList.add("pwa-offline");
    });
  }

  /* ── 4. Install Banner UI ── */
  function showInstallBanner() {
    if (document.getElementById("pwa-install-banner")) return;

    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.innerHTML = `
      <style>
        #pwa-install-banner {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #0d47a1 0%, #1565C0 100%);
          color: #fff;
          padding: 14px 18px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(21,101,192,0.4);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 999999;
          max-width: 400px;
          width: calc(100% - 32px);
          font-family: 'Segoe UI', sans-serif;
          animation: pwa-slide-up 0.4s cubic-bezier(.34,1.56,.64,1) both;
          border: 1px solid rgba(255,255,255,0.15);
        }
        @keyframes pwa-slide-up {
          from { opacity:0; transform:translateX(-50%) translateY(40px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        #pwa-install-banner .pwa-emoji { font-size: 30px; flex-shrink: 0; }
        #pwa-install-banner .pwa-info  { flex: 1; min-width: 0; }
        #pwa-install-banner .pwa-info strong {
          display: block; font-size: 13px; font-weight: 700; margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        #pwa-install-banner .pwa-info span {
          font-size: 11px; opacity: 0.82; display: block;
        }
        #pwa-install-banner .pwa-actions { display: flex; gap: 8px; flex-shrink: 0; }
        #pwa-do-install {
          background: #fff; color: #0d47a1;
          border: none; padding: 8px 16px; border-radius: 8px;
          font-weight: 700; font-size: 13px; cursor: pointer;
          white-space: nowrap;
          transition: background .15s;
        }
        #pwa-do-install:hover { background: #e3f2fd; }
        #pwa-do-dismiss {
          background: transparent; color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.25); padding: 8px 10px;
          border-radius: 8px; font-size: 14px; cursor: pointer; line-height: 1;
          transition: background .15s;
        }
        #pwa-do-dismiss:hover { background: rgba(255,255,255,0.1); }
      </style>
      <div class="pwa-emoji">🌩️</div>
      <div class="pwa-info">
        <strong>बिहार मौसम — Install करें</strong>
        <span>Desktop/Mobile App की तरह Offline use करें!</span>
      </div>
      <div class="pwa-actions">
        <button id="pwa-do-install">📲 Install</button>
        <button id="pwa-do-dismiss">✕</button>
      </div>
    `;
    document.body.appendChild(banner);

    document
      .getElementById("pwa-do-install")
      .addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA] User:", outcome);
        deferredPrompt = null;
        hideInstallBanner();
      });

    document.getElementById("pwa-do-dismiss").addEventListener("click", () => {
      localStorage.setItem("pwa-dismissed-at", Date.now());
      hideInstallBanner();
    });
  }

  function hideInstallBanner() {
    const el = document.getElementById("pwa-install-banner");
    if (!el) return;
    el.style.transition = "opacity 0.3s, transform 0.3s";
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(20px)";
    setTimeout(() => el.remove(), 320);
  }

  /* ── 5. Update Banner ── */
  function showUpdateBanner(reg) {
    if (document.getElementById("pwa-update-bar")) return;

    const bar = document.createElement("div");
    bar.id = "pwa-update-bar";
    bar.innerHTML = `
      <style>
        #pwa-update-bar {
          position: fixed; top: 0; left: 0; right: 0;
          background: linear-gradient(90deg, #1b5e20, #2e7d32);
          color: #fff; padding: 10px 16px;
          display: flex; align-items: center; justify-content: space-between;
          z-index: 999999; font-family: 'Segoe UI', sans-serif;
          font-size: 13px; gap: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        #pwa-update-bar span { flex:1 }
        #pwa-update-now {
          background:#fff; color:#1b5e20; border:none;
          padding:6px 14px; border-radius:6px;
          font-weight:700; font-size:12px; cursor:pointer;
          white-space:nowrap;
        }
        #pwa-update-skip {
          background:transparent; color:rgba(255,255,255,0.65);
          border:none; font-size:18px; cursor:pointer; padding:0 4px;
        }
      </style>
      <span>🔄 नया Update उपलब्ध है! / New update available</span>
      <button id="pwa-update-now">अभी Update करें</button>
      <button id="pwa-update-skip">✕</button>
    `;
    document.body.prepend(bar);

    document.getElementById("pwa-update-now").addEventListener("click", () => {
      reg.waiting?.postMessage({ type: "SKIP_WAITING" });
      location.reload();
    });
    document
      .getElementById("pwa-update-skip")
      .addEventListener("click", () => bar.remove());
  }

  /* ── 6. Toast Notification ── */
  function showToast(msg, duration = 3200, bg = "#1565C0") {
    const old = document.getElementById("pwa-toast");
    if (old) old.remove();

    const t = document.createElement("div");
    t.id = "pwa-toast";
    Object.assign(t.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      background: bg,
      color: "#fff",
      padding: "10px 18px",
      borderRadius: "10px",
      fontFamily: "'Segoe UI', sans-serif",
      fontSize: "13px",
      zIndex: "999998",
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
      maxWidth: "320px",
      lineHeight: "1.5",
      animation: "pwa-toast-in .3s ease both",
    });

    /* Inject toast keyframes once */
    if (!document.getElementById("pwa-toast-style")) {
      const s = document.createElement("style");
      s.id = "pwa-toast-style";
      s.textContent = `@keyframes pwa-toast-in{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}`;
      document.head.appendChild(s);
    }

    t.textContent = msg;
    document.body.appendChild(t);

    setTimeout(() => {
      t.style.transition = "opacity 0.4s, transform 0.4s";
      t.style.opacity = "0";
      t.style.transform = "translateY(-10px)";
      setTimeout(() => t.remove(), 420);
    }, duration);
  }
})();

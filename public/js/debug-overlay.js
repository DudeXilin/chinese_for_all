/* Diagnostic overlay - temporary tool to see what actually happens on
   a device where something silently fails (no console access needed).
   Loads as early as possible (before hydration) so it can catch even
   script-loading/hydration errors. Adds a small floating "bug" button;
   tapping it shows a full-screen log with a "Copy" button. Not part of
   the product UI - safe to delete once debugging is done. */

(function () {
  "use strict";
  if (window.__cfaDebugInstalled) return;
  window.__cfaDebugInstalled = true;

  var STORAGE_KEY = "cfa-debug-log";
  var MAX = 300;
  var log = [];

  try {
    var saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) log = JSON.parse(saved);
  } catch {
    log = [];
  }

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch {
      /* ignore (e.g. private mode storage limits) */
    }
  }

  function push(entry) {
    entry.t = new Date().toISOString().slice(11, 23);
    entry.page = location.pathname;
    log.push(entry);
    if (log.length > MAX) log.shift();
    save();
    render();
  }

  push({ type: "info", message: "debug started", ua: navigator.userAgent, url: location.href });

  window.addEventListener(
    "error",
    function (e) {
      push({
        type: "error",
        message: e.message || String(e.error || e),
        source: e.filename,
        line: e.lineno,
        col: e.colno,
        stack: e.error && e.error.stack,
      });
    },
    true
  );

  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    push({
      type: "unhandledrejection",
      message: (reason && (reason.message || String(reason))) || "unknown",
      stack: reason && reason.stack,
    });
  });

  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function () {
      var args = arguments;
      var url = args[0] && (args[0].url || args[0]);
      var method = (args[1] && args[1].method) || "GET";
      var start = Date.now();
      push({ type: "fetch-start", url: String(url), method: method });
      return originalFetch.apply(this, args).then(
        function (res) {
          push({
            type: "fetch-done",
            url: String(url),
            status: res.status,
            ok: res.ok,
            ms: Date.now() - start,
          });
          return res;
        },
        function (err) {
          push({
            type: "fetch-error",
            url: String(url),
            message: err && err.message,
            ms: Date.now() - start,
          });
          throw err;
        }
      );
    };
  }

  var overlay, listEl, button;

  function buildText() {
    var lines = [
      "Chinese For All - debug log",
      "URL: " + location.href,
      "UA: " + navigator.userAgent,
      "Time: " + new Date().toISOString(),
      "",
    ];
    log.forEach(function (e) {
      lines.push(JSON.stringify(e));
    });
    return lines.join("\n");
  }

  function render() {
    if (!listEl) return;
    listEl.textContent = buildText();
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function ensureUI() {
    if (button || !document.body) return;

    button = document.createElement("button");
    button.textContent = "\uD83D\uDC1E";
    button.setAttribute("aria-label", "Debug");
    button.style.cssText =
      "position:fixed;bottom:14px;left:14px;z-index:2147483647;" +
      "width:44px;height:44px;border-radius:50%;border:1px solid #999;" +
      "background:#222;color:#fff;font-size:20px;line-height:1;" +
      "box-shadow:0 2px 10px rgba(0,0,0,.4);";
    button.addEventListener("click", function () {
      overlay.style.display = "flex";
      render();
    });
    document.body.appendChild(button);

    overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:none;" +
      "flex-direction:column;background:rgba(10,10,10,.97);color:#0f0;" +
      "font-family:monospace;font-size:12px;padding:12px;box-sizing:border-box;";

    var header = document.createElement("div");
    header.style.cssText = "display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;";

    var copyBtn = document.createElement("button");
    copyBtn.textContent = "Скопировать";
    copyBtn.style.cssText =
      "padding:10px 14px;border-radius:8px;border:none;background:#0a5;color:#fff;font-size:14px;";
    copyBtn.addEventListener("click", function () {
      copyToClipboard(buildText());
      copyBtn.textContent = "Скопировано!";
      setTimeout(function () {
        copyBtn.textContent = "Скопировать";
      }, 1500);
    });

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Закрыть";
    closeBtn.style.cssText =
      "padding:10px 14px;border-radius:8px;border:none;background:#555;color:#fff;font-size:14px;";
    closeBtn.addEventListener("click", function () {
      overlay.style.display = "none";
    });

    var clearBtn = document.createElement("button");
    clearBtn.textContent = "Очистить";
    clearBtn.style.cssText =
      "padding:10px 14px;border-radius:8px;border:none;background:#a33;color:#fff;font-size:14px;";
    clearBtn.addEventListener("click", function () {
      log = [];
      save();
      render();
    });

    header.appendChild(copyBtn);
    header.appendChild(clearBtn);
    header.appendChild(closeBtn);
    overlay.appendChild(header);

    listEl = document.createElement("pre");
    listEl.style.cssText = "flex:1;overflow:auto;white-space:pre-wrap;word-break:break-word;margin:0;";
    overlay.appendChild(listEl);

    document.body.appendChild(overlay);
    render();
  }

  if (document.body) {
    ensureUI();
  } else {
    document.addEventListener("DOMContentLoaded", ensureUI);
  }

  // Other scripts (e.g. the login form) can log their own milestones:
  // window.__cfaDebugLogEvent("login-start", { email: "..." })
  window.__cfaDebugLogEvent = function (type, data) {
    push(Object.assign({ type: type }, data || {}));
  };
})();

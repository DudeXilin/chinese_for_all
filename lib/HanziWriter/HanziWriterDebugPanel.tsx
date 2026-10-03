"use client";

import { useEffect, useState } from "react";
import { clearHanziLogs, getHanziLogs, subscribeHanziLogs } from "./debugLog";

// Drop <HanziWriterDebugPanel /> anywhere once (e.g. in CardsExerciserClient).
// It renders a small floating button; opening it shows every log line any
// HanziWriterDrawing instance has written, with a one-tap copy button so it
// can be pasted straight into chat.
export default function HanziWriterDebugPanel() {
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeHanziLogs(() => bump((n) => n + 1)), []);

  const logs = getHanziLogs();
  const text = logs.join("\n");

  function copy() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
        .catch(() => {});
    }
  }

  return (
    <div className="fixed bottom-3 right-3 z-[999] font-mono">
      {open ? (
        <div className="flex w-[min(94vw,480px)] flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0a09]/97 p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/60">Hanzi Writer debug · {logs.length}</span>
            <div className="flex gap-1.5">
              <button
                onClick={copy}
                className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                {copied ? "Скопировано ✓" : "Копировать"}
              </button>
              <button
                onClick={() => clearHanziLogs()}
                className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                Очистить
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={text || "Пока пусто — откройте карточку с иероглифом."}
            onFocus={(e) => e.currentTarget.select()}
            className="h-72 w-full resize-none rounded-xl border border-white/10 bg-black/70 p-2 text-[10px] leading-tight text-lime-300/90"
          />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/20 bg-[#0a0a09]/95 px-3 py-2 text-xs text-white/80 shadow-xl"
        >
          🐞 Hanzi debug{logs.length > 0 ? ` (${logs.length})` : ""}
        </button>
      )}
    </div>
  );
}

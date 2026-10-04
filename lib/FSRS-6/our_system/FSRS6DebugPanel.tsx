"use client";

import { useEffect, useState } from "react";
import { clearFSRSLogs, getFSRSLogs, subscribeFSRSLogs } from "./debugLog";

export default function FSRS6DebugPanel({ visible = true }: { visible?: boolean }) {
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeFSRSLogs(() => bump((n) => n + 1)), []);

  const logs = getFSRSLogs();
  const text = logs.join("\n");

  function copy() {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <div className={`fixed bottom-3 left-3 z-[999] font-mono ${visible ? "" : "hidden"}`}>
      {open ? (
        <div className="flex w-[min(94vw,520px)] flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0a09]/97 p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/60">FSRS-6 debug · {logs.length}</span>
            <div className="flex gap-1.5">
              <button onClick={copy} className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10">
                {copied ? "Скопировано ✓" : "Копировать"}
              </button>
              <button onClick={() => clearFSRSLogs()} className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10">
                Очистить
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10">
                ✕
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={text || "Пока пусто — нажмите одну из оценок FSRS-6 после ответа."}
            onFocus={(e) => e.currentTarget.select()}
            className="h-80 w-full resize-none rounded-xl border border-white/10 bg-black/70 p-2 text-[10px] leading-tight text-cyan-200/90"
          />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/20 bg-[#0a0a09]/95 px-3 py-2 text-xs text-white/80 shadow-xl"
        >
          🐞 FSRS-6{logs.length > 0 ? ` (\${logs.length})` : ""}
        </button>
      )}
    </div>
  );
}

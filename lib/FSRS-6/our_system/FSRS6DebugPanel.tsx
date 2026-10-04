"use client";

import { useEffect, useState } from "react";
import { clearFSRSLogs, getFSRSLogs, subscribeFSRSLogs } from "./debugLog";

function formatLog(line: string): string {
  const separator = line.indexOf(" {");
  if (separator === -1) return line;

  const prefix = line.slice(0, separator + 1);
  const json = line.slice(separator + 1);

  try {
    return `${prefix}${JSON.stringify(JSON.parse(json), null, 2)}`;
  } catch {
    return line;
  }
}

export default function FSRS6DebugPanel({ visible = true }: { visible?: boolean }) {
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeFSRSLogs(() => bump((n) => n + 1)), []);

  const logs = getFSRSLogs();
  const text = logs.map(formatLog).join("\n\n");

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
        <div className="flex w-[min(94vw,620px)] flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0a09]/97 p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-white/70">FSRS-6 debug · {logs.length}</div>
              <div className="mt-0.5 text-[9px] leading-tight text-white/35">
                1 слово = 1 FSRS-карточка · оценка учитывает весь ответ целиком
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
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

          <div className="flex gap-2 text-[9px] text-white/35">
            <span>BEFORE = состояние + все 4 варианта</span>
            <span>•</span>
            <span>RESULT = выбранная оценка + новое состояние</span>
          </div>

          <textarea
            readOnly
            value={text || "Пока пусто — нажмите одну из оценок FSRS-6 после ответа."}
            onFocus={(e) => e.currentTarget.select()}
            className="h-[min(70vh,520px)] w-full resize-none rounded-xl border border-white/10 bg-black/70 p-3 text-[10px] leading-relaxed text-cyan-200/90"
          />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/20 bg-[#0a0a09]/95 px-3 py-2 text-xs text-white/80 shadow-xl"
        >
          🐞 FSRS-6{logs.length > 0 ? ` (${logs.length})` : ""}
        </button>
      )}
    </div>
  );
}

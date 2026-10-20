"use client";

import { useEffect, useState } from "react";
import WorkingTableCard from "./WorkingTableCard";

export default function WorkingTablePage() {
  const [debugVisible, setDebugVisible] = useState(false);

  useEffect(() => {
    const syncDebugTools = () => {
      const setter = (window as Window & { __cfaSetDebugToolsVisible?: (visible: boolean) => void }).__cfaSetDebugToolsVisible;
      setter?.(debugVisible);
    };
    syncDebugTools();
    return () => {
      const setter = (window as Window & { __cfaSetDebugToolsVisible?: (visible: boolean) => void }).__cfaSetDebugToolsVisible;
      setter?.(true);
    };
  }, [debugVisible]);

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#090909] text-white">
      <div className="fixed left-4 top-4 z-30 flex flex-col gap-2">
        <a
          href="/"
          aria-label="Вернуться в главное меню"
          title="Главное меню"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-2xl text-white/85 shadow-lg backdrop-blur-xl transition hover:bg-white/[0.13]"
        >
          <span aria-hidden="true">‹</span>
        </a>
        <button
          type="button"
          aria-label={debugVisible ? "Скрыть debug-tools" : "Показать debug-tools"}
          aria-pressed={debugVisible}
          title="Debug-tools"
          onClick={() => setDebugVisible((visible) => !visible)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl shadow-lg backdrop-blur-xl transition ${debugVisible ? "border-white/30 bg-white/15" : "border-white/15 bg-white/[0.07] hover:bg-white/[0.13]"}`}
        >
          🐞
        </button>
      </div>

      <a
        href="/profile"
        aria-label="Профиль"
        title="Профиль"
        className="fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.09] text-white/90 shadow-lg backdrop-blur-2xl transition hover:bg-white/[0.16]"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z" />
        </svg>
      </a>

      <WorkingTableCard />

    </main>
  );
}

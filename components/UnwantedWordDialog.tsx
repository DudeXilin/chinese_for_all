"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type UnwantedWordDialogProps = {
  word: string;
  translation: string;
  busy: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
};

export default function UnwantedWordDialog({ word, translation, busy, error, onCancel, onConfirm, children }: UnwantedWordDialogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    setCanConfirm(false);
    const element = scrollRef.current;
    if (element && element.scrollHeight <= element.clientHeight + 12) setCanConfirm(true);
  }, [word, children]);

  function handleScroll() {
    const element = scrollRef.current;
    if (element && element.scrollTop + element.clientHeight >= element.scrollHeight - 12) setCanConfirm(true);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-md sm:px-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="unwanted-title" className="relative flex max-h-[min(90dvh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#171717]/[0.98] text-white/85 shadow-2xl shadow-black/60" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-rose-200/15 bg-rose-200/[0.055] text-4xl font-medium text-white sm:h-20 sm:w-20 sm:text-5xl">{word}</div>
          <div className="min-w-0 flex-1">
            <h2 id="unwanted-title" className="text-lg font-semibold text-white">Точно отказаться от слова?</h2>
            <p className="mt-1 text-sm leading-5 text-white/55">{translation || "Перевод не найден"}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full border border-white/10 bg-white/[0.05] text-xl text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-40" aria-label="Закрыть">×</button>
        </header>
        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {children}
          <p className="mt-4 border-t border-white/[0.08] pt-4 text-xs leading-5 text-white/35">После отказа слово исчезнет из новых карточек и примеров предложений. Его можно будет вернуть из коллекции.</p>
          {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-3 py-2 text-sm text-rose-100/80">{error}</p>}
        </div>
        <footer className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-7">
          <button type="button" onClick={onConfirm} disabled={!canConfirm || busy} className="w-full rounded-2xl border border-rose-200/20 bg-rose-200/[0.10] px-5 py-3.5 text-sm font-semibold text-rose-50 transition hover:bg-rose-200/[0.16] disabled:cursor-not-allowed disabled:opacity-35">{busy ? "Сохраняем…" : canConfirm ? "Отказаться от слова" : "Пролистайте окно до конца"}</button>
        </footer>
      </section>
    </div>
  );
}

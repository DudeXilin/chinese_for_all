"use client";

import { useEffect, useMemo, useState } from "react";
import { getPinyins, getRussianTranslations, getSingleCharacterPinyins, getSingleCharacterRussianTranslations } from "@/lib/ru_en_chi_dictionary";
import WorkingTableCard from "./WorkingTableCard";

type CollectionCard = { word: string; scheduled_days: number; due: string; stability: number; reps: number; unwanted?: boolean };

export default function WorkingTablePage() {
  const [debugVisible, setDebugVisible] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [showEasy, setShowEasy] = useState(true);
  const [showHard, setShowHard] = useState(true);
  const [showUnwanted, setShowUnwanted] = useState(false);
  const [unwantedWords, setUnwantedWords] = useState<string[]>([]);
  const [collectionTrashMode, setCollectionTrashMode] = useState(false);
  const [pendingUnwantedWord, setPendingUnwantedWord] = useState<string | null>(null);
  const [unwantedActionBusy, setUnwantedActionBusy] = useState(false);

  async function openCollection() {
    setCollectionTrashMode(false);
    setPendingUnwantedWord(null);
    setCollectionOpen(true);
    setCollectionLoading(true);
    setCollectionError(null);
    try {
      const [response, unwantedResponse] = await Promise.all([
        fetch("/api/fsrs/cards", { cache: "no-store" }),
        fetch("/api/words/unwanted", { cache: "no-store" }),
      ]);
      const payload = await response.json();
      const unwantedPayload = await unwantedResponse.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось загрузить коллекцию.");
      if (!unwantedResponse.ok) throw new Error(unwantedPayload.error || "Не удалось загрузить ненужные слова.");
      const unwanted = Array.isArray(unwantedPayload.words) ? unwantedPayload.words.filter((word: unknown): word is string => typeof word === "string") : [];
      setUnwantedWords(unwanted);
      const cards: CollectionCard[] = Array.isArray(payload.cards) ? payload.cards.filter((card: unknown): card is CollectionCard => {
        if (!card || typeof card !== "object") return false;
        const item = card as Partial<CollectionCard>;
        return typeof item.word === "string" && typeof item.scheduled_days === "number";
      }) : [];
      const byWord = new Map(cards.map((card) => [card.word, { ...card, unwanted: unwanted.includes(card.word) }]));
      for (const word of unwanted) {
        if (!byWord.has(word)) byWord.set(word, { word, scheduled_days: 0, due: "", stability: 0, reps: 0, unwanted: true });
      }
      setCollectionCards([...byWord.values()]);
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "Не удалось загрузить коллекцию.");
    } finally {
      setCollectionLoading(false);
    }
  }

  async function confirmCollectionUnwantedWord() {
    if (!pendingUnwantedWord || unwantedActionBusy) return;
    setUnwantedActionBusy(true);
    setCollectionError(null);
    try {
      const response = await fetch("/api/words/unwanted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ word: pendingUnwantedWord, action: "exclude" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось отметить слово ненужным.");
      const words = Array.isArray(payload.words) ? payload.words.filter((word: unknown): word is string => typeof word === "string") : [];
      setUnwantedWords(words);
      setCollectionCards((items) => {
        const exists = items.some((item) => item.word === pendingUnwantedWord);
        const updated = items.map((item) => item.word === pendingUnwantedWord ? { ...item, unwanted: true, scheduled_days: 0 } : item);
        return exists ? updated : [...updated, { word: pendingUnwantedWord, scheduled_days: 0, due: "", stability: 0, reps: 0, unwanted: true }];
      });
      setShowUnwanted(true);
      setPendingUnwantedWord(null);
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "Не удалось отметить слово ненужным.");
    } finally {
      setUnwantedActionBusy(false);
    }
  }

  const filteredCollection = useMemo(() => collectionCards.filter((card) => {
    if (card.unwanted) return showUnwanted;
    const hard = card.scheduled_days < 30;
    return hard ? showHard : showEasy;
  }).sort((a, b) => Number(Boolean(b.unwanted)) - Number(Boolean(a.unwanted)) || a.scheduled_days - b.scheduled_days || a.word.localeCompare(b.word, "zh-Hans")), [collectionCards, showEasy, showHard, showUnwanted]);
  const collectionTranslations = useMemo(() => ({ ...getSingleCharacterRussianTranslations(), ...getRussianTranslations(collectionCards.map((card) => card.word)) }), [collectionCards]);
  const collectionPinyins = useMemo(() => ({ ...getSingleCharacterPinyins(), ...getPinyins(collectionCards.map((card) => card.word)) }), [collectionCards]);

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

      <button
        type="button"
        onClick={openCollection}
        aria-label="Открыть личную коллекцию"
        title="Коллекция"
        className="fixed right-4 top-20 z-30 flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 text-sm text-white/85 shadow-lg backdrop-blur-2xl transition hover:bg-white/[0.15]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" /><path d="M4 6v16M8 7h8M8 11h8" /></svg>
        <span>Коллекция</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">{collectionCards.length}</span>
      </button>

      <WorkingTableCard />

      <a
        href="/cards_exerciser?mode=hard"
        className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-white/[0.11] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition hover:border-white/30 hover:bg-white/[0.17] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:bottom-7 sm:px-8 sm:py-3.5"
      >
        Решать карточки
      </a>

      {pendingUnwantedWord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !unwantedActionBusy) setPendingUnwantedWord(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="collection-unwanted-title" className="w-full max-w-md rounded-[28px] border border-white/15 bg-[#171717]/[0.98] p-6 text-white shadow-2xl sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-rose-200/15 bg-rose-200/[0.07] text-4xl">{pendingUnwantedWord}</div>
              <div className="min-w-0 pt-1">
                <h2 id="collection-unwanted-title" className="text-lg font-semibold">Точно отказаться от слова?</h2>
                <p className="mt-2 text-sm text-white/65">{collectionTranslations[pendingUnwantedWord] || "Перевод не найден"}</p>
                <p className="mt-3 text-sm leading-6 text-white/45">Слово перестанет появляться в новых карточках и предложениях. Его можно будет вернуть из фильтра «Ненужные слова».</p>
              </div>
            </div>
            {collectionError && <p role="alert" className="mt-4 rounded-xl border border-rose-200/15 bg-rose-200/[0.06] px-3 py-2 text-sm text-rose-100/80">{collectionError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={unwantedActionBusy} onClick={() => { setPendingUnwantedWord(null); setCollectionError(null); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.09] disabled:opacity-40">Оставить слово</button>
              <button type="button" disabled={unwantedActionBusy} onClick={() => void confirmCollectionUnwantedWord()} className="rounded-xl border border-rose-200/20 bg-rose-200/[0.10] px-4 py-3 text-sm font-semibold text-rose-50 transition hover:bg-rose-200/[0.17] disabled:opacity-40">{unwantedActionBusy ? "Сохраняем…" : "Отказаться от слова"}</button>
            </div>
          </section>
        </div>
      )}

      {collectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-8" role="dialog" aria-modal="true" aria-label="Личная коллекция слов" onMouseDown={(event) => { if (event.target === event.currentTarget) setCollectionOpen(false); }}>
          <section className="relative flex max-h-[88svh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#151515]/95 text-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div><h2 className="text-xl font-semibold">Коллекция</h2><p className="mt-1 text-sm text-white/45">Слова, добавленные в вашу систему FSRS</p></div>
              <button type="button" onClick={() => setCollectionOpen(false)} aria-label="Закрыть коллекцию" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl text-white/65 hover:bg-white/[0.12]">×</button>
            </header>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/10 px-5 py-3 text-sm sm:px-7">
              <button type="button" onClick={() => setCollectionTrashMode((active) => !active)} aria-pressed={collectionTrashMode} title={collectionTrashMode ? "Выключить выбор ненужных слов" : "Включить выбор ненужных слов"} className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition ${collectionTrashMode ? "border-rose-200/40 bg-rose-200/[0.16] text-rose-100 shadow-[0_0_0_1px_rgba(253,164,175,0.08)]" : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.10] hover:text-white/85"}`}><span role="img" aria-label="Корзина">🗑️</span></button>
              {collectionTrashMode && <span className="text-xs text-rose-100/75">Режим выбора: нажмите на слово</span>}
              <label className="flex cursor-pointer items-center gap-2 text-white/75"><input type="checkbox" checked={showEasy} onChange={(event) => setShowEasy(event.target.checked)} className="h-4 w-4 accent-white" />Лёгкие слова <span className="text-white/35">≥ 30 дней</span></label>
              <label className="flex cursor-pointer items-center gap-2 text-white/75"><input type="checkbox" checked={showHard} onChange={(event) => setShowHard(event.target.checked)} className="h-4 w-4 accent-white" />Сложные слова <span className="text-white/35">меньше 30 дней</span></label>
              <label className="flex cursor-pointer items-center gap-2 text-white/75"><input type="checkbox" checked={showUnwanted} onChange={(event) => setShowUnwanted(event.target.checked)} className="h-4 w-4 accent-white" />Ненужные слова <span className="text-white/35">{unwantedWords.length}</span></label>
            </div>
            <div className="min-h-40 flex-1 overflow-y-auto px-5 py-3 sm:px-7">
              {collectionLoading ? <p className="py-10 text-center text-sm text-white/45">Загрузка коллекции…</p> : collectionError ? <p className="py-10 text-center text-sm text-red-200">{collectionError}</p> : filteredCollection.length === 0 ? <p className="py-10 text-center text-sm text-white/45">{collectionCards.length === 0 ? "Коллекция пока пуста. Откройте первую карточку на рабочем столе." : "Нет слов, соответствующих выбранным фильтрам."}</p> : (
                <ul className="divide-y divide-white/[0.07]">
                  {filteredCollection.map((card) => {
                    const hard = card.scheduled_days < 30;
                    return <li key={card.word} className="flex items-center gap-3 py-3"><button type="button" onClick={() => { if (collectionTrashMode && !card.unwanted) setPendingUnwantedWord(card.word); }} disabled={!collectionTrashMode || Boolean(card.unwanted)} aria-label={collectionTrashMode && !card.unwanted ? `Отказаться от слова ${card.word}` : card.word} title={collectionTrashMode && !card.unwanted ? "Отметить слово как ненужное" : undefined} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl transition ${collectionTrashMode && !card.unwanted ? "cursor-pointer border-rose-200/25 bg-rose-200/[0.07] hover:border-rose-200/50 hover:bg-rose-200/[0.15]" : "cursor-default border-white/10 bg-white/[0.04]"} disabled:opacity-65`}>{card.word}</button><div className="min-w-0 flex-1"><div className="truncate text-sm text-white/85">{collectionTranslations[card.word] || "Перевод не найден"}</div><div className="mt-1 text-xs text-white/40">{collectionPinyins[card.word] || ""}</div></div><div className="flex shrink-0 flex-col items-end gap-1"><span className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${card.unwanted ? "border-rose-300/20 bg-rose-300/[0.07] text-rose-100/75" : hard ? "border-amber-300/20 bg-amber-300/[0.07] text-amber-100/75" : "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100/75"}`}>{card.unwanted ? "Ненужное" : hard ? "Сложное" : "Лёгкое"}</span>{card.unwanted ? <button type="button" onClick={async () => { try { const response = await fetch("/api/words/unwanted", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ word: card.word, action: "restore" }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Не удалось вернуть слово."); setUnwantedWords(Array.isArray(payload.words) ? payload.words : []); setCollectionCards((items) => items.map((item) => item.word === card.word ? { ...item, unwanted: false } : item)); } catch (error) { setCollectionError(error instanceof Error ? error.message : "Не удалось вернуть слово."); } }} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-white/75 transition hover:bg-white/[0.12]">Вернуть</button> : <div className="text-[10px] text-white/35">{Math.max(0, Math.round(card.scheduled_days))} дн.</div>}</div></li>;
                  })}
                </ul>
              )}
            </div>
            <footer className="border-t border-white/10 px-5 py-3 text-xs text-white/35 sm:px-7">Показано: {filteredCollection.length} из {collectionCards.length}</footer>
          </section>
        </div>
      )}
    </main>
  );
}

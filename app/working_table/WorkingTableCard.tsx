"use client";

import { useEffect, useState } from "react";
import CardsExerciserClient from "@/app/cards_exerciser/CardsExerciserClient";
import {
  getPinyins,
  getRussianTranslations,
  getSingleCharacterPinyins,
  getSingleCharacterRussianTranslations,
  getPartOfSpeechTranslations,
} from "@/lib/ru_en_chi_dictionary";

type HskProgress = { level: number; remaining: number; total: number; completed: number };

type WordData = {
  hanzi: string;
  pinyin: string;
  russian: string;
  english: string;
  pos: string;
  level: number;
  frequency: number;
};

export default function WorkingTableCard() {
  const [word, setWord] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<HskProgress | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/working-table/next-card", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Не удалось загрузить прогресс HSK.");
        if (!cancelled && payload.progress) setProgress(payload.progress as HskProgress);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Не удалось загрузить прогресс HSK.");
      });
    return () => { cancelled = true; };
  }, []);

  async function openNextCard() {
    if (word || exhausted || error) {
      setWord(null);
      setExhausted(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/working-table/next-card", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось загрузить карточку.");
      if (payload.progress) setProgress(payload.progress as HskProgress);
      if (payload.exhausted) {
        setExhausted(true);
      } else {
        if (payload.authenticated === true) {
          const reviewResponse = await fetch("/api/fsrs/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ word: (payload.word as WordData).hanzi, answer: null, rating: 1 }),
          });
          const reviewPayload = await reviewResponse.json();
          if (!reviewResponse.ok) throw new Error(reviewPayload.error || "Не удалось добавить слово в FSRS.");
        }
        const openedWord = payload.word as WordData;
        if (payload.progress && openedWord.level === payload.progress.level) {
          setProgress({ ...payload.progress, remaining: Math.max(0, payload.progress.remaining - 1), completed: Math.min(payload.progress.total, payload.progress.completed + 1) });
        }
        setWord(openedWord);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить карточку.");
    } finally {
      setLoading(false);
    }
  }

  function closeCard() {
    setWord(null);
    setExhausted(false);
    setError(null);
  }

  const dictionaryWords = word ? [word.hanzi] : [];
  const dictionaryTranslations = word
    ? { ...getSingleCharacterRussianTranslations(), ...getRussianTranslations(dictionaryWords), [word.hanzi]: word.russian }
    : {};
  const dictionaryPinyins = word
    ? { ...getSingleCharacterPinyins(), ...getPinyins(dictionaryWords), [word.hanzi]: word.pinyin }
    : {};
  const dictionaryPartsOfSpeech = word ? getPartOfSpeechTranslations(dictionaryWords) : {};

  return (
    <>
      <button
        type="button"
        aria-label="Открыть следующую карточку"
        onClick={openNextCard}
        disabled={loading}
        className="absolute left-5 top-1/2 h-52 w-36 -translate-y-1/2 rounded-[1.35rem] border border-white/20 bg-gradient-to-br from-[#292929] via-[#171717] to-[#0d0d0d] shadow-[0_24px_70px_rgba(0,0,0,0.65)] outline-none transition duration-300 hover:border-white/30 focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-60 sm:left-[max(8vw,calc((100vw-1500px)/2+8vw))] sm:h-64 sm:w-44"
      >
        <span className="absolute inset-0 translate-x-2 translate-y-2 rounded-[1.35rem] border border-white/10 bg-[#171717]" />
        <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-[1.35rem] border border-white/10 bg-[#202020]" />
        <span className="absolute inset-0 rounded-[1.35rem] border border-white/15 bg-gradient-to-br from-white/[0.035] to-transparent" />
        {loading && <span className="absolute inset-0 z-10 flex items-center justify-center text-xs text-white/60">Загрузка…</span>}
      </button>

      {(word || exhausted || error) && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Карточка китайского слова"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCard();
          }}
        >
          <section className="relative z-10 max-h-[92svh] w-full max-w-3xl overflow-y-auto">
            {word ? (
              <CardsExerciserClient
                title="Рабочий стол"
                words={[word.hanzi]}
                embedded
                initialSide="back"
                onClose={closeCard}
                dictionaryTranslations={dictionaryTranslations}
                dictionaryPinyins={dictionaryPinyins}
                dictionaryPartsOfSpeech={dictionaryPartsOfSpeech}
              />
            ) : (
              <div className="relative rounded-[30px] border border-white/15 bg-[#151515]/95 p-8 text-center text-white shadow-2xl">
                <button type="button" onClick={closeCard} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl text-white/65 hover:bg-white/[0.12]" aria-label="Закрыть">×</button>
                {error ? <p className="py-8 text-sm text-red-200">{error}</p> : <><h2 className="text-xl font-semibold">Новые слова закончились</h2><p className="mt-3 text-sm text-white/50">У всех слов словаря уже есть оценки FSRS.</p></>}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

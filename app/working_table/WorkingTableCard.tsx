"use client";

import { useState } from "react";
import HanziWriterStrip from "@/lib/HanziWriter/HanziWriterStrip";

type CharacterInfo = {
  character: string;
  pinyin: string[];
  definition: string;
  decomposition: string;
  etymology: { type?: string; hint?: string | null; phonetic?: string | null; semantic?: string | null } | null;
  radical: string | null;
  decompositionTree: unknown;
};

type WordData = {
  hanzi: string;
  pinyin: string;
  russian: string;
  english: string;
  pos: string;
  level: number;
  frequency: number;
  characters: Array<{ character: string; info: CharacterInfo | null }>;
};

export default function WorkingTableCard() {
  const [word, setWord] = useState<WordData | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openNextCard() {
    if (word) {
      setWord(null);
      return;
    }
    setLoading(true);
    setError(null);
    setExhausted(false);
    try {
      const response = await fetch("/api/working-table/next-card", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось загрузить карточку.");
      setAuthenticated(payload.authenticated === true);
      if (payload.exhausted) {
        setExhausted(true);
        setWord(null);
      } else {
        setWord(payload.word as WordData);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить карточку.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={word ? "Закрыть карточку" : "Открыть следующую карточку"}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-8" role="dialog" aria-modal="true" aria-label="Карточка китайского слова">
          <button type="button" aria-label="Закрыть карточку" onClick={() => { setWord(null); setExhausted(false); setError(null); }} className="absolute inset-0 cursor-default" />
          <section className="relative z-10 max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/15 bg-[#151515]/95 p-5 text-white shadow-[0_30px_120px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
            <button type="button" onClick={() => { setWord(null); setExhausted(false); setError(null); }} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl text-white/65 transition hover:bg-white/[0.12]" aria-label="Закрыть">×</button>

            {error && <p className="py-12 text-center text-sm text-red-200">{error}</p>}
            {exhausted && <div className="py-12 text-center"><h2 className="text-xl font-semibold">Новые слова закончились</h2><p className="mt-3 text-sm text-white/50">У всех слов словаря уже есть оценки FSRS.</p></div>}

            {word && (
              <>
                <div className="mb-5 flex flex-wrap gap-2 pr-10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                  <span className="rounded-full border border-white/10 px-3 py-1">HSK {word.level}</span>
                  <span className="rounded-full border border-white/10 px-3 py-1">Частотность: {word.frequency.toLocaleString("ru-RU")}</span>
                </div>
                <div className="text-center">
                  <h2 className="text-4xl font-semibold tracking-wide sm:text-5xl">{word.hanzi}</h2>
                  <p className="mt-2 text-lg tracking-wide text-[#e6d2ad]">{word.pinyin || "Пиньинь не указан"}</p>
                  <p className="mt-4 text-xl text-white/90">{word.russian || "Перевод на русский не найден"}</p>
                  {word.english && <p className="mt-1 text-sm text-white/45">{word.english}</p>}
                  {word.pos && <p className="mt-3 text-xs text-white/45">Часть речи: {word.pos}</p>}
                </div>

                <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <h3 className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/40">Иероглифы</h3>
                <div className="flex justify-center">
                  <HanziWriterStrip characters={Array.from(word.hanzi)} mode="preview" size={Math.min(112, Math.floor(280 / Math.max(1, Array.from(word.hanzi).length)))} keyPrefix={`working-table-${word.hanzi}`} />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {word.characters.map(({ character, info }) => (
                    <article key={character} className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none">{character}</span>
                        <div className="min-w-0 flex-1">
                          {info?.pinyin?.length ? <p className="text-sm text-[#e6d2ad]">{info.pinyin.join(" · ")}</p> : <p className="text-sm text-white/40">Пиньинь не найден</p>}
                          {info?.definition && <p className="mt-1 text-sm leading-relaxed text-white/75">{info.definition}</p>}
                          {info?.radical && <p className="mt-2 text-xs text-white/40">Ключ: {info.radical}</p>}
                        </div>
                      </div>
                      {info?.decomposition && <p className="mt-3 border-t border-white/[0.08] pt-3 text-xs leading-relaxed text-white/45">Состав: {info.decomposition}</p>}
                      {info?.etymology?.hint && <p className="mt-2 text-xs leading-relaxed text-white/45">{info.etymology.hint}</p>}
                    </article>
                  ))}
                </div>

                {!authenticated && <p className="mt-5 text-center text-xs leading-relaxed text-white/35">Сейчас показано первое доступное слово. Войдите в аккаунт, чтобы подбор учитывал вашу историю оценок FSRS.</p>}
                <div className="mt-7 flex justify-center">
                  <button type="button" onClick={() => setWord(null)} className="rounded-full border border-white/15 bg-white/[0.07] px-6 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.12]">Вернуться к колоде</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

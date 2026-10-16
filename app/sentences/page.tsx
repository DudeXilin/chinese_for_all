"use client";

import { FormEvent, useMemo, useState } from "react";

type SentenceResult = { sentence: string; translation: string };

function HighlightedSentence({ sentence, target }: { sentence: string; target: string }) {
  const parts = useMemo(() => {
    if (!target) return [{ text: sentence, highlighted: false }];
    const result: Array<{ text: string; highlighted: boolean }> = [];
    const source = sentence.toLowerCase();
    const needle = target.toLowerCase();
    let cursor = 0;
    let matchAt = source.indexOf(needle, cursor);

    while (matchAt !== -1) {
      if (matchAt > cursor) result.push({ text: sentence.slice(cursor, matchAt), highlighted: false });
      result.push({ text: sentence.slice(matchAt, matchAt + target.length), highlighted: true });
      cursor = matchAt + target.length;
      matchAt = source.indexOf(needle, cursor);
    }
    if (cursor < sentence.length) result.push({ text: sentence.slice(cursor), highlighted: false });
    return result;
  }, [sentence, target]);

  return (
    <>
      {parts.map((part, index) =>
        part.highlighted ? (
          <span key={index} className="rounded-sm bg-rose-400/15 text-rose-300">{part.text}</span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

export default function SentencesPage() {
  const [knownInput, setKnownInput] = useState("");
  const [target, setTarget] = useState("");
  const [results, setResults] = useState<SentenceResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSearched(false);

    if (!target.trim()) {
      setError("Введите слово или иероглиф, который хотите изучать.");
      return;
    }

    const knownWords = knownInput
      .split(/[,，、;；\n]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const response = await fetch("/api/sentences/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knownWords, target: target.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось найти предложения.");
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] px-4 pb-16 pt-20 text-white sm:px-6">
      <a
        href="/"
        className="fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-2xl text-white/80 backdrop-blur-xl transition-colors hover:bg-white/10"
        aria-label="На главную"
      >
        &lt;
      </a>

      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-white/40">Chinese Free for Everyone</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Предложения</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
            Подбирайте примеры, используя только знакомые слова, и изучайте выбранное слово в контексте.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7">
          <label htmlFor="known-words" className="mb-2 block text-sm font-medium text-white/85">
            Слова, которые вы знаете
          </label>
          <textarea
            id="known-words"
            value={knownInput}
            onChange={(event) => setKnownInput(event.target.value)}
            placeholder="Например: 我, 你, 喜欢, 是, 朋友, 苹果"
            rows={4}
            className="w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-base leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-white/30 focus:ring-2 focus:ring-white/5"
          />
          <p className="mt-2 text-xs leading-5 text-white/40">Разделяйте слова запятыми. Поддерживаются также китайские запятые и переносы строк.</p>

          <label htmlFor="target-word" className="mb-2 mt-6 block text-sm font-medium text-white/85">
            Слово или иероглиф для изучения
          </label>
          <input
            id="target-word"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Например: 朋友"
            autoComplete="off"
            className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-lg text-white outline-none transition placeholder:text-white/25 focus:border-white/30 focus:ring-2 focus:ring-white/5"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#f0d9bd] px-5 py-3 font-semibold text-[#211a14] transition hover:bg-[#f7e7d4] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Подбираем предложения…" : "Привести примеры предложений"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        {searched && (
          <section className="mt-8" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">Примеры предложений</h2>
              <span className="text-sm text-white/45">Найдено: {results.length}</span>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-8 text-center text-sm leading-6 text-white/55">
                Подходящих предложений не найдено. Попробуйте добавить больше знакомых слов или проверить написание изучаемого слова.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.08] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                {results.map((result, index) => (
                  <article key={`${index}-${result.sentence}`} className="px-5 py-5 sm:px-6 sm:py-6">
                    <p className="text-xl leading-9 tracking-wide sm:text-2xl">
                      <HighlightedSentence sentence={result.sentence} target={target.trim()} />
                    </p>
                    <p className="mt-2 pl-2 text-sm leading-6 text-white/65 sm:text-base">{result.translation}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

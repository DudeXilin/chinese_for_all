"use client";

import { FormEvent, useMemo, useState } from "react";

type SentenceResult = { sentence: string; translation: string };
type SentenceDebug = {
  datasetShape: string;
  rootKeys: string[];
  totalEntries: number;
  targetMatches: number;
  rejectedUnknownTags: number;
  missingTags: number;
  missingTranslation: number;
  accepted: number;
  knownWordsReceived: number;
  knownWordsUnique: number;
  target: string;
  targetSamples: Array<{ sentence: string; translationFound: boolean; tags: string[] }>;
  rejectedSamples: Array<{ reason: string; sentence: string; tags?: string[]; unknownWords?: string[] }>;
};

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

function DebugPanel({ debug, resultsCount, error }: { debug: SentenceDebug | null; resultsCount: number; error: string }) {
  if (!debug && !error) {
    return (
      <div className="text-sm leading-6 text-white/55">
        <p>Пока нет данных. Введите слова и нажмите «Привести примеры предложений» — панель покажет этапы фильтрации.</p>
      </div>
    );
  }

  if (!debug) {
    return <pre className="whitespace-pre-wrap break-words text-xs text-rose-200">{error || "Ответ API не содержит debug-данных."}</pre>;
  }

  return (
    <div className="space-y-4 text-xs leading-5 text-white/75">
      <section>
        <h3 className="mb-2 font-semibold text-white">Сводка поиска</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Записей в базе", debug.totalEntries],
            ["Содержат цель", debug.targetMatches],
            ["Отброшено: незнакомые tags", debug.rejectedUnknownTags],
            ["Без tags", debug.missingTags],
            ["Без перевода", debug.missingTranslation],
            ["Подошло", debug.accepted],
            ["Результатов на экране", resultsCount],
            ["Знакомых слов (уник.)", debug.knownWordsUnique],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
              <div className="text-[10px] leading-4 text-white/40">{label}</div>
              <div className="font-mono text-base text-white">{value}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 break-words text-white/45">Цель: {debug.target} · Получено слов: {debug.knownWordsReceived}</p>
        <p className="break-words text-white/45">Формат: {debug.datasetShape}</p>
        <p className="break-words text-white/45">Ключи JSON: {debug.rootKeys.join(", ") || "(нет)"}</p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-white">Предложения, где найдена цель ({debug.targetSamples.length})</h3>
        {debug.targetSamples.length === 0 ? (
          <p className="text-amber-200">В базе не найдено ни одного предложения, содержащего точную строку цели.</p>
        ) : debug.targetSamples.map((item, index) => (
          <div key={index} className="mb-2 rounded-lg border border-white/10 bg-black/20 p-2">
            <p className="text-base text-white">{item.sentence}</p>
            <p className="mt-1 text-white/45">Перевод: {item.translationFound ? "есть" : "не найден"}</p>
            <p className="break-words text-white/45">tags: {item.tags.join(" · ") || "(пусто)"}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-white">Почему предложения отбрасываются ({debug.rejectedSamples.length} примеров)</h3>
        {debug.rejectedSamples.length === 0 ? (
          <p className="text-white/45">Нет примеров отклонённых предложений.</p>
        ) : debug.rejectedSamples.map((item, index) => (
          <div key={index} className="mb-2 rounded-lg border border-rose-300/15 bg-rose-300/[0.04] p-2">
            <p className="text-white/90">{item.reason}</p>
            <p className="mt-1 text-base text-white">{item.sentence}</p>
            {item.unknownWords?.length ? <p className="mt-1 break-words text-rose-200">Незнакомые: {item.unknownWords.join(" · ")}</p> : null}
            {item.tags?.length ? <p className="mt-1 break-words text-white/40">tags: {item.tags.join(" · ")}</p> : null}
          </div>
        ))}
      </section>
    </div>
  );
}

export default function SentencesPage() {
  const [knownInput, setKnownInput] = useState("");
  const [target, setTarget] = useState("");
  const [results, setResults] = useState<SentenceResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugData, setDebugData] = useState<SentenceDebug | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSearched(false);
    setDebugData(null);

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
        body: JSON.stringify({ knownWords, target: target.trim(), debug: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось найти предложения.");
      setResults(Array.isArray(data.results) ? data.results : []);
      setDebugData(data.debug ?? null);
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
        className="fixed left-4 top-4 z-30 flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/70 px-4 text-sm text-white/80 backdrop-blur-xl transition-colors hover:bg-white/10"
        aria-label="Вернуться в главное меню"
      >
        <span className="text-xl leading-none">&lt;</span>
        <span>Вернуться в главное меню</span>
      </a>
      <button
        type="button"
        onClick={() => {
          setDebugOpen((open) => {
            const nextOpen = !open;
            // Hide the site-wide diagnostic bug button while sentence debugging is active.
            (window as Window & { __cfaSetDebugButtonVisible?: (visible: boolean) => void })
              .__cfaSetDebugButtonVisible?.(!nextOpen);
            return nextOpen;
          });
        }}
        className="fixed left-4 top-[4.25rem] z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/70 text-xl backdrop-blur-xl transition hover:bg-white/10"
        aria-label={debugOpen ? "Скрыть инструменты отладки" : "Показать инструменты отладки"}
        aria-expanded={debugOpen}
        title="Debug tools"
      >
        🐞
      </button>

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
                Подходящих предложений не найдено. Откройте отладку кнопкой 🐞, чтобы увидеть, на каком этапе предложения отбрасываются.
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

      {debugOpen && (
        <aside className="fixed bottom-4 right-4 z-50 flex max-h-[72dvh] w-[min(94vw,540px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111]/95 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="font-semibold text-white">🐞 Отладка поиска предложений</h2>
              <p className="text-[10px] text-white/40">Этапы фильтрации на сервере</p>
            </div>
            <button type="button" onClick={() => setDebugOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 hover:bg-white/10" aria-label="Скрыть отладку">×</button>
          </div>
          <div className="min-h-0 overflow-y-auto p-4">
            <DebugPanel debug={debugData} resultsCount={results.length} error={error} />
          </div>
        </aside>
      )}
    </main>
  );
}

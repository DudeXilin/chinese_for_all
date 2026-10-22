"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CalibrationWord = { word: string; frequency: number };

type CalibrationPayload = {
  alreadyCalibrated?: boolean;
  level?: number;
  levels?: number[];
  words?: CalibrationWord[];
  error?: string;
};

export default function CalibrationClient() {
  const router = useRouter();
  const [level, setLevel] = useState(1);
  const [levels, setLevels] = useState<number[]>([]);
  const [words, setWords] = useState<CalibrationWord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLevel = useCallback(async (nextLevel: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calibration?level=${nextLevel}`, { cache: "no-store" });
      const payload = (await response.json()) as CalibrationPayload;
      if (response.status === 401) {
        router.replace("/profile");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Не удалось загрузить слова.");
      if (payload.alreadyCalibrated) {
        router.replace("/working_table");
        return;
      }
      setLevel(payload.level ?? nextLevel);
      setLevels(payload.levels ?? []);
      setWords(payload.words ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить слова.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadLevel(1);
  }, [loadLevel]);

  const nextLevel = useMemo(() => levels.find((value) => value > level), [levels, level]);

  function toggleWord(word: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  async function finishCalibration() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ words: [...selected] }),
      });
      const payload = (await response.json()) as { success?: boolean; alreadyCalibrated?: boolean; error?: string };
      if (response.status === 409 || payload.alreadyCalibrated) {
        router.replace("/working_table");
        return;
      }
      if (!response.ok || !payload.success) throw new Error(payload.error || "Не удалось сохранить калибровку.");
      router.replace("/working_table");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить калибровку.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#090909] text-white">
      <header className="shrink-0 border-b border-white/[0.08] bg-[#090909]/95 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:pb-3">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
          {nextLevel ? (
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => void loadLevel(nextLevel)}
              className="min-h-9 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-2 text-sm font-medium text-white/85 transition hover:bg-white/[0.11] disabled:opacity-40 sm:px-3 sm:text-lg"
            >
              К словам из HSK {nextLevel}
            </button>
          ) : <span />}
          <div className="min-w-0 text-center">
            <h1 className="text-xl font-medium leading-tight text-white/85 sm:text-2xl">
              <span className="block">Отметьте <strong className="font-bold text-white underline underline-offset-4 decoration-2">хорошо</strong></span>
              <span className="block">выученные слова</span>
            </h1>
          </div>
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void finishCalibration()}
            className="min-h-9 rounded-lg border border-emerald-300/30 bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4 sm:text-lg"
          >
            Готово
          </button>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1 sm:px-3 sm:py-2" aria-label={`Слова HSK ${level}`}>
        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-white/45">Загрузка слов…</div>
        ) : error && words.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-red-200">{error}</p>
            <button type="button" onClick={() => void loadLevel(level)} className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 hover:bg-white/10">Повторить</button>
          </div>
        ) : words.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/45">Для этого уровня слова не найдены.</p>
        ) : (
          <div className="flex content-start items-start justify-center gap-1 sm:gap-1.5" style={{ flexWrap: "wrap" }}>
            {words.map(({ word }) => {
              const isSelected = selected.has(word);
              const length = Math.max(1, Array.from(word).length);
              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggleWord(word)}
                  aria-pressed={isSelected}
                  aria-label={word}
                  className={`flex shrink-0 items-center justify-center rounded-lg border font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 ${isSelected ? "border-emerald-300/80 bg-emerald-400/25 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.15)]" : "border-white/[0.09] bg-white/[0.035] text-white/85 hover:border-white/20 hover:bg-white/[0.08]"}`}
                  style={{
                    width: `${length * 2.75}rem`,
                    height: "clamp(2.75rem, 6.5vh, 4.5rem)",
                    aspectRatio: `${length} / 1`,
                    fontSize: "clamp(1.3rem, 2.86vw, 2rem)",
                    lineHeight: 1,
                  }}
                >
                  {word}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {error && words.length > 0 && <p className="shrink-0 px-3 py-1 text-center text-sm text-red-200">{error}</p>}

      {saving && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="flex min-w-40 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-[#191919] px-6 py-4 shadow-2xl">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <span className="text-sm text-white/85">Загрузка…</span>
          </div>
        </div>
      )}
    </main>
  );
}

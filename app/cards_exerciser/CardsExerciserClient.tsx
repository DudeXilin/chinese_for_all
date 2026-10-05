"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import HanziWriterStrip from "@/lib/HanziWriter/HanziWriterStrip";
import HanziWriterDebugPanel from "@/lib/HanziWriter/HanziWriterDebugPanel";
import { convertPinyin } from "@/lib/neat_pinyin_converter";
import { createCard, preview, review, Rating, type SerializedCard } from "@/lib/FSRS-6/our_system";
import FSRS6DebugPanel from "@/lib/FSRS-6/our_system/FSRS6DebugPanel";
import { logFSRS } from "@/lib/FSRS-6/our_system/debugLog";
import uiDecks from "@/data/ui-interface-decks.json";

type TheoryItem = string | { label?: string; text: string };

type TheorySection = {
  type: string;
  title: string;
  text?: string;
  rows?: string[][];
  items?: TheoryItem[];
  note?: string;
  highlight?: string;
};

type Theory = {
  title: string;
  sections: TheorySection[];
};

type Props = { title: string; words: string[]; theory?: Theory };

const translations: Record<string, string> = {
  "这里": "здесь", "那里": "там", "这儿": "здесь", "那儿": "там", "哪里": "где", "哪儿": "где",
  "里面": "внутри", "外面": "снаружи", "上面": "сверху", "下面": "снизу", "前面": "спереди",
  "后面": "сзади", "旁边": "рядом", "附近": "поблизости", "中间": "посередине",
  "谁": "кто", "什么": "что", "为什么": "почему", "怎么": "как", "怎么样": "как, каким образом",
  "哪个": "какой, который", "哪一个": "который", "多少": "сколько", "几": "сколько",
  "什么时候": "когда", "怎么了": "что случилось", "谁的": "чей", "什么地方": "какое место / где",
  "个": "универсальное счётное слово", "条": "для длинных и узких предметов", "张": "для плоских предметов",
  "本": "для книг и изданий", "只": "для животных и отдельных частей пары", "件": "для одежды и некоторых вещей",
  "台": "для техники и устройств", "辆": "для наземного транспорта", "双": "для парных предметов",
  "间": "для комнат и помещений", "位": "вежливое счётное слово для людей", "把": "для предметов с ручкой или рукояткой",
  "杯": "порция напитка в чашке или стакане", "些": "несколько, немного", "种": "вид, тип, разновидность",
  "次": "раз, случай",
};

const pinyins: Record<string, string> = {
  "这里": "zhèlǐ", "那里": "nàlǐ", "这儿": "zhèr", "那儿": "nàr", "哪里": "nǎlǐ", "哪儿": "nǎr",
  "里面": "lǐmiàn", "外面": "wàimiàn", "上面": "shàngmiàn", "下面": "xiàmiàn", "前面": "qiánmiàn",
  "后面": "hòumiàn", "旁边": "pángbiān", "附近": "fùjìn", "中间": "zhōngjiān",
  "谁": "shéi", "什么": "shénme", "为什么": "wèishénme", "怎么": "zěnme", "怎么样": "zěnme yàng",
  "哪个": "nǎge", "哪一个": "nǎyīge", "多少": "duōshao", "几": "jǐ", "什么时候": "shénme shíhou",
  "怎么了": "zěnme le", "谁的": "shéide", "什么地方": "shénme dìfang",
  "个": "gè", "条": "tiáo", "张": "zhāng", "本": "běn", "只": "zhī", "件": "jiàn", "台": "tái",
  "辆": "liàng", "双": "shuāng", "间": "jiān", "位": "wèi", "把": "bǎ", "杯": "bēi", "些": "xiē",
  "种": "zhǒng", "次": "cì",
};

function compactPinyin(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function PinyinAnswer({ answer, correct }: { answer: string; correct: string }) {
  const normalizedAnswer = compactPinyin(answer.trim());
  const normalizedCorrect = compactPinyin(correct.trim());
  const isCorrect = normalizedAnswer === normalizedCorrect;

  if (isCorrect) return null;

  return (
    <div className="mt-1 text-lg tracking-wide" aria-label="Ваш ответ с ошибками">
      {Array.from(answer).map((character, index) => {
        if (/\s/.test(character)) {
          return <span key={`space-${index}`}>{character}</span>;
        }
        const compactIndex = Array.from(answer.slice(0, index)).filter((item) => !/\s/.test(item)).length;
        const expected = Array.from(normalizedCorrect)[compactIndex];
        const wrong = character.toLowerCase() !== expected;
        return (
          <span key={`char-${index}`} className={wrong ? "text-red-300/70" : "text-white/45"}>
            {character}
          </span>
        );
      })}
    </div>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H19v17H7.8A2.8 2.8 0 0 0 5 21.8V4.8Z" />
      <path d="M5 5v16.8A2.8 2.8 0 0 1 7.8 19H19M9 6h6M9 9h7" />
    </svg>
  );
}

export default function CardsExerciserClient({ title, words, theory }: Props) {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [answer, setAnswer] = useState("");
  const [finished, setFinished] = useState(false);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [dontShowTheory, setDontShowTheory] = useState(false);
  const [tonePadOpen, setTonePadOpen] = useState(false);
  const [keyboardBottom, setKeyboardBottom] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [fsrsCards, setFsrsCards] = useState<Record<number, SerializedCard>>({});
  const [lastFSRSResult, setLastFSRSResult] = useState<{ index: number; word: string; answer: string; rating: number; previousCard: SerializedCard; result: ReturnType<typeof review> } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFrontRef = useRef(side === "front" && !finished);
  isFrontRef.current = side === "front" && !finished;

  const currentWord = words[index] ?? "汉字";
  const currentFSRSCard = fsrsCards[index] ?? createCard(getAuthoritativeNow());
  const uiWord = (uiDecks.words as Record<string, { pinyin: string; translation: string }>)[currentWord];
  const correctPinyin = uiWord?.pinyin ?? pinyins[currentWord] ?? "pinyin placeholder";
  const translation = uiWord?.translation ?? translations[currentWord] ?? "перевод placeholder";
  const theoryKey = `cfa-theory-dismissed:${title}`;

  useEffect(() => {
    let cancelled = false;

    async function syncServerTime() {
      const startedAt = Date.now();
      try {
        const response = await fetch("/api/time", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        const receivedAt = Date.now();
        if (typeof payload.unixMs !== "number" || cancelled) return;

        const midpoint = (startedAt + receivedAt) / 2;
        setServerTimeOffsetMs(payload.unixMs - midpoint);
      } catch {
        // Local time remains the fallback when the server is unreachable.
      }
    }

    syncServerTime();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFSRSCards() {
      try {
        const response = await fetch("/api/fsrs/cards", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setAuthenticated(false);
            setSyncReady(true);
          }
          return;
        }

        const payload = await response.json();
        if (cancelled || !Array.isArray(payload.cards)) return;

        setAuthenticated(payload.authenticated === true);
        setSyncReady(true);

        const byWord = new Map<string, SerializedCard>();
        for (const row of payload.cards) {
          if (!row || typeof row.word !== "string") continue;
          byWord.set(row.word, {
            due: row.due,
            stability: row.stability,
            difficulty: row.difficulty,
            elapsed_days: row.elapsed_days,
            scheduled_days: row.scheduled_days,
            learning_steps: row.learning_steps,
            reps: row.reps,
            lapses: row.lapses,
            state: row.state,
            last_review: row.last_review,
          });
        }

        setFsrsCards(
          Object.fromEntries(
            words
              .map((word, wordIndex) => {
                const card = byWord.get(word);
                return card ? [wordIndex, card] : null;
              })
              .filter((entry): entry is [number, SerializedCard] => entry !== null),
          ),
        );
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
          setSyncReady(true);
        }
        // Session-local FSRS remains available if Supabase is unavailable.
      }
    }

    loadFSRSCards();
    return () => {
      cancelled = true;
    };
  }, [words]);

  useEffect(() => {
    if (!theory) return;
    try {
      const dismissed = window.localStorage.getItem(theoryKey) === "1";
      if (!dismissed) setTheoryOpen(true);
    } catch {
      setTheoryOpen(true);
    }
  }, [theory, theoryKey]);

  useEffect(() => {
    if (side !== "front" || finished) return;

    const isPhone = () => navigator.maxTouchPoints > 0 && window.innerWidth < 900;

    // Desktop keeps the existing "type immediately" behavior.
    // On phones we deliberately do nothing here: opening a card must not move
    // the page or open the keyboard.
    if (!isPhone()) {
      inputRef.current?.focus();
    }
  }, [index, side, finished]);

  function keepInputFocused() {
    const isPhone = navigator.maxTouchPoints > 0 && window.innerWidth < 900;

    // On iPhone/Safari blur must be allowed so the keyboard can close naturally.
    // Desktop keeps the input ready for immediate typing.
    if (isPhone) return;

    requestAnimationFrame(() => {
      if (isFrontRef.current) {
        inputRef.current?.focus();
      }
    });
  }

  function reveal() {
    setSide("back");
    inputRef.current?.blur();
    setTonePadOpen(false);
  }

  useEffect(() => {
    if (!tonePadOpen || !window.visualViewport) return;
    const update = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      setKeyboardBottom(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };
    update();
    window.visualViewport.addEventListener("resize", update);
    return () => window.visualViewport?.removeEventListener("resize", update);
  }, [tonePadOpen]);

  function insertTone(tone: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? answer.length;
    const end = input.selectionEnd ?? start;
    const next = answer.slice(0, start) + tone + answer.slice(end);
    const converted = convertPinyin(next);
    setAnswer(converted);
    requestAnimationFrame(() => {
      const element = inputRef.current;
      if (!element) return;
      const caret = Math.min(start + 1, converted.length);
      element.focus();
      element.setSelectionRange(caret, caret);
    });
  }

  type FSRSRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

  const fsrsRatings: Array<{
    value: FSRSRating;
    name: string;
    description: string;
    tone: string;
  }> = [
    {
      value: Rating.Again,
      name: "Заново",
      description: "Не вспомнил",
      tone: "border-blue-400/15 bg-blue-500/[0.08] hover:bg-blue-500/[0.13]",
    },
    {
      value: Rating.Hard,
      name: "Тяжко",
      description: "С трудом",
      tone: "border-emerald-400/15 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.13]",
    },
    {
      value: Rating.Good,
      name: "Пойдёт",
      description: "Вспомнил",
      tone: "border-yellow-400/15 bg-yellow-500/[0.08] hover:bg-yellow-500/[0.13]",
    },
    {
      value: Rating.Easy,
      name: "Легко",
      description: "Легко",
      tone: "border-red-400/15 bg-red-500/[0.09] hover:bg-red-500/[0.14]",
    },
  ];

  function getAuthoritativeNow() {
    return new Date(Date.now() + serverTimeOffsetMs);
  }

  function handleRatingPointerUp(event: PointerEvent<HTMLButtonElement>, rating: FSRSRating) {
    if (event.pointerType === "mouse" || event.pointerType === "touch" || event.pointerType === "pen") {
      if (event.currentTarget.contains(event.target as Node)) void rate(rating);
    }
  }

  async function undoLastRating() {
    const previous = lastFSRSResult;
    if (!previous || ratingBusy || !syncReady) return;

    setRatingBusy(true);
    try {
      if (authenticated) {
        const response = await fetch("/api/fsrs/undo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ word: previous.word, previousCard: previous.previousCard }),
        });
        if (!response.ok) throw new Error("FSRS undo failed");
      }

      setFsrsCards((cards) => ({ ...cards, [previous.index]: previous.previousCard }));
      setIndex(previous.index);
      setAnswer(previous.answer);
      setSide("back");
      setLastFSRSResult(null);
    } catch (error) {
      console.error("[FSRS-6] undo failed", error);
      logFSRS("undo_error", {
        word: previous.word,
        cardIndex: previous.index,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setRatingBusy(false);
    }
  }

  async function rate(rating: FSRSRating) {
    if (ratingBusy || !syncReady) return;
    setRatingBusy(true);

    const now = getAuthoritativeNow();
    const card = fsrsCards[index] ?? createCard(now);
    const previousCard = { ...card };
    const ratingName = Rating[rating];

    try {
      let beforePreview: ReturnType<typeof preview>;
      let result: ReturnType<typeof review>;
      let serverNow = now.toISOString();

      if (authenticated) {
        const response = await fetch("/api/fsrs/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            word: currentWord,
            answer: answer || null,
            rating,
          }),
        });

        if (!response.ok) {
          throw new Error("FSRS server review failed");
        }

        const payload = await response.json();
        beforePreview = payload.before;
        result = { card: payload.card, log: payload.log };
        serverNow = payload.serverNow ?? serverNow;
      } else {
        beforePreview = preview(card, now);
        result = review(card, now, rating);
      }

      setFsrsCards((cards) => ({ ...cards, [index]: result.card }));
      setLastFSRSResult({ index, word: currentWord, answer, rating, previousCard, result });

      logFSRS("review", {
        word: currentWord,
        cardIndex: index,
        answer: answer || null,
        rating: ratingName,
        ratingValue: rating,
        time: {
          source: authenticated ? "server" : "server-synchronized-client",
          serverNow,
          clientNow: new Date().toISOString(),
          offsetMs: Math.round(serverTimeOffsetMs),
        },
        before: {
          state: card.state,
          stability: card.stability,
          difficulty: card.difficulty,
          due: card.due,
          options: {
            again: {
              scheduledDays: beforePreview.again.card.scheduled_days,
              due: beforePreview.again.card.due,
            },
            hard: {
              scheduledDays: beforePreview.hard.card.scheduled_days,
              due: beforePreview.hard.card.due,
            },
            good: {
              scheduledDays: beforePreview.good.card.scheduled_days,
              due: beforePreview.good.card.due,
            },
            easy: {
              scheduledDays: beforePreview.easy.card.scheduled_days,
              due: beforePreview.easy.card.due,
            },
          },
        },
        result: {
          card: result.card,
          log: result.log,
        },
      });

      if (index >= words.length - 1) {
        setFinished(true);
        return;
      }
      setIndex((value) => value + 1);
      setAnswer("");
      setSide("front");
    } catch (error) {
      console.error("[FSRS-6] review failed", error);
      logFSRS("review_error", {
        word: currentWord,
        cardIndex: index,
        rating: ratingName,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setRatingBusy(false);
    }
  }

  useEffect(() => {
    const setter = (window as typeof window & { __cfaSetDebugButtonVisible?: (visible: boolean) => void }).__cfaSetDebugButtonVisible;
    setter?.(debugOpen);
    return () => setter?.(false);
  }, [debugOpen]);

  function closeTheory() {
    if (dontShowTheory) {
      try {
        window.localStorage.setItem(theoryKey, "1");
      } catch {
        // Ignore unavailable localStorage.
      }
    }
    setTheoryOpen(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_38%),radial-gradient(circle_at_15%_70%,rgba(255,255,255,0.045),transparent_28%)]" />
      <div className="fixed left-4 top-4 z-[1000] flex flex-col gap-2">
        <a href="/lessons" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-2xl leading-none text-white/80 shadow-lg backdrop-blur-2xl transition hover:bg-white/[0.1]" aria-label="Назад">&lt;</a>
        <button type="button" onClick={() => setDebugOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl shadow-lg backdrop-blur-2xl transition hover:bg-white/[0.1]" aria-label={debugOpen ? "Скрыть debug" : "Показать debug"}>🐞</button>
      </div>

      {finished ? (
        <div className="relative flex min-h-screen items-center justify-center px-6 text-center">
          <div className="max-w-xl">
            <div className="text-6xl">💪</div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">Вы решили все карточки из этой колоды!</h1>
            <a href="/lessons" className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.08] px-6 py-3 text-sm text-white/85 shadow-xl backdrop-blur-2xl transition hover:bg-white/[0.13]">Вернуться к выбору уроков</a>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-5 pt-5 sm:px-6">
          <header className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <div className="mt-5 flex w-full max-w-xl items-center gap-3">
              {theory && (
                <button type="button" onClick={() => setTheoryOpen(true)} className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/45 shadow-lg backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white/75" aria-label="Открыть теорию">
                  <BookIcon />
                </button>
              )}
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-white/60 transition-all duration-300" style={{ width: `${((index + 1) / Math.max(words.length, 1)) * 100}%` }} /></div>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/30">{index + 1} / {words.length}</span>

            </div>
          </header>

          <section className="mx-auto mt-5 w-full max-w-3xl">
            <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/40 backdrop-blur-2xl">
                            {side === "front" ? (
                <div className="relative px-5 pb-7 pt-8 sm:px-10 sm:pb-8 sm:pt-10">
                  {lastFSRSResult && index === lastFSRSResult.index + 1 && (
                    <button
                      type="button"
                      onClick={undoLastRating}
                      disabled={ratingBusy || !syncReady}
                      className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-[17px] text-white/45 shadow-lg backdrop-blur-xl transition hover:bg-white/[0.09] hover:text-white/75 disabled:cursor-wait disabled:opacity-40"
                      aria-label="Вернуться к предыдущей карточке и изменить оценку"
                      title="Изменить последнюю оценку"
                    >
                      ↶
                    </button>
                  )}
                  <div className="text-center"><h1 className="text-4xl font-semibold tracking-tight text-[#fff4e6]/75 sm:text-5xl">{translation}</h1></div>
                  <div className="mt-7 flex justify-center">
                    <HanziWriterStrip
                      characters={Array.from(currentWord)}
                      mode="practice"
                      size={240}
                      keyPrefix={`${index}-front`}
                    />
                  </div>
                  <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
                    <input
                      ref={inputRef}
                      value={answer}
                      onChange={(e) => setAnswer(convertPinyin(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          reveal();
                        }
                      }}
                      aria-label="Введите Pinyin"
                      placeholder="ping2guo3"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="text"
                      enterKeyHint="done"
                      className="mt-2 block min-h-8 w-full border-b border-white/10 bg-transparent pb-1 text-lg tracking-wide text-white/75 outline-none placeholder:text-white/20 focus:border-white/20"
                      onFocus={() => {
                        if (navigator.maxTouchPoints > 0 && window.innerWidth < 900) setTonePadOpen(true);
                      }}
                      onBlur={keepInputFocused}
                    />
                    {tonePadOpen && (
                      <div className="fixed left-0 z-[80] w-full px-2 pb-1 sm:hidden" style={{ bottom: keyboardBottom + "px" }}>
                        <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5 rounded-t-[14px] border border-white/[0.08] bg-[#1c1c1e]/95 p-1.5">
                          {[1, 2, 3, 4].map((tone) => (
                            <button key={tone} type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => insertTone(String(tone))} className="flex h-10 items-center justify-center rounded-[9px] bg-[#2c2c2e] text-[17px] font-medium text-white active:bg-[#3a3a3c]">{tone}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-7 pt-8 sm:px-10 sm:pb-8">
                  <div className="text-center pt-[8px]">
                    <h1 className="text-4xl font-semibold tracking-tight text-[#fff4e6]/75 sm:text-5xl">{translation}</h1>
                    <div className="mt-7 flex justify-center">
                      <HanziWriterStrip
                        characters={Array.from(currentWord)}
                        mode="preview"
                        size={240}
                        keyPrefix={`${index}-back`}
                      />
                    </div>
                    <div className="mt-4 flex flex-col items-center">
                      <PinyinAnswer answer={answer} correct={correctPinyin} />
                      <div className="text-xl tracking-wide text-white/65">{correctPinyin}</div>
                    </div>
                    <div className="mt-2 text-sm text-white/35">{translation}</div>
                  </div>
                  <div className="mx-auto mt-3 max-w-xl rounded-3xl border border-white/[0.08] bg-black/20 p-4">
                    <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-white/70">Информация</h2><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Details</span></div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{["Перевод", "Часть речи", "HSK", "Частотность"].map((item) => <div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3"><div className="text-[9px] uppercase tracking-[0.14em] text-white/25">{item}</div><div className="mt-2 text-xs text-white/55">placeholder</div></div>)}</div>
                  </div>
                  <div className="mx-auto mt-3 max-w-xl rounded-3xl border border-white/[0.08] bg-black/20 p-4">
                    <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-white/70">Примеры</h2><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Examples</span></div>
                    <div className="mt-3 space-y-2">{["пример 1", "пример 2", "пример 3"].map((example) => <div key={example} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white/45">{example}</div>)}</div>
                  </div>
                </div>
              )}
            </article>
          </section>

          {side === "back" && (() => {
            const now = getAuthoritativeNow();
            const options = preview(currentFSRSCard, now);
            const formatInterval = (due: string) => {
              const diffMs = Math.max(0, new Date(due).getTime() - now.getTime());
              const minutes = Math.max(1, Math.round(diffMs / 60000));
              if (minutes < 60) return `${minutes} мин`;
              const hours = Math.floor(minutes / 60);
              if (hours < 24) return `${hours} ч`;
              const days = Math.floor(hours / 24);
              if (days < 30) return `${Math.max(1, days)} д`;
              const months = Math.floor(days / 30);
              if (months < 12) return `${Math.max(1, months)} мес`;
              const years = Math.floor(months / 12);
              return `${Math.max(1, years)} г`;
            };
            const optionByRating = {
              [Rating.Again]: options.again,
              [Rating.Hard]: options.hard,
              [Rating.Good]: options.good,
              [Rating.Easy]: options.easy,
            };

            return (
              <section className="mx-auto mt-3 w-full max-w-3xl">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.045] p-1 shadow-xl backdrop-blur-2xl">
                  <div className="grid grid-cols-4 gap-3">
                    {fsrsRatings.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onPointerUp={(event) => handleRatingPointerUp(event, item.value)}
                        onClick={(event) => {
                          if (event.detail === 0) void rate(item.value);
                        }}
                        disabled={ratingBusy || !syncReady}
                        className={`flex h-[36px] min-h-0 flex-col items-center justify-center rounded-xl border transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 ${item.tone}`}
                        title={item.name}
                      >
                        <span className="text-[12px] font-bold leading-none text-white">
                          {formatInterval(optionByRating[item.value].card.due)}
                        </span>
                        <span className="mt-1 text-[9px] font-semibold leading-none text-white/50">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}

        </div>
      )}

      {theoryOpen && theory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-md sm:px-6">
          <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/15 bg-[#111]/95 shadow-2xl shadow-black/60">
            <div className="flex shrink-0 items-start gap-4 border-b border-white/[0.08] px-5 pb-4 pt-4 sm:px-7">
              <div className="min-w-0 flex-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
                  <input type="checkbox" checked={dontShowTheory} onChange={(e) => setDontShowTheory(e.target.checked)} className="h-4 w-4 accent-white" />
                  <span>Больше не показывать</span>
                </label>
                <p className="mt-2 max-w-xl text-xs leading-5 text-white/40">Если теория понадобится позже, её всегда можно открыть по маленькой кнопке с книжкой рядом с прогрессом.</p>
              </div>
              <button type="button" onClick={closeTheory} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl text-white/55 transition hover:bg-white/[0.1] hover:text-white" aria-label="Закрыть">×</button>
            </div>

            <div className="overflow-y-auto px-5 pb-8 pt-6 sm:px-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30"><BookIcon /><span>Теория колоды</span></div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{theory.title}</h1>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/55"><BookIcon /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-white/[0.08]" /><span className="font-mono text-[9px] text-white/30">1 / {words.length}</span></div>
                      <p className="mt-1 text-[10px] text-white/35">Вот здесь будет находиться теория и её маленькая кнопка.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {theory.sections.map((section, sectionIndex) => (
                  <section key={`${section.title}-${sectionIndex}`} className={section.type === "ending" ? "rounded-3xl border border-white/10 bg-white/[0.055] p-5 sm:p-6" : ""}>
                    <h2 className="text-xl font-semibold tracking-tight text-white/90 sm:text-2xl">{section.title}</h2>
                    <div className="mt-1 h-px w-16 bg-gradient-to-r from-white/60 to-transparent" />
                    {section.text && <p className="mt-3 text-[15px] leading-7 text-white/65">{section.text}</p>}

                    {section.rows && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.09]">
                        <div className="divide-y divide-white/[0.07]">
                          {section.rows.map((row) => (
                            <div key={row.join("-")} className="grid grid-cols-[1.05fr_1fr_1.35fr] gap-2 bg-white/[0.025] px-3 py-3 text-sm sm:px-4">
                              <div className="font-medium text-white/90">{row[0]}</div>
                              <div className="font-mono text-xs text-white/45">{row[1]}</div>
                              <div className="text-white/60">{row[2]}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === "note" && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/60">{section.text}</div>
                    )}

                    {section.type === "comparison" && section.items && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {section.items.map((item, itemIndex) => {
                          const itemText = typeof item === "string" ? item : item.text;
                          const itemLabel = typeof item === "string" ? undefined : item.label;
                          return (
                            <div key={itemIndex} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                              {itemLabel && <h3 className="font-medium text-white/85">{itemLabel}</h3>}
                              <p className="mt-2 text-sm leading-6 text-white/55">{itemText}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {section.type === "practice" && section.items && (
                      <div className="mt-4 space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-sm leading-6 text-white/65">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs text-white/60">{itemIndex + 1}</span>
                            <span>{typeof item === "string" ? item : item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.note && <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/55"><span className="text-white/75">Важно:</span> {section.note}</div>}
                    {section.highlight && <p className="mt-4 text-base font-medium leading-7 text-white/85">{section.highlight}</p>}
                  </section>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-white/[0.08] px-5 py-3 sm:px-7">
              <button type="button" onClick={closeTheory} className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.13]">Понятно, начать упражнения</button>
            </div>
          </div>
        </div>
      )}
      <HanziWriterDebugPanel visible={debugOpen} />
      <FSRS6DebugPanel visible={debugOpen} />
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

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
  "这里": "zhe4li3", "那里": "na4li3", "这儿": "zhe4r", "那儿": "na4r", "哪里": "na3li3", "哪儿": "na3r",
  "里面": "li3mian4", "外面": "wai4mian4", "上面": "shang4mian4", "下面": "xia4mian4", "前面": "qian2mian4",
  "后面": "hou4mian4", "旁边": "pang2bian1", "附近": "fu4jin4", "中间": "zhong1jian1",
  "谁": "shei2", "什么": "shen2me", "为什么": "wei4shen2me", "怎么": "zen3me", "怎么样": "zen3me yang4",
  "哪个": "na3ge", "哪一个": "na3yi1ge", "多少": "duo1shao", "几": "ji3", "什么时候": "shen2me shi2hou",
  "怎么了": "zen3me le", "谁的": "shei2de", "什么地方": "shen2me di4fang",
  "个": "ge4", "条": "tiao2", "张": "zhang1", "本": "ben3", "只": "zhi1", "件": "jian4", "台": "tai2",
  "辆": "liang4", "双": "shuang1", "间": "jian1", "位": "wei4", "把": "ba3", "杯": "bei1", "些": "xie1",
  "种": "zhong3", "次": "ci4",
};

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
  const inputRef = useRef<HTMLInputElement>(null);
  const isFrontRef = useRef(side === "front" && !finished);
  isFrontRef.current = side === "front" && !finished;

  const currentWord = words[index] ?? "汉字";
  const correctPinyin = pinyins[currentWord] ?? "pinyin placeholder";
  const translation = translations[currentWord] ?? "перевод placeholder";
  const theoryKey = `cfa-theory-dismissed:${title}`;

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
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [index, side, finished]);

  function keepInputFocused() {
    window.setTimeout(() => {
      if (isFrontRef.current) inputRef.current?.focus();
    }, 0);
  }

  function reveal() {
    setSide("back");
    inputRef.current?.blur();
  }

  function rate() {
    if (index >= words.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setSide("front");
  }

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
    <main className="min-h-screen overflow-hidden bg-[#090909] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_38%),radial-gradient(circle_at_15%_70%,rgba(255,255,255,0.045),transparent_28%)]" />
      <a href="/lessons" className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-2xl leading-none text-white/80 shadow-lg backdrop-blur-2xl transition hover:bg-white/[0.1]" aria-label="Назад">&lt;</a>

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
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35"><span>Cards exerciser</span><span className="h-1 w-1 rounded-full bg-white/25" /><span>{title}</span></div>
            <div className="mt-5 flex w-full max-w-xl items-center gap-3">
              {theory && (
                <button type="button" onClick={() => setTheoryOpen(true)} className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/45 shadow-lg backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white/75" aria-label="Открыть теорию">
                  <BookIcon />
                </button>
              )}
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-white/60 transition-all duration-300" style={{ width: `${((index + 1) / Math.max(words.length, 1)) * 100}%` }} /></div>
              <span className="font-mono text-[10px] text-white/35">{index + 1} / {words.length}</span>
            </div>
          </header>

          <section className="mx-auto mt-5 w-full max-w-3xl">
            <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3"><span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">{side === "front" ? "Front" : "Back"}</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] text-white/35">карточка {index + 1}</span></div>

              {side === "front" ? (
                <div className="px-5 pb-7 pt-8 sm:px-10 sm:pb-8 sm:pt-10">
                  <div className="text-center"><p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Перевод</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{translation}</h1><p className="mt-2 text-sm text-white/30">Напишите китайское слово</p></div>
                  <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 gap-3">
                    {[0, 1].map((slot) => <div key={slot} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/15 bg-black/20"><div className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Hanzi 0{slot + 1}</div><span className="text-center text-xs text-white/25">здесь будем<br />рисовать</span></div>)}
                  </div>
                  <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
                    <div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Pinyin</span><span className="text-[10px] text-white/25">печатайте сразу</span></div>
                    <div className="mt-2 min-h-8 cursor-text border-b border-white/10 pb-1 text-lg tracking-wide text-white/75" onPointerDown={(event) => { event.preventDefault(); inputRef.current?.focus(); }}>{answer || <span className="text-white/20">ping2guo3</span>}<span className="ml-1 inline-block h-5 w-px animate-pulse bg-white/35 align-middle" /></div>
                    <input ref={inputRef} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); reveal(); } }} aria-label="Введите Pinyin" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="text" className="absolute left-0 top-0 h-px w-px opacity-0" onBlur={keepInputFocused} />
                  </div>
                  <div className="mt-4 text-center text-xs text-white/25">Enter / Return → показать ответ</div>
                </div>
              ) : (
                <div className="px-5 pb-7 pt-8 sm:px-10 sm:pb-8">
                  <div className="text-center"><div className="text-6xl font-medium tracking-tight sm:text-7xl">{currentWord}</div><div className="mt-4 text-xl tracking-wide text-white/65">{correctPinyin}</div><div className="mt-2 text-sm text-white/35">{translation}</div></div>
                  <div className="mx-auto mt-7 max-w-xl rounded-3xl border border-white/[0.08] bg-black/20 p-4">
                    <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-white/70">Сравнение Pinyin</h2><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Your answer</span></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3"><div className="text-[9px] uppercase tracking-[0.14em] text-white/25">Ты ввёл</div><div className="mt-2 text-sm text-white/70">{answer || "ничего"}</div></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3"><div className="text-[9px] uppercase tracking-[0.14em] text-white/25">Правильно</div><div className="mt-2 text-sm text-white/70">{correctPinyin}</div></div>
                    </div>
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

          {side === "back" && <section className="mx-auto mt-3 w-full max-w-3xl"><div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-1.5 shadow-xl backdrop-blur-2xl"><div className="mb-1 flex items-center justify-between px-2"><span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Confidence</span><span className="text-[9px] text-white/20">оценка</span></div><div className="grid grid-cols-4 gap-1.5">{[1,2,3,4].map((rating)=><button key={rating} type="button" onClick={rate} className="flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-base transition hover:-translate-y-0.5 hover:bg-white/[0.08]">{rating}</button>)}</div></div></section>}

          <footer className="mx-auto mt-3 flex w-full max-w-3xl items-center justify-between px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/20"><span>Card {index + 1} of {words.length}</span><span>{side === "front" ? "type pinyin → Enter" : "rating → next card"}</span></footer>
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
    </main>
  );
}

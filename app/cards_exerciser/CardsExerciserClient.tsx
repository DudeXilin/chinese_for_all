"use client";

import { useEffect, useRef, useState } from "react";

type Props = { title: string; words: string[] };

const translations: Record<string, string> = {
  "这里": "здесь",
  "那里": "там",
  "这儿": "здесь",
  "那儿": "там",
  "哪里": "где",
  "哪儿": "где",
  "里面": "внутри",
  "外面": "снаружи",
  "上面": "сверху",
  "下面": "снизу",
  "前面": "спереди",
  "后面": "сзади",
  "旁边": "рядом",
  "附近": "поблизости",
  "中间": "посередине",
  "谁": "кто",
  "什么": "что",
  "为什么": "почему",
  "怎么": "как",
  "怎么样": "как, каким образом",
  "哪个": "какой, который",
  "哪一个": "который",
  "多少": "сколько",
  "几": "сколько",
  "什么时候": "когда",
  "怎么了": "что случилось",
  "谁的": "чей",
  "什么地方": "какое место / где",
  "个": "универсальное счётное слово",
  "条": "для длинных и узких предметов",
  "张": "для плоских предметов",
  "本": "для книг и изданий",
  "只": "для животных и отдельных частей пары",
  "件": "для одежды и некоторых вещей",
  "台": "для техники и устройств",
  "辆": "для наземного транспорта",
  "双": "для парных предметов",
  "间": "для комнат и помещений",
  "位": "вежливое счётное слово для людей",
  "把": "для предметов с ручкой или рукояткой",
  "杯": "порция напитка в чашке или стакане",
  "些": "несколько, немного",
  "种": "вид, тип, разновидность",
  "次": "раз, случай",
};

const pinyins: Record<string, string> = {
  "这里": "zhe4li3", "那里": "na4li3", "这儿": "zhe4r", "那儿": "na4r",
  "哪里": "na3li3", "哪儿": "na3r", "里面": "li3mian4", "外面": "wai4mian4",
  "上面": "shang4mian4", "下面": "xia4mian4", "前面": "qian2mian4", "后面": "hou4mian4",
  "旁边": "pang2bian1", "附近": "fu4jin4", "中间": "zhong1jian1",
  "谁": "shei2", "什么": "shen2me", "为什么": "wei4shen2me", "怎么": "zen3me",
  "怎么样": "zen3me yang4", "哪个": "na3ge", "哪一个": "na3yi1ge", "多少": "duo1shao",
  "几": "ji3", "什么时候": "shen2me shi2hou", "怎么了": "zen3me le", "谁的": "shei2de",
  "什么地方": "shen2me di4fang",
  "个": "ge4", "条": "tiao2", "张": "zhang1", "本": "ben3", "只": "zhi1",
  "件": "jian4", "台": "tai2", "辆": "liang4", "双": "shuang1", "间": "jian1",
  "位": "wei4", "把": "ba3", "杯": "bei1", "些": "xie1", "种": "zhong3", "次": "ci4",
};

export default function CardsExerciserClient({ title, words }: Props) {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [answer, setAnswer] = useState("");
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFrontRef = useRef(side === "front" && !finished);
  isFrontRef.current = side === "front" && !finished;

  const currentWord = words[index] ?? "汉字";
  const correctPinyin = pinyins[currentWord] ?? "pinyin placeholder";
  const translation = translations[currentWord] ?? "перевод placeholder";

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
                    <div
                      className="mt-2 min-h-8 cursor-text border-b border-white/10 pb-1 text-lg tracking-wide text-white/75"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        inputRef.current?.focus();
                      }}
                    >{answer || <span className="text-white/20">ping2guo3</span>}<span className="ml-1 inline-block h-5 w-px animate-pulse bg-white/35 align-middle" /></div>
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
    </main>
  );
}

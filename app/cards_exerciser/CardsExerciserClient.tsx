"use client";

import { useState } from "react";

type Props = { title: string; words: string[] };
const examples = ["пример 1", "пример 2", "пример 3"];

export default function CardsExerciserClient({ title, words }: Props) {
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const currentWord = words[0] ?? "汉字";

  return (
    <main className="min-h-screen overflow-hidden bg-[#090909] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_38%),radial-gradient(circle_at_15%_70%,rgba(255,255,255,0.045),transparent_28%)]" />
      <a href="/lessons" className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-2xl leading-none text-white/80 shadow-lg backdrop-blur-2xl transition hover:bg-white/[0.1]" aria-label="Назад">&lt;</a>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-8 pt-5 sm:px-6">
        <header className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
            <span>Cards exerciser</span><span className="h-1 w-1 rounded-full bg-white/25" /><span>{title}</span>
          </div>
          <div className="mt-5 flex w-full max-w-xl items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full w-[7%] rounded-full bg-white/60" /></div>
            <span className="font-mono text-[10px] text-white/35">1 / {words.length}</span>
          </div>
          <div className="mt-5 flex rounded-full border border-white/10 bg-white/[0.05] p-1 backdrop-blur-xl">
            <button type="button" onClick={() => setPreviewSide("front")} className={`rounded-full px-4 py-2 text-xs transition ${previewSide === "front" ? "bg-white text-black" : "text-white/45 hover:text-white/75"}`}>Передняя сторона</button>
            <button type="button" onClick={() => setPreviewSide("back")} className={`rounded-full px-4 py-2 text-xs transition ${previewSide === "back" ? "bg-white text-black" : "text-white/45 hover:text-white/75"}`}>Задняя сторона</button>
          </div>
        </header>

        <section className="mx-auto mt-5 w-full max-w-3xl">
          {previewSide === "front" ? (
            <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">Front</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] text-white/35">{currentWord}</span>
              </div>
              <div className="px-5 pb-8 pt-9 sm:px-10 sm:pb-10 sm:pt-12">
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Перевод</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Перевод слова</h1>
                  <p className="mt-2 text-sm text-white/35">Русский или английский смысл слова</p>
                </div>
                <div className="mx-auto mt-9 grid max-w-xl grid-cols-2 gap-3">
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/15 bg-black/20">
                    <div className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Hanzi 01</div>
                    <span className="text-center text-xs text-white/25">здесь будем<br />рисовать</span>
                  </div>
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/15 bg-black/20">
                    <div className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Hanzi 02</div>
                    <span className="text-center text-xs text-white/25">здесь будем<br />рисовать</span>
                  </div>
                </div>
                <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Pinyin</span>
                    <span className="text-[10px] text-white/25">клавиатура / ввод с телефона</span>
                  </div>
                  <div className="mt-3 min-h-8 border-b border-white/10 pb-2 text-lg tracking-wide text-white/65">
                    <span className="text-white/20">ping2guo3</span><span className="ml-2 inline-block h-5 w-px animate-pulse bg-white/35 align-middle" />
                  </div>
                </div>
                <div className="mt-5 text-center text-xs text-white/25">После ввода Pinyin → Enter → откроется задняя сторона</div>
              </div>
            </article>
          ) : (
            <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">Back</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] text-white/35">Ответ</span>
              </div>
              <div className="px-5 pb-8 pt-8 sm:px-10 sm:pb-10">
                <div className="text-center">
                  <div className="text-6xl font-medium tracking-tight sm:text-7xl">{currentWord}</div>
                  <div className="mt-4 text-xl tracking-wide text-white/65">Pinyin placeholder</div>
                  <div className="mt-2 text-sm text-white/35">Перевод / значение слова</div>
                </div>
                <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-white/70">Информация</h2><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Details</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["Перевод", "Часть речи", "HSK", "Частотность"].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-white/25">{item}</div><div className="mt-2 text-xs text-white/55">placeholder</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mx-auto mt-4 max-w-xl rounded-3xl border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-white/70">Примеры</h2><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Examples</span></div>
                  <div className="mt-3 space-y-2">
                    {examples.map((example) => <div key={example} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">{example}</div>)}
                  </div>
                </div>
              </div>
            </article>
          )}
        </section>

        <section className="mx-auto mt-4 w-full max-w-3xl">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-3 shadow-xl backdrop-blur-2xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Confidence</span>
              <span className="text-[10px] text-white/25">оценка ответа · функция будет подключена позже</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((rating) => (
                <button key={rating} type="button" className="group relative flex min-h-14 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] transition hover:-translate-y-0.5 hover:bg-white/[0.08]">
                  <span className="text-lg font-medium">{rating}</span><span className="text-[9px] uppercase tracking-[0.12em] text-white/25">оценка</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="mx-auto mt-4 flex w-full max-w-3xl items-center justify-between px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/20">
          <span>Card 1 of {words.length}</span><span>rating → next card</span>
        </footer>
      </div>
    </main>
  );
}

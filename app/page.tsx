"use client";

import Link from "next/link";
import { LiquidGlassPanel } from "@/components/liquid-glass";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-visible px-5 py-8 text-[#292824] sm:px-8 lg:px-12 dark:text-[#eeeae2]">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#f4f0e8] dark:bg-[#171817]">
        <div className="pointer-events-none absolute left-[-12%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#d6aaa0]/60 blur-[100px]" />
        <div className="pointer-events-none absolute right-[-8%] top-[15%] h-[480px] w-[480px] rounded-full bg-[#b9c9ad]/55 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-15%] left-[28%] h-[500px] w-[500px] rounded-full bg-[#d8c69f]/50 blur-[120px]" />
        <div className="pointer-events-none absolute left-[35%] top-[35%] h-[260px] w-[260px] rounded-full bg-white/25 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-[0.18em] text-black/70 dark:text-white/75">
            CHINESE FOR ALL ☭
          </div>

          <Link
            href="/profile"
            aria-label="Открыть профиль"
            className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/20 shadow-[0_8px_30px_rgba(80,70,50,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/35 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <span className="text-lg transition-transform duration-300 group-hover:scale-110">
              ◉
            </span>
          </Link>
        </header>

        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <div className="w-full">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Open • Free • For Everyone
            </p>

            <h1 className="mx-auto mt-8 w-full max-w-[1100px] text-center font-extrabold leading-[1.15] tracking-tight">
              <span className="block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)]">
                CHINESE FREE FOR EVERYONE ☭
              </span>
              <span className="mt-3 block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)]">
                КИТАЙСКИЙ БЕСПЛАТНО ДЛЯ ВСЕХ ☭
              </span>
              <span className="mt-3 block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)] tracking-[0.08em]">
                全民免费学习中文 ☭
              </span>
            </h1>

            <div className="mx-auto mt-20 grid max-w-5xl gap-5 sm:grid-cols-3">
              <div className="group min-h-56 rounded-[2rem] border border-white/55 bg-white/20 p-7 text-left shadow-[0_20px_60px_rgba(80,70,50,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/30 dark:border-white/[0.1] dark:bg-white/[0.045] dark:hover:bg-white/[0.08]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-xl shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]">
                    文
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">01</span>
                </div>
                <div className="mt-12">
                  <p className="text-xl font-semibold">1000 самых нужных слов</p>
                  <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">Карточки для изучения китайского языка</p>
                </div>
              </div>

              <div className="group min-h-56 rounded-[2rem] border border-white/55 bg-white/20 p-7 text-left shadow-[0_20px_60px_rgba(80,70,50,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/30 dark:border-white/[0.1] dark:bg-white/[0.045] dark:hover:bg-white/[0.08]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-xl shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]">学</div>
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">02</span>
                </div>
                <div className="mt-12">
                  <p className="text-xl font-semibold">Учись в своём ритме</p>
                  <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">Простая среда без рекламы и платных стен</p>
                </div>
              </div>

              <div className="group min-h-56 rounded-[2rem] border border-white/55 bg-white/20 p-7 text-left shadow-[0_20px_60px_rgba(80,70,50,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/30 dark:border-white/[0.1] dark:bg-white/[0.045] dark:hover:bg-white/[0.08]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-xl shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]">☯</div>
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">03</span>
                </div>
                <div className="mt-12">
                  <p className="text-xl font-semibold">Твой прогресс</p>
                  <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">Сколько уже знаешь и сколько ещё впереди</p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-20 max-w-2xl text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
              <p>Это среда с карточками для изучения китайского. Всё бесплатно, код открытый. Есть всё необходимое.</p>
              <p className="mt-5 font-semibold text-black/75 dark:text-white/75">В помойку мошенников! Знания — бесценны!</p>
            </div>

            <LiquidGlassPanel className="mx-auto mt-20 max-w-3xl overflow-hidden rounded-[2.5rem]">
              <div className="px-8 py-12">
                <div className="text-5xl opacity-80">🗑️</div>
                <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-black/45 dark:text-white/45">Всё лишнее отправляется сюда</p>
                <p className="mt-3 text-sm text-black/50 dark:text-white/50">Google · Duolingo · App Store · 💵 · ₽</p>
              </div>
            </LiquidGlassPanel>

            <div className="mx-auto mt-20 max-w-2xl pb-12">
              <p className="text-sm leading-6 text-black/45 dark:text-white/45">
                Проект открыт для всех. Предлагай изменения, улучшения и новые идеи через GitHub. Каждый, кто внесёт вклад, будет указан среди участников проекта и получит свою красивую медаль.
              </p>
              <a
                href="https://github.com/DudeXilin/chinese_for_all"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center rounded-full border border-white/55 bg-white/20 px-6 py-3 text-sm font-medium shadow-[0_12px_35px_rgba(80,70,50,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/35 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                GitHub проекта →
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

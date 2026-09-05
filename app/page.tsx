"use client";

import Link from "next/link";
import { LiquidGlassPanel } from "@/components/liquid-glass";

function FeatureCard({
  icon,
  number,
  title,
  description,
}: {
  icon: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <LiquidGlassPanel className="min-h-56 overflow-hidden rounded-[2rem] transition-transform duration-500 hover:-translate-y-1">
      <div className="flex h-full min-h-56 flex-col p-7 text-left">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/20 text-xl dark:border-white/10 dark:bg-white/[0.07]">
            {icon}
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">
            {number}
          </span>
        </div>

        <div className="mt-auto pt-12">
          <p className="text-xl font-semibold">{title}</p>
          <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">
            {description}
          </p>
        </div>
      </div>
    </LiquidGlassPanel>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-visible px-5 py-8 text-[#292824] sm:px-8 lg:px-12 dark:text-[#eeeae2]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f4f0e8] dark:bg-[#171817]">
        <img
          src="/liquid-glass-bg.webp"
          alt=""
          draggable={false}
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-white/20 dark:bg-black/25" />
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
            <span className="text-lg transition-transform duration-300 group-hover:scale-110">◉</span>
          </Link>
        </header>

        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <div className="w-full">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Open • Free • For Everyone
            </p>

            <h1 className="mx-auto mt-8 w-full max-w-[1100px] text-center font-extrabold leading-[1.15] tracking-tight">
              <span className="block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)]">CHINESE FREE FOR EVERYONE ☭</span>
              <span className="mt-3 block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)]">КИТАЙСКИЙ БЕСПЛАТНО ДЛЯ ВСЕХ ☭</span>
              <span className="mt-3 block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)] tracking-[0.08em]">全民免费学习中文 ☭</span>
            </h1>

            <div className="mx-auto mt-20 grid max-w-5xl gap-5 sm:grid-cols-3">
              <FeatureCard icon="文" number="01" title="1000 самых нужных слов" description="Карточки для изучения китайского языка" />
              <FeatureCard icon="学" number="02" title="Учись в своём ритме" description="Простая среда без рекламы и платных стен" />
              <FeatureCard icon="☯" number="03" title="Твой прогресс" description="Сколько уже знаешь и сколько ещё впереди" />
            </div>

            <div className="mx-auto mt-20 max-w-2xl text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
              <p>Это среда с карточками для изучения китайского. Всё бесплатно, код открытый. Есть всё необходимое.</p>
              <p className="mt-5 font-semibold text-black/75 dark:text-white/75">В помойку мошенников! Знания — бесценны!</p>
            </div>

            <div className="mx-auto mt-20 max-w-3xl">
              <LiquidGlassPanel className="overflow-hidden rounded-[2.5rem]">
                <div className="px-8 py-12">
                  <div className="text-5xl opacity-80">🗑️</div>
                  <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-black/45 dark:text-white/45">Всё лишнее отправляется сюда</p>
                  <p className="mt-3 text-sm text-black/50 dark:text-white/50">Google · Duolingo · App Store · 💵 · ₽</p>
                </div>
              </LiquidGlassPanel>
            </div>

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

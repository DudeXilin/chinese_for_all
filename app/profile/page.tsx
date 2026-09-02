"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LiquidGlassPanel } from "@/components/liquid-glass";

export default function ProfilePage() {
  const [email, setEmail] = useState("Загрузка...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "Пользователь");
      } else {
        window.location.href = "/";
      }

      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
      {/* Мягкие цветовые пятна за стеклом */}
      <div className="pointer-events-none absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-[#d9b7aa]/35 blur-3xl dark:bg-[#9b6f68]/20" />
      <div className="pointer-events-none absolute right-[-5%] top-[20%] h-96 w-96 rounded-full bg-[#b9c9ae]/35 blur-3xl dark:bg-[#718269]/15" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[35%] h-80 w-80 rounded-full bg-[#d8c9a9]/30 blur-3xl dark:bg-[#82775e]/15" />

      <div className="relative mx-auto max-w-5xl">
        {/* Верхняя панель */}
        <header className="flex items-center justify-between">
          <a
            href="/"
            className="text-sm font-semibold tracking-[0.18em] text-black/70 dark:text-white/75"
          >
            CHINESE FOR ALL ☭
          </a>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/30 text-sm font-medium shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            ☯
          </div>
        </header>

        {/* Профиль */}
        <section className="mx-auto max-w-3xl py-16 sm:py-24">
          <div className="mb-8 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Ваше пространство
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Профиль
            </h1>
          </div>

          {/* Главное стекло */}
          <LiquidGlassPanel
            className="rounded-[2rem] border border-white/30 bg-white/[0.08] p-7 shadow-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-10"
          >
            {/* Пользователь */}
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/20 text-3xl shadow-lg">
                {loading ? "…" : "☯"}
              </div>

              <div className="mt-5 sm:ml-7 sm:mt-0">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/40 dark:text-white/40">
                  Пользователь
                </p>

                <p className="mt-2 break-all text-xl font-semibold sm:text-2xl">
                  {email}
                </p>
              </div>
            </div>

            {/* Разделитель */}
            <div className="my-9 h-px bg-black/[0.08] dark:bg-white/[0.08]" />

            {/* Статистика */}
            <div className="grid gap-4 sm:grid-cols-2">
              <LiquidGlassPanel
                className="rounded-[1.5rem] border border-white/25 bg-white/[0.08] p-6 dark:border-white/10 dark:bg-white/[0.035]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
                  Выучено
                </p>

                <p className="mt-4 text-5xl font-semibold tracking-tight">
                  0
                </p>

                <p className="mt-2 text-sm text-black/45 dark:text-white/45">
                  слов
                </p>
              </LiquidGlassPanel>

              <LiquidGlassPanel
                className="rounded-[1.5rem] border border-white/25 bg-white/[0.08] p-6 dark:border-white/10 dark:bg-white/[0.035]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
                  Прогресс
                </p>

                <p className="mt-4 text-5xl font-semibold tracking-tight">
                  0%
                </p>

                <p className="mt-2 text-sm text-black/45 dark:text-white/45">
                  0 из 1000 слов
                </p>
              </LiquidGlassPanel>
            </div>

            {/* Прогресс */}
            <div className="mt-7 rounded-[1.5rem] border border-white/20 bg-white/[0.06] p-6 dark:border-white/[0.08] dark:bg-white/[0.025]">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">1000 самых частых слов</span>
                <span className="text-black/40 dark:text-white/40">
                  0 / 1000
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.08]">
                <div className="h-full w-0 rounded-full bg-[#b85c5c]/75" />
              </div>
            </div>

            {/* Выход */}
            <button
              onClick={handleLogout}
              className="mt-8 w-full rounded-full border border-black/[0.08] bg-white/[0.08] px-6 py-4 text-sm font-medium transition-all hover:bg-white/[0.18] dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.09]"
            >
              Выйти из аккаунта
            </button>
          </LiquidGlassPanel>
        </section>
      </div>
    </main>
  );
}

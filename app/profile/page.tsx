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
    <main className="relative min-h-screen bg-[#f4f0e8] px-5 py-8 text-[#292824] sm:px-8 lg:px-12 dark:bg-[#171817] dark:text-[#eeeae2]">
      {/* Мягкий фон */}
      <div className="pointer-events-none fixed left-[-12%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#d6aaa0]/45 blur-[100px]" />

      <div className="pointer-events-none fixed right-[-8%] top-[15%] h-[480px] w-[480px] rounded-full bg-[#b9c9ad]/40 blur-[110px]" />

      <div className="pointer-events-none fixed bottom-[-15%] left-[28%] h-[500px] w-[500px] rounded-full bg-[#d8c69f]/35 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Верхняя панель */}
        <header className="flex items-center justify-between">
          <a
            href="/"
            className="text-sm font-semibold tracking-[0.18em] text-black/60 transition-opacity hover:opacity-70 dark:text-white/65"
          >
            CHINESE FOR ALL ☭
          </a>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/25 text-lg shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
            ☯
          </div>
        </header>

        {/* Заголовок */}
        <section className="mx-auto max-w-3xl py-16 sm:py-24">
          <div className="mb-8 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Ваше пространство
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Профиль
            </h1>
          </div>

          {/* ЕДИНСТВЕННЫЙ настоящий Liquid Glass */}
          <LiquidGlassPanel className="p-7 sm:p-10">
            {/* Пользователь */}
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/20 text-3xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-md dark:border-white/15 dark:bg-white/10">
                {loading ? "…" : "☯"}
              </div>

              <div className="mt-5 min-w-0 sm:ml-7 sm:mt-0">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/40 dark:text-white/40">
                  Пользователь
                </p>

                <p className="mt-2 break-all text-xl font-semibold sm:text-2xl">
                  {email}
                </p>
              </div>
            </div>

            {/* Разделитель */}
            <div className="my-9 h-px bg-white/45 dark:bg-white/10" />

            {/* Статистика */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/45 bg-white/20 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
                  Выучено
                </p>

                <p className="mt-4 text-5xl font-semibold tracking-tight">
                  0
                </p>

                <p className="mt-2 text-sm text-black/45 dark:text-white/45">
                  слов
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/45 bg-white/20 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
                  Прогресс
                </p>

                <p className="mt-4 text-5xl font-semibold tracking-tight">
                  0%
                </p>

                <p className="mt-2 text-sm text-black/45 dark:text-white/45">
                  0 из 1000 слов
                </p>
              </div>
            </div>

            {/* Курс */}
            <div className="mt-7 rounded-[1.5rem] border border-white/40 bg-white/15 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">
                  1000 самых частых слов
                </span>

                <span className="text-black/40 dark:text-white/40">
                  0 / 1000
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <div className="h-full w-0 rounded-full bg-[#b85c5c]/75" />
              </div>
            </div>

            {/* Выход */}
            <button
              onClick={handleLogout}
              className="mt-8 w-full rounded-full border border-white/40 bg-white/15 px-6 py-4 text-sm font-medium shadow-sm backdrop-blur-xl transition-all hover:bg-white/25 active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.1]"
            >
              Выйти из аккаунта
            </button>
          </LiquidGlassPanel>
        </section>
      </div>
    </main>
  );
}

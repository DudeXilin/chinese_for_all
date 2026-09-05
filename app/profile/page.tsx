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
      if (data.user) setEmail(data.user.email ?? "Пользователь");
      else window.location.href = "/";
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="relative h-screen overflow-hidden text-[#292824] dark:text-[#eeeae2]">
      <div className="relative h-full overflow-y-auto overscroll-contain">
        <img
          src="/liquid-glass-bg.webp"
          alt=""
          draggable={false}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 z-0 bg-white/15 dark:bg-black/20" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(0,0,0,0.22)_100%)]" />

        <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
          <a
            href="/"
            className="rounded-full border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-black/65 shadow-sm backdrop-blur-xl transition-opacity hover:opacity-70 dark:border-white/15 dark:bg-black/10 dark:text-white/70"
          >
            CHINESE FOR ALL ☭
          </a>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/20 text-lg shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-black/10">
            ☯
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-3xl px-5 py-10 text-center sm:px-8 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-black/50 dark:text-white/55">
            Ваше пространство
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight drop-shadow-sm sm:text-5xl">
            Профиль
          </h1>
        </div>

        <LiquidGlassPanel className="relative z-10 mx-auto mb-20 w-[calc(100%-2.5rem)] max-w-3xl rounded-[2rem] sm:w-[calc(100%-4rem)]">
          <div className="p-7 sm:p-10">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/15 text-3xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:border-white/15 dark:bg-white/5">
                {loading ? "…" : "☯"}
              </div>
              <div className="mt-5 min-w-0 sm:ml-7 sm:mt-0">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/40 dark:text-white/40">
                  Пользователь
                </p>
                <p className="mt-2 break-all text-xl font-semibold sm:text-2xl">{email}</p>
              </div>
            </div>

            <div className="my-9 h-px bg-white/40 dark:bg-white/10" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/40 bg-white/15 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">Выучено</p>
                <p className="mt-4 text-5xl font-semibold tracking-tight">0</p>
                <p className="mt-2 text-sm text-black/45 dark:text-white/45">слов</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/40 bg-white/15 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">Прогресс</p>
                <p className="mt-4 text-5xl font-semibold tracking-tight">0%</p>
                <p className="mt-2 text-sm text-black/45 dark:text-white/45">0 из 1000 слов</p>
              </div>
            </div>

            <div className="mt-7 rounded-[1.5rem] border border-white/35 bg-white/10 p-6 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">1000 самых частых слов</span>
                <span className="text-black/40 dark:text-white/40">0 / 1000</span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <div className="h-full w-0 rounded-full bg-[#b85c5c]/75" />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-8 w-full rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm font-medium shadow-sm transition-all hover:bg-white/20 active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.09]"
            >
              Выйти из аккаунта
            </button>
          </div>
        </LiquidGlassPanel>
      </div>
    </main>
  );
}

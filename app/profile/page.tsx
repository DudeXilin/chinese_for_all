"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_LIQUID_GLASS_CONFIG,
  LiquidGlassPanel,
  type LiquidGlassConfig,
} from "@/components/liquid-glass";

type SliderConfig = {
  key: keyof LiquidGlassConfig;
  label: string;
  min: number;
  max: number;
  step: number;
};

const SLIDERS: SliderConfig[] = [
  { key: "blurAmount", label: "Blur", min: 0, max: 1, step: 0.01 },
  { key: "refraction", label: "Refraction", min: 0, max: 2, step: 0.01 },
  { key: "chromAberration", label: "Chromatic aberration", min: 0, max: 0.5, step: 0.01 },
  { key: "edgeHighlight", label: "Edge highlight", min: 0, max: 1, step: 0.01 },
  { key: "specular", label: "Specular", min: 0, max: 1, step: 0.01 },
  { key: "fresnel", label: "Fresnel", min: 0, max: 2, step: 0.01 },
  { key: "distortion", label: "Distortion", min: 0, max: 0.5, step: 0.01 },
  { key: "cornerRadius", label: "Corner radius", min: 0, max: 100, step: 1 },
  { key: "zRadius", label: "Z radius / bevel depth", min: 0, max: 100, step: 1 },
  { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
  { key: "saturation", label: "Saturation", min: -1, max: 1, step: 0.01 },
  { key: "tintStrength", label: "Tint strength", min: 0, max: 1, step: 0.01 },
  { key: "brightness", label: "Brightness", min: -0.5, max: 0.5, step: 0.01 },
  { key: "shadowOpacity", label: "Shadow opacity", min: 0, max: 1, step: 0.01 },
  { key: "shadowSpread", label: "Shadow spread", min: 0, max: 50, step: 1 },
  { key: "shadowOffsetY", label: "Shadow Y offset", min: -30, max: 50, step: 1 },
];

function formatValue(value: number, step: number) {
  return step >= 1 ? value.toFixed(0) : value.toFixed(2);
}

export default function ProfilePage() {
  const [email, setEmail] = useState("Загрузка...");
  const [loading, setLoading] = useState(true);
  const [glassConfig, setGlassConfig] = useState<LiquidGlassConfig>(DEFAULT_LIQUID_GLASS_CONFIG);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? "Пользователь");
      else window.location.href = "/";
      setLoading(false);
    });
  }, []);

  function updateGlassValue(key: keyof LiquidGlassConfig, value: number) {
    setGlassConfig((current) => ({ ...current, [key]: value }));
  }

  function updateBoolean(key: "floating" | "button", value: boolean) {
    setGlassConfig((current) => ({ ...current, [key]: value }));
  }

  function updateBevelMode(value: 0 | 1) {
    setGlassConfig((current) => ({ ...current, bevelMode: value }));
  }

  function resetGlassConfig() {
    setGlassConfig(DEFAULT_LIQUID_GLASS_CONFIG);
    setCopied(false);
  }

  async function copyGlassConfig() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(glassConfig, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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
          <a href="/" className="rounded-full border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-black/65 shadow-sm backdrop-blur-xl transition-opacity hover:opacity-70 dark:border-white/15 dark:bg-black/10 dark:text-white/70">
            CHINESE FOR ALL ☭
          </a>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/20 text-lg shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-black/10">☯</div>
        </header>

        <div className="relative z-10 mx-auto max-w-3xl px-5 py-10 text-center sm:px-8 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-black/50 dark:text-white/55">Ваше пространство</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight drop-shadow-sm sm:text-5xl">Профиль</h1>
        </div>

        <LiquidGlassPanel config={glassConfig} className="relative z-10 mx-auto mb-20 w-[calc(100%-2.5rem)] max-w-3xl rounded-[2rem] sm:w-[calc(100%-4rem)]">
          <div className="p-7 sm:p-10">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/15 text-3xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:border-white/15 dark:bg-white/5">{loading ? "…" : "☯"}</div>
              <div className="mt-5 min-w-0 sm:ml-7 sm:mt-0">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/40 dark:text-white/40">Пользователь</p>
                <p className="mt-2 break-all text-xl font-semibold sm:text-2xl">{email}</p>
              </div>
            </div>
            <div className="my-9 h-px bg-white/40 dark:bg-white/10" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/40 bg-white/15 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.04]"><p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">Выучено</p><p className="mt-4 text-5xl font-semibold tracking-tight">0</p><p className="mt-2 text-sm text-black/45 dark:text-white/45">слов</p></div>
              <div className="rounded-[1.5rem] border border-white/40 bg-white/15 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.04]"><p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 dark:text-white/40">Прогресс</p><p className="mt-4 text-5xl font-semibold tracking-tight">0%</p><p className="mt-2 text-sm text-black/45 dark:text-white/45">0 из 1000 слов</p></div>
            </div>
            <div className="mt-7 rounded-[1.5rem] border border-white/35 bg-white/10 p-6 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium">1000 самых частых слов</span><span className="text-black/40 dark:text-white/40">0 / 1000</span></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"><div className="h-full w-0 rounded-full bg-[#b85c5c]/75" /></div>
            </div>
            <button onClick={handleLogout} className="mt-8 w-full rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm font-medium shadow-sm transition-all hover:bg-white/20 active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.09]">Выйти из аккаунта</button>
          </div>
        </LiquidGlassPanel>
      </div>

      <aside className="fixed right-4 top-4 z-50 flex max-h-[calc(100vh-2rem)] w-[350px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/40 bg-white/35 shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/30">
        <div className="shrink-0 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">Developer tool</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Liquid Glass</h2></div><button onClick={resetGlassConfig} className="rounded-full border border-black/10 bg-white/40 px-3 py-1.5 text-[10px] font-medium transition hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15">Сбросить</button></div>
          <p className="mt-2 text-xs leading-5 text-black/45 dark:text-white/45">Меняй параметры и наблюдай за стеклом слева.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="space-y-5">
            {SLIDERS.map((slider) => { const value = glassConfig[slider.key]; if (typeof value !== "number") return null; return <div key={slider.key}><div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-xs font-medium">{slider.label}</label><span className="min-w-[52px] rounded-full bg-black/[0.05] px-2.5 py-1 text-center font-mono text-[10px] text-black/60 dark:bg-white/[0.07] dark:text-white/60">{formatValue(value, slider.step)}</span></div><input type="range" min={slider.min} max={slider.max} step={slider.step} value={value} onChange={(event) => updateGlassValue(slider.key, Number(event.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-black dark:bg-white/10 dark:accent-white" /><div className="mt-0.5 flex justify-between text-[9px] text-black/25 dark:text-white/25"><span>{formatValue(slider.min, slider.step)}</span><span>{formatValue(slider.max, slider.step)}</span></div></div>; })}
          </div>
          <div className="mt-6 space-y-3 border-t border-black/10 pt-5 dark:border-white/10">
            <label className="flex items-center justify-between gap-4 text-xs font-medium"><span>Floating</span><input type="checkbox" checked={glassConfig.floating} onChange={(event) => updateBoolean("floating", event.target.checked)} className="h-4 w-4 accent-black dark:accent-white" /></label>
            <label className="flex items-center justify-between gap-4 text-xs font-medium"><span>Button mode</span><input type="checkbox" checked={glassConfig.button} onChange={(event) => updateBoolean("button", event.target.checked)} className="h-4 w-4 accent-black dark:accent-white" /></label>
            <div><p className="mb-2 text-xs font-medium">Bevel mode</p><div className="grid grid-cols-2 gap-2"><button onClick={() => updateBevelMode(0)} className={`rounded-xl border px-3 py-2 text-xs transition ${glassConfig.bevelMode === 0 ? "border-black/30 bg-black/10 dark:border-white/30 dark:bg-white/10" : "border-black/10 bg-white/20 dark:border-white/10 dark:bg-white/5"}`}>Standard</button><button onClick={() => updateBevelMode(1)} className={`rounded-xl border px-3 py-2 text-xs transition ${glassConfig.bevelMode === 1 ? "border-black/30 bg-black/10 dark:border-white/30 dark:bg-white/10" : "border-black/10 bg-white/20 dark:border-white/10 dark:bg-white/5"}`}>Convex</button></div></div>
          </div>
          <button onClick={copyGlassConfig} className="mt-6 w-full rounded-xl border border-black/10 bg-white/30 px-4 py-3 text-xs font-medium transition hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">{copied ? "Скопировано" : "Копировать конфигурацию"}</button>
        </div>
      </aside>
    </main>
  );
}

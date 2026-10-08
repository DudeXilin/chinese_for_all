"use client";

import { useEffect, useState } from "react";

type HintSource = "user" | "developer" | "make_me_a_hanzi" | "none";

type Props = {
  itemKey: string;
  className?: string;
};

export default function Hint({ itemKey, className = "" }: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const [developerHint, setDeveloperHint] = useState<string | null>(null);
  const [source, setSource] = useState<HintSource>("none");
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"user" | "developer">("user");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/hints?itemKey=${encodeURIComponent(itemKey)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setHint(typeof data.hint === "string" ? data.hint : null);
        setDeveloperHint(typeof data.developerHint === "string" ? data.developerHint : null);
        setSource(data.source ?? "none");
        setAuthenticated(data.authenticated === true);
        setIsAdmin(data.isAdmin === true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [itemKey]);

  function beginEdit(nextMode: "user" | "developer") {
    if (nextMode === "user" && !authenticated) return;
    setMode(nextMode);
    setDraft(nextMode === "user" ? (source === "user" ? hint ?? "" : "") : developerHint ?? "");
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey, hint: draft, mode }),
      });
      if (!response.ok) throw new Error("Hint save failed");

      const data = await response.json();
      const refreshed = await fetch(`/api/hints?itemKey=${encodeURIComponent(itemKey)}`, { cache: "no-store" });
      if (refreshed.ok) {
        const next = await refreshed.json();
        setHint(typeof next.hint === "string" ? next.hint : null);
        setDeveloperHint(typeof next.developerHint === "string" ? next.developerHint : null);
        setSource(next.source ?? "none");
      } else {
        setHint(data.hint ?? null);
        setSource(data.source ?? "none");
      }
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  const label = source === "developer" ? "Подсказка разработчика" : source === "make_me_a_hanzi" ? "Этимология" : "Подсказка";

  return (
    <div className={`mx-auto mt-4 w-full max-w-xl ${className}`}>
      {!editing ? (
        <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/25">{label}</span>
            {source !== "none" && <span className="text-[9px] text-white/15">·</span>}
            {source === "user" && <span className="text-[9px] text-white/25">личная</span>}
          </div>
          <button
            type="button"
            onClick={() => beginEdit("user")}
            disabled={!authenticated}
            className={`mt-1 w-full text-left text-sm leading-6 ${hint ? "text-white/55" : "text-white/20"} ${authenticated ? "cursor-text hover:text-white/75" : "cursor-default"}`}
            aria-label={authenticated ? "Изменить личную подсказку" : "Войдите, чтобы добавить личную подсказку"}
          >
            {hint || (authenticated ? "Нажмите, чтобы добавить подсказку…" : "Войдите, чтобы добавить личную подсказку")}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => beginEdit("developer")}
              className="mt-2 text-[9px] uppercase tracking-[0.14em] text-white/20 transition hover:text-white/55"
            >
              Редактировать подсказку разработчика
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.1] bg-black/20 p-3">
          {isAdmin && (
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => beginEdit("user")} className={`rounded-lg px-2.5 py-1 text-[10px] ${mode === "user" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Личная</button>
              <button type="button" onClick={() => beginEdit("developer")} className={`rounded-lg px-2.5 py-1 text-[10px] ${mode === "developer" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Разработчик</button>
            </div>
          )}
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Введите подсказку…"
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm leading-6 text-white/75 outline-none placeholder:text-white/20 focus:border-white/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} disabled={busy} className="rounded-xl px-3 py-1.5 text-xs text-white/35 hover:text-white/60">Отмена</button>
            <button type="button" onClick={() => void save()} disabled={busy} className="rounded-xl border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs text-white/65 hover:bg-white/[0.12] disabled:opacity-40">{busy ? "Сохранение…" : "Сохранить"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

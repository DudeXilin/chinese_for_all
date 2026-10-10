"use client";

import { useEffect, useRef, useState } from "react";

type HintSource = "user" | "developer" | "make_me_a_hanzi" | "none";

type Props = {
  itemKey: string;
  className?: string;
};

const MAX_USER_HINT_LENGTH = 100;

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
  const [warning, setWarning] = useState<string | null>(null);
  const [saveShake, setSaveShake] = useState(false);
  const saveCooldownUntilRef = useRef(0);

  async function loadHint() {
    const response = await fetch(`/api/hints?itemKey=${encodeURIComponent(itemKey)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setHint(typeof data.hint === "string" ? data.hint : null);
    setDeveloperHint(typeof data.developerHint === "string" ? data.developerHint : null);
    setSource(data.source ?? "none");
    setAuthenticated(data.authenticated === true);
    setIsAdmin(data.isAdmin === true);
  }

  useEffect(() => {
    loadHint().catch(() => {});
  }, [itemKey]);

  function beginEdit(nextMode: "user" | "developer") {
    if (nextMode === "user" && !authenticated) return;
    if (nextMode === "developer" && !isAdmin) return;
    setMode(nextMode);
    setDraft(nextMode === "user" ? (source === "user" ? hint ?? "" : "") : developerHint ?? "");
    setWarning(null);
    setEditing(true);
  }

  function triggerSaveWarning(message: string) {
    setWarning(message);
    setSaveShake(false);
    requestAnimationFrame(() => setSaveShake(true));
    window.setTimeout(() => setSaveShake(false), 450);
  }

  async function save() {
    const length = Array.from(draft).length;

    if (mode === "user") {
      if (length > MAX_USER_HINT_LENGTH) {
        triggerSaveWarning(`Слишком длинная заметка :( Вы ввели ${length} символов, а максимально можно только 100`);
        return;
      }

      const now = Date.now();
      if (now < saveCooldownUntilRef.current) {
        triggerSaveWarning("Пожалуйста, подождите 5 секунд :)");
        return;
      }
    }

    setBusy(true);
    try {
      const response = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey, hint: draft, mode }),
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => null);
        const retryAfterMs = typeof data?.retryAfterMs === "number" ? data.retryAfterMs : 10_000;
        saveCooldownUntilRef.current = Date.now() + retryAfterMs;
        triggerSaveWarning("Пожалуйста, подождите 5 секунд :)");
        return;
      }

      if (response.status === 400) {
        const data = await response.json().catch(() => null);
        if (data?.error === "Hint too long") {
          const serverLength = typeof data.length === "number" ? data.length : length;
          triggerSaveWarning(`Слишком длинная заметка :( Вы ввели ${serverLength} символов, а максимально можно только 100`);
          return;
        }
      }

      if (!response.ok) throw new Error("Hint save failed");

      if (mode === "user") {
        saveCooldownUntilRef.current = Date.now() + 10_000;
      }

      await loadHint();
      setEditing(false);
      setWarning(null);
    } catch {
      setWarning("Не удалось сохранить заметку. Попробуйте ещё раз.");
      setSaveShake(false);
      requestAnimationFrame(() => setSaveShake(true));
      window.setTimeout(() => setSaveShake(false), 450);
    } finally {
      setBusy(false);
    }
  }

  const label =
    source === "developer"
      ? "Подсказка разработчика"
      : source === "make_me_a_hanzi"
        ? "Этимология"
        : "Подсказка";

  const displayedHint = hint || (authenticated ? "Нажмите, чтобы добавить подсказку…" : "Войдите, чтобы добавить личную подсказку");
  const canEditCurrent = source === "developer" ? isAdmin : authenticated;
  const pencilMode = source === "developer" && isAdmin ? "developer" : "user";
  const draftLength = Array.from(draft).length;
  const userDraftTooLong = mode === "user" && draftLength > MAX_USER_HINT_LENGTH;
  const displayedTextIsPlaceholder = !hint && authenticated;

  return (
    <div className={`mx-auto mt-4 w-full max-w-[570px] min-w-0 px-3 sm:px-0 ${className}`}>
      {!editing ? (
        <div className="relative inline-block w-fit min-w-[190px] max-w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/25">{label}</span>
            {source !== "none" && <span className="text-[9px] text-white/15">·</span>}
            {source === "user" && <span className="text-[9px] text-white/25">личная</span>}
          </div>

          <div className={`mt-1 whitespace-pre-wrap break-words pr-9 text-[18px] leading-6 ${hint ? "text-white/55" : "text-white/20"}`}>
            {displayedHint}
          </div>

          {canEditCurrent && (
            <button
              type="button"
              onClick={() => beginEdit(pencilMode)}
              className="absolute bottom-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg text-base text-white/25 transition hover:bg-white/[0.08] hover:text-white/70"
              aria-label={pencilMode === "developer" ? "Редактировать подсказку разработчика" : "Редактировать личную подсказку"}
              title={pencilMode === "developer" ? "Редактировать подсказку разработчика" : "Редактировать личную подсказку"}
            >
              ✎
            </button>
          )}

          {!hint && authenticated && (
            <button
              type="button"
              onClick={() => beginEdit("user")}
              className="absolute inset-0 z-10 rounded-2xl"
              aria-label="Добавить личную подсказку"
            />
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl border border-white/[0.1] bg-black/20 p-3">
          {isAdmin && (
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => beginEdit("user")} className={`rounded-lg px-2.5 py-1 text-[10px] ${mode === "user" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Личная</button>
              <button type="button" onClick={() => beginEdit("developer")} className={`rounded-lg px-2.5 py-1 text-[10px] ${mode === "developer" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Разработчик</button>
            </div>
          )}

          <div className="relative">
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Введите подсказку…"
              className={`w-full resize-none rounded-xl border bg-white/[0.035] px-3 pb-7 pt-2 text-[18px] leading-6 text-white/75 outline-none placeholder:text-white/20 ${userDraftTooLong ? "border-red-400/35" : "border-white/[0.08] focus:border-white/20"}`}
            />
            {mode === "user" && (
              <span className={`pointer-events-none absolute bottom-2 right-3 text-[10px] tabular-nums ${userDraftTooLong ? "text-red-300/75" : "text-white/25"}`}>
                {draftLength}/100
              </span>
            )}
          </div>

          {warning && (
            <div className="mt-2 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-3 py-2 text-xs leading-5 text-red-200/80" role="alert">
              {warning}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} disabled={busy} className="rounded-xl px-3 py-1.5 text-xs text-white/35 hover:text-white/60">Отмена</button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className={`rounded-xl border px-3 py-1.5 text-xs transition ${userDraftTooLong ? "border-red-400/25 bg-red-500/[0.10] text-red-200/75 hover:bg-red-500/[0.16]" : "border-white/10 bg-white/[0.08] text-white/65 hover:bg-white/[0.12]"} ${saveShake ? "animate-[hint-save-shake_0.42s_ease-in-out]" : ""} disabled:opacity-40`}
            >
              {busy ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export function ProfileSettings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function closeConfirmation() {
    if (submitting) return;
    setConfirmOpen(false);
    setConfirmation("");
    setError("");
  }

  async function resetStatistics() {
    if (confirmation !== "Уверен" || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/profile/reset-fsrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "Не удалось сбросить статистику.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-xl transition hover:bg-white/15"
      >
        Настройки
      </button>

      {settingsOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSettingsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-settings-title"
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#171717] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="profile-settings-title" className="text-lg font-semibold text-white">Настройки</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white/70 hover:bg-white/15 hover:text-white"
                aria-label="Закрыть"
              >×</button>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmation("");
                setError("");
                setConfirmOpen(true);
              }}
              className="w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              Сбросить статистику
              <span className="mt-1 block text-xs font-normal text-red-100/60">
                Удалить все данные личного прогресса FSRS
              </span>
            </button>
          </section>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-fsrs-title"
            className="w-full max-w-md rounded-3xl border border-red-300/20 bg-[#191515] p-5 shadow-2xl"
          >
            <h2 id="reset-fsrs-title" className="text-lg font-semibold text-white">
              Вы уверены?
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Эти данные больше никогда нельзя будет восстановить.
              Для подтверждения напишите <strong className="text-white">«Уверен»</strong>.
            </p>
            <label htmlFor="reset-fsrs-confirmation" className="mt-4 block text-xs text-white/55">
              Введите «Уверен» с большой буквы
            </label>
            <input
              id="reset-fsrs-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={submitting}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-50"
              placeholder="Уверен"
            />
            {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={resetStatistics}
                disabled={confirmation !== "Уверен" || submitting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {submitting ? "Удаление…" : "Подтвердить"}
              </button>
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={submitting}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

"use client";

import { useMemo, useState } from "react";

type FSRSCard = {
  word: string;
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
};

const stateNames: Record<number, string> = {
  0: "Новое",
  1: "Изучение",
  2: "Повторение",
  3: "Переизучение",
};

function formatDue(due: string) {
  const diff = new Date(due).getTime() - Date.now();
  if (diff <= 0) return "Сейчас";
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return Math.max(1, minutes) + " мин";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + " ч";
  const days = Math.round(hours / 24);
  return Math.max(1, days) + " " + (days === 1 ? "день" : days < 5 ? "дня" : "дней");
}

export function FSRSStatistics({ cards }: { cards: FSRSCard[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => cards.filter((card) => card.word.toLowerCase().includes(query.trim().toLowerCase())),
    [cards, query],
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-xl transition hover:bg-white/15">
        Статистика
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
          <div className="flex max-h-[88svh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#151515]/95 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Статистика слов</h2>
                <p className="text-xs text-white/45">{cards.length} {cards.length === 1 ? "слово" : "слов"} с оценкой FSRS</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/70 transition hover:bg-white/15 hover:text-white"
                aria-label="Закрыть">×</button>
            </div>
            <div className="border-b border-white/10 px-5 py-3">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти слово…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25" />
            </div>
            {filtered.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-white/45">
                {cards.length === 0 ? "Здесь появятся слова после первой оценки." : "Ничего не найдено."}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#1a1a1a] text-[10px] uppercase tracking-[0.12em] text-white/40">
                    <tr>
                      <th className="px-5 py-3">Слово</th><th className="px-3 py-3">Следующее</th><th className="px-3 py-3">Статус</th>
                      <th className="px-3 py-3">Интервал</th><th className="px-3 py-3">Стабильность</th><th className="px-3 py-3">Сложность</th>
                      <th className="px-3 py-3">Повторений</th><th className="px-5 py-3">Ошибок</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filtered.map((card) => (
                      <tr key={card.word} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                        <td className="px-5 py-4 text-lg font-semibold text-white">{card.word}</td>
                        <td className="px-3 py-4 font-medium text-white">{formatDue(card.due)}</td>
                        <td className="px-3 py-4">{stateNames[card.state] || "Состояние " + card.state}</td>
                        <td className="px-3 py-4">{card.scheduled_days} дн.</td>
                        <td className="px-3 py-4">{card.stability.toFixed(2)} дн.</td>
                        <td className="px-3 py-4">{card.difficulty.toFixed(2)}</td>
                        <td className="px-3 py-4">{card.reps}</td>
                        <td className="px-5 py-4">{card.lapses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-white/10 px-5 py-3 text-[11px] text-white/35">
              Данные берутся из текущего состояния FSRS-карточек пользователя.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

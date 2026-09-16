"use client";

import { PointerEvent, useRef, useState } from "react";

const sections = [
  "Слова по тематикам",
  "Грамматика",
  "3 тип упражнений",
  "4 тип упражнений",
];

const topics = Array.from({ length: 10 }, (_, index) => `Тема ${index + 1}`);
const grammarExercises = Array.from({ length: 5 }, (_, index) => `Упражнение ${index + 1}`);

export default function LessonsPage() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);
  const dragStart = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const moved = useRef(false);

  const goTo = (index: number) => {
    setActive(Math.max(0, Math.min(sections.length - 1, index)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragStart.current = event.clientX;
    dragDelta.current = 0;
    moved.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;

    const rawDelta = event.clientX - dragStart.current;
    const atFirst = active === 0 && rawDelta > 0;
    const atLast = active === sections.length - 1 && rawDelta < 0;
    const delta = atFirst || atLast ? rawDelta * 0.32 : rawDelta;

    dragDelta.current = delta;
    if (Math.abs(rawDelta) > 6) moved.current = true;

    const viewportWidth = window.innerWidth || 1;
    setDragRatio(delta / viewportWidth);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;

    const delta = dragDelta.current;
    const viewportWidth = window.innerWidth || 1;
    const threshold = Math.max(45, viewportWidth * 0.18);
    const shouldChange = Math.abs(delta) >= threshold;
    const direction = delta < 0 ? 1 : -1;
    const next = Math.max(0, Math.min(sections.length - 1, active + direction));

    dragStart.current = null;
    dragDelta.current = 0;
    setDragging(false);
    setDragRatio(0);

    if (shouldChange && next !== active) goTo(next);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onNavigatorClick = (event: PointerEvent<HTMLDivElement>) => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left + rect.width / 2) goTo(active - 1);
    if (event.clientX > rect.left + rect.width / 2) goTo(active + 1);
  };

  return (
    <main className="lessons-page">
      <div
        className={`lessons-viewport${dragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="lessons-track"
          style={{
            transform: `translate3d(calc(${-active * 100}vw + ${dragRatio * 100}vw), 0, 0)`,
            transition: dragging ? "none" : undefined,
          }}
        >
          <section className="lesson-panel">
            <div className="lesson-list">
              {topics.map((topic) => (
                <button className="lesson-island" key={topic} type="button">
                  {topic}
                </button>
              ))}
            </div>
          </section>

          <section className="lesson-panel">
            <div className="lesson-list grammar-list">
              {grammarExercises.map((exercise) => (
                <button className="lesson-island" key={exercise} type="button">
                  {exercise}
                </button>
              ))}
            </div>
          </section>

          <section className="lesson-panel">
            <div className="lesson-placeholder"><span>Здесь будет 3 тип упражнений</span></div>
          </section>

          <section className="lesson-panel">
            <div className="lesson-placeholder"><span>Здесь будет 4 тип упражнений</span></div>
          </section>
        </div>
      </div>

      <div
        className={`lessons-navigator${dragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onNavigatorClick}
        role="tablist"
        aria-label="Тип упражнений"
      >
        <div className="lessons-navigator-window">
          <div
            className="lessons-navigator-strip"
            style={{
              transform: `translateX(calc(-${active} * var(--step) + ${dragRatio} * var(--step)))`,
              transition: dragging ? "none" : undefined,
            }}
          >
            {sections.map((section) => (
              <span className="lessons-navigator-item" key={section}>{section}</span>
            ))}
          </div>
        </div>
        <div className="lessons-navigator-center">{sections[active]}</div>
      </div>

      <style jsx>{`
        .lessons-page { position: fixed; inset: 0; background: #000; color: #fff; overflow: hidden; touch-action: none; }
        .lessons-viewport { position: absolute; inset: 0; overflow: hidden; touch-action: pan-y; cursor: grab; }
        .lessons-viewport.is-dragging { cursor: grabbing; }
        .lessons-track { display: flex; width: 400vw; height: 100%; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lesson-panel { width: 100vw; height: 100%; flex: 0 0 100vw; display: flex; align-items: center; justify-content: center; padding: 70px 24px 120px; box-sizing: border-box; }

        .lesson-list { width: min(760px, 90vw); height: 100%; max-height: calc(100vh - 190px); overflow-y: auto; display: flex; flex-direction: column; align-items: stretch; gap: 16px; padding: 12px 8px 24px; box-sizing: border-box; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.28) transparent; touch-action: pan-y; }
        .lesson-list::-webkit-scrollbar { width: 7px; }
        .lesson-list::-webkit-scrollbar-track { background: transparent; }
        .lesson-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 10px; }
        .lesson-island { flex: 0 0 92px; width: 100%; border: 1px solid rgba(255,255,255,.14); border-radius: 28px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); box-shadow: 0 8px 28px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; font: 600 24px/1.2 Arial,sans-serif; cursor: pointer; transition: background 160ms ease, transform 160ms ease, border-color 160ms ease; }
        .lesson-island:hover { background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.22); transform: translateY(-1px); }
        .lesson-island:active { transform: scale(.985); }
        .grammar-list { max-width: 760px; }
        .lesson-placeholder { width: min(760px,90vw); min-height: 180px; border: 1px solid rgba(255,255,255,.15); border-radius: 28px; display: flex; align-items: center; justify-content: center; padding: 30px; box-sizing: border-box; text-align: center; color: rgba(255,255,255,.65); font: 500 clamp(18px,2vw,26px)/1.3 Arial,sans-serif; background: rgba(255,255,255,.04); }

        .lessons-navigator { --navigator-width: min(27vw,350px); --step: 74px; position: fixed; z-index: 110; left: 50%; bottom: max(22px,env(safe-area-inset-bottom)); transform: translateX(-50%); width: var(--navigator-width); height: 57px; border-radius: 29px; background: #303030; box-shadow: 0 8px 30px rgba(0,0,0,.45); user-select: none; cursor: grab; touch-action: pan-x; overflow: hidden; }
        .lessons-navigator.is-dragging { cursor: grabbing; }
        .lessons-navigator-window { position: absolute; inset: 0; overflow: hidden; }
        .lessons-navigator-strip { position: absolute; left: 50%; top: 0; height: 57px; display: flex; align-items: center; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lessons-navigator-item { flex: 0 0 var(--step); width: var(--step); text-align: center; color: rgba(255,255,255,.7); font: 600 12px/1.1 Arial,sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lessons-navigator-item:first-child { margin-left: calc(var(--step) * -.5); }
        .lessons-navigator-center { position: absolute; z-index: 2; left: 50%; top: 50%; width: min(62%,220px); height: 43px; transform: translate(-50%,-50%); border-radius: 22px; background: #555; box-shadow: 0 3px 12px rgba(0,0,0,.35); pointer-events: none; display: flex; align-items: center; justify-content: center; padding: 0 14px; box-sizing: border-box; text-align: center; color: #fff; font: 600 13px/1.1 Arial,sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lessons-navigator::after { content: ""; position: absolute; z-index: 3; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 20px 0 18px -22px rgba(0,0,0,.9), inset -20px 0 18px -22px rgba(0,0,0,.9); }

        @media (max-width:600px) {
          .lessons-navigator { --navigator-width: min(78vw,350px); --step: 68px; }
          .lessons-navigator-item { font-size: 11px; }
          .lesson-panel { padding-left: 18px; padding-right: 18px; }
          .lesson-list { width: 94vw; max-height: calc(100vh - 170px); gap: 12px; padding-left: 4px; padding-right: 4px; }
          .lesson-island { flex-basis: 82px; border-radius: 24px; font-size: 20px; }
        }
      `}</style>
    </main>
  );
}

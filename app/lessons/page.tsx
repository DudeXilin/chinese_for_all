"use client";

import Link from "next/link";
import { PointerEvent, useRef, useState } from "react";

const sections = [
  "Слова по тематикам",
  "Грамматика",
  "3 тип упражнений",
  "4 тип упражнений",
];

const placeholders = [
  "Здесь будут колоды с тематиками",
  "Здесь будут упражнения по грамматике",
  "Здесь будет 3 тип упражнений",
  "Здесь будет 4 тип упражнений",
];

export default function LessonsPage() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
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
    dragDelta.current = event.clientX - dragStart.current;
    if (Math.abs(dragDelta.current) > 6) moved.current = true;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const delta = dragDelta.current;
    dragStart.current = null;
    dragDelta.current = 0;
    setDragging(false);
    if (Math.abs(delta) >= 45) goTo(active + (delta < 0 ? 1 : -1));
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
      <Link href="/" className="lessons-back" aria-label="Вернуться на главную">
        <span className="lessons-back-icon" aria-hidden="true">&lt;</span>
      </Link>

      <div className="lessons-viewport">
        <div
          className="lessons-track"
          style={{ transform: `translate3d(${-active * 100}vw, 0, 0)` }}
        >
          {placeholders.map((text) => (
            <section className="lesson-panel" key={text}>
              <div className="lesson-placeholder"><span>{text}</span></div>
            </section>
          ))}
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
            style={{ transform: `translateX(calc(-${active} * var(--step)))` }}
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

        .lessons-back {
          position: fixed !important;
          top: 18px !important;
          left: 18px !important;
          z-index: 2147483647 !important;
          width: 56px !important;
          height: 56px !important;
          min-width: 56px !important;
          min-height: 56px !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          border-radius: 50% !important;
          background: #3a3a3a !important;
          color: #fff !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-decoration: none !important;
          box-sizing: border-box !important;
          box-shadow: 0 4px 14px rgba(0,0,0,.65) !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          overflow: hidden !important;
          appearance: none !important;
          -webkit-appearance: none !important;
        }

        .lessons-back-icon {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          color: #fff !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 32px !important;
          font-weight: 400 !important;
          line-height: 1 !important;
          text-align: center !important;
          transform: translate(-1px,-2px) !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        .lessons-viewport { position: absolute; inset: 0; overflow: hidden; }
        .lessons-track { display: flex; width: 400vw; height: 100%; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lesson-panel { width: 100vw; height: 100%; flex: 0 0 100vw; display: flex; align-items: center; justify-content: center; padding: 100px 24px 150px; box-sizing: border-box; }
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
          .lessons-back { top: 14px !important; left: 14px !important; width: 54px !important; height: 54px !important; min-width: 54px !important; min-height: 54px !important; }
          .lessons-back-icon { font-size: 31px !important; }
          .lessons-navigator { --navigator-width: min(78vw,350px); --step: 68px; }
          .lessons-navigator-item { font-size: 11px; }
          .lesson-panel { padding-left: 18px; padding-right: 18px; }
        }
      `}</style>
    </main>
  );
}

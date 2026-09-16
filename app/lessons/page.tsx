"use client";

import Link from "next/link";
import { PointerEvent, useRef, useState } from "react";

const sections = [
  "Слова по тематикам",
  "Грамматика",
  "3 тип упражнений",
  "4 тип упражнений",
];

export default function LessonsPage() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const goTo = (index: number) => {
    setActive(Math.max(0, Math.min(sections.length - 1, index)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = event.clientX;
    dragDelta.current = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    dragDelta.current = event.clientX - dragStart.current;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;

    const delta = dragDelta.current;
    dragStart.current = null;
    dragDelta.current = 0;
    setDragging(false);

    if (Math.abs(delta) >= 45) {
      goTo(active + (delta < 0 ? 1 : -1));
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const onNavigatorClick = (event: PointerEvent<HTMLDivElement>) => {
    if (Math.abs(dragDelta.current) >= 10) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    goTo(Math.round((x / rect.width) * (sections.length - 1)));
  };

  return (
    <main className="lessons-page">
      <Link href="/" aria-label="Назад" className="lessons-back-button">
        &lt;
      </Link>

      <div className="lessons-viewport">
        <div
          className="lessons-track"
          style={{ transform: `translate3d(${-active * 100}%, 0, 0)` }}
        >
          {[
            "Здесь будут колоды с тематиками",
            "Здесь будут упражнения по грамматике",
            "Здесь будет 3 тип упражнений",
            "Здесь будет 4 тип упражнений",
          ].map((text) => (
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
        <div className="lessons-navigator-track">
          {sections.map((section) => <span key={section} className="lessons-navigator-stop" />)}
        </div>
        <div
          className="lessons-navigator-thumb"
          style={{ left: `${(active / (sections.length - 1)) * 100}%` }}
        >
          {sections[active]}
        </div>
      </div>

      <style jsx>{`
        .lessons-page { position: fixed; inset: 0; background: #000; color: #fff; overflow: hidden; touch-action: none; }
        .lessons-back-button { position: fixed; top: 16px; left: 16px; z-index: 20; width: 57px; height: 57px; border-radius: 50%; background: #3a3a3a; color: #fff; display: flex; align-items: center; justify-content: center; text-decoration: none; font: 400 32px/1 Arial, sans-serif; box-sizing: border-box; padding-bottom: 4px; box-shadow: 0 3px 10px rgba(0,0,0,.35); }
        .lessons-viewport { position: absolute; inset: 0; overflow: hidden; }
        .lessons-track { display: flex; width: 400%; height: 100%; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lesson-panel { width: 25%; height: 100%; flex: 0 0 25%; display: flex; align-items: center; justify-content: center; padding: 100px 24px 150px; box-sizing: border-box; }
        .lesson-placeholder { width: min(760px,90vw); min-height: 180px; border: 1px solid rgba(255,255,255,.15); border-radius: 28px; display: flex; align-items: center; justify-content: center; padding: 30px; box-sizing: border-box; text-align: center; color: rgba(255,255,255,.65); font: 500 clamp(18px,2vw,26px)/1.3 Arial,sans-serif; background: rgba(255,255,255,.04); }
        .lessons-navigator { position: fixed; z-index: 30; left: 50%; bottom: max(22px,env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(33.333vw,420px); min-width: 260px; height: 57px; border-radius: 29px; background: #303030; box-shadow: 0 8px 30px rgba(0,0,0,.45); user-select: none; cursor: grab; touch-action: pan-x; }
        .lessons-navigator.is-dragging { cursor: grabbing; }
        .lessons-navigator-track { position: absolute; left: 22px; right: 22px; top: 50%; height: 2px; transform: translateY(-50%); background: rgba(255,255,255,.16); }
        .lessons-navigator-stop { position: absolute; top: 50%; width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.3); transform: translate(-50%,-50%); }
        .lessons-navigator-stop:nth-child(1) { left: 0%; } .lessons-navigator-stop:nth-child(2) { left: 33.333%; } .lessons-navigator-stop:nth-child(3) { left: 66.666%; } .lessons-navigator-stop:nth-child(4) { left: 100%; }
        .lessons-navigator-thumb { position: absolute; top: 50%; width: max-content; min-width: 42%; max-width: 78%; height: 43px; padding: 0 18px; border-radius: 22px; transform: translate(-50%,-50%); background: #555; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 12px rgba(0,0,0,.3); font: 600 14px/1 Arial,sans-serif; white-space: nowrap; pointer-events: none; transition: left 520ms cubic-bezier(.22,1,.36,1); }
        @media (max-width:600px) { .lessons-back-button { top:12px; left:12px; } .lessons-navigator { width: calc(100vw - 40px); min-width:0; } .lessons-navigator-thumb { font-size:13px; padding:0 14px; } .lesson-panel { padding-left:18px; padding-right:18px; } }
      `}</style>
    </main>
  );
}

"use client";

import { PointerEvent, useRef, useState } from "react";
import { GlassInit } from "@/components/glass-init";

const sections = [
  "Слова по тематикам",
  "Грамматика",
  "3 тип упражнений",
  "4 тип упражнений",
];

const topics = ["Места", ...Array.from({ length: 9 }, (_, index) => `Тема ${index + 2}`)];
const grammarExercises = ["Вопросительные слова", ...Array.from({ length: 4 }, (_, index) => `Упражнение ${index + 2}`)];

// Stable object reference (module scope, never recreated) so GlassInit's
// effect dependency array doesn't see a "new" options object on every
// LessonsPage re-render (this page re-renders on every pointermove while
// dragging - an inline `options={{ ... }}` literal would re-run liquidGL()
// init that often). No custom `snapshot` override here on purpose - see
// the .lessons-page comment below for why plain defaults are what actually
// make this work, same as public/index.html.
const GLASS_OPTIONS = { helper: true };

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
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />
      {/* liquidGL's own dev/debug GUI (lil-gui panel). Must load before
          liquidGL() runs (see GlassInit below) since it registers
          window.__liquidGLHelper__. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL-helper.js" />
      <GlassInit target=".cfa-glass" options={GLASS_OPTIONS} />

      <a href="/" className="lessons-back-btn" aria-label="На главную">
        <div className="lessons-back-btn-glass cfa-glass">
          <span className="lessons-back-btn-label">&lt;</span>
        </div>
      </a>

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
                <button
                  className="lesson-island"
                  key={exercise}
                  type="button"
                  onClick={() => exercise === "Вопросительные слова" && (window.location.href = "/cards_exerciser?topic=question-words")}
                >
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

      {/* Compass-needle glass: a small, purely decorative liquidGL chip -
          same setup as the back button and public/index.html's "Начать
          обучение" button (default options, no text of its own, no
          snapshot override). It sits ABOVE the ribbon, not on top of it,
          so it never has to refract fast-moving text - liquidGL only
          reliably shows a live view of content that isn't constantly
          changing underneath it. The actual lesson-type name lives in the
          ribbon right below it, in plain text, always crisp and always
          centered under this chip - see .lessons-navigator-item.is-active. */}
      <div
        className={`lessons-navigator-dock${dragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onNavigatorClick}
        role="tablist"
        aria-label="Тип упражнений"
      >
        <div className="lessons-navigator-glass-cap cfa-glass" aria-hidden="true" />

        <div className="lessons-navigator">
          <div className="lessons-navigator-window">
            <div
              className="lessons-navigator-strip"
              style={{
                transform: `translateX(calc(-${active} * var(--step) + ${dragRatio} * var(--step)))`,
                transition: dragging ? "none" : undefined,
              }}
            >
              {sections.map((section, index) => (
                <span
                  className={`lessons-navigator-item${index === active ? " is-active" : ""}`}
                  key={section}
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* .lessons-page is deliberately NOT position:fixed. That was the
           actual bug behind the broken navigator glass: liquidGL's
           snapshot walk starts at <body> and, per its own source
           (buildNode/collect), completely skips the subtree of any
           element with computed position:fixed - it never even descends
           into its children. public/index.html's real content
           (.main-content) is a normal, non-fixed sibling of its two fixed
           overlay buttons, so liquidGL's default snapshot: "body" finds
           real pixels there. Our whole page used to BE that one fixed
           element, so the snapshot had nothing to work with at all
           (a "baked" near-empty frame, no matter what settings were
           tuned). Scroll/bounce locking now happens on html/body instead
           (see :global rule below), so this element can stay a normal,
           capturable box. */
        .lessons-page { position: relative; width: 100%; height: 100vh; height: 100dvh; background: #000; color: #fff; overflow: hidden; touch-action: none; }
        :global(html), :global(body) { height: 100%; overflow: hidden; overscroll-behavior: none; }

        .lessons-viewport { position: absolute; inset: 0; overflow: hidden; touch-action: pan-y; cursor: grab; }
        .lessons-viewport.is-dragging { cursor: grabbing; }
        .lessons-back-btn { position: fixed; top: 1rem; left: 1rem; z-index: 120; text-decoration: none; transform: translateZ(0); will-change: transform; backface-visibility: hidden; }
        .lessons-back-btn-glass { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .lessons-back-btn-label { color: #f5f5f5; font-weight: 600; font-size: 1.1rem; letter-spacing: 0.01em; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55); line-height: 1; }

        /* liquidGL's debug GUI ships pinned top-right (and re-asserts
           that with !important via its own injected stylesheet), so we
           out-specify it here (repeating the class is a standard
           zero-cost specificity bump) to relocate it top-left, under the
           back button, on this page only. */
        :global(.lil-gui.root.liquidgl-helper.liquidgl-helper) {
          top: calc(1rem + 38px + 12px) !important;
          left: 1rem !important;
          right: auto !important;
          bottom: auto !important;
          z-index: 119 !important;
        }
        @media (max-width: 768px) {
          :global(.lil-gui.root.liquidgl-helper.liquidgl-helper) {
            top: calc(1rem + 38px + 10px) !important;
            left: 0.75rem !important;
            right: auto !important;
          }
        }

        .lessons-track { display: flex; width: 400vw; height: 100%; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lesson-panel { width: 100vw; height: 100%; flex: 0 0 100vw; display: flex; align-items: center; justify-content: center; padding: 70px 24px 150px; box-sizing: border-box; }

        .lesson-list { width: min(760px, 90vw); height: 100%; max-height: calc(100vh - 220px); overflow-y: auto; display: flex; flex-direction: column; align-items: stretch; gap: 16px; padding: 12px 8px 24px; box-sizing: border-box; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.28) transparent; touch-action: pan-y; }
        .lesson-list::-webkit-scrollbar { width: 7px; }
        .lesson-list::-webkit-scrollbar-track { background: transparent; }
        .lesson-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 10px; }
        .lesson-island { flex: 0 0 92px; width: 100%; border: 1px solid rgba(255,255,255,.14); border-radius: 28px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); box-shadow: 0 8px 28px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; font: 600 24px/1.2 Arial,sans-serif; cursor: pointer; transition: background 160ms ease, transform 160ms ease, border-color 160ms ease; }
        .lesson-island:hover { background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.22); transform: translateY(-1px); }
        .lesson-island:active { transform: scale(.985); }
        .grammar-list { max-width: 760px; }
        .lesson-placeholder { width: min(760px,90vw); min-height: 180px; border: 1px solid rgba(255,255,255,.15); border-radius: 28px; display: flex; align-items: center; justify-content: center; padding: 30px; box-sizing: border-box; text-align: center; color: rgba(255,255,255,.65); font: 500 clamp(18px,2vw,26px)/1.3 Arial,sans-serif; background: rgba(255,255,255,.04); }

        .lessons-navigator-dock {
          --navigator-width: min(27vw,350px);
          --step: 74px;
          position: fixed; z-index: 120; left: 50%; bottom: max(22px,env(safe-area-inset-bottom));
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          user-select: none; cursor: grab; touch-action: pan-x;
        }
        .lessons-navigator-dock.is-dragging { cursor: grabbing; }

        /* The "compass needle" itself: a small pure-glass chip, no text,
           default liquidGL options - exactly the .cfa-start-btn-link
           pattern. It never overlaps the ribbon's text, so it never needs
           to show anything that's moving. */
        .lessons-navigator-glass-cap { width: min(58%,190px); height: 34px; border-radius: 17px; overflow: hidden; pointer-events: none; }

        .lessons-navigator {
          position: relative; width: var(--navigator-width); height: 57px; border-radius: 29px; background: #303030;
          box-shadow: 0 8px 30px rgba(0,0,0,.45); overflow: hidden;
        }
        .lessons-navigator-window { position: absolute; inset: 0; overflow: hidden; }
        .lessons-navigator-strip { position: absolute; left: 50%; top: 0; height: 57px; display: flex; align-items: center; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lessons-navigator-item {
          flex: 0 0 var(--step); width: var(--step); min-width: 0; text-align: center;
          color: rgba(255,255,255,.55); font: 600 12px/1.1 Arial,sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 200ms ease;
        }
        .lessons-navigator-item:first-child { margin-left: calc(var(--step) * -.5); }
        .lessons-navigator::after { content: ""; position: absolute; z-index: 1; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 20px 0 18px -22px rgba(0,0,0,.9), inset -20px 0 18px -22px rgba(0,0,0,.9); }

        /* The one and only place the active section's name is rendered.
           It's always exactly centered under the glass chip above (both
           share --navigator-width's center axis via the shared dock), and
           gets a shimmering gradient-text treatment while it's active -
           plain CSS, no WebGL involved, so it's always crisp. */
        .lessons-navigator-item.is-active {
          color: transparent;
          background: linear-gradient(90deg, rgba(255,255,255,.55) 0%, #fff 22%, #fff 45%, rgba(255,255,255,.55) 68%, rgba(255,255,255,.35) 100%);
          background-size: 220% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: lessons-item-shimmer 2.6s ease-in-out infinite;
        }
        @keyframes lessons-item-shimmer {
          0% { background-position: 130% 0; }
          55% { background-position: -30% 0; }
          100% { background-position: -30% 0; }
        }

        @media (max-width:600px) {
          .lessons-navigator-dock { --navigator-width: min(78vw,350px); --step: 68px; }
          .lessons-navigator-item { font-size: 11px; }
          .lesson-panel { padding-left: 18px; padding-right: 18px; }
          .lesson-list { width: 94vw; max-height: calc(100vh - 200px); gap: 12px; padding-left: 4px; padding-right: 4px; }
          .lesson-island { flex-basis: 82px; border-radius: 24px; font-size: 20px; }
        }
      `}</style>
    </main>
  );
}

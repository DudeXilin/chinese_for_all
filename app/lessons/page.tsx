"use client";

import { PointerEvent, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GlassInit } from "@/components/glass-init";

// See docs/LIQUIDGL.md for the six ground rules this page is built around
// (Rules #1-#6). Summary, since this page leans on all of them at once:
//
// #1 content that must stay readable goes INSIDE a .cfa-glass target as a
//    real DOM child, never beside it - N/A here, our lens carries no text.
// #2 every .cfa-glass target's nearest positioned ancestor must share one
//    z-index across the whole page (the shared canvas sits at that max
//    value minus 1).
// #3 no position:fixed anywhere on the path from <body> down to content
//    that needs to be captured - liquidGL's snapshot walk skips the
//    entire subtree of any fixed element, full stop. This applies at
//    every level, not just the page root.
// #4 real-time refraction of something that's moving only works for
//    JS/GSAP-driven movement, not CSS transitions/animations - and the
//    moving element must be registered with liquidGL.registerDynamic().
// #5 a .cfa-glass target must not be nested inside a DOM parent with its
//    own opaque background - the shared canvas is z-index:0 in <body>,
//    so an opaque ancestor immediately behind the target paints over it.
// #6 never position a .cfa-glass target with `transform` - liquidGL owns
//    the target's own el.style.transform for its mouse-tilt effect and
//    will silently overwrite anything a CSS class put there. Center with
//    left/top + negative margin instead.

const sections = [
  "Слова по тематикам",
  "Грамматика",
  "3 тип упражнений",
  "4 тип упражнений",
];

const topics = ["Места", ...Array.from({ length: 9 }, (_, index) => `Тема ${index + 2}`)];
const grammarExercises = ["Вопросительные слова", "Счётные слова", "Упражнение 3", "Упражнение 4", "Упражнение 5"];

const NAVIGATOR_STEP_DESKTOP = 74;
const NAVIGATOR_STEP_MOBILE = 68;
const currentStep = () => (typeof window !== "undefined" && window.innerWidth <= 600 ? NAVIGATOR_STEP_MOBILE : NAVIGATOR_STEP_DESKTOP);

// Stable module-level reference - GlassInit's effect depends on this object
// by identity, and this page re-renders on every pointermove while
// dragging the navigator. An inline `options={{ ... }}` literal would be a
// "new" object each of those renders and would re-run liquidGL() init
// dozens of times a second.
//
// on.init (Rule #4) registers the ribbon strip as "dynamic" the moment the
// navigator's own lens is ready, so liquidGL keeps re-sampling it as it
// moves. Wrapped in try/catch: the library calls this from inside a
// forEach over all lenses with no error handling of its own, so a thrown
// error here could silently stop lenses after this one from finishing
// their own setup.
const GLASS_OPTIONS = {
  helper: true,
  on: {
    init(instance: { el?: Element }) {
      try {
        if (!instance.el || !instance.el.classList.contains("lessons-navigator-lens")) return;
        const strip = document.querySelector(".lessons-navigator-strip");
        const w = window as unknown as { liquidGL?: { registerDynamic?: (el: Element) => void } };
        if (strip && w.liquidGL?.registerDynamic) w.liquidGL.registerDynamic(strip);
      } catch (err) {
        console.error("liquidGL registerDynamic failed:", err);
      }
    },
  },
};

export default function LessonsPage() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
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

  // Drives the ribbon with GSAP instead of a CSS transition (Rule #4).
  // useLayoutEffect (not useEffect) so this runs - and sets the initial
  // transform - before GlassInit's own effect calls liquidGL(), per the
  // library's "set the initial state before calling liquidGL()" rule.
  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const apply = (animate: boolean) => {
      const x = -active * currentStep() + dragRatio * currentStep();
      if (animate) gsap.to(el, { x, duration: 0.52, ease: "expo.out" });
      else gsap.set(el, { x });
    };
    apply(!dragging);
    if (dragging) return undefined;
    const onResize = () => apply(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, dragRatio, dragging]);

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

      {/* Decorative only - doesn't need to refract anything specific, so
          position:fixed here is fine (Rule #3 only bites when something
          that MUST be captured, like the ribbon below, lives inside a
          fixed ancestor). */}
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
                <button
                  className="lesson-island"
                  key={topic}
                  type="button"
                  onClick={() => {
                    if (topic === "Места") window.location.href = "/cards_exerciser?topic=places";
                  }}
                >
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
                  onClick={() => {
                    if (exercise === "Вопросительные слова") window.location.href = "/cards_exerciser?topic=question-words";
                    if (exercise === "Счётные слова") window.location.href = "/cards_exerciser?topic=measure_words";
                  }}
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

      {/* Compass-needle glass: a static lens sitting over a sliding ribbon
          of lesson-type names, like a loupe over a ruler - whichever name
          is centered under it is the selection, shown by genuinely
          refracting/magnifying that word live (no text is ever drawn on
          the lens itself, and no separate label exists anywhere).
          position:absolute (Rule #3), not nested inside the pill's opaque
          background (Rule #5), no transform on the lens (Rule #6), ribbon
          moved by GSAP + registered dynamic (Rule #4). */}
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
        <div className="lessons-navigator">
          <div className="lessons-navigator-window">
            <div className="lessons-navigator-strip" ref={stripRef}>
              {sections.map((section) => (
                <span className="lessons-navigator-item" key={section}>{section}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="lessons-navigator-lens cfa-glass" aria-hidden="true" />
      </div>

      <style jsx>{`
        /* Rule #3: not position:fixed. The whole page needs to fill the
           screen without scrolling (this is an app-like, not a scrolling,
           page), so that lock is applied to html/body instead - see the
           :global rule below - leaving this element itself a normal,
           capturable box. */
        .lessons-page { position: relative; width: 100%; height: 100vh; height: 100dvh; background: #000; color: #fff; overflow: hidden; touch-action: none; }
        :global(html), :global(body) { height: 100%; overflow: hidden; overscroll-behavior: none; }

        .lessons-viewport { position: absolute; inset: 0; overflow: hidden; touch-action: pan-y; cursor: grab; }
        .lessons-viewport.is-dragging { cursor: grabbing; }

        .lessons-back-btn { position: fixed; top: 1rem; left: 1rem; z-index: 120; text-decoration: none; transform: translateZ(0); will-change: transform; backface-visibility: hidden; }
        .lessons-back-btn-glass { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .lessons-back-btn-label { color: #f5f5f5; font-weight: 600; font-size: 1.1rem; letter-spacing: 0.01em; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55); line-height: 1; }

        /* liquidGL's debug GUI ships pinned top-right (and re-asserts that
           with !important via its own injected stylesheet), so we
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

        /* Rule #3: position:absolute, not fixed - .lessons-page never
           scrolls, so anchoring to its bottom edge looks identical to
           fixed without excluding the ribbon inside from liquidGL's
           snapshot. Rule #2: z-index:120 matches .lessons-back-btn - this
           is the nearest positioned ancestor of .lessons-navigator-lens. */
        .lessons-navigator-dock {
          --navigator-width: min(27vw,350px);
          --step: 74px;
          position: absolute; z-index: 120; left: 0; right: 0; width: var(--navigator-width); margin-inline: auto;
          bottom: max(22px,env(safe-area-inset-bottom));
          user-select: none; cursor: grab; touch-action: pan-x;
        }
        .lessons-navigator-dock.is-dragging { cursor: grabbing; }

        .lessons-navigator {
          position: relative; width: 100%; height: 57px; border-radius: 29px; background: #303030;
          box-shadow: 0 8px 30px rgba(0,0,0,.45); overflow: hidden;
        }
        .lessons-navigator-window { position: absolute; inset: 0; overflow: hidden; }
        /* No CSS transition here - GSAP owns this element's transform
           (Rule #4), driven by the useLayoutEffect above. */
        .lessons-navigator-strip { position: absolute; left: 50%; top: 0; height: 57px; display: flex; align-items: center; will-change: transform; }
        .lessons-navigator-item {
          flex: 0 0 var(--step); width: var(--step); min-width: 0; text-align: center;
          color: rgba(255,255,255,.55); font: 600 12px/1.1 Arial,sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .lessons-navigator-item:first-child { margin-left: calc(var(--step) * -.5); }
        .lessons-navigator::after { content: ""; position: absolute; z-index: 1; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 20px 0 18px -22px rgba(0,0,0,.9), inset -20px 0 18px -22px rgba(0,0,0,.9); }

        /* The lens: empty, no background, no text (Rule #1 N/A - nothing
           to keep readable). A SIBLING of .lessons-navigator, not nested
           inside its opaque background (Rule #5). Centered with left/top
           + negative margin, never transform (Rule #6). */
        .lessons-navigator-lens {
          position: absolute; z-index: 2; left: 50%; top: 50%;
          width: min(62%, 220px); height: 43px;
          margin-left: calc(min(62%, 220px) / -2); margin-top: -21.5px;
          border-radius: 22px; overflow: hidden; pointer-events: none;
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

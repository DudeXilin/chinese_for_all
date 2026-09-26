"use client";

import { useEffect, useRef, useState } from "react";

type HanziWriterOptions = {
  width: number;
  height: number;
  padding: number;
  showCharacter?: boolean;
  showOutline?: boolean;
  outlineColor?: string;
  drawingColor?: string;
  drawingWidth?: number;
  strokeColor?: string;
  highlightColor?: string;
  highlightOnComplete?: boolean;
  showHintAfterMisses?: number | false;
  leniency?: number;
  acceptBackwardsStrokes?: boolean;
  markStrokeCorrectAfterMisses?: number | false;
  onLoadCharDataError?: (reason: unknown) => void;
};

type HanziWriterInstance = {
  quiz: (options?: {
    onMistake?: () => void;
    onComplete?: (summary: { totalMistakes: number }) => void;
    showHintAfterMisses?: number | false;
    highlightOnComplete?: boolean;
  }) => void;
  cancelQuiz: () => void;
  animateCharacter: () => Promise<unknown> | void;
};

type HanziWriterFactory = {
  create: (target: HTMLElement, character: string, options: HanziWriterOptions) => HanziWriterInstance;
};

declare global {
  interface Window {
    HanziWriter?: HanziWriterFactory;
    __cfaHanziWriterLoader?: Promise<HanziWriterFactory>;
  }
}

function loadHanziWriter(): Promise<HanziWriterFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Hanzi Writer is available only in the browser."));
  }
  if (window.HanziWriter) return Promise.resolve(window.HanziWriter);
  if (window.__cfaHanziWriterLoader) return window.__cfaHanziWriterLoader;

  window.__cfaHanziWriterLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cfa-hanzi-writer="true"]',
    );
    const script = existing ?? document.createElement("script");

    script.onload = () => {
      const writer = window.HanziWriter;
      if (writer) resolve(writer);
      else reject(new Error("Hanzi Writer loaded, but its API was not found."));
    };
    script.onerror = () => {
      reject(new Error("Не удалось загрузить Hanzi Writer с CDN."));
      delete window.__cfaHanziWriterLoader;
    };

    if (!existing) {
      // Loading from the jsdelivr CDN per https://hanziwriter.org/docs.html#script-loading-link
      script.src = "https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js";
      script.async = true;
      script.dataset.cfaHanziWriter = "true";
      document.head.appendChild(script);
    }
  });

  return window.__cfaHanziWriterLoader;
}

type Props = {
  character: string;
  mode?: "practice" | "preview";
  /** Forces a fresh writer instance (e.g. pass a new key when the card changes). */
  resetKey?: string | number;
  /** Square side length in px. Passed as-is to the writer's own width/height
   * AND used to explicitly size (not flex-center) the mount div, the same way
   * the working Anki template does it — no flexbox/aspect-ratio in the loop. */
  size?: number;
  onMistake?: () => void;
};

// Warm-white, ~90% opacity — used for anything the user should clearly see:
// their own drawn strokes, and the fully-shown character on the card back.
const WARM_WHITE = "rgba(255, 244, 230, 0.9)";
// A visible red tint for the stroke hint shown after repeated mistakes.
const HINT_RED = "rgba(224, 60, 70, 0.85)";

export default function HanziWriterDrawing({
  character,
  mode = "practice",
  resetKey,
  size = 150,
  onMistake,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !character) return;

    let cancelled = false;
    writerRef.current = null;
    host.replaceChildren();
    setStatus("loading");

    const isPractice = mode === "practice";
    const padding = Math.round(size * (isPractice ? 0.09 : 0.06));

    loadHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !host.isConnected) return;

        const writer = HanziWriter.create(host, character, {
          width: size,
          height: size,
          padding,
          // Front (practice): nothing is shown until the user draws it — no
          // filled-in character, no faint outline guide either.
          showCharacter: !isPractice,
          showOutline: false,
          outlineColor: "transparent",
          // What the user physically draws, and the fully-shown character on
          // the back, are both warm-white — clearly visible on the dark theme.
          drawingColor: WARM_WHITE,
          drawingWidth: Math.max(4, Math.round(size * 0.035)),
          strokeColor: WARM_WHITE,
          // The hint stroke shown after repeated misses is red, not the
          // library's default blue.
          highlightColor: HINT_RED,
          // No success flash on finishing the quiz — the user should judge for
          // themselves when the character is done, not get an extra tell.
          highlightOnComplete: false,
          showHintAfterMisses: isPractice ? 5 : false,
          // More forgiving matching, same as the working Anki deck template.
          leniency: 2.2,
          acceptBackwardsStrokes: true,
          markStrokeCorrectAfterMisses: 6,
          onLoadCharDataError: (reason) => {
            if (!cancelled) {
              setStatus("error");
              console.error("Hanzi Writer character data error:", reason);
            }
          },
        });

        writerRef.current = writer;
        if (!cancelled) setStatus("ready");

        if (isPractice) {
          writer.quiz({
            showHintAfterMisses: 5,
            highlightOnComplete: false,
            onMistake: onMistake,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus("error");
          console.error("Hanzi Writer (CDN) load error:", error);
        }
      });

    return () => {
      cancelled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, mode, resetKey, size]);

  function animatePreview() {
    writerRef.current?.animateCharacter();
  }

  return (
    <div
      // Explicit, equal width/height in px — guarantees a real square
      // regardless of any flexbox/aspect-ratio quirks in the surrounding
      // layout, same principle as the GRID_SIZE-based divs in the Anki deck.
      style={{ width: size, height: size, background: "#26221f" }}
      className={[
        "relative mx-auto shrink-0 overflow-hidden rounded-2xl",
        mode === "preview" ? "cursor-pointer select-none" : "",
      ].join(" ")}
      onClick={mode === "preview" ? animatePreview : undefined}
      aria-label={
        mode === "preview"
          ? "Нажмите, чтобы посмотреть порядок написания " + character
          : "Напишите иероглиф " + character
      }
    >
      {/* Solid cell border, a touch lighter than the dashed cross below it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
        style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.32)" }}
      />
      {/* Thin dashed cross splitting the cell into 4 equal quarters. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          style={{
            width: 1,
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.22) 0 4px, transparent 4px 9px)",
          }}
        />
        <div
          className="absolute left-0 top-1/2 w-full -translate-y-1/2"
          style={{
            height: 1,
            backgroundImage:
              "repeating-linear-gradient(to right, rgba(255,255,255,0.22) 0 4px, transparent 4px 9px)",
          }}
        />
      </div>
      {/* Explicit position+size (not flex-centering) so the writer's own SVG
          (also sized to `size`x`size`) lines up pixel-for-pixel every time. */}
      <div
        ref={hostRef}
        className="absolute left-0 top-0 z-10"
        style={{ width: size, height: size }}
      />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center text-xs text-white/25">
          загрузка…
        </div>
      )}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6 text-center text-xs text-red-300/70">
          Не удалось загрузить данные иероглифа
        </div>
      )}
    </div>
  );
}

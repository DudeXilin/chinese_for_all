"use client";

import { useEffect, useRef, useState } from "react";

type HanziWriterOptions = {
  width: number;
  height: number;
  renderer?: "svg" | "canvas";
  padding: number;
  showCharacter: boolean;
  showOutline: boolean;
  outlineColor: string;
  drawingColor: string;
  drawingWidth: number;
  strokeColor: string;
  highlightColor: string;
  highlightOnComplete: boolean;
  showHintAfterMisses?: number | false;
  strokeAnimationSpeed?: number;
  delayBetweenStrokes?: number;
  charDataLoader: (character: string, onComplete: (data: unknown) => void) => void;
  onLoadCharDataError?: (reason: unknown) => void;
};

type HanziWriterInstance = {
  quiz: (options?: {
    onComplete?: (summary: { totalMistakes: number }) => void;
    showHintAfterMisses?: number | false;
    highlightOnComplete?: boolean;
  }) => void;
  cancelQuiz: () => void;
  animateCharacter: () => Promise<unknown> | void;
};

type HanziWriterFactory = {
  create: (target: SVGElement | HTMLElement, character: string, options: HanziWriterOptions) => HanziWriterInstance;
};

declare global {
  interface Window {
    HanziWriter?: HanziWriterFactory;
    __cfaLocalHanziWriter?: Promise<HanziWriterFactory>;
  }
}

function loadLocalHanziWriter(): Promise<HanziWriterFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Hanzi Writer is available only in the browser."));
  }
  if (window.HanziWriter) return Promise.resolve(window.HanziWriter);
  if (window.__cfaLocalHanziWriter) return window.__cfaLocalHanziWriter;

  window.__cfaLocalHanziWriter = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cfa-local-hanzi-writer="true"]',
    );
    const script = existing ?? document.createElement("script");

    script.onload = () => {
      const writer = window.HanziWriter;
      if (writer) resolve(writer);
      else reject(new Error("Hanzi Writer loaded, but its API was not found."));
    };
    script.onerror = () => {
      reject(new Error("Не удалось загрузить Hanzi Writer."));
      delete window.__cfaLocalHanziWriter;
    };

    if (!existing) {
      script.src = "/api/hanzi-writer/library.js";
      script.async = true;
      script.dataset.cfaLocalHanziWriter = "true";
      document.head.appendChild(script);
    }
  });

  return window.__cfaLocalHanziWriter;
}

const SVG_NS = "http://www.w3.org/2000/svg";
// Canonical coordinate space for the grid + character. This is NOT a pixel
// size — the <svg viewBox> maps it onto whatever box the browser lays the
// element out at (via CSS), so the writer is always crisp and never
// stretched/flattened regardless of the container's actual rendered size.
const CANON = 200;

function buildGridSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", `0 0 ${CANON} ${CANON}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  // Hanzi Writer itself sets width/height *attributes* to CANON (a plain px
  // number) once it mounts — see HanziWriter.create() below. Inline CSS style
  // always wins over presentation attributes, so pinning these via .style
  // (not setAttribute) keeps the box responsive to its actual CSS-driven
  // size instead of snapping to a fixed 200x200 canvas.
  svg.style.display = "block";
  svg.style.width = "100%";
  svg.style.height = "100%";

  // Solid border marking the single writing cell — kept slightly *lighter*
  // than the dashed guide lines inside it, per the "rice paper" (田字格) look.
  const border = document.createElementNS(SVG_NS, "rect");
  border.setAttribute("x", "1");
  border.setAttribute("y", "1");
  border.setAttribute("width", String(CANON - 2));
  border.setAttribute("height", String(CANON - 2));
  border.setAttribute("fill", "none");
  border.setAttribute("stroke", "rgba(255,255,255,0.26)");
  border.setAttribute("stroke-width", "1");
  svg.appendChild(border);

  // Thin, unobtrusive dashed cross splitting the cell into 4 equal quarters.
  const vertical = document.createElementNS(SVG_NS, "line");
  vertical.setAttribute("x1", String(CANON / 2));
  vertical.setAttribute("y1", "0");
  vertical.setAttribute("x2", String(CANON / 2));
  vertical.setAttribute("y2", String(CANON));
  vertical.setAttribute("stroke", "rgba(255,255,255,0.15)");
  vertical.setAttribute("stroke-width", "1");
  vertical.setAttribute("stroke-dasharray", "4 5");
  svg.appendChild(vertical);

  const horizontal = document.createElementNS(SVG_NS, "line");
  horizontal.setAttribute("x1", "0");
  horizontal.setAttribute("y1", String(CANON / 2));
  horizontal.setAttribute("x2", String(CANON));
  horizontal.setAttribute("y2", String(CANON / 2));
  horizontal.setAttribute("stroke", "rgba(255,255,255,0.15)");
  horizontal.setAttribute("stroke-width", "1");
  horizontal.setAttribute("stroke-dasharray", "4 5");
  svg.appendChild(horizontal);

  return svg;
}

type Props = {
  character: string;
  mode?: "practice" | "preview";
  /** Forces a fresh writer instance (e.g. pass a new key when the card changes). */
  resetKey?: string | number;
};

export default function HanziWriterDrawing({ character, mode = "practice", resetKey }: Props) {
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

    // Draw the grid straight into the SVG that will also hold the character —
    // see Hanzi Writer's "Custom backgrounds" docs. Because the SVG scales via
    // viewBox instead of JS-measured pixel dimensions, it can never end up
    // squashed/clipped by the surrounding CSS box, whatever size that box is.
    const gridSvg = buildGridSvg();
    host.appendChild(gridSvg);

    const isPractice = mode === "practice";
    const padding = Math.round(CANON * (isPractice ? 0.09 : 0.06));

    loadLocalHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !host.isConnected) return;

        const writer = HanziWriter.create(gridSvg, character, {
          width: CANON,
          height: CANON,
          padding,
          showCharacter: !isPractice,
          showOutline: false,
          renderer: "svg",
          outlineColor: "transparent",
          drawingColor: "rgba(255, 236, 222, 0.9)",
          drawingWidth: 5,
          strokeColor: "rgba(255, 236, 222, 0.9)",
          highlightColor: "rgba(224, 120, 120, 0.68)",
          highlightOnComplete: false,
          showHintAfterMisses: isPractice ? 5 : false,
          strokeAnimationSpeed: 1.15,
          delayBetweenStrokes: 420,
          charDataLoader: (char, onComplete) => {
            fetch("/api/hanzi-writer/data/" + encodeURIComponent(char) + ".json")
              .then((response) => {
                if (!response.ok) throw new Error("Character data unavailable: " + char);
                return response.json();
              })
              .then((data) => onComplete(data))
              .catch((error) => {
                if (!cancelled) setStatus("error");
                console.error("Local Hanzi Writer data error:", error);
              });
          },
          onLoadCharDataError: (reason) => {
            if (!cancelled) {
              setStatus("error");
              console.error("Local Hanzi Writer character error:", reason);
            }
          },
        });

        writerRef.current = writer;
        if (!cancelled) setStatus("ready");

        if (isPractice) {
          writer.quiz({
            showHintAfterMisses: 5,
            highlightOnComplete: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus("error");
          console.error("Local Hanzi Writer error:", error);
        }
      });

    return () => {
      cancelled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
      host.replaceChildren();
    };
  }, [character, mode, resetKey]);

  function animatePreview() {
    writerRef.current?.animateCharacter();
  }

  return (
    <div
      className={[
        "relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[22px]",
        "shadow-inner shadow-black/50",
        mode === "preview" ? "cursor-pointer select-none" : "",
      ].join(" ")}
      style={{
        // Dark "rice paper" (米字格) look: warm-black base, a faint vignette,
        // and a very subtle fiber texture instead of a flat fill.
        background:
          "radial-gradient(120% 120% at 50% 38%, rgba(255,244,232,0.05), transparent 60%)," +
          "repeating-linear-gradient(115deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)," +
          "#0b0a09",
      }}
      onClick={mode === "preview" ? animatePreview : undefined}
      aria-label={
        mode === "preview"
          ? "Нажмите, чтобы посмотреть порядок написания " + character
          : "Напишите иероглиф " + character
      }
    >
      <div ref={hostRef} className="absolute inset-0 z-0" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white/25">
          загрузка…
        </div>
      )}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-red-200/70">
          Не удалось загрузить данные иероглифа
        </div>
      )}
    </div>
  );
}

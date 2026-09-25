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
  create: (target: HTMLElement, character: string, options: HanziWriterOptions) => HanziWriterInstance;
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

type Props = {
  character: string;
  mode?: "practice" | "preview";
  /** Forces a fresh writer instance (e.g. pass a new key when the card changes). */
  resetKey?: string | number;
};

export default function HanziWriterDrawing({ character, mode = "practice", resetKey }: Props) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !character) return;

    let cancelled = false;
    writerRef.current = null;
    target.replaceChildren();
    setStatus("loading");

    // Size the writer to whatever box it actually occupies, so 1..N character
    // squares in a row all stay square and legible instead of using a fixed px size.
    const measured = Math.round(target.clientWidth || target.getBoundingClientRect().width || 0);
    const isPractice = mode === "practice";
    const size = measured > 0 ? measured : isPractice ? 210 : 250;
    const padding = Math.round(size * (isPractice ? 0.09 : 0.06));

    loadLocalHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !target.isConnected) return;

        const writer = HanziWriter.create(target, character, {
          width: size,
          height: size,
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
      target.replaceChildren();
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
        // The solid cell border is the writing-cell boundary — it should read
        // slightly *lighter* than the dashed guide lines inside it.
        border: "1px solid rgba(255,255,255,0.24)",
      }}
      onClick={mode === "preview" ? animatePreview : undefined}
      aria-label={
        mode === "preview"
          ? "Нажмите, чтобы посмотреть порядок написания " + character
          : "Напишите иероглиф " + character
      }
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        <div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          style={{
            width: "1px",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.14) 0 4px, transparent 4px 9px)",
          }}
        />
        <div
          className="absolute left-0 top-1/2 w-full -translate-y-1/2"
          style={{
            height: "1px",
            backgroundImage:
              "repeating-linear-gradient(to right, rgba(255,255,255,0.14) 0 4px, transparent 4px 9px)",
          }}
        />
      </div>
      <div
        ref={targetRef}
        className="absolute inset-0 z-0 flex h-full w-full items-center justify-center"
      />
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

"use client";

import { useEffect, useRef, useState } from "react";

type HanziWriterOptions = {
  width: number;
  height: number;
  padding: number;
  showCharacter?: boolean;
  showOutline?: boolean;
  showHintAfterMisses?: number | false;
  onLoadCharDataError?: (reason: unknown) => void;
};

type HanziWriterInstance = {
  quiz: (options?: {
    onComplete?: (summary: { totalMistakes: number }) => void;
    showHintAfterMisses?: number | false;
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
      // Bare-minimum CDN load per https://hanziwriter.org/docs.html#script-loading-link
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
};

// Stripped down to the simplest possible thing that could work: a plain div
// target, default rendering (no custom SVG/grid, no custom colors), library +
// character data both loaded from the jsdelivr CDN. Nothing fancy — just
// trying to get *a* character to show up at all.
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

    const isPractice = mode === "practice";

    loadHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !host.isConnected) return;

        const writer = HanziWriter.create(host, character, {
          width: 200,
          height: 200,
          padding: 15,
          showCharacter: !isPractice,
          showHintAfterMisses: isPractice ? 5 : false,
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
          writer.quiz({ showHintAfterMisses: 5 });
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
  }, [character, mode, resetKey]);

  function animatePreview() {
    writerRef.current?.animateCharacter();
  }

  return (
    <div
      className={[
        "relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white",
        mode === "preview" ? "cursor-pointer select-none" : "",
      ].join(" ")}
      onClick={mode === "preview" ? animatePreview : undefined}
      aria-label={
        mode === "preview"
          ? "Нажмите, чтобы посмотреть порядок написания " + character
          : "Напишите иероглиф " + character
      }
    >
      <div ref={hostRef} className="flex items-center justify-center" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-black/40">
          загрузка…
        </div>
      )}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-red-600">
          Не удалось загрузить данные иероглифа
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type HanziWriterOptions = {
  width: number;
  height: number;
  padding: number;
  showCharacter: boolean;
  showOutline: boolean;
  outlineColor: string;
  drawingColor: string;
  drawingWidth: number;
  strokeColor: string;
  charDataLoader: (character: string, onComplete: (data: unknown) => void) => void;
  onLoadCharDataError?: (reason: unknown) => void;
};

type HanziWriterInstance = {
  quiz: (options?: {
    onComplete?: (summary: { totalMistakes: number }) => void;
  }) => void;
  cancelQuiz: () => void;
};

type HanziWriterFactory = {
  create: (
    target: HTMLElement,
    character: string,
    options: HanziWriterOptions,
  ) => HanziWriterInstance;
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

type Props = { character: string };

export default function HanziWriterDrawing({ character }: Props) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "done">("loading");

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !character) return;

    let cancelled = false;
    writerRef.current = null;
    target.replaceChildren();
    setStatus("loading");

    loadLocalHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !target.isConnected) return;

        const writer = HanziWriter.create(target, character, {
          width: 230,
          height: 230,
          padding: 18,
          showCharacter: false,
          showOutline: true,
          outlineColor: "rgba(255,255,255,0.16)",
          drawingColor: "rgba(255,255,255,0.9)",
          drawingWidth: 5,
          strokeColor: "rgba(255,255,255,0.72)",
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

        writer.quiz({
          onComplete: () => {
            if (!cancelled) setStatus("done");
          },
        });
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
  }, [character]);

  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-white/[0.12] bg-black/20">
      <div className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
        Hanzi
      </div>
      <div ref={targetRef} className="h-full w-full" aria-label={"Напишите иероглиф " + character} />
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
      {status === "done" && (
        <div className="pointer-events-none absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.12] text-xs text-white/70">
          ✓
        </div>
      )}
    </div>
  );
}

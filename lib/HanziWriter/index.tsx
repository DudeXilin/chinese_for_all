"use client";

import { useEffect, useRef, useState } from "react";

export type HanziWriterMode = "static" | "animate" | "quiz";

export type HanziWriterInstance = {
  animateCharacter: (options?: { onComplete?: () => void }) => Promise<void>;
  loopCharacterAnimation: () => void;
  quiz: (options?: { onComplete?: (summary: { character: string; totalMistakes: number }) => void; onMistake?: (data: unknown) => void; onCorrectStroke?: (data: unknown) => void }) => void;
  cancelQuiz: () => void;
  setCharacter: (character: string) => void;
  showCharacter: () => void;
  hideCharacter: () => void;
  showOutline: () => void;
  hideOutline: () => void;
  updateColor: (colorName: string, value: string) => void;
};

type WriterOptions = {
  width?: number;
  height?: number;
  padding?: number;
  strokeColor?: string;
  radicalColor?: string;
  outlineColor?: string;
  drawingColor?: string;
  highlightColor?: string;
  showCharacter?: boolean;
  showOutline?: boolean;
  strokeAnimationSpeed?: number;
  delayBetweenStrokes?: number;
  [key: string]: unknown;
};

type HanziWriterFactory = {
  create: (target: HTMLElement, character: string, options?: WriterOptions) => HanziWriterInstance;
};

declare global {
  interface Window {
    HanziWriter?: HanziWriterFactory;
    __cfaHanziWriterLoading?: Promise<HanziWriterFactory>;
  }
}

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js";

export function loadHanziWriter(): Promise<HanziWriterFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Hanzi Writer is available only in the browser."));
  }
  if (window.HanziWriter) return Promise.resolve(window.HanziWriter);
  if (window.__cfaHanziWriterLoading) return window.__cfaHanziWriterLoading;

  window.__cfaHanziWriterLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-cfa-hanzi-writer="true"]');
    const script = existing ?? document.createElement("script");
    const cleanup = () => {
      delete window.__cfaHanziWriterLoading;
    };
    script.onload = () => {
      const writer = window.HanziWriter;
      cleanup();
      if (writer) resolve(writer);
      else reject(new Error("Hanzi Writer loaded, but its API was not found."));
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Could not load Hanzi Writer. Check your internet connection."));
    };
    if (!existing) {
      script.src = SCRIPT_URL;
      script.async = true;
      script.dataset.cfaHanziWriter = "true";
      document.head.appendChild(script);
    }
  });
  return window.__cfaHanziWriterLoading;
}

export type HanziWriterCanvasProps = {
  character: string;
  mode?: HanziWriterMode;
  width?: number;
  height?: number;
  padding?: number;
  options?: WriterOptions;
  className?: string;
  onReady?: (writer: HanziWriterInstance) => void;
  onComplete?: (summary: { character: string; totalMistakes: number }) => void;
  onError?: (error: Error) => void;
};

export function HanziWriterCanvas({
  character,
  mode = "static",
  width = 180,
  height = 180,
  padding = 8,
  options,
  className,
  onReady,
  onComplete,
  onError,
}: HanziWriterCanvasProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !character.trim()) return;
    let cancelled = false;
    let writer: HanziWriterInstance | undefined;
    setError(null);
    target.replaceChildren();

    loadHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !target.isConnected) return;
        writer = HanziWriter.create(target, character, {
          width,
          height,
          padding,
          showCharacter: mode === "static",
          showOutline: mode !== "static",
          ...options,
        });
        onReady?.(writer);
        if (mode === "animate") {
          void writer.animateCharacter({ onComplete: () => onComplete?.({ character, totalMistakes: 0 }) });
        } else if (mode === "quiz") {
          writer.quiz({
            onComplete: (summary) => onComplete?.(summary),
          });
        }
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        const message = reason instanceof Error ? reason.message : "Не удалось загрузить Hanzi Writer.";
        setError(message);
        onError?.(reason instanceof Error ? reason : new Error(message));
      });

    return () => {
      cancelled = true;
      writer?.cancelQuiz();
      target.replaceChildren();
    };
  }, [character, mode, width, height, padding, options, onReady, onComplete, onError]);

  return (
    <div className={className}>
      <div ref={targetRef} className="inline-block align-middle" aria-label={`Иероглиф ${character}`} />
      {error && <p role="status" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

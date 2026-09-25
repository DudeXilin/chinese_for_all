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
};

export default function HanziWriterDrawing({ character, mode = "practice" }: Props) {
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

    loadLocalHanziWriter()
      .then((HanziWriter) => {
        if (cancelled || !target.isConnected) return;

        const isPractice = mode === "practice";
        const writer = HanziWriter.create(target, character, {
          width: isPractice ? 210 : 250,
          height: isPractice ? 210 : 250,
          padding: isPractice ? 18 : 14,
          showCharacter: !isPractice,
          showOutline: false,
          outlineColor: "transparent",
          drawingColor: "rgba(255, 231, 216, 0.9)",
          drawingWidth: 5,
          strokeColor: "rgba(255, 232, 218, 0.78)",
          highlightColor: "rgba(214, 137, 145, 0.58)",
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
  }, [character, mode]);

  function animatePreview() {
    writerRef.current?.animateCharacter();
  }

  // Hanzi Writer renders its own SVG/canvas inside this target.
  // The paper guide is kept as a CSS background underneath it.
  const characterPaperBackground = [
    "repeating-linear-gradient(to bottom, rgba(90,90,90,0.48) 0 5px, transparent 5px 11px) 50% 0 / 2px 100% no-repeat",
    "repeating-linear-gradient(to right, rgba(90,90,90,0.48) 0 5px, transparent 5px 11px) 0 50% / 100% 2px no-repeat",
  ].join(", ");

  return (
    <div
      className={[
        "relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-[26px] border",
        "border-white/[0.11] bg-[#080808] shadow-inner shadow-black/40",
        mode === "preview" ? "cursor-pointer select-none" : "",
      ].join(" ")}
      style={{ backgroundImage: characterPaperBackground }}
      onClick={mode === "preview" ? animatePreview : undefined}
      aria-label={
        mode === "preview"
          ? "Нажмите, чтобы посмотреть порядок написания " + character
          : "Напишите иероглиф " + character
      }
    >
      <div
        ref={targetRef}
        className="absolute inset-0 flex h-full w-full items-center justify-center"
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

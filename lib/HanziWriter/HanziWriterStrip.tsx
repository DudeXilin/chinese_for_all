"use client";

import HanziWriterDrawing from "./HanziWriterDrawing";

type Props = {
  characters: string[];
  mode: "practice" | "preview";
  size: number;
  /** Unique per card+side, so each character's writer resets on a new card. */
  keyPrefix: string;
  onMistake?: () => void;
};

// One word = one continuous rounded strip of equal-size cells (vertical on
// phones, horizontal on wider screens), separated by a thin divider line
// instead of a gap — so a 4-character word reads as "甲乙丙丁", not as four
// separate boxes with daylight between them and 16 rounded corners.
export default function HanziWriterStrip({ characters, mode, size, keyPrefix, onMistake }: Props) {
  return (
    <div
      className="mx-auto flex w-fit flex-col divide-y divide-white/20 overflow-hidden rounded-[28px] sm:flex-row sm:divide-x sm:divide-y-0"
      style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.32)" }}
    >
      {characters.map((char, i) => (
        <HanziWriterDrawing
          key={`${keyPrefix}-${i}-${char}`}
          character={char}
          mode={mode}
          size={size}
          resetKey={`${keyPrefix}-${i}`}
          onMistake={mode === "practice" ? onMistake : undefined}
        />
      ))}
    </div>
  );
}

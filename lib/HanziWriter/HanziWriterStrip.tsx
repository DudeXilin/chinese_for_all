"use client";

import { Fragment } from "react";
import HanziWriterDrawing, { WARM_WHITE_DARK_30 } from "./HanziWriterDrawing";

type Props = {
  characters: string[];
  mode: "practice" | "preview";
  size: number;
  /** Unique per card+side, so each character's writer resets on a new card. */
  keyPrefix: string;
  onMistake?: () => void;
};

const dividerGradient = (direction: "to right" | "to bottom") =>
  `linear-gradient(${direction}, transparent, ${WARM_WHITE_DARK_30}, transparent)`;

// One word = one continuous rounded strip of equal-size cells (vertical on
// phones, horizontal on wider screens, no outer frame). Between characters
// there's a thin divider, same warm hue as the strokes but darker, that fades
// out to nothing at both ends — left/right on phones, top/bottom on desktop —
// instead of a hard white line or a gap.
export default function HanziWriterStrip({ characters, mode, size, keyPrefix, onMistake }: Props) {
  return (
    <div className="mx-auto flex w-fit flex-col overflow-hidden rounded-[28px] sm:flex-row">
      {characters.map((char, i) => (
        <Fragment key={`${keyPrefix}-${i}-${char}`}>
          {i > 0 && (
            <>
              {/* Mobile: horizontal line between stacked cells, fading left/right. */}
              <div
                aria-hidden="true"
                className="h-px w-full shrink-0 sm:hidden"
                style={{ backgroundImage: dividerGradient("to right") }}
              />
              {/* Desktop: vertical line between side-by-side cells, fading top/bottom. */}
              <div
                aria-hidden="true"
                className="hidden shrink-0 sm:block sm:h-full sm:w-px"
                style={{ backgroundImage: dividerGradient("to bottom") }}
              />
            </>
          )}
          <HanziWriterDrawing
            character={char}
            mode={mode}
            size={size}
            resetKey={`${keyPrefix}-${i}`}
            onMistake={mode === "practice" ? onMistake : undefined}
          />
        </Fragment>
      ))}
    </div>
  );
}

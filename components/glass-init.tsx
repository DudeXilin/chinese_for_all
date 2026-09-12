"use client";

import { useEffect } from "react";

type LiquidGLWindow = Window & {
  liquidGL?: (options: Record<string, unknown>) => unknown;
};

/**
 * Calls the real liquidGL library (loaded via a plain <script> tag -
 * see /scripts/liquidGL.js) on mount, targeting elements with the
 * given selector (defaults to ".cfa-glass"). Renders nothing itself;
 * it only triggers the WebGL glass effect on whatever markup already
 * has that class.
 */
export function GlassInit({ target = ".cfa-glass" }: { target?: string }) {
  useEffect(() => {
    const w = window as unknown as LiquidGLWindow;
    if (!w.liquidGL) return;

    w.liquidGL({
      target,
      snapshot: "body",
      resolution: 2,
      refraction: 0.02,
      bevelDepth: 0.1,
      bevelWidth: 0.12,
      frost: 0.05,
      specular: true,
      shadow: true,
      reveal: "fade",
    });
  }, [target]);

  return null;
}

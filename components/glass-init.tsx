"use client";

import { useEffect } from "react";

type LiquidGLWindow = Window & {
  liquidGL?: (options: Record<string, unknown>) => unknown;
};

// The site-wide default liquidGL configuration for every glass
// button/card built with this component. Keep this the single source
// of truth - if you want to retune the look, change it here rather
// than passing one-off overrides at each call site.
export const DEFAULT_GLASS_OPTIONS = {
  snapshot: "body",
  resolution: 1.5,
  refraction: 0.002,
  aberration: 0.1,
  bevelDepth: 0.04,
  bevelWidth: 0.264,
  frost: 0,
  shadow: true,
  specular: true,
  reveal: "fade",
  tilt: false,
  tiltFactor: 10,
  tiltEase: 400,
  magnify: 1.2,
  helper: false,
} as const;

/**
 * Calls the real liquidGL library (loaded via a plain <script> tag -
 * see /scripts/liquidGL.js) on mount, targeting elements with the
 * given selector (defaults to ".cfa-glass"). Renders nothing itself;
 * it only triggers the WebGL glass effect on whatever markup already
 * has that class. Pass `options` to override any of
 * DEFAULT_GLASS_OPTIONS for this particular call.
 */
export function GlassInit({
  target = ".cfa-glass",
  options,
}: {
  target?: string;
  options?: Record<string, unknown>;
}) {
  useEffect(() => {
    const w = window as unknown as LiquidGLWindow;
    if (!w.liquidGL) return;

    w.liquidGL({
      target,
      ...DEFAULT_GLASS_OPTIONS,
      ...options,
    });
  }, [target, options]);

  return null;
}

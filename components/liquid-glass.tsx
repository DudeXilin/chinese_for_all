"use client";

import { useEffect, useRef } from "react";
import { LiquidGlass } from "@ybouane/liquidglass";

type LiquidGlassPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function LiquidGlassPanel({
  children,
  className = "",
}: LiquidGlassPanelProps) {
  const glassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glass = glassRef.current;

    if (!glass) return;

    const root = glass.parentElement;

    if (!root) return;

    root.style.position = "relative";
    root.style.isolation = "isolate";

    glass.dataset.config = JSON.stringify({
      blurAmount: 0.18,
      refraction: 1.15,
      chromAberration: 0.14,
      edgeHighlight: 0.22,
      specular: 0.4,
      fresnel: 1,
      distortion: 0.08,
      cornerRadius: 32,
      zRadius: 30,
      opacity: 0.96,
      saturation: 0.12,
      brightness: 0.03,
      shadowOpacity: 0.35,
      shadowSpread: 12,
      shadowOffsetY: 6,
      floating: false,
      button: false,
    });

    let instance: LiquidGlass | null = null;
    let cancelled = false;

    async function initialize() {
      try {
        const created = await LiquidGlass.init({
          root,
          glassElements: [glass],
        });

        if (cancelled) {
          created.destroy();
          return;
        }

        instance = created;
      } catch (error) {
        console.error("Liquid Glass initialization failed:", error);
      }
    }

    initialize();

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  return (
    <div
      ref={glassRef}
      className={`relative isolate ${className}`}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

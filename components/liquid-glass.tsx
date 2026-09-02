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
    const glassElement = glassRef.current;

    if (!glassElement) {
      return;
    }

    const rootElement = glassElement.parentElement;

    if (!rootElement) {
      return;
    }

    const glass = glassElement as HTMLElement;
    const root = rootElement as HTMLElement;

    root.style.position = "relative";
    root.style.isolation = "isolate";

    glass.dataset.config = JSON.stringify({
      blurAmount: 0.16,
      refraction: 1.2,
      chromAberration: 0.16,
      edgeHighlight: 0.24,
      specular: 0.42,
      fresnel: 1,
      distortion: 0.1,
      cornerRadius: 32,
      zRadius: 32,
      opacity: 0.94,
      saturation: 0.14,
      brightness: 0.04,
      shadowOpacity: 0.32,
      shadowSpread: 14,
      shadowOffsetY: 7,
      floating: false,
      button: false,
    });

    let instance: LiquidGlass | null = null;
    let cancelled = false;

    const initialize = async () => {
      try {
        const created = await LiquidGlass.init({
          root: root,
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
    };

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

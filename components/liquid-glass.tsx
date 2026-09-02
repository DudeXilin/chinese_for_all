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
  const rootRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const glass = glassRef.current;

    if (!root || !glass) return;

    glass.dataset.config = JSON.stringify({
      blurAmount: 0.18,
      refraction: 0.78,
      chromAberration: 0.04,
      edgeHighlight: 0.1,
      specular: 0.2,
      fresnel: 1.15,
      distortion: 0,
      cornerRadius: 32,
      zRadius: 28,
      opacity: 0.45,
      saturation: 0.05,
      tintStrength: 0,
      brightness: 0.02,
      shadowOpacity: 0.22,
      shadowSpread: 12,
      shadowOffsetY: 5,
    });

    let instance: Awaited<ReturnType<typeof LiquidGlass.init>> | null = null;
    let cancelled = false;

    LiquidGlass.init({
      root,
      glassElements: [glass],
    })
      .then((createdInstance) => {
        if (cancelled) {
          createdInstance.destroy();
          return;
        }

        instance = createdInstance;
      })
      .catch((error) => {
        console.error("Liquid Glass initialization failed:", error);
      });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#d8aaa0]/45 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-[#b8c7a8]/45 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[#d8c69f]/40 blur-3xl" />

      <div
        ref={glassRef}
        className={`relative overflow-visible rounded-[2rem] border border-white/45 bg-transparent shadow-[0_25px_70px_rgba(0,0,0,0.16)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

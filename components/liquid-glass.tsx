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
      blurAmount: 0,
      refraction: 0.69,
      chromAberration: 0.06,
      edgeHighlight: 0.12,
      specular: 0.18,
      fresnel: 1,
      distortion: 0,
      cornerRadius: 32,
      zRadius: 24,
      opacity: 0.9,
      saturation: 0,
      tintStrength: 0,
      brightness: 0.02,
      shadowOpacity: 0.2,
      shadowSpread: 10,
      shadowOffsetY: 4,
    });

    let instance: Awaited<ReturnType<typeof LiquidGlass.init>> | null = null;
    let cancelled = false;

    LiquidGlass.init({
      root,
      glassElements: [glass],
    }).then((createdInstance) => {
      if (cancelled) {
        createdInstance.destroy();
        return;
      }

      instance = createdInstance;
    });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="absolute inset-0 rounded-[2rem] bg-[#d9b7aa]/30" />
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#b9c9ae]/35 blur-2xl" />
      <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-[#d8c9a9]/35 blur-2xl" />

      <div
        ref={glassRef}
        className={`relative rounded-[2rem] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

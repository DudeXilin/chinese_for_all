"use client";

import { useEffect, useRef } from "react";
import { LiquidGlass } from "@ybouane/liquidglass";

type LiquidGlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  config?: Record<string, number | boolean>;
};

export function LiquidGlassPanel({
  children,
  className = "",
  config = {},
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
      chromAberration: 0.05,
      edgeHighlight: 0.12,
      specular: 0.16,
      fresnel: 1,
      distortion: 0,
      cornerRadius: 32,
      zRadius: 22,
      opacity: 0.82,
      saturation: 0,
      tintStrength: 0,
      brightness: 0.03,
      shadowOpacity: 0.18,
      shadowSpread: 8,
      shadowOffsetY: 3,
      ...config,
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
  }, [config]);

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={glassRef}
        className={`rounded-[2rem] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}      cancelled = true;
      instance?.destroy();
    };
  }, [config]);

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={glassRef}
        className={`relative overflow-visible ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

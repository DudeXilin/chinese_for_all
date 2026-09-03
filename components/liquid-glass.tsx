"use client";

import { useEffect, useRef } from "react";
import { LiquidGlass } from "@ybouane/liquidglass";

export type LiquidGlassConfig = {
  blurAmount: number;
  refraction: number;
  chromAberration: number;
  edgeHighlight: number;
  specular: number;
  fresnel: number;
  distortion: number;
  cornerRadius: number;
  zRadius: number;
  opacity: number;
  saturation: number;
  tintStrength: number;
  brightness: number;
  shadowOpacity: number;
  shadowSpread: number;
  shadowOffsetY: number;
  floating: boolean;
  button: boolean;
  bevelMode: 0 | 1;
};

export const DEFAULT_LIQUID_GLASS_CONFIG: LiquidGlassConfig = {
  blurAmount: 0.2,
  refraction: 0.62,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1.12,
  distortion: 0,
  cornerRadius: 41,
  zRadius: 41,
  opacity: 1,
  saturation: 0,
  tintStrength: 0.45,
  brightness: 0,
  shadowOpacity: 0.31,
  shadowSpread: 15,
  shadowOffsetY: 0,
  floating: false,
  button: false,
  bevelMode: 0,
};

type LiquidGlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  config?: LiquidGlassConfig;
};

export function LiquidGlassPanel({
  children,
  className = "",
  config = DEFAULT_LIQUID_GLASS_CONFIG,
}: LiquidGlassPanelProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);

  useEffect(() => {
    const glassElement = glassRef.current;
    if (!glassElement) return;

    const rootElement = glassElement.parentElement;
    if (!rootElement) return;

    const glass = glassElement as HTMLElement;
    const root = rootElement as HTMLElement;

    root.style.position = "relative";
    root.style.isolation = "isolate";
    glass.dataset.config = JSON.stringify(config);

    let cancelled = false;

    const initialize = async () => {
      try {
        const instance = await LiquidGlass.init({
          root,
          glassElements: [glass],
        });

        if (cancelled) {
          instance.destroy();
          return;
        }

        instanceRef.current = instance;
      } catch (error) {
        console.error("Liquid Glass initialization failed:", error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const glassElement = glassRef.current;
    if (!glassElement) return;

    glassElement.dataset.config = JSON.stringify(config);

    const instance = instanceRef.current;
    if (instance) {
      instance.markChanged(glassElement);
    }
  }, [config]);

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

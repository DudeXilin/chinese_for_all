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
  tintStrength: 0,
  brightness: 0.04,
  shadowOpacity: 0.32,
  shadowSpread: 14,
  shadowOffsetY: 7,
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

    // Начальная конфигурация должна попасть в элемент
    // ДО запуска Liquid Glass.
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
        console.error(
          "Liquid Glass initialization failed:",
          error,
        );
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

    if (!glassElement) {
      return;
    }

    // Обновляем конфигурацию непосредственно на HTML-элементе.
    const configString = JSON.stringify(config);

    glassElement.dataset.config = configString;

    // И главное:
    // немедленно говорим Liquid Glass,
    // что стекло нужно перерисовать.
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

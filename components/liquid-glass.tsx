"use client";

import { useEffect, useRef } from "react";
import liquidGL from "liquid-gl";

export type LiquidGlassConfig = {
  resolution: number;
  refraction: number;
  aberration: number;
  bevelDepth: number;
  bevelWidth: number;
  frost: number;
  shadow: boolean;
  specular: boolean;
  reveal: "none" | "fade";
  tilt: boolean;
  tiltFactor: number;
  tiltEase: number;
  magnify: number;
};

export const DEFAULT_LIQUID_GLASS_CONFIG: LiquidGlassConfig = {
  resolution: 2,
  refraction: 0,
  aberration: 0,
  bevelDepth: 0.052,
  bevelWidth: 0.211,
  frost: 2,
  shadow: true,
  specular: true,
  reveal: "fade",
  tilt: false,
  tiltFactor: 5,
  tiltEase: 400,
  magnify: 1,
};

type LiquidGlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  config?: LiquidGlassConfig;
  debug?: boolean;
};

export function LiquidGlassPanel({
  children,
  className = "",
  config = DEFAULT_LIQUID_GLASS_CONFIG,
  debug = true,
}: LiquidGlassPanelProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const guiRef = useRef<any>(null);

  useEffect(() => {
    const element = glassRef.current;
    if (!element) return;

    let cancelled = false;

    const initialize = async () => {
      try {
        const instance = liquidGL({
          target: element,
          snapshot: "body",
          ...config,
          on: {
            init() {
              if (!cancelled) element.dataset.liquidReady = "true";
            },
          },
        });

        if (cancelled) {
          instance?.destroy?.();
          return;
        }

        instanceRef.current = instance;

        if (!debug) return;

        const { GUI } = await import("lil-gui");
        if (cancelled || !instanceRef.current) return;

        const gui = new GUI({ title: "Liquid Glass", width: 250 });
        guiRef.current = gui;

        const folder = gui.addFolder("Effect");
        const controls = [
          ["refraction", 0, 0.1, 0.001],
          ["aberration", 0, 1, 0.01],
          ["bevelDepth", 0, 0.2, 0.001],
          ["bevelWidth", 0, 0.5, 0.001],
          ["frost", 0, 10, 0.1],
          ["magnify", 1, 5, 0.1],
          ["tiltFactor", 0, 25, 0.1],
          ["tiltEase", 0, 1000, 10],
        ] as const;

        for (const [key, min, max, step] of controls) {
          folder
            .add(instance.options, key, min, max, step)
            .onChange((value: number) => {
              instance.options[key] = value;
              instance.markChanged?.();
              instance.renderer?.render?.();
            });
        }

        folder.add(instance.options, "shadow").onChange((value: boolean) => {
          instance.options.shadow = value;
          instance.setShadow?.(value);
        });

        folder.add(instance.options, "specular").onChange((value: boolean) => {
          instance.options.specular = value;
          instance.markChanged?.();
        });

        folder.add(instance.options, "tilt").onChange((value: boolean) => {
          instance.options.tilt = value;
          instance.setTilt?.(value);
        });

        folder
          .add(instance.options, "reveal", ["none", "fade"])
          .onChange((value: "none" | "fade") => {
            instance.options.reveal = value;
          });

        folder.close();
      } catch (error) {
        console.error("liquidGL initialization failed:", error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      guiRef.current?.destroy?.();
      guiRef.current = null;
      instanceRef.current?.destroy?.();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={glassRef}
      className={`liquidGL relative isolate ${className}`}
      style={{ borderRadius: "inherit", position: "relative" }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

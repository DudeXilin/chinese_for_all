"use client";

import { useEffect, useRef } from "react";

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
  bevelWidth: 0.18,
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

type LiquidGLInstance = {
  options: LiquidGlassConfig & { target: string; snapshot?: string };
  setShadow?: (enabled: boolean) => void;
  setTilt?: (enabled: boolean) => void;
  destroy?: () => void;
};

const lenses = new Set<LiquidGLInstance>();
let gui: any = null;
let guiPromise: Promise<any> | null = null;

async function ensureDebugGui() {
  if (gui) return gui;
  if (guiPromise) return guiPromise;

  guiPromise = import("lil-gui").then(({ GUI }) => {
    if (gui) return gui;

    gui = new GUI({ title: "Liquid Glass", width: 240 });
    const folder = gui.addFolder("liquidGL Effect");
    const first = () => Array.from(lenses)[0];
    const updateAll = (key: keyof LiquidGlassConfig, value: unknown) => {
      lenses.forEach((lens) => {
        lens.options[key] = value as never;
        if (key === "shadow") lens.setShadow?.(value as boolean);
        if (key === "tilt") lens.setTilt?.(value as boolean);
      });
    };

    const lens = first();
    if (!lens) return gui;

    folder
      .add(lens.options, "refraction", 0, 0.1, 0.001)
      .onChange((value: number) => updateAll("refraction", value));
    folder
      .add(lens.options, "aberration", 0, 1, 0.01)
      .onChange((value: number) => updateAll("aberration", value));
    folder
      .add(lens.options, "bevelDepth", 0, 0.2, 0.001)
      .onChange((value: number) => updateAll("bevelDepth", value));
    folder
      .add(lens.options, "bevelWidth", 0, 0.5, 0.001)
      .onChange((value: number) => updateAll("bevelWidth", value));
    folder
      .add(lens.options, "frost", 0, 10, 0.1)
      .onChange((value: number) => updateAll("frost", value));
    folder
      .add(lens.options, "shadow")
      .onChange((value: boolean) => updateAll("shadow", value));
    folder
      .add(lens.options, "specular")
      .onChange((value: boolean) => updateAll("specular", value));
    folder
      .add(lens.options, "reveal", ["none", "fade"])
      .onChange((value: "none" | "fade") => updateAll("reveal", value));
    folder
      .add(lens.options, "tilt")
      .onChange((value: boolean) => updateAll("tilt", value));
    folder
      .add(lens.options, "tiltFactor", 0, 25, 0.1)
      .onChange((value: number) => updateAll("tiltFactor", value));
    folder
      .add(lens.options, "tiltEase", 0, 1000, 10)
      .onChange((value: number) => updateAll("tiltEase", value));
    folder
      .add(lens.options, "magnify", 0.001, 3, 0.01)
      .onChange((value: number) => updateAll("magnify", value));

    folder.close();
    return gui;
  }).finally(() => {
    guiPromise = null;
  });

  return guiPromise;
}

export function LiquidGlassPanel({
  children,
  className = "",
  config = DEFAULT_LIQUID_GLASS_CONFIG,
  debug = true,
}: LiquidGlassPanelProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiquidGLInstance>(null);

  useEffect(() => {
    const element = glassRef.current;
    if (!element) return;

    let cancelled = false;
    const targetId = `liquid-glass-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    element.dataset.liquidGlassTarget = targetId;

    const initialize = async () => {
      try {
        const { default: liquidGL } = await import("liquid-gl");
        if (cancelled) return;

        const instance = liquidGL({
          target: `[data-liquid-glass-target="${targetId}"]`,
          snapshot: "body",
          ...config,
          on: {
            init() {
              if (!cancelled) element.dataset.liquidGlassReady = "true";
            },
          },
        });

        if (cancelled || !instance) {
          instance?.destroy?.();
          return;
        }

        instanceRef.current = instance as LiquidGLInstance;
        lenses.add(instance as LiquidGLInstance);

        if (debug) await ensureDebugGui();
      } catch (error) {
        console.error("liquidGL initialization failed:", error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      const instance = instanceRef.current;
      if (instance) {
        lenses.delete(instance);
        instance.destroy?.();
        instanceRef.current = null;
      }

      if (lenses.size === 0 && gui) {
        gui.destroy?.();
        gui = null;
      }
    };
  }, []);

  return (
    <div
      ref={glassRef}
      data-liquid-glass-panel="true"
      className={`liquidGL relative z-[9999] ${className}`}
      style={{ borderRadius: "inherit" }}
    >
      <div className="relative z-[3]">{children}</div>
    </div>
  );
}

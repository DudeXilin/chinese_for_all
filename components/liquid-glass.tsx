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

type LiquidGLInstance = {
  options: LiquidGlassConfig & { target: string; snapshot?: string };
  markChanged?: () => void;
  setShadow?: (enabled: boolean) => void;
  setTilt?: (enabled: boolean) => void;
  destroy?: () => void;
};

type Lens = LiquidGLInstance;

const lenses = new Set<Lens>();
let gui: any = null;
let guiPromise: Promise<any> | null = null;

async function ensureDebugGui() {
  if (gui) return gui;
  if (guiPromise) return guiPromise;

  guiPromise = import("lil-gui").then(({ GUI }) => {
    if (gui) return gui;

    gui = new GUI({ title: "Liquid Glass", width: 240 });
    const folder = gui.addFolder("Effect");

    const numeric = [
      ["refraction", 0, 0.1, 0.001],
      ["aberration", 0, 1, 0.01],
      ["bevelDepth", 0, 0.2, 0.001],
      ["bevelWidth", 0, 0.5, 0.001],
      ["frost", 0, 10, 0.1],
      ["magnify", 1, 5, 0.1],
      ["tiltFactor", 0, 25, 0.1],
      ["tiltEase", 0, 1000, 10],
    ] as const;

    const first = () => Array.from(lenses)[0];

    for (const [key, min, max, step] of numeric) {
      folder.add({
        get value() { return first()?.options[key]; },
        set value(v: number) {
          lenses.forEach((lens) => {
            lens.options[key] = v;
            lens.markChanged?.();
          });
        },
      }, "value", min, max, step).name(key);
    }

    for (const key of ["shadow", "specular", "tilt"] as const) {
      folder.add({
        get value() { return first()?.options[key]; },
        set value(v: boolean) {
          lenses.forEach((lens) => {
            lens.options[key] = v;
            if (key === "shadow") lens.setShadow?.(v);
            if (key === "tilt") lens.setTilt?.(v);
            lens.markChanged?.();
          });
        },
      }, "value").name(key);
    }

    folder
      .add({
        get value() { return first()?.options.reveal; },
        set value(v: "none" | "fade") {
          lenses.forEach((lens) => {
            lens.options.reveal = v;
            lens.markChanged?.();
          });
        },
      }, "value", ["none", "fade"])
      .name("reveal");

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
  const instanceRef = useRef<Lens>(null);

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
        });

        if (cancelled || !instance) {
          instance?.destroy?.();
          return;
        }

        instanceRef.current = instance as Lens;
        lenses.add(instance as Lens);

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
      className={`liquidGL relative isolate ${className}`}
      style={{ borderRadius: "inherit", position: "relative" }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

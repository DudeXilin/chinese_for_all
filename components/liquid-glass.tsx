"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type LiquidGlassConfig = {
  resolution: number;
  refraction: number;
  bevelDepth: number;
  bevelWidth: number;
  frost: number;
  shadow: boolean;
  specular: boolean;
  reveal: "none" | "fade";
  tilt: boolean;
  tiltFactor: number;
  magnify: number;
};

export const DEFAULT_LIQUID_GLASS_CONFIG: LiquidGlassConfig = {
  resolution: 2,
  refraction: 0.01,
  bevelDepth: 0.052,
  bevelWidth: 0.211,
  frost: 2,
  shadow: true,
  specular: true,
  reveal: "fade",
  tilt: false,
  tiltFactor: 5,
  magnify: 1.05,
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

    gui = new GUI({ title: "Liquid Glass", width: 230 });
    const folder = gui.addFolder("liquidGL Effect");
    const first = () => Array.from(lenses)[0];

    const set = (key: keyof LiquidGlassConfig, value: unknown) => {
      lenses.forEach((lens) => {
        lens.options[key] = value as never;
        if (key === "shadow") lens.setShadow?.(value as boolean);
        if (key === "tilt") lens.setTilt?.(value as boolean);
      });
    };

    const proxy: Record<string, any> = {};
    const lens = first();
    const source = lens?.options;

    const numeric = [
      ["refraction", 0, 0.1, 0.001],
      ["bevelDepth", 0, 0.2, 0.001],
      ["bevelWidth", 0, 0.5, 0.001],
      ["frost", 0, 10, 0.1],
      ["tiltFactor", 0, 25, 0.1],
      ["magnify", 0.8, 2, 0.01],
    ] as const;

    for (const [key, min, max, step] of numeric) {
      proxy[key] = source?.[key] ?? DEFAULT_LIQUID_GLASS_CONFIG[key];
      folder.add(proxy, key, min, max, step).onChange((v: number) => set(key, v));
    }

    proxy.shadow = source?.shadow ?? DEFAULT_LIQUID_GLASS_CONFIG.shadow;
    proxy.specular = source?.specular ?? DEFAULT_LIQUID_GLASS_CONFIG.specular;
    proxy.tilt = source?.tilt ?? DEFAULT_LIQUID_GLASS_CONFIG.tilt;
    proxy.reveal = source?.reveal ?? DEFAULT_LIQUID_GLASS_CONFIG.reveal;

    folder.add(proxy, "shadow").onChange((v: boolean) => set("shadow", v));
    folder.add(proxy, "specular").onChange((v: boolean) => set("specular", v));
    folder.add(proxy, "tilt").onChange((v: boolean) => set("tilt", v));
    folder.add(proxy, "reveal", ["none", "fade"]).onChange((v: "none" | "fade") => set("reveal", v));
    folder.close();

    return gui;
  }).finally(() => {
    guiPromise = null;
  });

  return guiPromise;
}

function getScrollParent(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) return parent;
    parent = parent.parentElement;
  }
  return window;
}

export function LiquidGlassPanel({
  children,
  className = "",
  config = DEFAULT_LIQUID_GLASS_CONFIG,
  debug = true,
}: LiquidGlassPanelProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiquidGLInstance>(null);
  const idRef = useRef(`liquid-glass-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder) return;

    const updateRect = () => {
      const r = placeholder.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const scrollParent = getScrollParent(placeholder);
    updateRect();
    window.addEventListener("scroll", updateRect, { passive: true });
    if (scrollParent !== window) scrollParent.addEventListener("scroll", updateRect, { passive: true });
    window.addEventListener("resize", updateRect, { passive: true });

    const observer = new ResizeObserver(updateRect);
    observer.observe(placeholder);

    return () => {
      window.removeEventListener("scroll", updateRect);
      if (scrollParent !== window) scrollParent.removeEventListener("scroll", updateRect);
      window.removeEventListener("resize", updateRect);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (debug) void ensureDebugGui();
  }, [debug]);

  useEffect(() => {
    if (!mounted) return;

    const element = document.querySelector(`[data-liquid-glass-id="${idRef.current}"]`) as HTMLElement | null;
    if (!element) return;

    let cancelled = false;
    const initialize = async () => {
      try {
        const { default: liquidGL } = await import("liquid-gl");
        if (cancelled) return;

        const instance = liquidGL({
          target: `[data-liquid-glass-id="${idRef.current}"]`,
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
      } catch (error) {
        console.warn("liquidGL initialization failed; CSS glass fallback remains active.", error);
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
  }, [mounted]);

  const visualStyle = {
    position: "fixed" as const,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    maxWidth: "none",
    margin: 0,
    borderRadius: "inherit",
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.35)",
    boxShadow: "0 18px 50px rgba(30,25,20,0.10)",
  };

  return (
    <div ref={placeholderRef} className={className} style={{ visibility: "hidden" }} aria-hidden="true">
      {mounted && createPortal(
        <div
          data-liquid-glass-id={idRef.current}
          className={`liquidGL z-[9999] ${className}`}
          style={visualStyle}
        >
          <div className="relative z-[3] h-full w-full">{children}</div>
        </div>,
        document.body,
      )}
    </div>
  );
}

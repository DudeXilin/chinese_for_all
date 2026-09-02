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
if (!glassElement) return;

const rootElement = glassElement.parentElement;

if (!rootElement) return;

const glass: HTMLElement = glassElement;
const root: HTMLElement = rootElement;

glass.dataset.config = JSON.stringify({
  blurAmount: 0.25,
  refraction: 0.8,
  chromAberration: 0.08,
  edgeHighlight: 0.12,
  specular: 0.2,
  fresnel: 1,
  distortion: 0.04,
  cornerRadius: 32,
  zRadius: 24,
  opacity: 0.92,
  saturation: 0.08,
  brightness: 0.02,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  shadowOffsetY: 4,
  floating: false,
  button: false,
});

let instance: LiquidGlass | null = null;
let cancelled = false;

async function initialize() {
  try {
    const created = await LiquidGlass.init({
      root,
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
}

initialize();

return () => {
  cancelled = true;
  instance?.destroy();
};
}, []);
return (
<div
ref={glassRef}
className={relative ${className}}
>
{children}
</div>
);
}

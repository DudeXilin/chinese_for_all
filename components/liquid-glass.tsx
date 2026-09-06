"use client";

import type { CSSProperties, ReactNode } from "react";

export type LiquidGlassConfig = {
  [key: string]: unknown;
};

type LiquidGlassPanelProps = {
  children: ReactNode;
  className?: string;
  config?: LiquidGlassConfig;
  debug?: boolean;
};

export const DEFAULT_LIQUID_GLASS_CONFIG: LiquidGlassConfig = {};

export function LiquidGlassPanel({
  children,
  className = "",
}: LiquidGlassPanelProps) {
  return (
    <div
      className={className}
      style={
        {
          position: "relative",
          borderRadius: "inherit",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

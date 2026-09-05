declare module "liquid-gl" {
  export type LiquidGLReveal = "none" | "fade";

  export type LiquidGLOptions = {
    target: string;
    snapshot?: string;
    resolution?: number;
    refraction?: number;
    aberration?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    shadow?: boolean;
    specular?: boolean;
    reveal?: LiquidGLReveal;
    tilt?: boolean;
    tiltFactor?: number;
    tiltEase?: number;
    magnify?: number;
    on?: {
      init?: (instance: LiquidGLInstance) => void;
    };
  };

  export type LiquidGLInstance = {
    options: LiquidGLOptions;
    markChanged?: () => void;
    setShadow?: (enabled: boolean) => void;
    setTilt?: (enabled: boolean) => void;
    destroy?: () => void;
  };

  const liquidGL: (options: LiquidGLOptions) => LiquidGLInstance;

  export default liquidGL;
}

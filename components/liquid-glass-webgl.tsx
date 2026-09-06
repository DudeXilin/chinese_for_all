"use client";

import { useEffect, useRef, useState } from "react";

type GlassPane = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

type LiquidGlassWebGLProps = {
  backgroundUrl?: string;
  panes?: GlassPane[];
};

type GlassParams = {
  width: number;
  height: number;
  radius: number;
  thickness: number;
  bezel: number;
  ior: number;
  blur: number;
  specular: number;
  tint: number;
  shadow: number;
};

const DEFAULT_PARAMS: GlassParams = {
  width: 300,
  height: 200,
  radius: 60,
  thickness: 50,
  bezel: 60,
  ior: 3,
  blur: 1.5,
  specular: 0.55,
  tint: 0.08,
  shadow: 0.5,
};

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uGlassCenter;
uniform vec2 uGlassSize;
uniform float uRadius;
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform float uTint;
uniform float uShadow;
uniform sampler2D uBgTex;
uniform float uBgAspect;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s*s*s*s, 0.25);
}

vec3 sampleBg(vec2 screenUV) {
  float screenAspect = uResolution.x / uResolution.y;
  vec2 uv = screenUV;
  if (uBgAspect > screenAspect) {
    float s = screenAspect / uBgAspect;
    uv.x = uv.x * s + (1.0 - s) * 0.5;
  } else {
    float s = uBgAspect / screenAspect;
    uv.y = uv.y * s + (1.0 - s) * 0.5;
  }
  uv.y = 1.0 - uv.y;
  return texture2D(uBgTex, uv).rgb;
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.5) return sampleBg(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;
  vec2 offsets[16];
  offsets[0]  = vec2(-0.94201, -0.39906);
  offsets[1]  = vec2( 0.94558, -0.76890);
  offsets[2]  = vec2(-0.09418, -0.92938);
  offsets[3]  = vec2( 0.34495,  0.29387);
  offsets[4]  = vec2(-0.91588, -0.45771);
  offsets[5]  = vec2(-0.81544,  0.48568);
  offsets[6]  = vec2(-0.38277, -0.56071);
  offsets[7]  = vec2(-0.12675,  0.84686);
  offsets[8]  = vec2( 0.89642,  0.41254);
  offsets[9]  = vec2( 0.18150, -0.30020);
  offsets[10] = vec2(-0.01445, -0.16001);
  offsets[11] = vec2( 0.59614,  0.71118);
  offsets[12] = vec2( 0.49742, -0.47280);
  offsets[13] = vec2( 0.80685,  0.04588);
  offsets[14] = vec2(-0.32490, -0.03965);
  offsets[15] = vec2(-0.60975,  0.06566);
  for (int i = 0; i < 16; i++) {
    sum += sampleBg(uv + offsets[i] * radius * px);
  }
  return sum / 16.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 p = screenPx - uGlassCenter;
  vec2 halfSize = uGlassSize * 0.5;
  float sd = sdRoundedRect(p, halfSize, uRadius);

  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 800.0);
    float shadowAlpha = uShadow * shadowFalloff * 0.6;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(uRadius, min(halfSize.x, halfSize.y)) - 1.0);
  float t = clamp(distFromEdge / bezel, 0.0, 1.0);
  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;
  float slopeAngle = atan(dh * (uThickness / bezel));
  float sinR = sin(slopeAngle) / uIOR;
  sinR = clamp(sinR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, uRadius) - sd;
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, uRadius) - sd;
  grad = normalize(grad);

  vec2 offset = -grad * displacement / uResolution;
  vec2 screenUV = screenPx / uResolution;
  vec3 color = sampleBgBlurred(screenUV + offset, uBlur);

  vec2 lightDir = normalize(vec2(0.5, -0.7));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.5);
  color += vec3(specHighlight * uSpecular);

  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.7, innerShadow * 0.3);
  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.15 * uSpecular);
  color = mix(color, vec3(1.0), uTint);

  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha);
}`;

const DEFAULT_PANES: GlassPane[] = [
  { x: 0.25, y: 0.5, width: 300, height: 200, radius: 60 },
  { x: 0.5, y: 0.5, width: 300, height: 200, radius: 60 },
  { x: 0.75, y: 0.5, width: 300, height: 200, radius: 60 },
];

const CONTROL_DEFS = [
  ["width", "Width", 200, 700, 1],
  ["height", "Height", 100, 800, 1],
  ["radius", "Radius", 4, 100, 1],
  ["thickness", "Thickness", 10, 200, 1],
  ["bezel", "Bezel", 2, 60, 1],
  ["ior", "IOR", 1, 3, 0.05],
  ["blur", "Blur", 0, 12, 0.5],
  ["specular", "Specular", 0, 1, 0.05],
  ["tint", "Tint", 0, 0.4, 0.01],
  ["shadow", "Shadow", 0, 1, 0.05],
] as const;

export function LiquidGlassWebGL({ backgroundUrl = "/liquid-glass-bg.webp", panes = DEFAULT_PANES }: LiquidGlassWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<GlassParams>(DEFAULT_PARAMS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    let animationFrame = 0;
    let renderer: any = null;
    let material: any = null;

    const start = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const THREE = await import("three");
      if (!alive) return;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      renderer.autoClear = false;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2);

      material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uGlassCenter: { value: new THREE.Vector2() },
          uGlassSize: { value: new THREE.Vector2(DEFAULT_PARAMS.width, DEFAULT_PARAMS.height) },
          uRadius: { value: DEFAULT_PARAMS.radius },
          uBezel: { value: DEFAULT_PARAMS.bezel },
          uThickness: { value: DEFAULT_PARAMS.thickness },
          uIOR: { value: DEFAULT_PARAMS.ior },
          uBlur: { value: DEFAULT_PARAMS.blur },
          uSpecular: { value: DEFAULT_PARAMS.specular },
          uTint: { value: DEFAULT_PARAMS.tint },
          uShadow: { value: DEFAULT_PARAMS.shadow },
          uBgTex: { value: null },
          uBgAspect: { value: 1.5 },
        },
        transparent: true,
        depthTest: false,
      });

      scene.add(new THREE.Mesh(geometry, material));

      new THREE.TextureLoader().load(backgroundUrl, (texture: any) => {
        if (!alive || !material) return;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        material.uniforms.uBgTex.value = texture;
        material.uniforms.uBgAspect.value = texture.image.width / texture.image.height;
      });

      const readPanes = (): GlassPane[] => {
        const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-glass-pane]"));
        if (!elements.length) return panes;
        return elements.map((element) => {
          const rect = element.getBoundingClientRect();
          const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || paramsRef.current.radius;
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            radius,
          };
        });
      };

      const resize = () => {
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      };

      const render = () => {
        if (!alive) return;
        const current = paramsRef.current;
        const u = material.uniforms;
        u.uResolution.value.set(window.innerWidth, window.innerHeight);
        u.uBezel.value = current.bezel;
        u.uThickness.value = current.thickness;
        u.uIOR.value = current.ior;
        u.uBlur.value = current.blur;
        u.uSpecular.value = current.specular;
        u.uTint.value = current.tint;
        u.uShadow.value = current.shadow;

        renderer.clear();
        for (const pane of readPanes()) {
          u.uGlassCenter.value.set(pane.x, window.innerHeight - pane.y);
          u.uGlassSize.value.set(current.width, current.height);
          u.uRadius.value = current.radius;
          renderer.render(scene, camera);
        }

        animationFrame = requestAnimationFrame(render);
      };

      window.addEventListener("resize", resize, { passive: true });
      resize();
      render();

      return () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(animationFrame);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    };

    void start();

    return () => {
      alive = false;
      cancelAnimationFrame(animationFrame);
      if (renderer) renderer.dispose();
      if (material) material.dispose();
    };
  }, [backgroundUrl, panes]);

  const changeParam = (key: keyof GlassParams, value: number) => {
    const next = { ...paramsRef.current, [key]: value };
    paramsRef.current = next;
    setParams(next);
  };

  const formatValue = (key: keyof GlassParams, value: number) => {
    if (key === "ior" || key === "blur" || key === "specular" || key === "shadow") return value.toFixed(2);
    if (key === "tint") return `${Math.round(value * 100)}%`;
    return Math.round(value).toString();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      />

      <button
        type="button"
        aria-label="Toggle glass controls"
        onClick={() => setDebugOpen((open) => !open)}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 10003,
          width: 44,
          height: 44,
          border: "1px solid rgba(255,255,255,.28)",
          borderRadius: 12,
          background: "rgba(20,20,24,.82)",
          color: "white",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          touchAction: "manipulation",
          fontSize: 20,
        }}
      >
        ⚙
      </button>

      {debugOpen && (
        <div
          style={{
            position: "fixed",
            top: 68,
            right: 16,
            zIndex: 10004,
            width: "min(330px, calc(100vw - 32px))",
            maxHeight: "calc(100vh - 84px)",
            overflowY: "auto",
            padding: 16,
            borderRadius: 16,
            background: "rgba(18,18,22,.94)",
            color: "white",
            border: "1px solid rgba(255,255,255,.18)",
            boxShadow: "0 18px 50px rgba(0,0,0,.35)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>Liquid Glass WebGL</strong>
            <button
              type="button"
              onClick={() => setDebugOpen(false)}
              style={{ background: "transparent", border: 0, color: "white", fontSize: 20, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
          {CONTROL_DEFS.map(([key, label, min, max, step]) => {
            const typedKey = key as keyof GlassParams;
            const value = params[typedKey];
            return (
              <label key={key} style={{ display: "grid", gridTemplateColumns: "78px 1fr 44px", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span>{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(event) => changeParam(typedKey, Number(event.target.value))}
                  style={{ width: "100%" }}
                />
                <span style={{ textAlign: "right", opacity: 0.75 }}>{formatValue(typedKey, value)}</span>
              </label>
            );
          })}
        </div>
      )}
    </>
  );
}

export default LiquidGlassWebGL;

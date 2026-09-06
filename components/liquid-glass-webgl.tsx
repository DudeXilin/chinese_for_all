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
  bezel: number;
  thickness: number;
  ior: number;
  blur: number;
  specular: number;
  tint: number;
  shadow: number;
};

const DEFAULT_PARAMS: GlassParams = {
  bezel: 60,
  thickness: 50,
  ior: 3,
  blur: 1.5,
  specular: 0.55,
  tint: 0.08,
  shadow: 0.5,
};

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
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
uniform float uScrollProgress;

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
  uv.y = fract(uv.y + uScrollProgress);

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
  float safeBezel = max(1.0, min(uBezel, min(uRadius, min(halfSize.x, halfSize.y)) - 1.0));
  float t = clamp(distFromEdge / safeBezel, 0.0, 1.0);
  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;
  float slopeAngle = atan(dh * (uThickness / safeBezel));
  float sinR = clamp(sin(slopeAngle) / uIOR, -1.0, 1.0);
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
  float rimFalloff = 1.0 - smoothstep(0.0, safeBezel * 0.4, distFromEdge);
  color += vec3(pow(rimDot * rimFalloff, 1.5) * uSpecular);

  float innerShadow = 1.0 - smoothstep(0.0, safeBezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.7, innerShadow * 0.3);
  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.15 * uSpecular);
  color = mix(color, vec3(1.0), uTint);

  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha);
}`;

const DEFAULT_PANES: GlassPane[] = [
  { x: 0.32, y: 0.5, width: 0.25, height: 0.22, radius: 28 },
  { x: 0.5, y: 0.5, width: 0.25, height: 0.22, radius: 28 },
  { x: 0.68, y: 0.5, width: 0.25, height: 0.22, radius: 28 },
];

export function LiquidGlassWebGL({
  backgroundUrl = "/liquid-glass-bg.webp",
  panes = DEFAULT_PANES,
}: LiquidGlassWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<GlassParams>(DEFAULT_PARAMS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the broadly supported WebGL 1 path for the shader. WebGL 2 devices
    // also support this API, while this avoids mobile browsers selecting a
    // WebGL 2 context and then rejecting the older shader syntax.
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });

    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create WebGL shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || "Unknown shader error";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Unable to link WebGL program");
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "aPosition");
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uResolution = uniform("uResolution");
    const uGlassCenter = uniform("uGlassCenter");
    const uGlassSize = uniform("uGlassSize");
    const uRadius = uniform("uRadius");
    const uBezel = uniform("uBezel");
    const uThickness = uniform("uThickness");
    const uIOR = uniform("uIOR");
    const uBlur = uniform("uBlur");
    const uSpecular = uniform("uSpecular");
    const uTint = uniform("uTint");
    const uShadow = uniform("uShadow");
    const uBgTex = uniform("uBgTex");
    const uBgAspect = uniform("uBgAspect");
    const uScrollProgress = uniform("uScrollProgress");

    const texture = gl.createTexture();
    const image = new Image();
    image.decoding = "async";
    image.src = backgroundUrl;

    let animationFrame = 0;
    let alive = true;
    let bgAspect = 1.5;
    let textureReady = false;
    let scrollProgress = 0;

    const uploadTexture = () => {
      if (!alive || !image.naturalWidth || !texture) return;
      bgAspect = image.naturalWidth / image.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
    };

    image.onload = uploadTexture;

    const getDpr = () => Math.min(window.devicePixelRatio || 1, window.innerWidth <= 768 ? 1.5 : 2);

    const resize = () => {
      const dpr = getDpr();
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const updateScroll = () => {
      const viewportHeight = Math.max(1, window.innerHeight);
      scrollProgress = (window.scrollY % viewportHeight) / viewportHeight;
    };

    const readPanes = (): GlassPane[] => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-glass-pane]"));
      if (!elements.length) return panes;
      const dpr = getDpr();
      return elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 28;
        return {
          x: ((rect.left + rect.width / 2) * dpr) / canvas.width,
          y: ((window.innerHeight - rect.top - rect.height / 2) * dpr) / canvas.height,
          width: (rect.width * dpr) / canvas.width,
          height: (rect.height * dpr) / canvas.height,
          radius: radius * dpr,
        };
      });
    };

    const render = () => {
      if (!alive) return;
      resize();
      updateScroll();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (textureReady) {
        const current = paramsRef.current;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uBgTex, 0);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uBgAspect, bgAspect);
        gl.uniform1f(uScrollProgress, scrollProgress);
        gl.uniform1f(uBezel, current.bezel * getDpr());
        gl.uniform1f(uThickness, current.thickness * getDpr());
        gl.uniform1f(uIOR, current.ior);
        gl.uniform1f(uBlur, current.blur);
        gl.uniform1f(uSpecular, current.specular);
        gl.uniform1f(uTint, current.tint);
        gl.uniform1f(uShadow, current.shadow);

        for (const pane of readPanes()) {
          const width = pane.width * canvas.width;
          const height = pane.height * canvas.height;
          gl.uniform2f(uGlassCenter, pane.x * canvas.width, pane.y * canvas.height);
          gl.uniform2f(uGlassSize, width, height);
          gl.uniform1f(uRadius, pane.radius);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    resize();
    updateScroll();
    render();

    return () => {
      alive = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
      image.onload = null;
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [backgroundUrl, panes]);

  const changeParam = (key: keyof GlassParams, value: number) => {
    const next = { ...paramsRef.current, [key]: value };
    paramsRef.current = next;
    setParams(next);
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
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 10001,
          fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          fontSize: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setDebugOpen((open) => !open)}
          style={{
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 10,
            padding: "8px 11px",
            background: "rgba(20,20,22,.78)",
            color: "white",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            cursor: "pointer",
          }}
        >
          {debugOpen ? "Close debug" : "Debug glass"}
        </button>

        {debugOpen && (
          <div
            style={{
              marginTop: 8,
              width: 250,
              padding: 12,
              borderRadius: 14,
              background: "rgba(18,18,20,.88)",
              color: "#fff",
              boxShadow: "0 12px 40px rgba(0,0,0,.35)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,.12)",
            }}
          >
            <div style={{ marginBottom: 10, opacity: 0.7 }}>WebGL glass controls</div>
            {([
              ["bezel", 5, 120, 1],
              ["thickness", 0, 120, 1],
              ["ior", 1, 5, 0.05],
              ["blur", 0, 8, 0.1],
              ["specular", 0, 1, 0.01],
              ["tint", 0, 0.5, 0.01],
              ["shadow", 0, 1, 0.01],
            ] as const).map(([key, min, max, step]) => (
              <label key={key} style={{ display: "block", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span>{key}</span>
                  <span>{params[key].toFixed(key === "ior" || key === "blur" ? 2 : 2)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={params[key]}
                  onChange={(event) => changeParam(key, Number(event.target.value))}
                  style={{ width: "100%" }}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default LiquidGlassWebGL;

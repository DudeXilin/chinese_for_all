"use client";

import { useEffect, useRef, useState } from "react";

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
float sdRoundedRect(vec2 p, vec2 halfSize, float r) { vec2 q = abs(p) - halfSize + r; return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r; }
float surfaceHeight(float t) { float s = 1.0 - t; return pow(1.0 - s*s*s*s, 0.25); }
vec3 sampleBg(vec2 screenUV) { float screenAspect = uResolution.x / uResolution.y; vec2 uv = screenUV; if (uBgAspect > screenAspect) { float s = screenAspect / uBgAspect; uv.x = uv.x * s + (1.0 - s) * 0.5; } else { float s = uBgAspect / screenAspect; uv.y = uv.y * s + (1.0 - s) * 0.5; } uv.y = 1.0 - uv.y; return texture2D(uBgTex, uv).rgb; }
vec3 sampleBgBlurred(vec2 uv, float radius) { if (radius < 0.5) return sampleBg(uv); vec3 sum = vec3(0.0); vec2 px = 1.0 / uResolution; vec2 offsets[16]; offsets[0]=vec2(-0.94201,-0.39906); offsets[1]=vec2(0.94558,-0.76890); offsets[2]=vec2(-0.09418,-0.92938); offsets[3]=vec2(0.34495,0.29387); offsets[4]=vec2(-0.91588,-0.45771); offsets[5]=vec2(-0.81544,0.48568); offsets[6]=vec2(-0.38277,-0.56071); offsets[7]=vec2(-0.12675,0.84686); offsets[8]=vec2(0.89642,0.41254); offsets[9]=vec2(0.18150,-0.30020); offsets[10]=vec2(-0.01445,-0.16001); offsets[11]=vec2(0.59614,0.71118); offsets[12]=vec2(0.49742,-0.47280); offsets[13]=vec2(0.80685,0.04588); offsets[14]=vec2(-0.32490,-0.03965); offsets[15]=vec2(-0.60975,0.06566); for(int i=0;i<16;i++){ sum += sampleBg(uv + offsets[i]*radius*px); } return sum/16.0; }
void main() { vec2 screenPx=vec2(vUv.x,1.0-vUv.y)*uResolution; vec2 p=screenPx-uGlassCenter; vec2 halfSize=uGlassSize*0.5; float sd=sdRoundedRect(p,halfSize,uRadius); if(sd>0.0){float shadowFalloff=exp(-sd*sd/800.0);float shadowAlpha=uShadow*shadowFalloff*0.6;gl_FragColor=vec4(0.0,0.0,0.0,shadowAlpha);return;} float distFromEdge=-sd; float bezel=min(uBezel,min(uRadius,min(halfSize.x,halfSize.y))-1.0); float t=clamp(distFromEdge/bezel,0.0,1.0); float h=surfaceHeight(t); float dt=0.001; float h2=surfaceHeight(min(t+dt,1.0)); float dh=(h2-h)/dt; float slopeAngle=atan(dh*(uThickness/bezel)); float sinR=sin(slopeAngle)/uIOR; sinR=clamp(sinR,-1.0,1.0); float thetaR=asin(sinR); float displacement=h*uThickness*(tan(slopeAngle)-tan(thetaR)); vec2 grad; float eps=0.5; grad.x=sdRoundedRect(p+vec2(eps,0.0),halfSize,uRadius)-sd; grad.y=sdRoundedRect(p+vec2(0.0,eps),halfSize,uRadius)-sd; grad=normalize(grad); vec2 offset=-grad*displacement/uResolution; vec2 screenUV=screenPx/uResolution; vec3 color=sampleBgBlurred(screenUV+offset,uBlur); vec2 lightDir=normalize(vec2(0.5,-0.7)); float rimDot=abs(dot(grad,lightDir)); float rimFalloff=1.0-smoothstep(0.0,bezel*0.4,distFromEdge); float specHighlight=pow(rimDot*rimFalloff,1.5); color+=vec3(specHighlight*uSpecular); float innerShadow=1.0-smoothstep(0.0,bezel*0.6,distFromEdge); color*=mix(1.0,0.7,innerShadow*0.3); float innerRim=smoothstep(0.0,2.0,distFromEdge)*(1.0-smoothstep(2.0,5.0,distFromEdge)); color+=vec3(innerRim*0.15*uSpecular); color=mix(color,vec3(1.0),uTint); float alpha=smoothstep(0.0,1.5,distFromEdge); gl_FragColor=vec4(color,alpha); }
`;

type Params = { width:number; height:number; radius:number; thickness:number; bezel:number; ior:number; blur:number; specular:number; tint:number; shadow:number };
const DEFAULT_PARAMS: Params = { width:300,height:200,radius:60,thickness:50,bezel:60,ior:3,blur:1.5,specular:0.55,tint:0.08,shadow:0.5 };
const CONTROLS: Array<[keyof Params,string,number,number,number]> = [
  ["width","Width",200,700,1],["height","Height",200,800,1],["radius","Radius",4,100,1],["thickness","Thickness",10,200,1],["bezel","Bezel",2,60,1],["ior","IOR",1,3,0.05],["blur","Blur",0,12,0.5],["specular","Specular",0,1,0.05],["tint","Tint",0,0.4,0.01],["shadow","Shadow",0,1,0.05]
];

export default function LiquidGlassWebGL({ backgroundUrl = "/liquid-glass-bg.webp" }: { backgroundUrl?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<Params>(DEFAULT_PARAMS);
  const [params,setParams] = useState(DEFAULT_PARAMS);
  const [debugOpen,setDebugOpen] = useState(false);

  useEffect(() => {
    let alive=true, frame=0, renderer:any=null, material:any=null, geometry:any=null, texture:any=null;
    const init=async()=>{
      const canvas=canvasRef.current; if(!canvas)return;
      const THREE=await import("three"); if(!alive)return;
      renderer=new THREE.WebGLRenderer({canvas,alpha:true});
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth,window.innerHeight);
      renderer.autoClear=false;
      const scene=new THREE.Scene();
      const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
      material=new THREE.ShaderMaterial({vertexShader:VERTEX_SHADER,fragmentShader:FRAGMENT_SHADER,uniforms:{
        uResolution:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)},uGlassCenter:{value:new THREE.Vector2(window.innerWidth/2,window.innerHeight/2)},uGlassSize:{value:new THREE.Vector2(300,200)},uRadius:{value:60},uBezel:{value:60},uThickness:{value:50},uIOR:{value:3},uBlur:{value:1.5},uSpecular:{value:0.55},uTint:{value:0.08},uShadow:{value:0.5},uBgTex:{value:null},uBgAspect:{value:1.5}
      },transparent:true,depthTest:false});
      geometry=new THREE.PlaneGeometry(2,2); scene.add(new THREE.Mesh(geometry,material));
      new THREE.TextureLoader().load(backgroundUrl,(tex:any)=>{if(!alive)return;texture=tex;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;material.uniforms.uBgTex.value=tex;material.uniforms.uBgAspect.value=tex.image.width/tex.image.height;});
      const panes=()=>Array.from(document.querySelectorAll<HTMLElement>("[data-glass-pane]"));
      const resize=()=>{renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(window.innerWidth,window.innerHeight);material.uniforms.uResolution.value.set(window.innerWidth,window.innerHeight);};
      const render=()=>{if(!alive)return;const u=material.uniforms;const p=paramsRef.current;u.uResolution.value.set(window.innerWidth,window.innerHeight);u.uGlassSize.value.set(p.width,p.height);u.uRadius.value=p.radius;u.uBezel.value=p.bezel;u.uThickness.value=p.thickness;u.uIOR.value=p.ior;u.uBlur.value=p.blur;u.uSpecular.value=p.specular;u.uTint.value=p.tint;u.uShadow.value=p.shadow;renderer.clear();for(const pane of panes()){const r=pane.getBoundingClientRect();u.uGlassCenter.value.set(r.left+r.width/2,r.top+r.height/2);renderer.render(scene,camera);}frame=requestAnimationFrame(render);};
      window.addEventListener("resize",resize,{passive:true});resize();render();
    };
    void init();
    return()=>{alive=false;cancelAnimationFrame(frame);geometry?.dispose();material?.dispose();texture?.dispose();renderer?.dispose();};
  },[backgroundUrl]);

  const changeParam=(key:keyof Params,value:number)=>{const next={...paramsRef.current,[key]:value};paramsRef.current=next;setParams(next);};
  const value=(key:keyof Params)=>key==="tint"?`${Math.round(params[key]*100)}%`:params[key].toFixed(key==="ior"||key==="blur"||key==="specular"||key==="shadow"?2:0);

  return <>
    <canvas ref={canvasRef} aria-hidden="true" className="liquid-glass-webgl-canvas" />
    <button type="button" aria-label="Toggle controls" onClick={()=>setDebugOpen(v=>!v)} className="liquid-glass-debug-toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
    </button>
    {debugOpen&&<div className="liquid-glass-debug-panel"><div className="liquid-glass-debug-header"><span>Controls</span><button type="button" onClick={()=>setDebugOpen(false)} aria-label="Close">×</button></div>{CONTROLS.map(([key,label,min,max,step])=><label key={key}><span>{label}</span><input type="range" min={min} max={max} step={step} value={params[key]} onChange={e=>changeParam(key,Number(e.target.value))}/><b>{value(key)}</b></label>)}</div>}
  </>;
}

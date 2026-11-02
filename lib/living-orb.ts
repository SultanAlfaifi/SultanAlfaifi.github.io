// LivingOrb: a luminous, fluid sphere of light for the deep-black ground. Raw WebGL1, no libraries,
// with a Canvas 2D fallback. It is the site's logo, the hero's agent and the AI section's face.
//
//   const orb = mountLivingOrb(canvas, { palette: "aurora", state: "idle", fps: 30 });
//   orb.setState("thinking"); orb.setAmplitude(0.6); orb.setStill(true); orb.destroy();
//
// The engine pauses itself off screen, in a hidden tab, and while `still` is set (motion off), when it
// paints one composed frame instead. React code uses components/living-orb.tsx rather than this module.

export type LivingOrbState = "idle" | "listening" | "thinking" | "speaking" | "approved" | "paused";
export type LivingOrbPaletteName = "aurora" | "ember" | "glacier" | "pearl";
/** A named palette, or 2 to 4 hex colours on a cyclic gradient. */
export type LivingOrbPalette = LivingOrbPaletteName | readonly string[];
export type LivingOrbRenderer = "webgl" | "2d" | "none";

export type LivingOrbOptions = {
  palette?: LivingOrbPalette;
  state?: LivingOrbState;
  /** Sets the canvas CSS size in px. Otherwise the canvas' own CSS size is used. */
  size?: number;
  /** The pointer tilts the light and hovering makes it lean in. */
  interactive?: boolean;
  /** 0..1: room left for the glow. Default: 1, or 0.2 below 72px (a mark). */
  halo?: number;
  /** A voice feed for "speaking", polled each frame: 0..1, or null to fall back to setAmplitude() or the built-in voice. */
  amplitude?: () => number | null;
  /** Frame cap, for always-visible marks such as the logo. 0 or undefined: every frame. */
  fps?: number;
  /** Paint one composed frame and stop (motion off). */
  still?: boolean;
  /** "auto" (default) uses WebGL while fewer than MAX_LIVE_WEBGL are live, then Canvas 2D. */
  renderer?: "auto" | "webgl" | "2d";
  /** Called when the canvas enters or leaves the viewport (with an 80px margin). */
  onVisibilityChange?: (visible: boolean) => void;
};

export type LivingOrbHandle = {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: LivingOrbRenderer;
  getState(): LivingOrbState;
  setState(state: LivingOrbState): LivingOrbHandle;
  /** A ring of light leaves the orb, without changing its state. */
  bloom(): LivingOrbHandle;
  setAmplitude(value: number | null): LivingOrbHandle;
  setPalette(palette: LivingOrbPalette): LivingOrbHandle;
  setFps(fps: number): LivingOrbHandle;
  setStill(still: boolean): LivingOrbHandle;
  destroy(): void;
};

// Four stops on a cyclic gradient. Colour only ever lives in the light.
export const LIVING_PALETTES: Record<LivingOrbPaletteName, readonly [string, string, string, string]> = {
  aurora: ["#FFB46A", "#FF5C8D", "#8F6BFF", "#47C8F5"], // apricot, rose, iris, glacier
  ember: ["#FFD9A0", "#FF8A4C", "#F0436A", "#9B4DFF"],
  glacier: ["#E8F6FF", "#72D6FF", "#4F7DFF", "#A684FF"],
  pearl: ["#F4F1EA", "#C4D6FF", "#EBCBFF", "#FFE2C4"]
};

type StateParams = { speed: number; swell: number; ripple: number; energy: number; glow: number; hue: number; breathe: number; und: number };

// speed: flow speed · swell: radius · ripple: voice waveform at the edge · energy: brightness · glow: halo
// hue: colour rotation (cycles/s) · breathe: breathing depth · und: a slow wave round the edge and through the light
const STATES: Record<LivingOrbState, StateParams> = {
  idle: { speed: 0.3, swell: 1.0, ripple: 0.0, energy: 1.0, glow: 0.58, hue: 0.006, breathe: 1.0, und: 1.0 },
  listening: { speed: 0.55, swell: 1.07, ripple: 0.16, energy: 1.14, glow: 0.82, hue: 0.012, breathe: 0.6, und: 0.7 },
  thinking: { speed: 1.45, swell: 0.96, ripple: 0.1, energy: 1.06, glow: 0.64, hue: 0.085, breathe: 0.3, und: 0.45 },
  speaking: { speed: 0.8, swell: 1.03, ripple: 1.0, energy: 1.12, glow: 0.8, hue: 0.02, breathe: 0.2, und: 0.25 },
  approved: { speed: 0.38, swell: 1.03, ripple: 0.0, energy: 1.12, glow: 0.76, hue: 0.008, breathe: 1.0, und: 0.8 },
  paused: { speed: 0.16, swell: 0.93, ripple: 0.0, energy: 0.55, glow: 0.3, hue: 0.003, breathe: 0.5, und: 0.35 }
};
const KEYS = ["speed", "swell", "ripple", "energy", "glow", "hue", "breathe", "und"] as const;
export const LIVING_ORB_STATES = Object.keys(STATES) as LivingOrbState[];

/** At most this many WebGL orbs are live at once; later mounts draw with Canvas 2D. */
export const MAX_LIVE_WEBGL = 3;
let liveWebGL = 0;

const TAU = Math.PI * 2;
const VERT = "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}";

function fragSource(precision: string) {
  return [
    "precision " + precision + " float;",
    "uniform vec2 uRes;uniform float uPx;",
    "uniform float uTime,uClock,uHue,uSwell,uRipple,uEnergy,uGlow,uBloom,uRing,uAmp,uDetail,uRadius,uUnd,uMark;",
    "uniform vec2 uTilt;",
    "uniform vec3 uC0,uC1,uC2,uC3;",
    // Simplex 3D noise: Ashima Arts / Ian McEwan (MIT).
    "vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}",
    "vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}",
    "float snoise(vec3 v){",
    " const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);",
    " vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);",
    " vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);",
    " vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;",
    " i=mod289(i);",
    " vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));",
    " float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;",
    " vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);",
    " vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);",
    " vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);",
    " vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));",
    " vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;",
    " vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);",
    " vec4 nm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));",
    " p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;",
    " vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;",
    " return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));",
    "}",
    // Cyclic four-stop palette, eased between stops so it never bands.
    "vec3 pal(float x){",
    " x=fract(x)*4.0;float f=fract(x);f=f*f*(3.0-2.0*f);",
    " if(x<1.0)return mix(uC0,uC1,f);",
    " if(x<2.0)return mix(uC1,uC2,f);",
    " if(x<3.0)return mix(uC2,uC3,f);",
    " return mix(uC3,uC0,f);",
    "}",
    "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}",
    "void main(){",
    " float hp=0.5*min(uRes.x,uRes.y);",
    " vec2 p=(gl_FragCoord.xy-0.5*uRes)/hp;",
    " p-=uTilt*0.012;",
    " float d=length(p);",
    " float ang=atan(p.y,p.x);",
    " float t=uTime,c=uClock;",
    // Living edge: a slow organic wobble, plus a voice-like waveform when speaking.
    " float wob=sin(ang*2.0+t*0.9)*sin(ang*3.0-t*0.63)*0.013;",
    " float v=sin(ang*3.0+c*5.1)*0.5+sin(ang*5.0-c*7.3)*0.3+sin(ang*9.0+c*11.0)*0.2;",
    " float voice=v*uRipple*(0.2+uAmp)*0.042;",
    " float und=(sin(ang*3.0-c*1.3)*0.6+sin(ang*5.0+c*0.85+1.2)*0.4)*0.018*uUnd;",
    " float r=uRadius*uSwell*(1.0+wob+und+voice+uRipple*uAmp*0.05+uBloom*0.07);",
    " float aa=uPx*1.3;",
    " float mask=1.0-smoothstep(r-aa,r+aa,d);",
    " vec3 col=vec3(0.0);",
    " if(d<r+aa){",
    "  vec2 s=p/r;",
    "  float z=sqrt(max(0.0,1.0-dot(s,s)));",
    "  vec3 n=vec3(s,z);",
    "  vec3 P=n;",
    "  P.xz=rot(t*0.11+uTilt.x*0.5)*P.xz;",
    "  P.yz=rot(0.35-uTilt.y*0.5)*P.yz;",
    // Back of the sphere, seen through the glass: gives the ribbons real depth.
    "  vec3 B=vec3(s,-z);",
    "  B.xz=rot(t*0.11+uTilt.x*0.5)*B.xz;",
    "  B.yz=rot(0.35-uTilt.y*0.5)*B.yz;",
    // Two noise fields warp a few silk ribbons; a third is the soft inner light.
    "  vec2 w=vec2(snoise(P*0.95+vec3(0.0,0.0,t*0.22)),snoise(P*0.95+vec3(5.2,1.3,-t*0.19)));",
    "  float fl=snoise(B*1.1+vec3(w,0.0)*0.6+vec3(1.7,-t*0.12,0.0));",
    "  float b1=sin(P.y*2.3+w.x*1.7+t*0.55);",
    "  float b2=sin((B.x*0.8+B.y*0.6)*2.1-w.y*1.6-t*0.42+1.7);",
    "  float b3=sin((P.x*0.7-P.y*0.7)*1.7+w.y*1.9-t*0.33+4.0);",
    "  float kk=mix(mix(2.4,11.0,uDetail),6.5,uMark);",
    "  float rib1=(exp(-abs(b1)*kk)+0.32*exp(-abs(b1)*kk*0.22))*(0.30+0.70*smoothstep(-0.7,0.6,w.y));",
    "  float rib2=(exp(-abs(b2)*kk*1.15)+0.30*exp(-abs(b2)*kk*0.25))*(0.30+0.70*smoothstep(-0.7,0.6,-w.x));",
    "  float rib3=(exp(-abs(b3)*kk*0.8)+0.30*exp(-abs(b3)*kk*0.2))*(0.20+0.80*smoothstep(-0.2,0.8,w.x*w.y*2.0+0.2));",
    "  vec3 c1=pal(uHue+w.x*0.22+P.y*0.12);",
    "  vec3 c2=pal(uHue+0.5+w.y*0.22-B.x*0.12);",
    "  vec3 c3=pal(uHue+0.27+fl*0.2);",
    "  vec3 body=pal(uHue+0.75+fl*0.25);",
    // Small marks (the logo) get a dark core, one saturated ribbon and a bright rim, so they read as a mark.
    "  col =c1*rib1*(0.55+0.75*z)*(1.0+0.7*uMark);",
    "  col+=c3*rib3*(0.40+0.60*z)*0.8*(1.0-0.7*uMark);",
    "  col+=c2*rib2*0.42*(1.0-0.6*uMark);",
    "  col+=body*smoothstep(-0.2,0.9,fl)*mix(0.42,0.13,uDetail)*(1.0-0.76*uMark);",
    "  col+=c1*mix(0.20,0.02,uDetail)*(1.0-0.85*uMark);",
    "  col*=1.0-uMark*0.6*(1.0-smoothstep(0.2,0.85,length(s)));",
    // glass rim
    "  float fres=pow(1.0-z,mix(2.4,1.7,uMark));",
    "  col+=pal(uHue+ang*0.159155+t*0.03)*fres*(0.95+0.6*uBloom+0.9*uMark);",
    // undulation: soft bands of light travelling outward through the glass
    "  col*=1.0+uUnd*0.11*sin(length(s)*7.0-c*1.7)*(1.0-0.4*z);",
    // voice: concentric waves travelling outward
    "  float wave=0.5+0.5*sin(length(s)*15.0-c*9.0);",
    "  col*=1.0+uRipple*uAmp*0.5*wave*(1.0-0.5*z);",
    // a soft specular kiss
    "  vec3 L=normalize(vec3(-0.42+uTilt.x*0.35,0.55+uTilt.y*0.35,0.75));",
    "  col+=vec3(1.0,0.98,0.95)*pow(max(dot(n,L),0.0),34.0)*(0.14+0.16*uDetail);",
    "  col*=uEnergy*(1.0+uBloom*0.9);",
    "  col*=mask;",
    " }",
    // Halo: two falloffs, coloured by angle, faded before the canvas edge.
    " float o=max(d-r,0.0);",
    " vec3 hc=pal(uHue+ang*0.159155-t*0.02);",
    " float halo=(exp(-o*9.0)*0.75+exp(-o*3.2)*0.25)*uGlow*(1.0-smoothstep(0.6,1.0,d));",
    " halo*=(1.0-mask)+mask*exp(-max(r-d,0.0)*16.0)*0.6;",
    " col+=hc*halo*(1.0+uBloom*1.6);",
    // Approval: a single ring of light leaves the orb and dissolves.
    " float rr=r*(1.0+uRing*0.8);",
    " float rw=0.010+0.05*uRing;",
    " float q=(d-rr)/rw;",
    " float ring=exp(-q*q)*(1.0-uRing)*smoothstep(0.0,0.04,uRing)*(1.0-smoothstep(0.7,1.0,d));",
    " col+=mix(hc,vec3(1.0),0.45)*ring*0.9;",
    " col=1.0-exp(-col*1.3);",
    " col+=(hash(gl_FragCoord.xy+fract(c))-0.5)/255.0;",
    " col=max(col,0.0);",
    " float a=max(max(col.r,col.g),col.b);",
    " a=clamp(max(a,mask*0.92),0.0,1.0);",
    " gl_FragColor=vec4(min(col,vec3(a)),a);",
    "}"
  ].join("\n");
}

type RGB = [number, number, number];
type Colors = [RGB, RGB, RGB, RGB];
type Uniforms = {
  time: number; clock: number; hue: number; swell: number; ripple: number; energy: number; glow: number;
  bloom: number; ring: number; amp: number; detail: number; radius: number; tilt: [number, number]; und: number; mark: number;
};
type Renderer = { kind: "webgl" | "2d"; draw(u: Uniforms, cols: Colors): void; dispose(): void };
type FailedGL = { failed: true; gl: WebGLRenderingContext };

function hexToRgb(hex: string): RGB {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function resolvePalette(p: LivingOrbPalette | undefined): Colors {
  const list: readonly string[] = Array.isArray(p) && p.length >= 2 ? p : LIVING_PALETTES[p as LivingOrbPaletteName] ?? LIVING_PALETTES.aurora;
  return [0, 1, 2, 3].map((i) => hexToRgb(list[i % list.length])) as Colors;
}
function palAt(cols: Colors, x: number): RGB {
  x = (x - Math.floor(x)) * 4;
  const i = Math.floor(x);
  let f = x - i;
  f = f * f * (3 - 2 * f);
  const a = cols[i % 4], b = cols[(i + 1) % 4];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
function rgba(c: RGB, a: number) {
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

function createGL(canvas: HTMLCanvasElement): Renderer | FailedGL | null {
  const attrs: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "low-power" };
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext("webgl", attrs) || canvas.getContext("experimental-webgl", attrs)) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const ctx = gl;
  const hi = ctx.getShaderPrecisionFormat?.(ctx.FRAGMENT_SHADER, ctx.HIGH_FLOAT);
  const precision = hi && hi.precision > 0 ? "highp" : "mediump";

  function shader(type: number, src: string) {
    const s = ctx.createShader(type);
    if (!s) return null;
    ctx.shaderSource(s, src);
    ctx.compileShader(s);
    if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS) && !ctx.isContextLost()) {
      console.warn("[LivingOrb] shader:", ctx.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = shader(ctx.VERTEX_SHADER, VERT), fs = shader(ctx.FRAGMENT_SHADER, fragSource(precision));
  if (!vs || !fs) return { failed: true, gl: ctx };
  const prog = ctx.createProgram();
  if (!prog) return { failed: true, gl: ctx };
  ctx.attachShader(prog, vs);
  ctx.attachShader(prog, fs);
  ctx.linkProgram(prog);
  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS) && !ctx.isContextLost()) return { failed: true, gl: ctx };
  ctx.useProgram(prog);

  const buf = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
  const loc = ctx.getAttribLocation(prog, "aPos");
  ctx.enableVertexAttribArray(loc);
  ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

  const names = ["uRes", "uPx", "uTime", "uClock", "uHue", "uSwell", "uRipple", "uEnergy", "uGlow", "uBloom", "uRing", "uAmp", "uDetail", "uRadius", "uUnd", "uMark", "uTilt", "uC0", "uC1", "uC2", "uC3"] as const;
  const U = {} as Record<(typeof names)[number], WebGLUniformLocation | null>;
  for (const n of names) U[n] = ctx.getUniformLocation(prog, n);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.clearColor(0, 0, 0, 0);
  const wrap = precision === "highp" ? 4000 : 300; // keep noise inputs precise

  return {
    kind: "webgl",
    draw(u, cols) {
      const W = canvas.width, H = canvas.height;
      ctx.viewport(0, 0, W, H);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.uniform2f(U.uRes, W, H);
      ctx.uniform1f(U.uPx, 1 / (0.5 * Math.min(W, H)));
      ctx.uniform1f(U.uTime, u.time % wrap);
      ctx.uniform1f(U.uClock, u.clock % 628.3185);
      ctx.uniform1f(U.uHue, u.hue % 1);
      ctx.uniform1f(U.uSwell, u.swell);
      ctx.uniform1f(U.uRipple, u.ripple);
      ctx.uniform1f(U.uEnergy, u.energy);
      ctx.uniform1f(U.uGlow, u.glow);
      ctx.uniform1f(U.uBloom, u.bloom);
      ctx.uniform1f(U.uRing, u.ring);
      ctx.uniform1f(U.uAmp, u.amp);
      ctx.uniform1f(U.uDetail, u.detail);
      ctx.uniform1f(U.uRadius, u.radius);
      ctx.uniform1f(U.uUnd, u.und);
      ctx.uniform1f(U.uMark, u.mark);
      ctx.uniform2f(U.uTilt, u.tilt[0], u.tilt[1]);
      ctx.uniform3fv(U.uC0, cols[0]);
      ctx.uniform3fv(U.uC1, cols[1]);
      ctx.uniform3fv(U.uC2, cols[2]);
      ctx.uniform3fv(U.uC3, cols[3]);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    },
    dispose() {
      try {
        ctx.deleteBuffer(buf);
        ctx.deleteProgram(prog);
        ctx.deleteShader(vs);
        ctx.deleteShader(fs);
        ctx.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // already gone
      }
    }
  };
}

function create2D(canvas: HTMLCanvasElement): Renderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return {
    kind: "2d",
    draw(u, cols) {
      const W = canvas.width, H = canvas.height, h = Math.min(W, H) / 2, cx = W / 2, cy = H / 2;
      const r = u.radius * u.swell * h * (1 + u.bloom * 0.07 + u.ripple * u.amp * 0.05);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);

      const hc = palAt(cols, u.hue + 0.1), hc2 = palAt(cols, u.hue + 0.6);
      const g = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, h);
      g.addColorStop(0, rgba(hc, 0.55 * u.glow * (1 + u.bloom)));
      g.addColorStop(0.3, rgba(hc2, 0.16 * u.glow));
      g.addColorStop(1, rgba(hc2, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.closePath();
      ctx.fillStyle = "#06060b";
      ctx.fill();
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) {
        const a = u.time * 0.55 + (i * TAU) / 4;
        const bx = cx + Math.cos(a) * r * 0.42, by = cy + Math.sin(a * 1.31 + i) * r * 0.42;
        const c = palAt(cols, u.hue + i * 0.25);
        const gg = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.95);
        gg.addColorStop(0, rgba(c, 0.5 * u.energy * (1 + u.bloom * 0.8)));
        gg.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = gg;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      const rim = ctx.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
      const rc = palAt(cols, u.hue + 0.35);
      rim.addColorStop(0, rgba(rc, 0));
      rim.addColorStop(1, rgba(rc, 0.75));
      ctx.fillStyle = rim;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      const sp = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.42, 0, cx - r * 0.35, cy - r * 0.42, r * 0.45);
      sp.addColorStop(0, "rgba(255,250,244,0.22)");
      sp.addColorStop(1, "rgba(255,250,244,0)");
      ctx.fillStyle = sp;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      if (u.ring > 0.01 && u.ring < 1) {
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.arc(cx, cy, r * (1 + u.ring * 0.8), 0, TAU);
        ctx.strokeStyle = rgba([1, 1, 1], 0.5 * (1 - u.ring));
        ctx.lineWidth = Math.max(1, h * (0.02 + 0.05 * u.ring));
        ctx.stroke();
      }
    },
    dispose() {}
  };
}

const NOOP_HANDLE = (canvas: HTMLCanvasElement, state: LivingOrbState): LivingOrbHandle => {
  const handle: LivingOrbHandle = {
    canvas,
    renderer: "none",
    getState: () => state,
    setState: () => handle,
    bloom: () => handle,
    setAmplitude: () => handle,
    setPalette: () => handle,
    setFps: () => handle,
    setStill: () => handle,
    destroy: () => {}
  };
  return handle;
};

/** How many WebGL orbs are live right now (for tests and diagnostics). */
export function liveWebGLOrbs() {
  return liveWebGL;
}

export function mountLivingOrb(canvasElement: HTMLCanvasElement, opts: LivingOrbOptions = {}): LivingOrbHandle {
  let canvas = canvasElement;
  if (!canvas || !canvas.getContext) throw new Error("mountLivingOrb needs a <canvas>");
  if (typeof opts.size === "number") {
    canvas.style.width = opts.size + "px";
    canvas.style.height = opts.size + "px";
  }
  if (!canvas.hasAttribute("role") && !canvas.hasAttribute("aria-hidden")) canvas.setAttribute("aria-hidden", "true");

  let cols = resolvePalette(opts.palette);
  const interactive = !!opts.interactive;
  let still = !!opts.still;

  let stateName: LivingOrbState = opts.state && STATES[opts.state] ? opts.state : "idle";
  let tgt = STATES[stateName];
  let cur: StateParams = { ...tgt };
  const seed = Math.random();
  let time = 12 + seed * 40, hue = seed, clock = seed * 30;
  let bloomT = -1, amp = 0, ampExt: number | null = null;
  const ampFn = typeof opts.amplitude === "function" ? opts.amplitude : null;
  let tilt: [number, number] = [0, 0], tiltT: [number, number] = [0, 0];
  let hover = 0, hoverT = 0;
  let detail = 1, mark = 0, radius = 0.56;
  let minDt = typeof opts.fps === "number" && opts.fps > 0 ? 1000 / opts.fps : 0;
  let visible = true, pageHidden = typeof document !== "undefined" && document.hidden, raf = 0, last = 0, destroyed = false;

  let R: Renderer | null = null;
  const wantGL = opts.renderer === "webgl" || ((opts.renderer ?? "auto") === "auto" && liveWebGL < MAX_LIVE_WEBGL);
  if (wantGL) {
    const made = createGL(canvas);
    if (made && "failed" in made) {
      // The shader would not build: swap in a fresh canvas so 2D can take over.
      try {
        made.gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // noop
      }
      const fresh = canvas.cloneNode(false) as HTMLCanvasElement;
      canvas.parentNode?.replaceChild(fresh, canvas);
      canvas = fresh;
    } else if (made) {
      R = made;
    }
  }
  if (!R) R = create2D(canvas);
  if (!R) return NOOP_HANDLE(canvas, stateName);
  let renderer: Renderer = R;
  if (renderer.kind === "webgl") liveWebGL++;
  const countedGL = renderer.kind === "webgl";

  function measure() {
    // The layout size, not the painted one: an orb usually mounts mid-entrance (scaled to 0.86), and a
    // transform never fires the ResizeObserver, so a transformed size would stay too small all visit.
    const rect = canvas.clientWidth && canvas.clientHeight ? null : canvas.getBoundingClientRect();
    const cssW = Math.max(1, canvas.clientWidth || rect?.width || 1);
    const cssH = Math.max(1, canvas.clientHeight || rect?.height || 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Cap the backing store (~0.9 MP) so a large hero orb stays smooth on phones.
    const scale = Math.min(dpr, Math.sqrt(900000 / (cssW * cssH)));
    const w = Math.max(1, Math.round(cssW * scale)), h = Math.max(1, Math.round(cssH * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const m = Math.min(cssW, cssH);
    detail = clamp((m - 40) / 220, 0, 1); // 24px logo -> 0, 260px+ -> 1
    mark = clamp((56 - m) / 20, 0, 1); // 36px and below -> 1 (logo look), 56px+ -> 0
    const haloAmt = typeof opts.halo === "number" ? clamp(opts.halo, 0, 1) : m < 72 ? 0.2 : 1;
    radius = 0.8 + (0.56 - 0.8) * haloAmt;
  }

  function uniforms(): Uniforms {
    const b = cur.breathe, br = Math.sin(clock * 1.25);
    let bloom = 0, ring = 0;
    if (bloomT >= 0) {
      bloom = (1 - Math.exp(-bloomT / 0.07)) * Math.exp(-bloomT / 0.6);
      ring = clamp(bloomT / 1.3, 0, 1);
    }
    const hv = hover * 0.03;
    return {
      time, clock, hue,
      swell: cur.swell * (1 + 0.022 * br * b) * (1 + hv),
      ripple: cur.ripple,
      energy: cur.energy * (1 + hv * 1.5),
      glow: cur.glow * (1 + 0.16 * br * b) * (1 + hv * 3),
      bloom, ring, amp, detail, radius, tilt, und: cur.und, mark
    };
  }

  function synthVoice(c: number) {
    const syll = Math.abs(Math.sin(c * 6.3) * 0.55 + Math.sin(c * 10.1 + 1.3) * 0.3 + Math.sin(c * 2.2) * 0.35);
    const phrase = 0.55 + 0.45 * Math.sin(c * 0.9 + Math.sin(c * 0.37) * 2.0);
    return clamp(syll * phrase * 1.25, 0, 1);
  }

  function step(dt: number) {
    const k = 1 - Math.exp(-dt / 0.2); // ~600 ms to settle
    for (const key of KEYS) cur[key] += (tgt[key] - cur[key]) * k;
    hover += (hoverT - hover) * (1 - Math.exp(-dt / 0.25));
    const kt = 1 - Math.exp(-dt / 0.35);
    tilt = [tilt[0] + (tiltT[0] - tilt[0]) * kt, tilt[1] + (tiltT[1] - tilt[1]) * kt];
    time += dt * cur.speed;
    hue += dt * cur.hue * (1 + 3 * mark); // the small mark drifts colour faster, so it visibly lives
    clock += dt;
    if (bloomT >= 0) {
      bloomT += dt;
      if (bloomT > 2) bloomT = -1;
    }
    let raw = 0;
    if (cur.ripple > 0.01 || stateName === "speaking") {
      const fed = ampFn ? ampFn() : null;
      raw = typeof fed === "number" && !Number.isNaN(fed) ? fed : ampExt !== null ? ampExt : synthVoice(clock);
    }
    raw = clamp(raw, 0, 1);
    amp += (raw - amp) * (1 - Math.exp(-dt / (raw > amp ? 0.05 : 0.16)));
  }

  function render() {
    if (!destroyed) renderer.draw(uniforms(), cols);
  }

  function running() {
    return visible && !pageHidden && !still;
  }
  function frame(now: number) {
    raf = 0;
    if (destroyed || !running()) {
      last = 0;
      return;
    }
    if (minDt && last && now - last < minDt - 1) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    step(dt);
    render();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && running() && !destroyed) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    last = 0;
  }

  function renderStill() {
    // A composed frame: settled params, no transient bloom.
    cur = { ...tgt };
    bloomT = -1;
    hover = 0;
    tilt = [0, 0];
    amp = stateName === "speaking" ? 0.45 : 0;
    time = 17.3;
    clock = 3.1;
    hue = stateName === "thinking" ? 0.42 : 0.12;
    render();
  }
  function refresh() {
    if (still) renderStill();
    else if (!running()) render();
  }

  /* observers & listeners */
  let ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
  let reported: boolean | null = null;
  const listeners: [EventTarget, string, EventListener, AddEventListenerOptions | undefined][] = [];
  function on(target: EventTarget, type: string, fn: EventListener, options?: AddEventListenerOptions) {
    target.addEventListener(type, fn, options);
    listeners.push([target, type, fn, options]);
  }

  measure();
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => {
      measure();
      refresh();
    });
    ro.observe(canvas);
  } else {
    on(window, "resize", () => {
      measure();
      refresh();
    });
  }
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(
      (entries) => {
        const next = entries[entries.length - 1].isIntersecting;
        if (next !== reported) opts.onVisibilityChange?.(next);
        reported = next;
        visible = next;
        if (visible) start();
        else stop();
      },
      { rootMargin: "80px" }
    );
    io.observe(canvas);
  }
  on(document, "visibilitychange", () => {
    pageHidden = document.hidden;
    if (pageHidden) stop();
    else start();
  });
  if (interactive) {
    on(window, "pointermove", ((event: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const span = Math.max(r.width, 280);
      tiltT = [clamp((event.clientX - (r.left + r.width / 2)) / span, -1, 1), clamp(-(event.clientY - (r.top + r.height / 2)) / span, -1, 1)];
    }) as EventListener, { passive: true });
    on(document, "pointerleave", () => {
      tiltT = [0, 0];
    });
    on(canvas, "pointerenter", () => {
      hoverT = 1;
    });
    on(canvas, "pointerleave", () => {
      hoverT = 0;
    });
  }
  if (renderer.kind === "webgl") {
    on(canvas, "webglcontextlost", (event) => {
      event.preventDefault();
      stop();
    });
    on(canvas, "webglcontextrestored", () => {
      const made = createGL(canvas);
      if (made && !("failed" in made)) {
        renderer = made;
        refresh();
        start();
      }
    });
  }

  // Complete at rest: paint the first frame immediately.
  if (still) renderStill();
  else {
    render();
    start();
  }

  const api: LivingOrbHandle = {
    get canvas() {
      return canvas;
    },
    get renderer() {
      return renderer.kind;
    },
    getState: () => stateName,
    setState(s) {
      if (!STATES[s]) return api;
      const again = s === stateName;
      stateName = s;
      tgt = STATES[s];
      if (s === "approved" && !still) bloomT = 0;
      if (still) renderStill();
      else if (!again || s === "approved") start();
      return api;
    },
    bloom() {
      if (!still) {
        bloomT = 0;
        start();
      }
      return api;
    },
    setAmplitude(v) {
      ampExt = v === null || v === undefined ? null : clamp(+v || 0, 0, 1);
      return api;
    },
    setPalette(p) {
      cols = resolvePalette(p);
      refresh();
      return api;
    },
    setFps(fps) {
      minDt = fps > 0 ? 1000 / fps : 0;
      return api;
    },
    setStill(next) {
      if (next === still) return api;
      still = next;
      if (still) {
        stop();
        renderStill();
      } else start();
      return api;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      ro?.disconnect();
      io?.disconnect();
      for (const [target, type, fn, options] of listeners) target.removeEventListener(type, fn, options);
      renderer.dispose();
      if (countedGL) liveWebGL = Math.max(0, liveWebGL - 1);
    }
  };
  return api;
}

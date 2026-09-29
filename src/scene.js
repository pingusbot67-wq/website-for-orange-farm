/*
 * Sunmist Fruit — 3D orchard scene
 * ---------------------------------
 * One fixed WebGL canvas sits behind the page. The page tells the scene how far
 * the visitor has scrolled through each chapter (hero → story → fruits → book)
 * and the scene choreographs the fruit to match:
 *
 *   hero    a Tango tangerine floats beside the headline and follows the cursor
 *   story   it drifts left and splits open, spraying juice, to show the segments
 *   fruits  it closes again, then morphs into a lemon, blueberries and an avocado
 *   book    a basket's worth of fruit tumbles down and piles up (push it around)
 *
 * All textures are generated in code, so there are no image files to load.
 * Build with `npm run build` → assets/js/scene.js (exposes window.OrchardScene).
 */
import * as THREE from 'three';

/* ------------------------------------------------------------------ utils */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260418);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/* 3D value noise — sampled on the sphere so textures have no seams at the poles */
const PERM = new Uint8Array(512);
{ const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; }
const hash3 = (x, y, z) => PERM[(PERM[(PERM[x & 255] + y) & 255] + z) & 255] / 255;
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x, y, z, oct = 4) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
  return s;
}

/* ------------------------------------------------------- procedural peels */

/**
 * Builds an equirectangular colour map + normal map for a citrus/avocado skin.
 * `pores` are the oil glands you can see on a tangerine; negative depth makes
 * bumps instead (avocado).
 */
function makeSkin({ w = 1024, h = 512, pores = 9000, poreR = [1.2, 2.8], depth = 1, lumps = 0.35,
  lumpScale = 3, strength = 2.2, palette, stemTint = null, blossomTint = null }) {
  const H = new Float32Array(w * h);
  // low-frequency lumpiness, sampled on a coarse grid then bilinearly upsampled
  const gw = 256, gh = 128, G = new Float32Array(gw * gh), C = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    const th = (y + 0.5) / gh * Math.PI;
    for (let x = 0; x < gw; x++) {
      const ph = x / gw * Math.PI * 2;
      const sx = Math.sin(th) * Math.cos(ph), sy = Math.cos(th), sz = Math.sin(th) * Math.sin(ph);
      G[y * gw + x] = fbm(sx * lumpScale + 11, sy * lumpScale + 3, sz * lumpScale + 7, 4);
      C[y * gw + x] = fbm(sx * 2.2 + 40, sy * 2.2 + 17, sz * 2.2 + 5, 3);
    }
  }
  const sample = (A, u, v) => {
    const x = u * gw - 0.5, y = clamp(v * gh - 0.5, 0, gh - 1.001);
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = ((x0 % gw) + gw) % gw, X1 = (X0 + 1) % gw, Y1 = Math.min(y0 + 1, gh - 1);
    return lerp(lerp(A[y0 * gw + X0], A[y0 * gw + X1], fx), lerp(A[Y1 * gw + X0], A[Y1 * gw + X1], fx), fy);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) H[y * w + x] = sample(G, x / w, y / h) * lumps;

  // pores: small bowls, widened horizontally toward the poles to undo equirect squash
  for (let i = 0; i < pores; i++) {
    const v = Math.acos(1 - 2 * rand()) / Math.PI; // uniform over the sphere
    const cx = rand() * w, cy = v * h;
    const s = Math.max(Math.sin(v * Math.PI), 0.08);
    const r = lerp(poreR[0], poreR[1], rand()), rx = r / s, ry = r;
    const d = depth * lerp(0.5, 1, rand()) * 0.12;
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1);
    const y0 = Math.max(0, Math.floor(cy - ry - 1)), y1 = Math.min(h - 1, Math.ceil(cy + ry + 1));
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const dx = (xx - cx) / rx, dy = (yy - cy) / ry, q = dx * dx + dy * dy;
      if (q < 1) { const X = ((xx % w) + w) % w; H[yy * w + X] -= d * (1 - q) * (1 - q); }
    }
  }

  // normal map
  const nCan = document.createElement('canvas'); nCan.width = w; nCan.height = h;
  const nCtx = nCan.getContext('2d'); const nImg = nCtx.createImageData(w, h); const N = nImg.data;
  for (let y = 0; y < h; y++) {
    const s = Math.max(Math.sin((y + 0.5) / h * Math.PI), 0.08);
    const yu = Math.max(0, y - 1), yd = Math.min(h - 1, y + 1);
    for (let x = 0; x < w; x++) {
      const xl = (x - 1 + w) % w, xr = (x + 1) % w;
      let nx = -(H[y * w + xr] - H[y * w + xl]) * strength * 10 / s;
      let ny = (H[yd * w + x] - H[yu * w + x]) * strength * 10;
      const l = Math.hypot(nx, ny, 1); const k = (y * w + x) * 4;
      N[k] = (nx / l * 0.5 + 0.5) * 255; N[k + 1] = (ny / l * 0.5 + 0.5) * 255; N[k + 2] = (1 / l * 0.5 + 0.5) * 255; N[k + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  // colour map
  const cCan = document.createElement('canvas'); cCan.width = w; cCan.height = h;
  const cCtx = cCan.getContext('2d'); const cImg = cCtx.createImageData(w, h); const P = cImg.data;
  const [a, b, pore] = palette.map((c) => new THREE.Color(c));
  const tmp = new THREE.Color();
  const stem = stemTint && new THREE.Color(stemTint), blossom = blossomTint && new THREE.Color(blossomTint);
  for (let y = 0; y < h; y++) {
    const th = (y + 0.5) / h * Math.PI;
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      const m = clamp((sample(C, x / w, y / h) - 0.3) * 2.2);
      tmp.copy(a).lerp(b, m);
      const hp = clamp(-H[k] * 6); tmp.lerp(pore, hp * 0.35);
      if (stem) tmp.lerp(stem, smooth(0.2, 0.0, th) * 0.85);
      if (blossom) tmp.lerp(blossom, smooth(Math.PI - 0.07, Math.PI, th) * 0.8);
      tmp.convertLinearToSRGB(); // canvas pixels are sRGB
      const o = k * 4; P[o] = tmp.r * 255; P[o + 1] = tmp.g * 255; P[o + 2] = tmp.b * 255; P[o + 3] = 255;
    }
  }
  cCtx.putImageData(cImg, 0, 0);

  const map = new THREE.CanvasTexture(cCan); map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(nCan);
  for (const t of [map, normalMap]) { t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; }
  return { map, normalMap };
}

function makeLeafTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#1f4a1f'); grad.addColorStop(0.5, '#3a7a31'); grad.addColorStop(1, '#1f4a1f');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = 'rgba(190,230,140,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 512); g.lineTo(128, 0); g.stroke();
  g.lineWidth = 2; g.strokeStyle = 'rgba(170,215,120,.3)';
  for (let i = 0; i < 11; i++) {
    const y = 470 - i * 42;
    g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(170, y - 30, 250, y - 70); g.stroke();
    g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(86, y - 30, 6, y - 70); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeDotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,240,200,.55)'); r.addColorStop(1, 'rgba(255,220,160,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* ---------------------------------------------------------------- geometry */

function leafGeometry() {
  const L = 1, s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.34, 0.18, 0.36, 0.62, 0, L);
  s.bezierCurveTo(-0.36, 0.62, -0.34, 0.18, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 32);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    uv.setXY(i, x / 0.56 + 0.5, y / L);
    pos.setZ(i, Math.abs(x) * 0.45 - Math.pow(y, 2) * 0.35); // fold along the midrib + arch
  }
  geo.computeVertexNormals();
  return geo;
}

/** Hemisphere with UVs remapped so the two halves share one sphere texture. */
function halfSphere(top) {
  const g = new THREE.SphereGeometry(1, 128, 64, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, top ? 0.5 + 0.5 * uv.getY(i) : 0.5 * uv.getY(i));
  return g;
}

function deformedSphere(fn, ws = 128, hs = 96) {
  const g = new THREE.SphereGeometry(1, ws, hs);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
}

const lemonShape = (v) => {
  const a = Math.abs(v.y), tip = smooth(0.82, 1, a);
  const k = 1 - 0.12 * a * a - 0.3 * tip;
  v.x *= k; v.z *= k;
  v.y = v.y * 1.24 + Math.sign(v.y) * tip * tip * 0.2;
};
const avocadoShape = (v) => {
  const k = lerp(1, 0.58, smooth(-0.35, 1, v.y));
  v.x *= k; v.z *= k; v.y = v.y * 1.34 + 0.08;
};

/* ------------------------------------------------------ cut-face shader */

const cutFaceMaterial = () => new THREE.ShaderMaterial({
  uniforms: {
    uFlesh: { value: new THREE.Color('#ff8a1e') },
    uFlesh2: { value: new THREE.Color('#ffb347') },
    uPith: { value: new THREE.Color('#fff1d6') },
    uPeel: { value: new THREE.Color('#f26a0d') },
    uSeg: { value: 10 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: /* glsl */`
    uniform vec3 uFlesh, uFlesh2, uPith, uPeel; uniform float uSeg, uTime;
    varying vec2 vUv;
    vec2 h2(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
    // returns: x = F1, y = F2 - F1, zw = vector to nearest cell centre
    vec4 voro(vec2 x){
      vec2 n = floor(x), f = fract(x); float d1 = 8., d2 = 8.; vec2 mv = vec2(0.);
      for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
        vec2 g = vec2(float(i),float(j)); vec2 o = h2(n+g); vec2 r = g + o - f; float d = dot(r,r);
        if(d<d1){ d2 = d1; d1 = d; mv = r; } else if(d<d2){ d2 = d; }
      }
      return vec4(sqrt(d1), sqrt(d2)-sqrt(d1), mv);
    }
    void main(){
      vec2 p = vUv*2.-1.; float r = length(p); float a = atan(p.y,p.x);
      float sa = (a/6.2831853 + .5) * uSeg; float fs = fract(sa); float edge = min(fs, 1.-fs);
      float memW = .010 / max(r,.04) * uSeg / 6.2831853;
      float membrane = 1. - smoothstep(memW, memW*2.4, edge);
      // juice vesicles — long teardrops radiating from the core
      vec4 v = voro(vec2(fs*3.2 + floor(sa)*7.3, r*9.));
      float cellShade = .78 + .22*h2(floor(vec2(fs*3.2 + floor(sa)*7.3, r*9.) + v.zw)).x;
      vec3 flesh = mix(uFlesh, uFlesh2, smoothstep(.2,.9,r)*.6 + (1.-v.x)*.25) * cellShade;
      flesh = mix(flesh*0.82, flesh, smoothstep(.02,.12,v.y));
      // fake per-vesicle bulge normal for a wet highlight
      vec3 n = normalize(vec3(-v.zw*.55, 1.));
      vec3 L = normalize(vec3(-.4,.6,.8)); vec3 H = normalize(L + vec3(0.,0.,1.));
      float spec = pow(max(dot(n,H),0.), 60.) * .55;
      vec3 col = flesh + spec;
      col = mix(col, uPith*.96, membrane*smoothstep(.95,.1,r)*.9);
      col = mix(col, uPith, 1.-smoothstep(.05,.09,r));               // core
      col = mix(col, uPith*.97, smoothstep(.855,.875,r));             // albedo ring
      col = mix(col, uPeel, smoothstep(.945,.96,r));                  // rind
      col *= .9 + .1*smoothstep(1.,.0,r);
      gl_FragColor = vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});

/* ------------------------------------------------------------ environment */

function buildEnvironment(renderer) {
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vP; void main(){ float h = normalize(vP).y;
      vec3 top = vec3(1.0,.93,.82)*1.1, mid = vec3(1.,.72,.45)*.7, bot = vec3(.16,.26,.14)*.5;
      gl_FragColor = vec4(h>0. ? mix(mid, top, pow(h,.6)) : mix(mid, bot, pow(-h,.5)), 1.); }`,
  }));
  env.add(sky);
  const panel = (x, y, z, s, c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(6), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(-5, 5, 6, 4, '#fff4e0');  // soft key
  panel(6, 2, -4, 3, '#ffd6a0');  // warm rim
  panel(0, -2, 7, 5, '#ffe9cf');  // fill
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.035);
  pmrem.dispose();
  return rt.texture;
}

/* ------------------------------------------------------------------ scene */

/**
 * opts.mode    'home'  — full scroll choreography (index page)
 *              'page'  — one fruit pinned into the page hero, scrolls away with it
 * opts.fruit   0 tangerine · 1 lemon · 2 blueberries · 3 avocado · null = none
 * opts.anchor  { x, y, s } position in half-viewport units (x: -1…1, y: -1…1) and scale
 * opts.floaters / opts.motes  false to hide background fruit / sun motes
 * opts.still   true for a fixed, unspinning pose (used to render product images)
 */
export function createScene(canvas, opts = {}) {
  const { onReady } = opts;
  const mode = opts.mode || 'home';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.still });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.NoToneMapping; // keeps the peel a true, saturated orange
    renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.environment = buildEnvironment(renderer);
  scene.fog = new THREE.Fog(new THREE.Color('#fff1de'), 10, 21);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 8);

  const key = new THREE.DirectionalLight('#fff0d8', 2.0); key.position.set(-4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffb36b', 1.6); rim.position.set(5, 2, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#fff6e8', '#44603a', 0.35));

  /* textures + materials */
  const tangerineSkin = makeSkin({ palette: ['#ff6a00', '#ff8410', '#ff9a2e'], stemTint: '#7f8f1c', blossomTint: '#b04c00', pores: 22000, poreR: [0.7, 1.7], depth: 0.7, lumps: 0.25, strength: 1.5 });
  const lemonSkin = makeSkin({ palette: ['#f2c200', '#ffd21a', '#ffe45c'], stemTint: '#8f9a1c', blossomTint: '#b88a00', pores: 20000, poreR: [0.7, 1.6], depth: 0.6, lumps: 0.4, strength: 1.4 });
  const avoSkin = makeSkin({ palette: ['#1f3812', '#35561c', '#2a2418'], pores: 9000, poreR: [1.4, 3], depth: -1.4, lumps: 0.6, lumpScale: 5, strength: 2.4 });

  const peel = (skin, o = {}) => new THREE.MeshPhysicalMaterial({
    map: skin.map, normalMap: skin.normalMap, normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.35, envMapIntensity: 0.55, ...o,
  });
  const tangerineMat = peel(tangerineSkin);
  const lemonMat = peel(lemonSkin, { roughness: 0.42 });
  const avoMat = peel(avoSkin, { roughness: 0.7, clearcoat: 0.12, envMapIntensity: 0.45, normalScale: new THREE.Vector2(1.1, 1.1) });
  const berryMat = new THREE.MeshPhysicalMaterial({ color: '#27346e', roughness: 0.55, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#8c9bd0'), envMapIntensity: 0.7 });
  const crownMat = new THREE.MeshStandardMaterial({ color: '#1a1f3e', roughness: 0.8 });
  const leafMat = new THREE.MeshPhysicalMaterial({ map: makeLeafTexture(), roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.6, side: THREE.DoubleSide });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#5c6b2a', roughness: 0.7 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#5a3d22', roughness: 0.8 });

  const leafGeo = leafGeometry();
  const makeLeaf = (scale, rx, ry, rz) => {
    const m = new THREE.Mesh(leafGeo, leafMat); m.scale.setScalar(scale); m.rotation.set(rx, ry, rz); return m;
  };
  const makeStem = (mat = stemMat, len = 0.2) => {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, len, 10), mat); stem.position.y = len / 2; g.add(stem);
    const cal = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.035, 5), stemMat); cal.position.y = 0.01; g.add(cal);
    return g;
  };

  /* ---- main tangerine (two halves so it can be split open) */
  const orange = new THREE.Group();
  const top = new THREE.Group(), bottom = new THREE.Group();
  top.add(new THREE.Mesh(halfSphere(true), tangerineMat));
  bottom.add(new THREE.Mesh(halfSphere(false), tangerineMat));
  const faceMat = cutFaceMaterial();
  const faceGeo = new THREE.CircleGeometry(0.995, 128);
  const topFace = new THREE.Mesh(faceGeo, faceMat); topFace.rotation.x = Math.PI / 2; top.add(topFace);
  const botFace = new THREE.Mesh(faceGeo, faceMat); botFace.rotation.x = -Math.PI / 2; bottom.add(botFace);
  const oStem = makeStem(); oStem.position.y = 0.97; top.add(oStem);
  const oLeaf = makeLeaf(1.25, -0.9, 0.5, -0.5); oLeaf.position.set(0.02, 1.05, 0); top.add(oLeaf);
  const oLeaf2 = makeLeaf(0.8, -1.2, -2.3, 0.4); oLeaf2.position.set(0, 1.05, 0); top.add(oLeaf2);
  orange.add(top, bottom);
  orange.scale.set(1, 0.9, 1);
  const orangeWrap = new THREE.Group(); orangeWrap.add(orange);

  /* juice droplets that spray when the fruit splits */
  const DROPS = 80;
  const dropMat = new THREE.MeshPhysicalMaterial({ color: '#ff9a2a', roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9, emissive: '#ff6a00', emissiveIntensity: 0.25 });
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), dropMat, DROPS);
  const dropData = Array.from({ length: DROPS }, () => {
    const a = rand() * Math.PI * 2, sp = lerp(1.2, 3.2, rand());
    return { a, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp * 0.6, vy: lerp(-0.6, 2.6, rand()), s: lerp(0.02, 0.06, rand()), d: rand() * 0.25 };
  });
  drops.frustumCulled = false; orangeWrap.add(drops);

  /* ---- lemon */
  const lemon = new THREE.Group();
  lemon.add(new THREE.Mesh(deformedSphere(lemonShape), lemonMat));
  const lStem = makeStem(); lStem.position.y = 1.43; lStem.scale.setScalar(0.8); lemon.add(lStem);
  const lLeaf = makeLeaf(1.2, -0.7, 0.9, -0.8); lLeaf.position.set(0, 1.46, 0); lemon.add(lLeaf);
  lemon.rotation.z = -0.5;
  const lemonWrap = new THREE.Group(); lemonWrap.add(lemon);

  /* ---- blueberry cluster */
  const berries = new THREE.Group();
  const berryGeo = new THREE.SphereGeometry(1, 64, 48);
  const crownGeo = new THREE.TorusGeometry(0.2, 0.07, 8, 5);
  const bpos = [[0, 0, 0.35], [-0.72, 0.18, 0], [0.72, 0.12, 0.05], [-0.3, 0.72, -0.2], [0.38, 0.7, -0.25], [0.05, -0.62, 0.1], [-0.72, -0.55, -0.3], [0.7, -0.5, -0.25], [0, 0.2, -0.6]];
  bpos.forEach(([x, y, z], i) => {
    const b = new THREE.Group();
    const m = new THREE.Mesh(berryGeo, berryMat); m.scale.set(1, 0.86, 1); b.add(m);
    const c = new THREE.Mesh(crownGeo, crownMat); c.position.y = 0.84; c.rotation.x = Math.PI / 2; b.add(c);
    const s = i === 0 ? 0.5 : lerp(0.36, 0.46, rand());
    b.scale.setScalar(s); b.position.set(x, y, z);
    b.rotation.set(lerp(-0.9, 0.9, rand()), rand() * 6, lerp(-0.9, 0.9, rand()));
    berries.add(b);
  });
  const bLeaf = makeLeaf(1.1, -1.5, 0.3, 0.9); bLeaf.position.set(-0.2, 0.7, -0.4); berries.add(bLeaf);
  const bLeaf2 = makeLeaf(0.9, -1.2, 2.6, -0.9); bLeaf2.position.set(0.3, 0.7, -0.4); berries.add(bLeaf2);
  const berriesWrap = new THREE.Group(); berriesWrap.add(berries);

  /* ---- avocado */
  const avocado = new THREE.Group();
  avocado.add(new THREE.Mesh(deformedSphere(avocadoShape), avoMat));
  const aStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.28, 10), woodMat); aStem.position.y = 1.5; avocado.add(aStem);
  const aLeaf = makeLeaf(1.3, -0.6, 0.7, -1.0); aLeaf.position.set(0, 1.55, 0); aLeaf.material = leafMat; avocado.add(aLeaf);
  avocado.rotation.z = 0.35;
  const avocadoWrap = new THREE.Group(); avocadoWrap.add(avocado);

  const showcase = [orangeWrap, lemonWrap, berriesWrap, avocadoWrap];
  const hero = new THREE.Group(); showcase.forEach((f) => hero.add(f)); scene.add(hero);

  /* ---- background floaters: small fruit + leaves drifting at depth */
  const floatGroup = new THREE.Group(); scene.add(floatGroup);
  const miniGeo = new THREE.SphereGeometry(1, 48, 32); miniGeo.scale(1, 0.9, 1);
  const miniLemonGeo = deformedSphere(lemonShape, 48, 32);
  const floaters = [];
  const addFloaters = (geo, mat, n, sMin, sMax) => {
    const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; floatGroup.add(im);
    for (let i = 0; i < n; i++) floaters.push({ im, i, x: lerp(-1, 1, rand()), y: rand(), z: lerp(-10, -4, rand()), s: lerp(sMin, sMax, rand()), r: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6), sp: lerp(0.1, 0.35, rand()) * (rand() < 0.5 ? -1 : 1), ph: rand() * 6 });
  };
  addFloaters(miniGeo, tangerineMat, 8, 0.2, 0.4);
  addFloaters(miniLemonGeo, lemonMat, 3, 0.18, 0.3);
  addFloaters(leafGeo, leafMat, 8, 0.4, 0.7);

  /* sun motes */
  const MOTES = 260;
  const moteGeo = new THREE.BufferGeometry();
  const mp = new Float32Array(MOTES * 3), mseed = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) { mp[i * 3] = lerp(-8, 8, rand()); mp[i * 3 + 1] = lerp(-5, 5, rand()); mp[i * 3 + 2] = lerp(-6, 3, rand()); mseed[i] = rand(); }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ size: 0.09, map: makeDotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffd8a0', opacity: 0.7, sizeAttenuation: true }));
  scene.add(motes);

  /* ---- basket finale: fruit tumbles in and piles up */
  const basket = new THREE.Group(); basket.visible = false; scene.add(basket);
  const BN = 46, LN = 12;
  const bOrange = new THREE.InstancedMesh(miniGeo, tangerineMat, BN);
  const bLemon = new THREE.InstancedMesh(miniLemonGeo, lemonMat, LN);
  bOrange.frustumCulled = bLemon.frustumCulled = false;
  basket.add(bOrange, bLemon);
  let bodies = [];
  let basketEl = null, basketT = 0;

  /* ---------------------------------------------------------- state */
  const state = { story: 0, fruits: 0, out: 0, heroOut: 0, scrollY: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, px: 0, py: 0, inside: false, wx: 99, wy: 99 };
  let active = true, W = 1, Hh = 1, aspect = 1, spin = 0, spinVel = 0;
  const cur = { x: 0, y: 0, s: 1, rx: 0, rz: 0, split: 0 };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = aspect = w / h; camera.updateProjectionMatrix();
    Hh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    W = Hh * aspect;
  }
  resize();
  window.addEventListener('resize', resize);

  function onPointer(e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.vx += (e.movementX || 0) * 0.0025;
    pointer.px = e.clientX; pointer.py = e.clientY; pointer.inside = true;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.inside = false; });

  /* layout targets for each chapter */
  function layout() {
    const mobile = aspect < 0.85;
    const s = mobile ? Math.min(W * 0.26, 0.95) : Math.min(1.5, W * 0.13);
    return {
      mobile,
      hero: mobile ? { x: 0, y: Hh * 0.2, s } : { x: W * 0.23, y: -0.15, s },
      story: mobile ? { x: 0, y: Hh * 0.22, s: s * 0.9 } : { x: -W * 0.22, y: 0, s: s * 0.9 },
    };
  }

  function spawnBasket() {
    const mobile = aspect < 0.85;
    const r = mobile ? 0.17 : 0.3;
    const count = mobile ? 26 : BN + LN;
    bodies = [];
    let o = 0, l = 0;
    for (let i = 0; i < count; i++) {
      const isLemon = i % 5 === 3 && l < LN;
      const idx = isLemon ? l++ : o++;
      if (!isLemon && idx >= BN) continue;
      const rr = r * lerp(0.85, 1.12, rand());
      const x = lerp(-W * 0.45, W * 0.45, rand());
      const y = Hh * 1.05 + rand() * 1.5;
      bodies.push({ x, y, px: x - lerp(-0.02, 0.02, rand()), py: y, r: rr, isLemon, idx, rot: rand() * 6, tilt: rand() * 6, delay: i * 0.035 });
    }
    for (let i = 0; i < BN; i++) setInstance(bOrange, i, 0, -99, 0, 0.0001, 0, 0);
    for (let i = 0; i < LN; i++) setInstance(bLemon, i, 0, -99, 0, 0.0001, 0, 0);
    basketT = 0;
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
  function setInstance(im, i, x, y, z, s, rz, rx, ry = 0) {
    e3.set(rx, ry, rz); q.setFromEuler(e3); v3.set(x, y, z); sc.set(s, s, s);
    m4.compose(v3, q, sc); im.setMatrixAt(i, m4);
  }

  function stepBasket(dt) {
    if (!basketEl) return;
    const rect = basketEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const visible = rect.top < vh && rect.bottom > 0;
    basket.visible = visible && bodies.length > 0;
    if (!basket.visible) return;
    const pxw = Hh / vh;
    basket.position.y = Hh / 2 - rect.bottom * pxw;
    basketT += Math.min(dt, 1 / 30); const t = basketT;
    const g = -14, wall = W / 2 - 0.05;
    const px = pointer.inside ? (pointer.px / window.innerWidth * 2 - 1) * W / 2 : 999;
    const py = pointer.inside ? Hh / 2 - pointer.py * pxw - basket.position.y : 999;
    const sub = 3, h = Math.min(dt, 1 / 30) / sub;
    for (let s = 0; s < sub; s++) {
      for (const b of bodies) {
        if (t < b.delay) continue;
        const vx = (b.x - b.px) * 0.995, vy = (b.y - b.py) * 0.995;
        b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + g * h * h;
        // cursor pushes fruit around
        const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy), R = b.r + 0.35;
        if (d < R && d > 1e-4) { const k = (R - d) / d * 0.35; b.x += dx * k; b.y += dy * k; }
      }
      for (let it = 0; it < 2; it++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i]; if (t < a.delay) continue;
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j]; if (t < b.delay) continue;
            const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
            if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2), k = (rr - d) / d * 0.5; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
          }
        }
        for (const b of bodies) {
          if (b.y < b.r) { b.y = b.r; b.px = lerp(b.px, b.x, 0.08); }
          if (b.x < -wall + b.r) { b.x = -wall + b.r; } else if (b.x > wall - b.r) { b.x = wall - b.r; }
        }
      }
    }
    for (const b of bodies) {
      b.rot -= (b.x - b.px) / b.r;
      const im = b.isLemon ? bLemon : bOrange;
      setInstance(im, b.idx, b.x, t < b.delay ? -99 : b.y, 0, b.r, b.rot, b.tilt, b.isLemon ? Math.PI / 2 : 0);
    }
    bOrange.instanceMatrix.needsUpdate = true; bLemon.instanceMatrix.needsUpdate = true;
  }

  /* ------------------------------------------------------------ loop */
  let raf = 0, last = performance.now(), time = 0;
  function frame(now = performance.now()) {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05); last = Math.max(last, now);
    if (!active) return;
    time += dt;

    pointer.x = damp(pointer.x, pointer.tx, 4, dt); pointer.y = damp(pointer.y, pointer.ty, 4, dt);
    camera.position.x = pointer.x * 0.22; camera.position.y = pointer.y * 0.14; camera.lookAt(0, 0, 0);

    const L = layout();
    const { story, out } = state;
    const fruits = mode === 'page' ? (opts.fruit == null ? 0 : (opts.fruit + 0.5) / 4) : state.fruits;
    const scrollWorld = state.scrollY / window.innerHeight * Hh;

    /* main fruit placement */
    const move = easeInOut(clamp(story / 0.42));
    let tx = lerp(L.hero.x, L.story.x, move);
    let ty = lerp(L.hero.y, L.story.y, move) + out * Hh * 0.35 + Math.sin(time * 1.1) * 0.06;
    let ts = lerp(L.hero.s, L.story.s, move) * (1 - state.heroOut * 0.08);
    if (mode === 'page') {
      const a = (L.mobile && opts.anchorMobile) || opts.anchor || { x: 0.45, y: 0, s: 1 };
      tx = a.x * W / 2;
      ty = a.y * Hh / 2 + scrollWorld + (opts.still ? 0 : Math.sin(time * 1.1) * 0.06);
      ts = a.s * (L.mobile ? Math.min(W * 0.26, 0.95) : Math.min(1.5, W * 0.13));
    }
    cur.x = damp(cur.x, tx, 6, dt); cur.y = damp(cur.y, ty, 6, dt); cur.s = damp(cur.s, ts, 6, dt);
    hero.position.set(cur.x, cur.y, 0); hero.scale.setScalar(cur.s);

    const split = smooth(0.22, 0.45, story) * (1 - smooth(0.68, 0.92, story));
    cur.split = damp(cur.split, split, 8, dt);
    const S = cur.split;

    // spin: free while whole, eases back to face the camera while split open
    pointer.vx *= Math.exp(-2.5 * dt);
    spinVel = opts.still ? 0 : 0.35 + pointer.vx * 8;
    spin += dt * spinVel * (1 - S);
    const target = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
    spin = lerp(spin, target, clamp(S * dt * 5));

    cur.rx = opts.still ? 0 : damp(cur.rx, -pointer.y * 0.35, 3, dt);
    cur.rz = opts.still ? 0 : damp(cur.rz, pointer.x * 0.18, 3, dt);

    /* per-fruit show/hide during the fruits chapter */
    const f = fruits * 4;
    showcase.forEach((g, i) => {
      const appear = i === 0 ? 1 : smooth(i - 0.14, i + 0.14, f);
      const leave = i === 3 ? 1 : 1 - smooth(i + 1 - 0.14, i + 1 + 0.14, f);
      const k = appear * leave;
      g.visible = k > 0.002;
      if (!g.visible) return;
      const e = easeInOut(k);
      g.scale.setScalar(Math.max(e, 0.0001));
      g.position.y = (1 - appear) * -1.6 + (1 - leave) * 1.6;
      g.rotation.set(cur.rx + 0.15, spin + (1 - k) * Math.PI * 1.2 + i * 0.7, cur.rz);
    });

    top.position.y = S * 0.62; bottom.position.y = -S * 0.62;
    top.rotation.x = -S * 1.15; bottom.rotation.x = S * 1.15;
    top.position.z = bottom.position.z = S * 0.25;
    orange.rotation.y = 0;

    /* juice */
    const jt = clamp((story - 0.24) / 0.3);
    drops.visible = jt > 0 && jt < 1 && orangeWrap.visible;
    if (drops.visible) {
      dropData.forEach((d, i) => {
        const tt = clamp((jt - d.d) / (1 - d.d));
        const x = Math.cos(d.a) * 0.9 + d.vx * tt * 1.2;
        const z = Math.sin(d.a) * 0.9 + d.vz * tt * 1.2;
        const y = d.vy * tt * 1.2 - 3.2 * tt * tt;
        setInstance(drops, i, x, y, z + 0.4, d.s * Math.sin(Math.PI * tt), 0, 0);
      });
      drops.instanceMatrix.needsUpdate = true;
    }
    faceMat.uniforms.uTime.value = time;

    /* floaters */
    floaters.forEach((fl) => {
      const depth = (fl.z + 10) / 6;
      const span = Hh * 2.2;
      let y = ((fl.y * span + scrollWorld * (0.25 + depth * 0.35) + time * 0.08) % span + span) % span - span / 2;
      const x = fl.x * (W / 2) * (1.9 - depth * 0.5) + Math.sin(time * 0.3 + fl.ph) * 0.2;
      fl.r.x += dt * fl.sp; fl.r.y += dt * fl.sp * 0.7;
      const shown = !L.mobile || fl.i % 2 === 0; // fewer on phones so text stays readable
      setInstance(fl.im, fl.i, x, y, fl.z, shown ? fl.s : 0.0001, fl.r.z, fl.r.x, fl.r.y);
    });
    for (const im of new Set(floaters.map((f) => f.im))) im.instanceMatrix.needsUpdate = true;
    floatGroup.visible = opts.floaters !== false && state.out < 0.999;
    hero.visible = mode === 'page' ? opts.fruit != null && scrollWorld < Hh * 1.6 : state.out < 0.999;
    motes.visible = opts.motes !== false;

    /* motes */
    const pa = moteGeo.attributes.position.array;
    for (let i = 0; i < MOTES; i++) {
      pa[i * 3 + 1] += dt * (0.05 + mseed[i] * 0.12);
      pa[i * 3] += Math.sin(time * 0.5 + mseed[i] * 20) * dt * 0.05;
      if (pa[i * 3 + 1] > 5) pa[i * 3 + 1] = -5;
    }
    moteGeo.attributes.position.needsUpdate = true;
    motes.position.y = -scrollWorld * 0.15 % 10;

    stepBasket(dt);
    renderer.render(scene, camera);
  }

  // warm up shaders, then start
  renderer.compile(scene, camera);
  frame();
  if (onReady) requestAnimationFrame(() => onReady());

  return {
    set(key, value) { state[key] = value; },
    setActive(v) { if (v && !active) last = performance.now(); active = v; },
    setFog(color) { scene.fog.color.set(color); },
    attachBasket(el) { basketEl = el; },
    dropFruit() { spawnBasket(); },
    get hasBasket() { return bodies.length > 0; },
    dispose() { cancelAnimationFrame(raf); renderer.dispose(); },
  };
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

window.OrchardScene = { create: createScene, supported: supportsWebGL };

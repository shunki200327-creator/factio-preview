const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const isLowSpecMobile = () => window.innerWidth < 992;

(async () => {
  const home = document.querySelector('#home'), img = home?.querySelector('img');
  if (!home || !img || mq?.matches || isLowSpecMobile()) return;
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  let THREE;
  try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'); } catch { return; }
  if (!img.complete) await new Promise((r) => { img.onload = img.onerror = r; });
  if (!img.naturalWidth || mq?.matches || isLowSpecMobile()) return;

  const container = img.closest('.hero-art') || home, isMobile = window.innerWidth < 992;
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;z-index:1;visibility:hidden';

  const still = new Image(); still.src = img.currentSrc || img.src;
  try { await still.decode(); } catch { return; }
  const tex = new THREE.Texture(still);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const N = 16, trail = Array.from({ length: N }, () => new THREE.Vector3(0.5, 0.5, -99));
  const uniforms = {
    uTex: { value: tex }, uTime: { value: 0 }, uSpeed: { value: 0 },
    uAspect: { value: 1 }, uCover: { value: new THREE.Vector2(1, 1) }, uFullColor: { value: 0 }, uTrail: { value: trail }
  };

  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
  camera.position.z = 1;
  const geo = new THREE.PlaneGeometry(1.03, 1.03, isMobile ? 24 : 48, isMobile ? 16 : 32);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime, uSpeed; varying vec2 vUv;
      void main() {
        vUv = uv; vec3 p = position;
        float amp = mix(0.005, 0.015, clamp(uSpeed, 0.0, 1.0));
        p.x += sin(uv.x * 6.283 + uTime * 1.6 + uv.y * 2.4) * amp;
        p.y += sin(uv.y * 5.2 - uTime * 1.3 + uv.x * 2.8) * amp;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform float uTime, uAspect, uFullColor;
      uniform vec2 uCover; uniform vec3 uTrail[${N}]; varying vec2 vUv;
      void main() {
        vec2 uv = (vUv - 0.5) * uCover + 0.5;
        vec4 c = texture2D(uTex, clamp(uv, 0.0, 1.0));
        float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114)), rev = uFullColor;
        for (int i = 0; i < ${N}; i++) {
          float age = uTime - uTrail[i].z;
          if (age >= 0.0 && age < 1.5) {
            float life = 1.0 - age / 1.5;
            vec2 d = (vUv - uTrail[i].xy) * vec2(uAspect, 1.0);
            rev = max(rev, (1.0 - smoothstep(0.0, 0.22 * (0.55 + 0.45 * life), length(d))) * life * life);
          }
        }
        gl_FragColor = vec4(mix(vec3(gray), c.rgb, clamp(rev, 0.0, 1.0)), 1.0);
        #include <colorspace_fragment>
      }`
  });

  scene.add(new THREE.Mesh(geo, mat));
  const oldCanvas = home.querySelector('#hero-canvas');
  let failed = false;
  const enabled = () => !failed && !mq.matches && !isLowSpecMobile() && !document.hidden;
  const useGL = active => {
    home.classList.toggle('hero-gl-active', active);
    renderer.domElement.style.visibility = active ? 'visible' : 'hidden';
    img.style.visibility = active ? 'hidden' : '';
    if(oldCanvas) oldCanvas.style.visibility = active ? 'hidden' : '';
    home.dispatchEvent(new Event('factio-hero-renderer'));
  };
  renderer.domElement.style.visibility = 'hidden';
  renderer.debug.onShaderError = () => { failed = true; useGL(false); };
  // Switch only after the first successful render.
  container.appendChild(renderer.domElement);

  const resize = () => {
    const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 992 ? 1.25 : 2));
    renderer.setSize(w, h, false);
    const va = w / Math.max(h, 1), ia = (img.naturalWidth || 1800) / (img.naturalHeight || 1200);
    uniforms.uAspect.value = va;
    uniforms.uCover.value.set(va < ia ? va / ia : 1, va > ia ? ia / va : 1);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });
  img.addEventListener('load', () => resize());

  let px = 0.5, py = 0.5, ox = 0.5, oy = 0.5, vel = 0, idx = 0, lastPush = -1, lastInput = -99;
  const pushTrail = (x, y, t) => {
    if (t - lastPush < (window.innerWidth < 992 ? 0.045 : 0.03)) return;
    trail[idx].set(x, y, t); idx = (idx + 1) % N; lastPush = t;
  };
  const onPointer = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    const r = container.getBoundingClientRect();
    px = Math.min(1, Math.max(0, (pt.clientX - r.left) / Math.max(r.width, 1)));
    py = Math.min(1, Math.max(0, 1 - (pt.clientY - r.top) / Math.max(r.height, 1)));
    lastInput = performance.now() * 0.001; pushTrail(px, py, lastInput);
  };
  ['pointermove', 'touchmove', 'touchstart'].forEach((ev) => home.addEventListener(ev, onPointer, { passive: true }));

  let inView = true, rafId = 0;
  const toggleBtn = document.querySelector('#print-toggle');
  const tick = (now) => {
    rafId = 0;
    if (!inView || !enabled()) return;
    const t = (uniforms.uTime.value = now * 0.001);
    if (t - lastInput > 2.5) {
      px = 0.5 + 0.26 * Math.sin(t * 1.15); py = 0.5 + 0.16 * Math.sin(t * 2.3); pushTrail(px, py, t);
    }
    vel += (Math.min(1, Math.hypot(px - ox, py - oy) * 28) - vel) * 0.12;
    ox = px; oy = py; uniforms.uSpeed.value = vel;
    uniforms.uFullColor.value += ((toggleBtn?.getAttribute('aria-pressed') === 'true' ? 1 : 0) - uniforms.uFullColor.value) * 0.1;
    try { renderer.render(scene, camera); } catch { failed = true; useGL(false); return; }
    if(failed) return;
    if(!home.classList.contains('hero-gl-active')) useGL(true);
    rafId = requestAnimationFrame(tick);
  };
  const start = () => { if (!rafId && inView && enabled()) rafId = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : (cancelAnimationFrame(rafId), rafId = 0); }).observe(home);
  const sync = () => { cancelAnimationFrame(rafId); rafId = 0; if (!enabled()) useGL(false); else start(); };
  mq.addEventListener('change', sync);
  window.addEventListener('resize', sync);
  document.addEventListener('visibilitychange', sync);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); failed=true; cancelAnimationFrame(rafId); rafId=0; useGL(false); });
  start();
})().catch(() => { /* Keep the existing photo renderer on initialization failure. */ });

/* =========================================================
   Hero WebGL2 — casco revelado por una simulación de fluidos
   Misma idea que el original:
   - Un fluido (stable fluids, rejilla al 10% de la pantalla) que el
     cursor empuja. Donde el fluido se mueve (umbral duro) aparece el
     casco; fuera de la cabeza aparece un fondo topográfico gris claro.
   - Cuando el ratón está quieto 2 s, un cursor "fantasma" recorre la
     cara en zigzag horizontal (de arriba abajo y vuelta), lo que
     genera las franjas horizontales.
   - Casco "fantasma": bandas de escaneo tenues sobre la silueta.
   - La cabeza se desplaza un poco siguiendo el ratón.
   ========================================================= */
window.HeroGL = (() => {
  const OPT = { poisson: 4, dissipation: 0.96, force: 50, resolution: 0.1, cursor: 18, dt: 0.014 };
  const COLORS = { cursorBg: [0xe8, 0xe8, 0xdf], cursorFg: [0xcf, 0xd2, 0xc5], outline: [0xe8, 0xe8, 0xdf] };

  const QUAD_VS = `#version 300 es
    in vec2 aPos; out vec2 vUv;
    void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FORCE_VS = `#version 300 es
    in vec2 aPos; uniform vec2 uCenter, uScale; out vec2 vUv;
    void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos * uScale + uCenter, 0.0, 1.0); }`;

  const HDR = `#version 300 es
    precision highp float; in vec2 vUv; out vec4 o;`;

  const ADVECT = HDR + `
    uniform sampler2D uVel; uniform vec2 uFbo; uniform float uDt, uDiss;
    void main(){
      vec2 ratio = max(uFbo.x, uFbo.y) / uFbo;
      // BFECC: avance, retroceso y corrección del error
      vec2 v0 = texture(uVel, vUv).xy;
      vec2 back = vUv - v0 * uDt * ratio;
      vec2 v1 = texture(uVel, back).xy;
      vec2 fwd = back + v1 * uDt * ratio;
      vec2 corr = vUv - (fwd - vUv) * 0.5;
      vec2 v2 = texture(uVel, corr).xy;
      vec2 v3 = texture(uVel, corr - v2 * uDt * ratio).xy;
      o = vec4(v3 * uDiss, 0.0, 1.0);
    }`;

  const FORCE = HDR + `
    uniform vec2 uForce;
    void main(){
      float d = 1.0 - min(length((vUv - 0.5) * 2.0), 1.0);
      o = vec4(uForce * d * d, 0.0, 1.0);
    }`;

  const DIV = HDR + `
    uniform sampler2D uVel; uniform vec2 uPx; uniform float uDt;
    void main(){
      float x0 = texture(uVel, vUv - vec2(uPx.x, 0.0)).x;
      float x1 = texture(uVel, vUv + vec2(uPx.x, 0.0)).x;
      float y0 = texture(uVel, vUv - vec2(0.0, uPx.y)).y;
      float y1 = texture(uVel, vUv + vec2(0.0, uPx.y)).y;
      o = vec4((x1 - x0 + y1 - y0) * 0.5 / uDt);
    }`;

  const POISSON = HDR + `
    uniform sampler2D uP, uDiv; uniform vec2 uPx;
    void main(){
      float p0 = texture(uP, vUv + vec2(uPx.x * 2.0, 0.0)).r;
      float p1 = texture(uP, vUv - vec2(uPx.x * 2.0, 0.0)).r;
      float p2 = texture(uP, vUv + vec2(0.0, uPx.y * 2.0)).r;
      float p3 = texture(uP, vUv - vec2(0.0, uPx.y * 2.0)).r;
      o = vec4((p0 + p1 + p2 + p3) / 5.0 - texture(uDiv, vUv).r); // straightness = 1
    }`;

  const PRESSURE = HDR + `
    uniform sampler2D uVel, uP; uniform vec2 uPx; uniform float uDt;
    void main(){
      float p0 = texture(uP, vUv + vec2(uPx.x, 0.0)).r;
      float p1 = texture(uP, vUv - vec2(uPx.x, 0.0)).r;
      float p2 = texture(uP, vUv + vec2(0.0, uPx.y)).r;
      float p3 = texture(uP, vUv - vec2(0.0, uPx.y)).r;
      vec2 v = texture(uVel, vUv).xy - vec2(p0 - p1, p2 - p3) * 0.5 * uDt;
      o = vec4(v, 0.0, 1.0);
    }`;

  const COMPOSITE = HDR + `
    uniform sampler2D uPortrait, uHelmet, uHolo, uVel;
    // quita el alfa residual casi transparente del recorte (evita el recuadro claro)
    vec4 clean(vec4 c){ float a = smoothstep(0.12, 0.6, c.a); return c.a > 0.001 ? vec4(c.rgb / c.a * a, a) : vec4(0.0); }
    uniform vec2 uRes, uShift;
    uniform vec4 uRect;
    uniform float uTime, uAspect;
    uniform vec3 uCBg, uCFg, uCOut;

    // simplex 3D (Ashima Arts, licencia MIT)
    vec4 permute(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0; vec4 s1 = floor(b1) * 2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main(){
      // --- efecto del cursor (fluido): umbral duro, como el original
      vec2 vel = texture(uVel, vec2(0.025 + vUv.x * 0.95, 0.025 + vUv.y * 0.95)).xy;
      float len = length(vel);
      float r = mix(1.0, vel.x * 0.5 + 0.5, len);
      float cursorFx = step(0.1, 1.0 - r);

      // --- fondo topográfico del cursor (gris claro con contorno)
      vec2 uv = vUv; uv.x *= uAspect;
      float nd = 0.5 + snoise(vec3(uv, uTime * 0.01)) * 0.5;
      float nf = 0.5 + snoise(vec3(uv + nd * 0.5, uTime * 0.1)) * 0.5;
      nf = fract(nf * 3.0);
      float nb = step(0.5, nf);
      float edge = 1.0 - smoothstep(0.0, fwidth(nf) * 1.5, abs(nf - 0.5));
      vec3 cursorBg = mix(mix(uCBg, uCFg, nb), uCOut, edge);

      // --- coordenadas de la foto
      vec2 px = vUv * uRes;
      vec2 iuv = vec2((px.x - uRect.x) / uRect.z, 1.0 - (px.y - uRect.y) / uRect.w) + uShift;
      float inR = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
      // la sudadera toca los bordes laterales de la foto: se desvanece solo ahí (abajo)
      float sideFade = mix(1.0, smoothstep(0.0, 0.09, iuv.x) * smoothstep(1.0, 0.91, iuv.x), smoothstep(0.5, 0.65, iuv.y));

      // CAPA 1 · fondo: retrato sin casco (PNG recortado)
      vec4 P = clean(texture(uPortrait, iuv)) * inR * sideFade;
      // CAPA 3 · frente: foto con casco (PNG recortado)
      vec4 Hm = clean(texture(uHelmet, iuv)) * inR * sideFade;
      // CAPA 2 · intermedia: holograma del casco (líneas grises sobre blanco -> alfa)
      vec3 G = texture(uHolo, iuv).rgb;
      float ag = clamp((1.0 - min(G.r, min(G.g, G.b))) * 1.7, 0.0, 1.0) * inR;
      vec3 cg = clamp((G - (1.0 - ag)) / max(ag, 0.001), 0.0, 1.0);

      // zona del casco = donde la foto con casco difiere del retrato (solo cabeza, no la sudadera)
      float hDiff = length(Hm.rgb - P.rgb) + abs(Hm.a - P.a);
      float hA = smoothstep(0.12, 0.30, hDiff) * Hm.a * (1.0 - smoothstep(0.58, 0.66, iuv.y));

      // --- composición (alfa premultiplicado)
      float rest = 1.0 - cursorFx;
      vec4 col = vec4(cursorBg, 1.0) * cursorFx * 0.75; // estela gris pálida del fluido
      col = P + col * (1.0 - P.a);                     // 1 · retrato

      // 2 · holograma: siempre visible y muy tenue (~10 % en superficies, ~18 % en bordes),
      //     sin animación; sobre la cara casi no se nota
      float edgeH = smoothstep(0.25, 0.75, ag);
      float oh = (ag * 0.10 + edgeH * 0.08) * (1.0 - 0.6 * P.a) * rest;
      vec3 holoCol = mix(cg, vec3(0.62, 0.62, 0.57), 0.35);           // gris cálido
      col = vec4(holoCol * oh, oh) + col * (1.0 - oh);
      float fill = hA * 0.05 * (1.0 - P.a) * rest;                     // relleno translúcido de cristal
      col = vec4(vec3(fill), fill) + col * (1.0 - fill);

      col = mix(col, Hm, cursorFx * hA);               // 3 · casco donde pasa el fluido
      o = col;
    }`;

  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  async function init({ hero, portrait, helmet, holo, rect }) {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__gl';
    canvas.id = 'heroGL';
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return null;
    const imgs = await Promise.all([loadImg(portrait), loadImg(helmet), loadImg(holo)]);

    // ---------- utilidades GL ----------
    const compile = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
      return { p, u };
    };
    const P = {
      advect: program(QUAD_VS, ADVECT), force: program(FORCE_VS, FORCE), div: program(QUAD_VS, DIV),
      poisson: program(QUAD_VS, POISSON), pressure: program(QUAD_VS, PRESSURE), comp: program(QUAD_VS, COMPOSITE),
    };
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = (w, h, src) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (src) { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      return t;
    };
    const fbo = (w, h) => {
      const tex = texture(w, h); const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb };
    };
    const texPortrait = texture(0, 0, imgs[0]);
    const texHelmet = texture(0, 0, imgs[1]);
    const texHolo = texture(0, 0, imgs[2]);

    let F = null, fw = 0, fh = 0;
    let W = 0, H = 0, dpr = 1;
    const rectPx = { x: 0, y: 0, s: 0 };
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 1.75);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      Object.assign(rectPx, rect(W, H));
      const nw = Math.max(16, Math.round(W * OPT.resolution)), nh = Math.max(16, Math.round(H * OPT.resolution));
      if (nw !== fw || nh !== fh) {
        fw = nw; fh = nh;
        F = { vel0: fbo(fw, fh), vel1: fbo(fw, fh), div: fbo(fw, fh), p0: fbo(fw, fh), p1: fbo(fw, fh) };
      }
    }
    resize();
    addEventListener('resize', resize);

    const bind = (unit, tex, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };
    const target = (f) => { gl.bindFramebuffer(gl.FRAMEBUFFER, f ? f.fb : null); f ? gl.viewport(0, 0, fw, fh) : gl.viewport(0, 0, canvas.width, canvas.height); };
    const draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ---------- ratón + cursor inactivo ----------
    const mouse = { x: 0, y: 0 };            // normalizado -1..1 (y hacia arriba)
    const coords = { x: 0, y: 0 }, old = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let isMoving = true, moveTimer = setTimeout(() => setIdle(), 2500);
    let idleT0 = 0;
    function setIdle() { isMoving = false; idleT0 = performance.now(); }
    addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / innerHeight) * 2 - 1);
      isMoving = true; clearTimeout(moveTimer);
      moveTimer = setTimeout(setIdle, 2000);
    });
    // Línea de tiempo del cursor inactivo: baja 2.5 s, pausa, sube 2.5 s, pausa 3 s (ciclo 9.5 s)
    const inOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
    function idleCursor(now) {
      const t = ((now - idleT0) / 1000) % 9.5;
      let py, px;
      if (t < 2.5) { py = t / 2.5; px = inOut(t / 2.5); }
      else if (t < 4) { py = 1; px = 1; }
      else if (t < 6.5) { py = 1 - (t - 4) / 2.5; px = 1 - inOut((t - 4) / 2.5); }
      else { py = 0; px = 0; }
      return { x: -Math.cos(px * Math.PI * 4) * 0.75, y: Math.cos(py * Math.PI) * 0.5 };
    }

    // ---------- simulación ----------
    function step(now) {
      // fuerza del cursor
      if (isMoving) { coords.x = mouse.x; coords.y = mouse.y; }
      else { const c = idleCursor(now); coords.x = c.x; coords.y = c.y; }
      const dx = coords.x - old.x, dy = coords.y - old.y;
      old.x = coords.x; old.y = coords.y;
      const px = 1 / fw, py = 1 / fh;

      gl.disable(gl.BLEND);
      // 1. advección
      gl.useProgram(P.advect.p); target(F.vel1);
      bind(0, F.vel0.tex, P.advect.u.uVel);
      gl.uniform2f(P.advect.u.uFbo, fw, fh); gl.uniform1f(P.advect.u.uDt, OPT.dt); gl.uniform1f(P.advect.u.uDiss, OPT.dissipation);
      draw();
      // 2. fuerza externa (mezcla aditiva)
      if (Math.abs(dx) + Math.abs(dy) > 0 && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(P.force.p);
        const sx = OPT.cursor * px, sy = OPT.cursor * py;
        const cx = Math.min(Math.max(coords.x, -1 + sx + px * 2), 1 - sx - px * 2);
        const cy = Math.min(Math.max(coords.y, -1 + sy + py * 2), 1 - sy - py * 2);
        gl.uniform2f(P.force.u.uCenter, cx, cy); gl.uniform2f(P.force.u.uScale, sx, sy);
        gl.uniform2f(P.force.u.uForce, (dx / 2) * OPT.force, (dy / 2) * OPT.force);
        draw();
        gl.disable(gl.BLEND);
      }
      // 3. divergencia
      gl.useProgram(P.div.p); target(F.div);
      bind(0, F.vel1.tex, P.div.u.uVel); gl.uniform2f(P.div.u.uPx, px, py); gl.uniform1f(P.div.u.uDt, OPT.dt);
      draw();
      // 4. presión (Jacobi)
      gl.useProgram(P.poisson.p); gl.uniform2f(P.poisson.u.uPx, px, py);
      let pin = F.p0, pout = F.p1;
      for (let i = 0; i < OPT.poisson; i++) {
        target(pout); bind(0, pin.tex, P.poisson.u.uP); bind(1, F.div.tex, P.poisson.u.uDiv); draw();
        [pin, pout] = [pout, pin];
      }
      // 5. proyección
      gl.useProgram(P.pressure.p); target(F.vel0);
      bind(0, F.vel1.tex, P.pressure.u.uVel); bind(1, pin.tex, P.pressure.u.uP);
      gl.uniform2f(P.pressure.u.uPx, px, py); gl.uniform1f(P.pressure.u.uDt, OPT.dt);
      draw();
    }

    // ---------- composición ----------
    const c3 = (c) => c.map((v) => v / 255);
    function composite(now) {
      gl.useProgram(P.comp.p); target(null);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const u = P.comp.u;
      bind(0, texPortrait, u.uPortrait); bind(1, texHelmet, u.uHelmet); bind(2, F.vel0.tex, u.uVel); bind(3, texHolo, u.uHolo);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform4f(u.uRect, rectPx.x * dpr, (H - rectPx.y - rectPx.s) * dpr, rectPx.s * dpr, rectPx.s * dpr);
      gl.uniform1f(u.uTime, now / 1000);
      gl.uniform1f(u.uAspect, W / H);
      // la cabeza sigue un poco al ratón (como la rotación 3D del original)
      eased.x += (mouse.x - eased.x) * 0.025; eased.y += (mouse.y - eased.y) * 0.025;
      gl.uniform2f(u.uShift, 0, 0); // en el original la cabeza no se desplaza
      gl.uniform3fv(u.uCBg, c3(COLORS.cursorBg)); gl.uniform3fv(u.uCFg, c3(COLORS.cursorFg)); gl.uniform3fv(u.uCOut, c3(COLORS.outline));
      draw();
    }

    // ---------- bucle (simulación a 60 Hz fijos) ----------
    let visible = true, raf = 0, acc = 0, last = performance.now();
    function frame(now) {
      raf = 0;
      acc += Math.min(0.1, (now - last) / 1000); last = now;
      let n = 0;
      while (acc >= 1 / 60 && n < 3) { step(now); acc -= 1 / 60; n++; }
      if (n === 3) acc = 0;
      composite(now);
      if (visible) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }).observe(hero);
    raf = requestAnimationFrame(frame);

    hero.appendChild(canvas);
    hero.classList.add('gl-on');
    // sweep(): arranca ya el recorrido del cursor inactivo (para la intro / doble clic)
    return { canvas, resize, sweep: () => { clearTimeout(moveTimer); isMoving = false; idleT0 = performance.now(); old.x = coords.x = -0.75; old.y = coords.y = 0.5; } };
  }

  return { init };
})();

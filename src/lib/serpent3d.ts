/**
 * VENORA 3D serpent engine — dependency-free, Canvas 2D, perspective-projected.
 * Two scenes: an "ouroboros" intro and an interactive hero serpent that chases the cursor.
 * Browser-only (uses canvas / document).
 */

const F = 900; // focal length for perspective

type Bead = { x: number; y: number; z: number; r: number };
type Spark = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ───────── sprites (drawn once) ───────── */
let SPR: { bead: HTMLCanvasElement; fog: HTMLCanvasElement; glow: HTMLCanvasElement } | null = null;

type RGB = [number, number, number];
function themeRGB(name: string, fallback: RGB): RGB {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
    if (v.length === 3 && v.every((n) => Number.isFinite(n))) return v as RGB;
  } catch {
    /* ignore */
  }
  return fallback;
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

function sprites() {
  if (SPR) return SPR;
  const gold = themeRGB('--c-gold', [214, 173, 104]);
  const deep = themeRGB('--c-gold-deep', [184, 138, 69]);
  const light = themeRGB('--c-gold-light', [246, 224, 176]);
  const black: RGB = [8, 6, 4];
  const mk = (s: number) => {
    const c = document.createElement('canvas');
    c.width = c.height = s;
    return c;
  };
  const S = 128;
  const bead = mk(S);
  const b = bead.getContext('2d')!;
  const g = b.createRadialGradient(S * 0.36, S * 0.32, 2, S * 0.5, S * 0.5, S * 0.62);
  g.addColorStop(0, css(mix(light, [255, 255, 255], 0.6)));
  g.addColorStop(0.18, css(light));
  g.addColorStop(0.5, css(mix(gold, deep, 0.5)));
  g.addColorStop(0.82, css(mix(deep, black, 0.6)));
  g.addColorStop(1, css(mix(deep, black, 0.88)));
  b.fillStyle = g;
  b.beginPath();
  b.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
  b.fill();
  // scale edge + specular
  b.strokeStyle = css(mix(deep, black, 0.85), 0.55);
  b.lineWidth = S * 0.035;
  b.beginPath();
  b.arc(S * 0.5, S * 0.62, S * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  b.stroke();
  b.fillStyle = 'rgba(255,255,255,0.55)';
  b.beginPath();
  b.ellipse(S * 0.36, S * 0.3, S * 0.14, S * 0.08, -0.6, 0, Math.PI * 2);
  b.fill();

  const fog = mk(S);
  const f = fog.getContext('2d')!;
  f.fillStyle = '#050505';
  f.beginPath();
  f.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
  f.fill();

  const glow = mk(64);
  const gl = glow.getContext('2d')!;
  const gg = gl.createRadialGradient(32, 32, 0, 32, 32, 32);
  gg.addColorStop(0, css(mix(light, [255, 255, 255], 0.5)));
  gg.addColorStop(0.25, css(gold, 0.6));
  gg.addColorStop(1, css(gold, 0));
  gl.fillStyle = gg;
  gl.fillRect(0, 0, 64, 64);

  SPR = { bead, fog, glow };
  return SPR;
}

/* ───────── stage ───────── */
function makeStage(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const st = { ctx, w: 0, h: 0, dpr: 1 };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    st.dpr = Math.min(window.devicePixelRatio || 1, 2);
    st.w = Math.max(1, rect.width);
    st.h = Math.max(1, rect.height);
    canvas.width = Math.round(st.w * st.dpr);
    canvas.height = Math.round(st.h * st.dpr);
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  };
  resize();
  return { st, resize };
}

/** Body thickness profile: neck → full → tapered tail (u: 0 head … 1 tail). */
function thickness(u: number) {
  const neck = 0.78 + 0.22 * Math.sin(clamp(u * 6) * (Math.PI / 2));
  const s = clamp((u - 0.35) / 0.65);
  const taper = 1 - 0.82 * (s * s * (3 - 2 * s));
  return neck * taper;
}

type Proj = { cx: number; cy: number; zoom: number; weak: boolean };

function project(b: Bead, p: Proj) {
  const s = F / (F + b.z);
  if (p.weak) return { x: p.cx + b.x, y: p.cy + b.y, s };
  return { x: p.cx + b.x * s * p.zoom, y: p.cy + b.y * s * p.zoom, s: s * p.zoom };
}

function drawSerpent(ctx: CanvasRenderingContext2D, beads: Bead[], p: Proj, t: number, zNear: number, zFar: number, alpha = 1) {
  const { bead, fog, glow } = sprites();
  const order = beads.map((_, i) => i).sort((a, c) => beads[c].z - beads[a].z);
  const N = beads.length;
  ctx.globalCompositeOperation = 'source-over';
  for (const i of order) {
    const b = beads[i];
    if (F + b.z < 80) continue;
    const q = project(b, p);
    const rr = b.r * q.s;
    const fg = clamp((b.z - zNear) / (zFar - zNear)) * 0.62;
    if (i === 0) {
      drawHead(ctx, beads, p, t, alpha);
      continue;
    }
    ctx.globalAlpha = alpha;
    ctx.drawImage(bead, q.x - rr, q.y - rr, rr * 2, rr * 2);
    if (fg > 0.02) {
      ctx.globalAlpha = fg * alpha;
      ctx.drawImage(fog, q.x - rr, q.y - rr, rr * 2, rr * 2);
    }
  }
  // travelling glint
  const g = (t * 26) % (N + 40);
  if (g < N) {
    const b = beads[Math.floor(g)];
    const q = project(b, p);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.95 * alpha;
    const R = b.r * q.s * 3.4;
    ctx.drawImage(glow, q.x - R, q.y - R, R * 2, R * 2);
    ctx.strokeStyle = 'rgba(255,245,215,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(q.x - R * 1.1, q.y);
    ctx.lineTo(q.x + R * 1.1, q.y);
    ctx.moveTo(q.x, q.y - R * 1.1);
    ctx.lineTo(q.x, q.y + R * 1.1);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function drawHead(ctx: CanvasRenderingContext2D, beads: Bead[], p: Proj, t: number, alpha: number) {
  const { bead } = sprites();
  const h = beads[0];
  const n = beads[Math.min(3, beads.length - 1)];
  const a = project(h, p);
  const c = project(n, p);
  const ang = Math.atan2(a.y - c.y, a.x - c.x);
  const rx = h.r * 1.7 * a.s;
  const ry = h.r * 1.2 * a.s;
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  // tongue
  const flick = Math.pow(Math.max(0, Math.sin(t * 3.3)), 8);
  if (flick > 0.05) {
    const L = rx * (0.5 + 0.9 * flick);
    ctx.strokeStyle = '#d23b3b';
    ctx.lineWidth = Math.max(1, ry * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rx * 0.9, 0);
    ctx.lineTo(rx * 0.9 + L, 0);
    ctx.moveTo(rx * 0.9 + L * 0.7, 0);
    ctx.lineTo(rx * 0.9 + L, -ry * 0.28);
    ctx.moveTo(rx * 0.9 + L * 0.7, 0);
    ctx.lineTo(rx * 0.9 + L, ry * 0.28);
    ctx.stroke();
  }
  ctx.drawImage(bead, -rx, -ry, rx * 2, ry * 2);
  // eyes
  ctx.shadowColor = '#ff3b2a';
  ctx.shadowBlur = Math.max(4, ry * 0.9);
  ctx.fillStyle = '#ff4a2e';
  const er = Math.max(1.2, ry * 0.2);
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(rx * 0.32, sgn * ry * 0.5, er, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSparks(ctx: CanvasRenderingContext2D, sparks: Spark[], p: Proj, alphaMul = 1) {
  const { glow } = sprites();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of sparks) {
    if (F + s.z < 80) continue;
    const q = project({ x: s.x, y: s.y, z: s.z, r: 0 }, p);
    const lf = clamp(s.life / s.max);
    const R = s.size * q.s * (0.6 + lf);
    ctx.globalAlpha = clamp(lf * 1.2) * alphaMul * (0.55 + 0.45 * Math.sin(s.life * 18 + s.size * 9));
    ctx.drawImage(glow, q.x - R, q.y - R, R * 2, R * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function stepSparks(sparks: Spark[], dt: number, rise: number) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    s.vx *= 0.985;
    s.vy = s.vy * 0.985 - rise * dt;
    s.vz *= 0.985;
  }
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* ═════════════════════════ INTRO: the ouroboros ═════════════════════════ */
export const INTRO_EXIT_START = 3.7;
export const INTRO_DURATION = 4.6;

export function createIntroScene(canvas: HTMLCanvasElement) {
  SPR = null;
  const { st, resize } = makeStage(canvas);
  const sparks: Spark[] = [];
  let last = 0;

  function frame(T: number) {
    const dt = clamp(T - last, 0, 0.05);
    last = T;
    const { ctx, w, h } = st;
    ctx.clearRect(0, 0, w, h);

    const small = Math.min(w, h) < 520;
    const N = small ? 100 : 130;
    const R = Math.min(w, h) * (small ? 0.3 : 0.31);
    const arc = Math.PI * 2 * 0.93;
    const rBase = ((Math.PI * 2 * R * 0.93) / N) * 1.55;

    const tilt = lerp(1.05, 0.2, easeInOut(clamp((T - 0.5) / 2.1)));
    const yaw = Math.sin(T * 0.8) * 0.2;
    const ca = Math.cos(tilt), sa = Math.sin(tilt), cb = Math.cos(yaw), sb = Math.sin(yaw);
    const headAngle = -Math.PI / 2 + 0.9 * T + 1.6 * easeOut(clamp(T / 2.4));

    const beads: Bead[] = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const p = clamp((T - 0.1 - u * 1.0) / 1.35);
      const e = easeOut(p);
      const m = 1 + 3.2 * (1 - e) * (1 - e);
      const th = headAngle - u * arc + (1 - e) * Math.PI * 1.6;
      const Ri = R * (1 + 0.03 * Math.sin(th * 5 - T * 2)) * m;
      const writhe = Math.sin(th * 3 + T * 2.2) * R * 0.1 * (1 - 0.4 * e);
      let x = Ri * Math.cos(th);
      let y = Ri * Math.sin(th);
      let z = writhe - (1 - e) * (1 - e) * 500;
      // tilt about X, then yaw about Y
      const y1 = y * ca - z * sa;
      const z1 = y * sa + z * ca;
      const x2 = x * cb + z1 * sb;
      const z2 = -x * sb + z1 * cb;
      beads.push({ x: x2, y: y1, z: z2, r: rBase * thickness(u) });
    }

    // sparks trail from the head + random body glints
    if (T > 0.1 && T < INTRO_EXIT_START + 0.4) {
      const hd = beads[0];
      for (let k = 0; k < 3; k++) {
        sparks.push({ x: hd.x + rnd(-6, 6), y: hd.y + rnd(-6, 6), z: hd.z, vx: rnd(-30, 30), vy: rnd(-40, 10), vz: rnd(-20, 20), life: rnd(0.6, 1.4), max: 1.4, size: rnd(5, 11) });
      }
      const rb = beads[Math.floor(Math.random() * N)];
      sparks.push({ x: rb.x, y: rb.y, z: rb.z, vx: rnd(-14, 14), vy: rnd(-34, -8), vz: 0, life: rnd(0.8, 1.6), max: 1.6, size: rnd(4, 9) });
    }
    if (sparks.length > 320) sparks.splice(0, sparks.length - 320);
    stepSparks(sparks, dt, 18);

    const q = clamp((T - INTRO_EXIT_START) / (INTRO_DURATION - INTRO_EXIT_START));
    const zoom = 1 + easeIn(q) * 7;
    const proj: Proj = { cx: w / 2, cy: h / 2, zoom, weak: false };

    // soft halo behind the ring
    const halo = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, R * 1.5 * zoom);
    halo.addColorStop(0, css(themeRGB('--c-gold', [214, 173, 104]), 0.16 * easeOut(clamp(T / 1.5))));
    halo.addColorStop(1, css(themeRGB('--c-gold', [214, 173, 104]), 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    drawSerpent(ctx, beads, proj, T, -R * 0.5, R * 0.7);
    drawSparks(ctx, sparks, proj);
  }

  return { frame, resize };
}

/* ═════════════════════════ HERO: interactive serpent ═════════════════════════ */
export function createHeroScene(canvas: HTMLCanvasElement) {
  SPR = null;
  const { st, resize } = makeStage(canvas);
  const sparks: Spark[] = [];
  const dust: Spark[] = [];
  const trail: { x: number; y: number; z: number }[] = [];
  const head = { x: -140, y: 0, z: 0, vx: 0, vy: 0 };
  let started = false;
  let t = 0;
  const pointer = { x: 0, y: 0, active: false, last: -10 };

  function setPointer(x: number | null, y: number | null) {
    if (x === null || y === null) {
      pointer.active = false;
      return;
    }
    pointer.x = x - st.w / 2;
    pointer.y = y - st.h / 2;
    pointer.active = true;
    pointer.last = t;
  }

  function frame(dtRaw: number) {
    const dt = clamp(dtRaw, 0, 0.05);
    t += dt;
    const { ctx, w, h } = st;
    ctx.clearRect(0, 0, w, h);
    const small = w < 640;
    const N = small ? 70 : 96;
    const rBase = clamp(w * 0.0085, 6, 13);
    const spacing = rBase * 0.62;

    if (!started) {
      head.x = -w / 2 - 120;
      head.y = h * 0.25;
      started = true;
    }

    // target: orbit the cursor while it is active/recent, otherwise patrol the hero
    const chasing = pointer.active && t - pointer.last < 2.5;
    let tx: number, ty: number, tz: number;
    if (chasing) {
      const orbit = small ? 46 : 70;
      tx = pointer.x + Math.cos(t * 1.6) * orbit;
      ty = pointer.y + Math.sin(t * 1.6) * orbit * 0.75;
      tz = Math.sin(t * 1.6) * 160;
    } else {
      tx = Math.sin(t * 0.42) * w * 0.42 + Math.sin(t * 1.3) * w * 0.04;
      ty = Math.sin(t * 0.67 + 0.8) * h * 0.34 + Math.cos(t * 1.1) * h * 0.05;
      tz = Math.sin(t * 0.37 + 2) * 240;
    }
    const maxV = w * (chasing ? 0.7 : 0.4);
    head.vx += ((tx - head.x) * 6 - head.vx * 2.8) * dt;
    head.vy += ((ty - head.y) * 6 - head.vy * 2.8) * dt;
    const sp = Math.hypot(head.vx, head.vy);
    if (sp > maxV) {
      head.vx *= maxV / sp;
      head.vy *= maxV / sp;
    }
    head.x += head.vx * dt;
    head.y += head.vy * dt;
    head.z = lerp(head.z, tz, clamp(dt * 2));
    // slither: lateral wave perpendicular to travel
    const mag = Math.max(1, Math.hypot(head.vx, head.vy));
    const nx = -head.vy / mag, ny = head.vx / mag;
    const wave = Math.sin(t * 7) * rBase * 1.4 * clamp(mag / (w * 0.2));
    const px = head.x + nx * wave, py = head.y + ny * wave;

    const last = trail[trail.length - 1];
    if (!last || Math.hypot(px - last.x, py - last.y) > 1.5) {
      trail.push({ x: px, y: py, z: head.z });
      if (trail.length > 900) trail.shift();
    } else {
      last.z = head.z;
    }

    // place beads along the trail by arc length
    const beads: Bead[] = [];
    let need = 0;
    let acc = 0;
    let prev = trail[trail.length - 1];
    beads.push({ x: prev.x, y: prev.y, z: prev.z, r: rBase * thickness(0) });
    need = spacing;
    for (let k = trail.length - 2; k >= 0 && beads.length < N; k--) {
      const cur = trail[k];
      let seg = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      while (seg > 0 && acc + seg >= need && beads.length < N) {
        const f = (need - acc) / seg;
        const x = lerp(prev.x, cur.x, f), y = lerp(prev.y, cur.y, f), z = lerp(prev.z, cur.z, f);
        beads.push({ x, y, z, r: rBase * thickness(beads.length / (N - 1)) });
        // advance within the segment
        prev = { x, y, z };
        seg = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        acc = 0;
        need = spacing;
      }
      acc += seg;
      prev = cur;
    }
    // not enough trail yet (just started): stack the rest behind the head so nothing pops
    while (beads.length < N) {
      const b = beads[beads.length - 1];
      beads.push({ x: b.x - 1, y: b.y, z: b.z, r: rBase * thickness(beads.length / (N - 1)) });
    }

    // dust motes (ambient) + head sparks
    while (dust.length < (small ? 28 : 56)) {
      dust.push({ x: rnd(-w / 2, w / 2), y: rnd(-h / 2, h / 2), z: rnd(-300, 400), vx: rnd(-4, 4), vy: rnd(-14, -3), vz: 0, life: rnd(2, 6), max: 6, size: rnd(3, 8) });
    }
    stepSparks(dust, dt, 0);
    if (mag > 30) {
      sparks.push({ x: px, y: py, z: head.z, vx: rnd(-18, 18), vy: rnd(-24, 6), vz: 0, life: rnd(0.5, 1.1), max: 1.1, size: rnd(4, 9) });
    }
    if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
    stepSparks(sparks, dt, 12);

    const proj: Proj = { cx: w / 2, cy: h / 2, zoom: 1, weak: true };
    drawSparks(ctx, dust, proj, 0.7);
    drawSerpent(ctx, beads, proj, t, -240, 280, 0.96);
    drawSparks(ctx, sparks, proj);
  }

  return { frame, resize, setPointer };
}

'use strict';

window.Jelly = (() => {
  const TAU = Math.PI * 2;
  const W = 400, H = 514, WALL = 4, FLOOR_PAD = 6, WARNING_Y = 121;
  // 120Hz fixed physics step: 1:1 smooth on 120fps mobile screens; base feel 100% preserved
  const DT = 1 / 120;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const crew = JellyCast.map(([name, gear, color, light, r], i) => Object.freeze({ name, gear, color, light, r, value: 2 ** i }));
  const N = 24;
  let serial = 0;

  class Drop {
    constructor(level, x, y, vx = 0, vy = 0, shape = null, wild = false, frozen = 0) {
      this.id = ++serial;
      this.level = level;
      this.wild = !!wild;
      this.frozen = frozen || 0;
      this.beatBoost = false;
      this.r = wild ? 27 : crew[level].r;
      this.seed = this.id * 2.39996;
      this.baseInv = 1 / (1 + (wild ? 0.1 : level * .11));
      this.inv = this.frozen > 0 ? this.baseInv * 0.48 : this.baseInv;
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.age = 0; this.landed = false; this.strain = 0; this.hit = 0; this.joy = 0;
      this.kickAt = -10; this.floorAt = -10; this.sideAt = -10;
      this.xx = 0; this.xy = 0; this.speedXX = 0; this.speedXY = 0;
      this.p = [];
      for (let i = 0; i < N; i++) {
        const a = i * TAU / N;
        const vx0 = Math.cos(a), vy0 = Math.sin(a);
        const variation = 1 + .055 * Math.cos(3 * a + this.seed) + .02 * Math.sin(2 * a + this.seed);
        const ox = this.r * 1.10 * Math.sign(vx0) * Math.abs(vx0) ** .91 * variation;
        const oy = this.r * .90 * Math.sign(vy0) * Math.abs(vy0) ** .89 * variation;
        let sx = ox, sy = oy;
        if (shape) {
          const parallel = ox * shape.dx + oy * shape.dy;
          const normal = -ox * shape.dy + oy * shape.dx;
          sx = shape.dx * parallel * shape.scale - shape.dy * normal / shape.scale;
          sy = shape.dy * parallel * shape.scale + shape.dx * normal / shape.scale;
        }
        const restLen = Math.hypot(ox, oy) || this.r;
        this.p.push({ x: x + sx, y: y + sy, px: x + sx - vx * DT, py: y + sy - vy * DT, ox, oy, restLen, gx: 0, gy: 0, fx: x + sx, fy: y + sy });
      }
      this.restArea = 0;
      this.links = [];
      for (let i = 0; i < N; i++) {
        const p = this.p[i], next = this.p[(i + 1) % N];
        this.restArea += (p.ox * next.oy - next.ox * p.oy) * 0.5;
        for (const skip of [1, 3]) {
          const q = this.p[(i + skip) % N];
          const dx = q.ox - p.ox, dy = q.oy - p.oy, length = Math.hypot(dx, dy);
          this.links.push({ p, q, dx, dy, goal: length, stiffness: skip === 1 ? .52 : .11 });
        }
        if (i < N / 2) {
          const q = this.p[i + N / 2];
          const dx = q.ox - p.ox, dy = q.oy - p.oy, length = Math.hypot(dx, dy);
          this.links.push({ p, q, dx, dy, goal: length, stiffness: .16 });
        }
      }
      this.bounds();
    }
    setFrozen(layers) {
      this.frozen = Math.max(0, layers);
      this.inv = this.frozen > 0 ? this.baseInv * 0.48 : this.baseInv;
    }
    bounds() {
      let sx = 0, sy = 0, left = 1e9, right = -1e9, top = 1e9, bottom = -1e9;
      const pts = this.p;
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        sx += p.x; sy += p.y;
        if (p.x < left) left = p.x;
        if (p.x > right) right = p.x;
        if (p.y < top) top = p.y;
        if (p.y > bottom) bottom = p.y;
      }
      this.x = sx / N; this.y = sy / N;
      this.left = left; this.right = right; this.top = top; this.bottom = bottom;
    }
    pulse(nx, ny, amount) {
      const intensity = clamp(amount, 0, 7.8);
      this.speedXX = clamp(this.speedXX - (nx * nx - ny * ny) * intensity, -9.5, 9.5);
      this.speedXY = clamp(this.speedXY - 2 * nx * ny * intensity, -9.5, 9.5);
    }
    integrate(gx = 0, gy = 655) {
      this.lastX = this.x; this.lastY = this.y; this.age += DT;
      if (this.hit > 0) this.hit = Math.max(0, this.hit - DT);
      if (this.joy > 0) this.joy = Math.max(0, this.joy - DT);
      this.speedXX += (-260 * this.xx - 7.4 * this.speedXX) * DT;
      this.speedXY += (-260 * this.xy - 7.4 * this.speedXY) * DT;
      this.xx = clamp(this.xx + this.speedXX * DT, -.36, .36);
      this.xy = clamp(this.xy + this.speedXY * DT, -.36, .36);
      const volume = 1 / Math.sqrt(1 - this.xx * this.xx - this.xy * this.xy);
      const ax = this.ax = (1 + this.xx) * volume;
      const ay = this.ay = (1 - this.xx) * volume;
      const sh = this.shear = this.xy * volume;
      const links = this.links;
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const lx = link.dx * ax + link.dy * sh;
        const ly = link.dx * sh + link.dy * ay;
        link.goal = Math.sqrt(lx * lx + ly * ly);
      }
      const pts = this.p;
      const drag = this.frozen > 0 ? .972 : .993;
      const gdx = gx * DT * DT, gdy = gy * DT * DT;
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const vx = clamp((p.x - p.px) * drag, -8.8, 8.8);
        const vy = clamp((p.y - p.py) * drag, -8.8, 8.8);
        p.fx = p.x; p.fy = p.y;
        p.px = p.x; p.py = p.y;
        p.x += vx + gdx;
        p.y += vy + gdy;
      }
    }
    elastic() {
      const links = this.links;
      for (let i = 0; i < links.length; i++) {
        const link = links[i], p = link.p, q = link.q;
        const dx = q.x - p.x, dy = q.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) || .001;
        const k = (d - link.goal) / d * .5 * link.stiffness;
        p.x += dx * k; p.y += dy * k; q.x -= dx * k; q.y -= dy * k;
      }
      let area = 0, denom = 0, sx = 0, sy = 0;
      const pts = this.p;
      for (let i = 0; i < N; i++) {
        const p = pts[i], a = pts[(i + N - 1) % N], b = pts[(i + 1) % N];
        p.gx = (b.y - a.y) * .5; p.gy = (a.x - b.x) * .5;
        denom += p.gx * p.gx + p.gy * p.gy;
        area += (p.x * b.y - b.x * p.y) * .5;
        sx += p.x; sy += p.y;
      }
      const pressure = clamp((this.restArea - area) / Math.max(1, denom), -.6, .6) * .43;
      const cx = sx / N, cy = sy / N;
      const ax = this.ax, ay = this.ay, sh = this.shear;
      const shapeK = area < this.restArea * 0.50 ? .18 : .022;
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        p.x += p.gx * pressure + (cx + p.ox * ax + p.oy * sh - p.x) * shapeK;
        p.y += p.gy * pressure + (cy + p.ox * sh + p.oy * ay - p.y) * shapeK;
      }
    }
    stabilize() {
      // Prevent soft-body vertex folding, self-inversion, or snagged spikes under heavy squeeze
      const pts = this.p;
      let sx = 0, sy = 0;
      for (let i = 0; i < N; i++) { sx += pts[i].x; sy += pts[i].y; }
      const cx = sx / N, cy = sy / N;
      const ax = this.ax || 1, ay = this.ay || 1, sh = this.shear || 0;
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const tx = p.ox * ax + p.oy * sh;
        const ty = p.ox * sh + p.oy * ay;
        const tLen = Math.hypot(tx, ty) || p.restLen;
        const ux = tx / tLen, uy = ty / tLen;
        const dx = p.x - cx, dy = p.y - cy;
        const proj = dx * ux + dy * uy;
        const perp = -dx * uy + dy * ux;
        const minR = tLen * 0.50, maxR = tLen * 1.32, maxPerp = tLen * 0.06;
        const cProj = clamp(proj, minR, maxR);
        const cPerp = clamp(perp, -maxPerp, maxPerp);
        if (cProj !== proj || cPerp !== perp) {
          const nx = cx + ux * cProj - uy * cPerp;
          const ny = cy + uy * cProj + ux * cPerp;
          p.px = nx - (nx - p.px) * 0.35;
          p.py = ny - (ny - p.py) * 0.35;
          p.x = nx;
          p.y = ny;
        }
      }
    }
    walls(height, bounceScale = 1, pressY = 0, world = null) {
      // Exact preserved floor/wall restitution feel + smooth time-morphing terrain boundaries
      const floorRest = clamp(.34 * bounceScale, .20, .72);
      const wallRest = clamp(.56 * bounceScale, .38, .82);
      const floor = height - FLOOR_PAD - (world?.floorRise || 0);
      const useMorph = world && world.terrainMorph > 0.005;
      const pts = this.p;
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        if (p.y > floor) {
          const v = p.y - p.py; p.y = floor;
          if (v > 0) { p.py = floor + v * floorRest; p.px += (p.x - p.px) * .095; }
          this.landed = true;
        } else if (p.y < WALL) {
          const v = p.y - p.py; p.y = WALL;
          if (v < 0) p.py = WALL + v * .28;
        } else if (pressY > WALL && this.landed && p.y < pressY) {
          const v = p.y - p.py; p.y = pressY;
          p.py = v < 0 ? pressY + v * .28 : pressY - v;
        }
        const inset = (useMorph && p.y >= WARNING_Y) ? world.wallInset(p.y) : 0;
        const leftB = WALL + inset, rightB = W - WALL - inset;
        if (p.x < leftB || p.x > rightB) {
          const side = p.x < leftB ? leftB : rightB, speed = p.x - p.px;
          p.x = side;
          if ((side === leftB && speed < 0) || (side === rightB && speed > 0)) p.px = side + speed * wallRest;
          if (inset > 4) this.landed = true;
        }
      }
    }
    translate(dx, dy) {
      if (!dx && !dy) return;
      const pts = this.p;
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        p.fx += dx; p.fy += dy;
        p.x += dx; p.px += dx; p.y += dy; p.py += dy;
      }
      this.bounds();
    }
    kick(vx, vy) {
      const scale = this.frozen > 0 ? 0.45 : 1;
      const dx = vx * DT * scale, dy = vy * DT * scale, pts = this.p;
      for (let i = 0; i < N; i++) { pts[i].px -= dx; pts[i].py -= dy; }
    }
  }

  function overlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function separateCores(a, b) {
    // Hard inner-core separation so two jellies can never pass through or interlock with each other
    const dx = a.x - b.x, dy = a.y - b.y;
    const d = Math.hypot(dx, dy);
    const minCore = (a.r + b.r) * 0.72;
    if (d >= minCore) return false;
    const nx = d > 0.001 ? dx / d : 0;
    const ny = d > 0.001 ? dy / d : -1;
    const push = (minCore - d) * 0.52;
    const denom = a.inv + b.inv || 1;
    const pa = push * (a.inv / denom), pb = push * (b.inv / denom);
    const ptsA = a.p, ptsB = b.p;
    for (let i = 0; i < N; i++) {
      ptsA[i].x += nx * pa; ptsA[i].y += ny * pa;
      ptsB[i].x -= nx * pb; ptsB[i].y -= ny * pb;
    }
    a.x += nx * pa; a.y += ny * pa;
    b.x -= nx * pb; b.y -= ny * pb;
    return true;
  }

  function separate(a, b) {
    let hit = false;
    const poly = b.p, ptsA = a.p;
    const bLeft = b.left, bRight = b.right, bTop = b.top, bBottom = b.bottom;
    const sepX = a.x - b.x, sepY = a.y - b.y;
    for (let pi = 0; pi < N; pi++) {
      const p = ptsA[pi];
      if (p.x <= bLeft || p.x >= bRight || p.y <= bTop || p.y >= bBottom) continue;
      let inside = false;
      for (let j = 0, k = N - 1; j < N; k = j++) {
        const q = poly[j], s = poly[k];
        if ((q.y > p.y) !== (s.y > p.y) && p.x < (s.x - q.x) * (p.y - q.y) / (s.y - q.y) + q.x) inside = !inside;
      }
      if (!inside) continue;
      let best = 1e12, u = null, v = null, bestT = 0, nx = 0, ny = 0;
      for (let j = 0; j < N; j++) {
        const q = poly[j], s = poly[(j + 1) % N], dx = s.x - q.x, dy = s.y - q.y;
        const t = clamp(((p.x - q.x) * dx + (p.y - q.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        const ex = q.x + t * dx - p.x, ey = q.y + t * dy - p.y, d = ex * ex + ey * ey;
        if (d < best) { best = d; u = q; v = s; bestT = t; nx = ex; ny = ey; }
      }
      // If vertex penetrated past b's midline, nearest edge is on the WRONG side of b — retract toward a's center instead of tangling through b!
      if (nx * sepX + ny * sepY < -0.5) {
        p.x += (a.x - p.x) * 0.45;
        p.y += (a.y - p.y) * 0.45;
        hit = true;
        continue;
      }
      const w = 1 - bestT, denom = a.inv + b.inv * (w * w + bestT * bestT);
      const dist = Math.sqrt(best);
      const k = Math.min(1.18, 1 + .14 / Math.max(.01, dist)) * .90 / denom;
      const step = dist * k;
      const cap = Math.min(1, (a.r * 0.45) / Math.max(0.001, step * a.inv));
      const kk = k * cap;
      p.x += nx * kk * a.inv; p.y += ny * kk * a.inv;
      u.x -= nx * kk * b.inv * w; u.y -= ny * kk * b.inv * w;
      v.x -= nx * kk * b.inv * bestT; v.y -= ny * kk * b.inv * bestT;
      hit = true;
    }
    return hit;
  }

  function pushOutOfCircle(body, cx, cy, cr, bounceSpeed = 0) {
    let touched = false;
    const pts = body.p;
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const dx = p.x - cx, dy = p.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < cr * cr) {
        const d = Math.sqrt(d2) || 0.01;
        const nx = dx / d, ny = dy / d;
        p.x = cx + nx * cr;
        p.y = cy + ny * cr;
        touched = true;
      }
    }
    if (touched) {
      body.bounds();
      if (bounceSpeed > 0) {
        const dx = body.x - cx, dy = body.y - cy, d = Math.hypot(dx, dy) || 1;
        body.kick((dx / d) * bounceSpeed, (dy / d) * bounceSpeed - 45);
        body.pulse(dx / d, dy / d, 5.2);
        body.hit = 0.52;
      }
    }
    return touched;
  }

  class World {
    constructor(emit = () => {}) {
      this.bodies = [];
      this.bumpers = [];
      this.boss = null;
      this.pressY = 0;
      this.floorRise = 0;
      this.terrainShape = 'none';
      this.terrainMorph = 0;
      this.height = H;
      this.emit = emit;
      this.time = 0;
      this.allowMerge = true;
      this.gx = 0;
      this.gy = 655;
      this.bounceScale = 1;
      this.magnet = false;
      this._contacts = new Map();
      this._used = new Set();
    }
    add(...args) { const b = new Drop(...args); this.bodies.push(b); return b; }
    setEnvironment(gx = 0, gy = 655, bounceScale = 1) {
      this.gx = gx; this.gy = gy; this.bounceScale = bounceScale;
    }
    setTerrain(shape = 'none', morph = 0) {
      this.terrainShape = shape || 'none';
      this.terrainMorph = clamp(morph, 0, 1.2);
    }
    wallInset(y) {
      const m = this.terrainMorph;
      if (m <= 0.005 || this.terrainShape === 'none' || y <= WARNING_Y) return 0;
      const floor = this.height - FLOOR_PAD;
      const t = clamp((y - WARNING_Y) / Math.max(1, floor - WARNING_Y), 0, 1);
      const s = this.terrainShape;
      let inset = 0;
      if (s === 'heart') {
        inset = t > 0.36 ? Math.pow((t - 0.36) / 0.64, 1.32) * 124 * m : Math.pow(1 - t / 0.36, 2) * 36 * m;
      } else if (s === 'hourglass') {
        const d = (t - 0.52) / 0.24;
        inset = Math.exp(-d * d) * 106 * m;
      } else if (s === 'diamond') {
        inset = Math.abs(t - 0.46) * 148 * m;
      } else if (s === 'bowl') {
        inset = t > 0.40 ? Math.pow((t - 0.40) / 0.60, 1.85) * 120 * m : 0;
      } else if (s === 'funnel') {
        inset = t * 112 * m;
      }
      return Math.min(134, inset);
    }
    setGimmicks(setup = null) {
      this.bumpers = [];
      this.boss = null;
      this.pressY = 0;
      this.floorRise = 0;
      this.terrainShape = 'none';
      this.terrainMorph = 0;
      if (!setup) return;
      if (Array.isArray(setup.bumpers)) {
        this.bumpers = setup.bumpers.map(([x, y, r]) => ({ x, y, r, hit: 0, lastHit: -10 }));
      }
      if (setup.boss) {
        const b = setup.boss;
        this.boss = {
          x: b.x, y: Math.min(this.height - FLOOR_PAD - b.r - 4, b.y),
          r: b.r, hp: b.hp, maxHp: b.hp, name: b.name || '音箱 Boss', hit: 0, lastHit: -10
        };
      }
      if (setup.pressSpeed > 0) {
        this.pressY = WARNING_Y + 2;
      }
    }
    seed(preset = 'standard', setup = null) {
      this.bodies = []; this.time = 0; this.allowMerge = false; serial = 0;
      this.gx = 0; this.gy = 655; this.bounceScale = 1; this.magnet = false;
      this.setGimmicks(setup);

      if (setup?.iceSpots?.length) {
        for (const [level, x, aboveFloor] of setup.iceSpots) {
          this.add(level, x, this.height - aboveFloor, 0, 0, null, false, 2);
        }
        this.add(0, 62, this.height - 96);
        this.add(1, 338, this.height - 96);
      } else if (setup?.boss) {
        const rows = [[0, 65, 34], [1, 118, 34], [1, 282, 34], [0, 335, 34], [2, 86, 86], [2, 314, 86]];
        for (const [level, x, aboveFloor] of rows) this.add(level, x, this.height - aboveFloor);
      } else {
        const rows = preset === 'light'
          ? [[2, 72, 34], [3, 168, 36], [1, 256, 32], [4, 340, 38], [0, 122, 86], [2, 294, 88]]
          : [[5, 41, 38], [6, 125, 38], [4, 205, 35], [7, 289, 40], [1, 368, 29],
             [2, 70, 91], [0, 199, 86], [3, 328, 96]];
        for (const [level, x, aboveFloor] of rows) this.add(level, x, this.height - aboveFloor);
      }
      for (let i = 0; i < 140; i++) this.step(false);
      for (const b of this.bodies) { b.landed = true; b.hit = 0; b.joy = 0; }
      this.allowMerge = true;
    }
    bodyAt(p) {
      for (let idx = this.bodies.length - 1; idx >= 0; idx--) {
        const b = this.bodies[idx];
        if (p.x < b.left - 4 || p.x > b.right + 4 || p.y < b.top - 4 || p.y > b.bottom + 4) continue;
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.15) return b;
      }
      return null;
    }
    removeBody(b) { this.bodies = this.bodies.filter(c => c !== b); }
    crackIce(body, amount = 1) {
      if (!body || body.frozen <= 0) return false;
      const before = body.frozen;
      body.setFrozen(body.frozen - amount);
      body.hit = 0.5;
      body.pulse(0, 1, 4.5);
      if (before > 0 && body.frozen === 0) {
        this.emit({ type: 'ice_break', body, x: body.x, y: body.y });
        return true;
      }
      this.emit({ type: 'ice_crack', body, x: body.x, y: body.y, left: body.frozen });
      return false;
    }
    damageBoss(dmg, x, y) {
      if (!this.boss || this.boss.hp <= 0) return;
      this.boss.hp = Math.max(0, this.boss.hp - dmg);
      this.boss.hit = 0.45;
      this.emit({ type: 'boss_hit', dmg, hp: this.boss.hp, maxHp: this.boss.maxHp, x: x ?? this.boss.x, y: y ?? this.boss.y });
      if (this.boss.hp <= 0) {
        this.emit({ type: 'boss_defeat', x: this.boss.x, y: this.boss.y });
      }
    }
    clearTop(count = 4) {
      const sorted = [...this.bodies].sort((a, b) => a.top - b.top);
      const victims = sorted.slice(0, Math.min(count, Math.max(0, sorted.length - 2)));
      const set = new Set(victims);
      this.bodies = this.bodies.filter(b => !set.has(b));
      return victims;
    }
    shakeAll() {
      for (const b of this.bodies) {
        if (b.frozen > 0) this.crackIce(b, 1);
        const angle = (Math.random() - .5) * 1.1;
        const up = 180 + Math.random() * 170;
        b.kick(Math.sin(angle) * 210, -up);
        b.pulse(Math.cos(angle), Math.sin(angle), 5.2);
        b.hit = .5;
      }
    }
    impact(a, b, closing, nx, ny) {
      if (closing < 72 || this.time - Math.max(a.kickAt, b.kickAt) < .125) return;
      a.kickAt = b.kickAt = this.time;
      a.hit = b.hit = clamp(closing / 640, .28, .85);
      const strength = clamp(closing * .010, 1.2, 7.2);
      a.pulse(nx, ny, strength); b.pulse(nx, ny, strength);

      if (closing > 215) {
        if (a.frozen > 0) this.crackIce(a, 1);
        if (b.frozen > 0) this.crackIce(b, 1);
      }

      const rebound = Math.min(135, closing * .165) * this.bounceScale;
      const share = a.inv / (a.inv + b.inv);
      a.kick(-nx * rebound * share, -ny * rebound * share);
      b.kick(nx * rebound * (1 - share), ny * rebound * (1 - share));
      const x = (a.x + b.x) * .5, y = (a.y + b.y) * .5;
      const bodies = this.bodies;
      for (let i = 0; i < bodies.length; i++) {
        const c = bodies[i];
        if (c === a || c === b) continue;
        const dx = c.x - x, dy = c.y - y, dist = Math.hypot(dx, dy), reach = 64 + c.r * 1.55;
        if (dist < 1 || dist >= reach) continue;
        const amount = 1 - dist / reach, impulse = amount * Math.min(140, closing * .25);
        c.kick(dx / dist * impulse, dy / dist * impulse * .72);
        c.pulse(dx / dist, dy / dist, strength * amount * .55);
        c.hit = Math.max(c.hit, amount * .48);
      }
      this.emit({ type: 'hit', x, y, speed: closing, level: Math.max(a.level, b.level) });
    }
    resize(height) {
      const old = this.height;
      if (Math.abs(old - height) < .01) return;
      for (const b of this.bodies) {
        const delta = b.landed ? height - old : (height - old) * clamp((b.y - WARNING_Y) / Math.max(1, old - WARNING_Y), 0, 1);
        b.translate(0, delta);
      }
      if (this.boss) this.boss.y += (height - old);
      this.height = height;
    }
    merge(a, b) {
      const baseLevel = a.wild ? b.level : b.wild ? a.level : a.level;
      const targetLevel = Math.min(crew.length - 1, baseLevel + 1);
      const x = (a.x + b.x) * .5, y = (a.y + b.y) * .5;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const beatBoost = !!(a.beatBoost || b.beatBoost);
      const next = this.add(targetLevel, x, y, (a.vx + b.vx) * .35, (a.vy + b.vy) * .30,
        { dx: dx / d, dy: dy / d, scale: 1.38 });
      const topLimit = Math.max(WALL, this.pressY);
      const inset = this.wallInset(next.y);
      const moveX = Math.max(0, (WALL + inset) - next.left) - Math.max(0, next.right - (W - WALL - inset));
      const moveY = Math.max(0, topLimit - next.top) - Math.max(0, next.bottom - (this.height - FLOOR_PAD - this.floorRise));
      next.translate(moveX, moveY);
      next.landed = a.landed || b.landed;
      next.joy = 1.05;
      next.pulse(dx / d, dy / d, 4.0);
      this.bodies = this.bodies.filter(c => c !== a && c !== b);

      const blastReach = next.r * 2.5 + (beatBoost ? 46 : 24);
      for (let i = 0; i < this.bodies.length; i++) {
        const c = this.bodies[i];
        if (c === next) continue;
        const dist = Math.hypot(c.x - next.x, c.y - next.y);
        if (c.frozen > 0 && dist < blastReach + c.r) {
          this.crackIce(c, beatBoost ? 2 : 1);
        } else if (beatBoost && dist < blastReach + c.r && dist > 1) {
          const push = (1 - dist / (blastReach + c.r)) * 130;
          c.kick((c.x - next.x) / dist * push, (c.y - next.y) / dist * push - 20);
        }
      }
      if (this.boss && this.boss.hp > 0) {
        const bd = Math.hypot(this.boss.x - next.x, this.boss.y - next.y);
        if (bd < this.boss.r + next.r + 125) {
          const dmg = Math.round((14 + targetLevel * 4.5) * (beatBoost ? 1.5 : 1));
          this.damageBoss(dmg, next.x, next.y);
        }
      }

      this.emit({ type: 'merge', a, b, body: next, x: next.x, y: next.y, wild: a.wild || b.wild, beatBoost });
    }
    step(events = true) {
      this.time += DT;
      const contacts = this._contacts; contacts.clear();
      const bodies = this.bodies, len = bodies.length;
      for (let i = 0; i < len; i++) bodies[i].integrate(this.gx, this.gy);

      for (let i = 0; i < this.bumpers.length; i++) {
        if (this.bumpers[i].hit > 0) this.bumpers[i].hit = Math.max(0, this.bumpers[i].hit - DT * 3.5);
      }
      if (this.boss && this.boss.hit > 0) this.boss.hit = Math.max(0, this.boss.hit - DT * 3.2);

      if (this.magnet && len > 1) {
        for (let i = 0; i < len; i++) {
          const a = bodies[i]; if (a.wild || a.frozen > 0) continue;
          for (let j = i + 1; j < len; j++) {
            const b = bodies[j]; if (a.level !== b.level || b.wild || b.frozen > 0) continue;
            const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
            const maxDist = (a.r + b.r) * 1.9;
            if (dist > 4 && dist < maxDist) {
              const pull = (1 - dist / maxDist) * 18;
              a.kick(dx / dist * pull, dy / dist * pull);
              b.kick(-dx / dist * pull, -dy / dist * pull);
            }
          }
        }
      }

      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < len; i++) {
          const b = bodies[i];
          b.elastic();
          b.walls(this.height, this.bounceScale, this.pressY, this);
          for (let k = 0; k < this.bumpers.length; k++) {
            const bm = this.bumpers[k];
            if (Math.hypot(b.x - bm.x, b.y - bm.y) < b.r + bm.r + 12) {
              const hit = pushOutOfCircle(b, bm.x, bm.y, bm.r, pass === 0 ? 275 : 0);
              if (hit && events && this.time - bm.lastHit > 0.16) {
                bm.hit = 1; bm.lastHit = this.time;
                this.emit({ type: 'bumper', x: bm.x, y: bm.y, r: bm.r, body: b });
              }
            }
          }
          if (this.boss && this.boss.hp > 0) {
            const bs = this.boss;
            if (Math.hypot(b.x - bs.x, b.y - bs.y) < b.r + bs.r + 12) {
              const spd = Math.hypot(b.vx, b.vy);
              const hit = pushOutOfCircle(b, bs.x, bs.y, bs.r, pass === 0 ? 155 : 0);
              if (hit) b.landed = true;
              if (hit && events && spd > 185 && this.time - bs.lastHit > 0.25) {
                bs.lastHit = this.time;
                this.damageBoss(Math.max(4, Math.round(spd * 0.018)), b.x, b.y);
              }
            }
          }
          b.bounds();
        }
        for (let i = 0; i < len; i++) {
          const a = bodies[i];
          for (let j = i + 1; j < len; j++) {
            const b = bodies[j];
            if (!overlap(a, b)) continue;
            const hitCore = separateCores(a, b);
            const hitA = separate(a, b), hitB = separate(b, a);
            if (hitCore || hitA || hitB) {
              const key = i * len + j;
              if (!contacts.has(key)) {
                const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
                contacts.set(key, [a, b, (a.vx - b.vx) * nx + (a.vy - b.vy) * ny, nx, ny]);
              }
              if (a.landed || b.landed) a.landed = b.landed = true;
            }
          }
        }
      }

      for (let i = 0; i < len; i++) {
        const b = bodies[i];
        b.walls(this.height, this.bounceScale, this.pressY, this);
        b.stabilize();
        b.bounds();
        if (events && b.vy > 130 && b.bottom >= this.height - FLOOR_PAD - this.floorRise - 1 && this.time - b.floorAt > .22) {
          b.floorAt = this.time; b.hit = .50; b.pulse(0, 1, clamp(b.vy * .012, 2.0, 7.2));
          b.kick(0, -Math.min(95, b.vy * .14) * this.bounceScale);
          this.emit({ type: 'floor', x: b.x, y: b.bottom, speed: b.vy, level: b.level });
        }
        if (events && Math.abs(b.vx) > 165 && (b.left < WALL + 1 || b.right > W - WALL - 1) && this.time - b.sideAt > .20) {
          b.sideAt = this.time; b.pulse(1, 0, Math.min(6.4, Math.abs(b.vx) * .012)); b.hit = Math.max(b.hit, .38);
        }
        b.vx = (b.x - b.lastX) / DT; b.vy = (b.y - b.lastY) / DT;
        const squash = Math.max(0, 1 - (b.bottom - b.top) / (b.r * 1.8));
        b.strain += (squash - b.strain) * .1;
      }

      const used = this._used; used.clear();
      for (const entry of contacts.values()) {
        const a = entry[0], b = entry[1];
        if (used.has(a) || used.has(b)) continue;
        const canWild = (a.wild && !b.wild && b.level < crew.length - 1) || (b.wild && !a.wild && a.level < crew.length - 1);
        const canSame = !a.wild && !b.wild && a.frozen <= 0 && b.frozen <= 0 && a.level === b.level && a.level < crew.length - 1;
        if ((canSame || canWild) && this.allowMerge) {
          if (a.frozen > 0) this.crackIce(a, 2);
          if (b.frozen > 0) this.crackIce(b, 2);
          used.add(a); used.add(b); this.merge(a, b);
        } else if (events) {
          this.impact(a, b, entry[2], entry[3], entry[4]);
        }
      }
    }
  }
  return { TAU, W, H, FLOOR_PAD, WARNING_Y, DT, clamp, crew, Drop, World };
})();

'use strict';

(() => {
  const { crew, TAU, clamp } = Jelly;

  const themes = {
    cartoon:   { name: '经典卡通', stage: '薄荷排练室', shade: '#76b59a', paper: '#e6efe4', base: 'cartoon', shaderMode: 0, dark: false },
    toy3d:     { name: '潮玩3D',   stage: '潮玩展示柜', shade: '#3d7c8f', paper: '#d4ebf2', base: 'cartoon', shaderMode: 8, dark: true  },
    metal:     { name: '柔光金属', stage: '节奏录音棚', shade: '#7b9aa8', paper: '#dbe4e8', base: 'metal',   shaderMode: 1, dark: true  },
    glass:     { name: '海盐玻璃', stage: '潮汐回声室', shade: '#48a8b8', paper: '#d2eff2', base: 'cartoon', shaderMode: 2, dark: true  },
    neon:      { name: '霓虹电音', stage: '霓虹电音夜', shade: '#361f66', paper: '#e6d8ff', base: 'cartoon', shaderMode: 3, dark: true  },
    plush:     { name: '短绒玩偶', stage: '绒布小剧场', shade: '#a87686', paper: '#efe0dc', base: 'plush',   shaderMode: 0, dark: true  },
    pixel:     { name: '像素街机', stage: '午夜像素厅', shade: '#6f72b0', paper: '#dcdced', base: 'pixel',   shaderMode: 0, dark: true  },
    gummy:     { name: '果汁软糖', stage: '蜜橘糖果屋', shade: '#d48d55', paper: '#f5e2c4', base: 'cartoon', shaderMode: 4, dark: true  },
    porcelain: { name: '青花釉瓷', stage: '东方雅韵阁', shade: '#6789ad', paper: '#dce6f2', base: 'cartoon', shaderMode: 5, dark: true  },
    sakura:    { name: '落樱和果', stage: '樱吹雪庭院', shade: '#b57292', paper: '#f5dfe9', base: 'cartoon', shaderMode: 6, dark: true  },
    holo:      { name: '极光贝母', stage: '冰川极光台', shade: '#4e6294', paper: '#dce8f8', base: 'metal',   shaderMode: 7, dark: true  }
  };

  let active = 'cartoon';
  let activeStage = 'cartoon';

  const rawSheets = new Map();
  const bakedSheets = new Map();

  function loadRaw(baseKey) {
    if (!rawSheets.has(baseKey)) {
      const img = new Image();
      rawSheets.set(baseKey, img);
      img.onload = () => {
        bakedSheets.clear();
        window.dispatchEvent(new Event('crewready'));
      };
      img.src = `assets/crew-${baseKey}.webp?v=13`;
    }
    return rawSheets.get(baseKey);
  }

  const charTint = {
    4:  'rgba(255, 248, 120, 0.22)',
    10: 'rgba(255, 160, 20,  0.24)',
    14: 'rgba(255, 102, 42,  0.26)',
    8:  'rgba(175, 232, 255, 0.24)',
    16: 'rgba(72,  214, 198, 0.26)',
    18: 'rgba(130, 118, 188, 0.28)',
    9:  'rgba(48,  232, 165, 0.20)',
    15: 'rgba(92,  196, 56,  0.20)'
  };

  function applyCharDistinction(ctx, w, h) {
    const cw = w / 5, ch = h / 4;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    for (const [idxStr, col] of Object.entries(charTint)) {
      const i = Number(idxStr);
      ctx.fillStyle = col;
      ctx.fillRect((i % 5) * cw, Math.floor(i / 5) * ch, cw, ch);
    }
    ctx.restore();
  }

  // Smoothly trim ONLY baked cheek whiskers/side tufts on cells 4, 7, 12, 17
  // Clipped strictly to the lower cheek band first so the top of every head/ear/hat is 100% untouched!
  function trimIvoryWhiskers(ctx, w, h) {
    const cw = w / 5, ch = h / 4;
    const rx = cw * (1.0 / 3.4) * 1.02;
    const ry = ch * (0.84 / 3.4) * 1.02;
    const targets = [
      [4,  0.04], // aerial (金铃天线): cheek triangles only
      [7,  0.10], // horn   (紫电小角): cheek fins only, keep top horns
      [12, 0.03], // ivory  (雪白音符): cat whiskers only, keep top ears
      [17, 0.08]  // ranger (沙丘帽客): cheek sideburns only, keep hat
    ];
    for (const [idx, cutRatio] of targets) {
      const ox = (idx % 5) * cw, oy = Math.floor(idx / 5) * ch;
      const cx = ox + cw * 0.5, cy = oy + ch * 0.5;
      const yTop = cy - ch * cutRatio;
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, yTop, cw, oy + ch - yTop);
      ctx.clip();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.rect(ox, oy, cw, ch);
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      ctx.fill('evenodd');
      ctx.restore();
    }
  }

  function bakeProceduralAtlas(key, baseImg) {
    if (bakedSheets.has(key)) return bakedSheets.get(key);
    // Preserve full native HD resolution (1800x1440) so large characters & Home mascots stay razor-sharp!
    const w = baseImg.naturalWidth || 1800, h = baseImg.naturalHeight || 1440;
    const cw = w / 5, ch = h / 4, pxScale = w / 750;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.imageSmoothingEnabled = key !== 'pixel';
    if (key !== 'pixel') ctx.imageSmoothingQuality = 'high';

    if (key === 'cartoon') {
      // Preserved unchanged per user preference
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      applyCharDistinction(ctx, w, h);
    } else if (key === 'toy3d') {
      // Sculptural 3D designer vinyl toy: velvety matte-satin studio shading & soft volume AO
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      applyCharDistinction(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx - rad * 0.26, cy - rad * 0.32, rad * 0.04, cx + rad * 0.08, cy + rad * 0.14, rad * 1.08);
        g.addColorStop(0, 'rgba(255, 252, 246, 0.34)');
        g.addColorStop(0.36, 'rgba(255, 250, 244, 0.08)');
        g.addColorStop(0.74, 'rgba(34, 24, 52, 0.14)');
        g.addColorStop(1, 'rgba(22, 16, 40, 0.34)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
        const rim = ctx.createRadialGradient(cx, cy, rad * 0.58, cx, cy, rad * 1.02);
        rim.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rim.addColorStop(0.84, 'rgba(218, 244, 255, 0.16)');
        rim.addColorStop(1, 'rgba(235, 250, 255, 0.36)');
        ctx.fillStyle = rim; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'glass') {
      // Crystal sea-salt glass: clean volumetric translucency & smooth aqua rim (no 2D sticker arcs)
      ctx.save(); ctx.globalAlpha = 0.78; ctx.drawImage(baseImg, 0, 0, w, h); ctx.restore();
      trimIvoryWhiskers(ctx, w, h);
      applyCharDistinction(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx - rad * 0.18, cy - rad * 0.22, rad * 0.08, cx, cy, rad * 1.04);
        g.addColorStop(0, 'rgba(240, 255, 255, 0.22)');
        g.addColorStop(0.55, 'rgba(72, 212, 232, 0.18)');
        g.addColorStop(0.86, 'rgba(176, 246, 255, 0.52)');
        g.addColorStop(1, 'rgba(245, 255, 255, 0.80)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
        const cg = ctx.createRadialGradient(cx, cy + rad * 0.42, rad * 0.04, cx, cy + rad * 0.42, rad * 0.48);
        cg.addColorStop(0, 'rgba(182, 255, 252, 0.46)');
        cg.addColorStop(1, 'rgba(182, 255, 252, 0)');
        ctx.fillStyle = cg; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'neon') {
      // High-contrast cyberpunk neon: sleek glossy obsidian core + smooth character-colored rim
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx - rad * 0.18, cy - rad * 0.22, rad * 0.08, cx, cy, rad * 1.03);
        g.addColorStop(0, 'rgba(34, 22, 72, 0.72)');
        g.addColorStop(0.58, 'rgba(18, 12, 42, 0.78)');
        g.addColorStop(0.84, crew[i].color);
        g.addColorStop(1, crew[i].light);
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'plush') {
      // Warm velvety plush: soft studio top bounce + cozy shadow depth
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      applyCharDistinction(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx - rad * 0.22, cy - rad * 0.28, rad * 0.06, cx, cy, rad * 1.04);
        g.addColorStop(0, 'rgba(255, 248, 242, 0.24)');
        g.addColorStop(0.62, 'rgba(255, 232, 224, 0.04)');
        g.addColorStop(1, 'rgba(116, 64, 78, 0.24)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'pixel') {
      // Crisp high-contrast arcade pixel art with smooth retro top/bottom shading
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const g = ctx.createLinearGradient(ox, oy + ch * 0.14, ox, oy + ch * 0.86);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
        g.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        g.addColorStop(1, 'rgba(24, 20, 56, 0.22)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'gummy') {
      // Juicy translucent fruit gummy: smooth warm subsurface glow, zero 2D sticker ovals
      ctx.save(); ctx.globalAlpha = 0.92; ctx.drawImage(baseImg, 0, 0, w, h); ctx.restore();
      trimIvoryWhiskers(ctx, w, h);
      applyCharDistinction(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx - rad * 0.18, cy - rad * 0.22, rad * 0.06, cx, cy, rad * 1.04);
        g.addColorStop(0, 'rgba(255, 252, 232, 0.30)');
        g.addColorStop(0.55, 'rgba(255, 224, 150, 0.06)');
        g.addColorStop(1, 'rgba(220, 108, 36, 0.24)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'porcelain') {
      // Fine Jingdezhen glazed ceramic: smooth warm-ivory core + soft cobalt glaze rim (no harsh 2D stroke)
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx - rad * 0.22, cy - rad * 0.26, rad * 0.08, cx, cy, rad * 1.05);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
        g.addColorStop(0.54, 'rgba(240, 246, 254, 0.62)');
        g.addColorStop(0.82, 'rgba(54, 104, 186, 0.66)');
        g.addColorStop(1, 'rgba(26, 58, 128, 0.86)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'sakura') {
      // Preserved unchanged per user preference
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createRadialGradient(cx, cy - rad * 0.2, rad * 0.1, cx, cy, rad * 1.05);
        g.addColorStop(0, 'rgba(255, 232, 242, 0.60)');
        g.addColorStop(0.65, 'rgba(246, 170, 202, 0.56)');
        g.addColorStop(1, 'rgba(255, 242, 248, 0.74)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else if (key === 'holo') {
      // Natural mother-of-pearl aurora: smooth pearlescent gradient + soft spherical volume shading (no 2D arc)
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 20; i++) {
        const ox = (i % 5) * cw, oy = Math.floor(i / 5) * ch;
        const cx = ox + cw * 0.5, cy = oy + ch * 0.5, rad = cw * 0.35;
        const g = ctx.createLinearGradient(ox + cw * 0.16, oy + ch * 0.16, ox + cw * 0.84, oy + ch * 0.84);
        g.addColorStop(0, 'rgba(176, 250, 244, 0.42)');
        g.addColorStop(0.36, 'rgba(196, 202, 255, 0.38)');
        g.addColorStop(0.70, 'rgba(252, 196, 240, 0.40)');
        g.addColorStop(1, 'rgba(252, 238, 186, 0.40)');
        ctx.fillStyle = g; ctx.fillRect(ox, oy, cw, ch);
        const rg = ctx.createRadialGradient(cx - rad * 0.22, cy - rad * 0.26, rad * 0.06, cx, cy, rad * 1.04);
        rg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
        rg.addColorStop(0.56, 'rgba(255, 255, 255, 0.04)');
        rg.addColorStop(1, 'rgba(84, 108, 196, 0.28)');
        ctx.fillStyle = rg; ctx.fillRect(ox, oy, cw, ch);
      }
      ctx.restore();
    } else {
      // Metal preserved unchanged per user preference
      ctx.drawImage(baseImg, 0, 0, w, h);
      trimIvoryWhiskers(ctx, w, h);
    }

    bakedSheets.set(key, off);
    return off;
  }

  function imageFor(key) {
    const t = themes[key] || themes.cartoon;
    const raw = loadRaw(t.base);
    if (raw.complete && raw.naturalWidth) return bakeProceduralAtlas(key, raw);
    return raw;
  }

  function setSkin(key) { if (themes[key]) { active = key; imageFor(key); } }
  function setStage(key) { if (themes[key]) { activeStage = key; } }

  const N = 24, cellSpan = 3.4, bodyAspect = .84;
  const dirs = Array.from({ length: N }, (_, i) => {
    const x = Math.cos(i * TAU / N), y = Math.sin(i * TAU / N);
    return { x, y, outer: Math.min(1.685 / (Math.abs(x) || .001), 1.685 / (bodyAspect * Math.abs(y) || .001)) };
  });

  function makeView(level) {
    return { level, wild: false, frozen: 0, baseR: crew[level]?.r || 24, points: Array.from({ length: N }, () => ({ x: 0, y: 0 })), mode: 'idle', pressure: 0, shine: 0, flash: 0 };
  }
  function axes(v) {
    const p = v.points, a = p[0], b = p[12], d = p[6], e = p[18];
    v.ax = (a.x - b.x) * .5; v.ay = (a.y - b.y) * .5; v.bx = (d.x - e.x) * .5; v.by = (d.y - e.y) * .5;
    v.rx = Math.hypot(v.ax, v.ay); v.ry = Math.hypot(v.bx, v.by);
    // Guard against collapsed or inverted facial transform under extreme squeeze
    const det = v.ax * v.by - v.ay * v.bx;
    const minAxis = (v.baseR || 20) * 0.42;
    if (det <= minAxis * minAxis * 0.35 || v.rx < minAxis || v.ry < minAxis) {
      const r = v.baseR || 24;
      v.ax = r * 1.05; v.ay = 0; v.bx = 0; v.by = r * 0.88;
      v.rx = v.ax; v.ry = v.by;
    }
    return v;
  }
  function bodyView(b, blend) {
    const v = b.picture || (b.picture = makeView(b.level));
    v.level = b.level; v.wild = !!b.wild; v.frozen = b.frozen || 0; v.baseR = b.r;
    let x = 0, y = 0; const k = 1 - blend;
    for (let i = 0; i < N; i++) {
      const p = b.p[i], q = v.points[i];
      q.x = p.x + k * (p.fx - p.x); q.y = p.y + k * (p.fy - p.y);
      x += q.x; y += q.y;
    }
    v.x = x / N; v.y = y / N; v.seed = b.seed; v.pressure = b.strain;
    // Render-time vertex sanity guard: keep 24-gon cleanly star-convex around centroid
    const maxR = b.r * 1.44, minR = b.r * 0.44;
    for (let i = 0; i < N; i++) {
      const q = v.points[i], d = dirs[i];
      const dx = q.x - v.x, dy = q.y - v.y;
      const dist = Math.hypot(dx, dy);
      if (dist < minR || dist > maxR || dx * d.x + dy * d.y < dist * 0.32) {
        const clampedR = clamp(dist, minR, maxR);
        q.x = v.x + d.x * clampedR * 1.06;
        q.y = v.y + d.y * clampedR * 0.90;
      }
    }
    if (b.swell > 0) {
      const sc = 1 + b.swell * 0.42;
      const jitX = Math.sin(b.swell * 48 + b.id) * b.swell * 3.2;
      const jitY = Math.cos(b.swell * 54 + b.id) * b.swell * 2.4;
      for (let i = 0; i < N; i++) {
        const q = v.points[i];
        q.x = v.x + (q.x - v.x) * sc + jitX;
        q.y = v.y + (q.y - v.y) * sc + jitY;
      }
      v.x += jitX; v.y += jitY;
    }
    v.mode = (b.frozen > 0 || b.swell > 0) ? 'squeeze' : b.joy > .10 ? 'glee' : b.hit > .48 ? 'squeeze' : b.hit > .17 ? 'startle' : !b.landed && b.vy > 165 ? 'startle' : 'idle';
    v.shine = clamp(b.vx / 670 + b.xy * .85, -.9, .9);
    v.flash = clamp(Math.hypot(b.xx, b.xy) + b.joy * .22, 0, .65);
    return axes(v);
  }
  function pose(v, level, x, y, r, t, opts = {}) {
    v.level = level; v.wild = !!opts.wild; v.frozen = opts.frozen || 0; v.baseR = r; v.x = x; v.y = y; v.seed = opts.seed ?? level + .7; v.mode = opts.mode || 'idle'; v.pressure = 0;
    const wobble = opts.still ? 0 : .025 * Math.sin(t * 3 + v.seed);
    const long = 1 + (opts.stretch || 0), wide = 1 / long, angle = opts.angle || 0;
    const dx = Math.sin(angle), dy = Math.cos(angle), amount = long - wide;
    for (let i = 0; i < N; i++) {
      const ox = dirs[i].x * r * 1.10 * (1 + wobble), oy = dirs[i].y * r * .90 * (1 - wobble);
      const dot = dx * ox + dy * oy, p = v.points[i];
      p.x = x + wide * ox + amount * dx * dot; p.y = y + wide * oy + amount * dy * dot;
    }
    v.shine = clamp(dx * (opts.stretch || 0) + Math.sin(t * 1.5 + v.seed) * .11, -.9, .9);
    v.flash = Math.abs(opts.stretch || 0) * .65;
    return axes(v);
  }

  function oval(c, x, y, rx, ry, fill) {
    c.beginPath(); c.ellipse(x, y, Math.max(.0001, rx), Math.max(.0001, ry), 0, 0, TAU); c.fillStyle = fill; c.fill();
  }
  function curve(c, color, width, x1, y1, cx, cy, x2, y2) {
    c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); c.stroke();
  }

  function drawWildBody(c, v, t) {
    c.save(); c.beginPath();
    for (let i = 0; i < N; i++) { const p = v.points[i]; if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); }
    c.closePath();
    const hue = (t * 140) % 360;
    const g = c.createRadialGradient(v.x - v.rx * .3, v.y - v.ry * .35, v.rx * .08, v.x, v.y, v.rx * 1.15);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, `hsl(${hue}, 96%, 72%)`);
    g.addColorStop(0.68, `hsl(${(hue + 110) % 360}, 92%, 62%)`); g.addColorStop(1, `hsl(${(hue + 220) % 360}, 88%, 50%)`);
    c.fillStyle = g; c.fill(); c.lineWidth = 2.4; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
    c.beginPath(); c.ellipse(v.x - v.rx * .28, v.y - v.ry * .36, v.rx * .28, v.ry * .14, -0.5, 0, TAU);
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill();
    c.fillStyle = '#241838';
    const sr = v.rx * .34;
    c.beginPath();
    c.moveTo(v.x, v.y - sr); c.quadraticCurveTo(v.x + sr * .22, v.y - sr * .22, v.x + sr, v.y);
    c.quadraticCurveTo(v.x + sr * .22, v.y + sr * .22, v.x, v.y + sr);
    c.quadraticCurveTo(v.x - sr * .22, v.y + sr * .22, v.x - sr, v.y);
    c.quadraticCurveTo(v.x - sr * .22, v.y - sr * .22, v.x, v.y - sr);
    c.fill();
    c.restore();
  }

  function drawIceOverlay(c, v) {
    if (!v.frozen || v.frozen <= 0) return;
    c.save();
    c.beginPath();
    for (let i = 0; i < N; i++) {
      const p = v.points[i];
      const ox = v.x + (p.x - v.x) * 1.07, oy = v.y + (p.y - v.y) * 1.07;
      if (i === 0) c.moveTo(ox, oy); else c.lineTo(ox, oy);
    }
    c.closePath();
    const g = c.createRadialGradient(v.x - v.rx * .3, v.y - v.ry * .35, v.rx * .1, v.x, v.y, v.rx * 1.12);
    g.addColorStop(0, 'rgba(230, 252, 255, 0.34)');
    g.addColorStop(0.7, 'rgba(120, 224, 252, 0.44)');
    g.addColorStop(1, 'rgba(56, 189, 248, 0.68)');
    c.fillStyle = g; c.fill();
    c.lineWidth = v.frozen >= 2 ? 3.0 : 2.0;
    c.strokeStyle = v.frozen >= 2 ? '#e0faff' : '#bae6fd';
    c.stroke();

    // Faceted crystal specular glint
    c.strokeStyle = 'rgba(255,255,255,0.92)'; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath(); c.arc(v.x, v.y, v.rx * 0.72, -Math.PI * 0.82, -Math.PI * 0.48); c.stroke();

    // If cracked (1 layer left), draw crisp frost crack lines
    if (v.frozen === 1) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.0;
      c.beginPath();
      c.moveTo(v.x - v.rx * .55, v.y - v.ry * .25);
      c.lineTo(v.x - v.rx * .12, v.y + v.ry * .05);
      c.lineTo(v.x + v.rx * .28, v.y - v.ry * .18);
      c.lineTo(v.x + v.rx * .52, v.y + v.ry * .24);
      c.stroke();
    }
    c.restore();
  }

  const sleepy = new Set(['phones', 'disc', 'flame', 'hood', 'flower', 'ash', 'gray', 'hat']);
  const sunny = new Set(['sun', 'oak', 'rabbit', 'aerial', 'ivory', 'bear']);

  function smile(c, w, h, ink, tongue) {
    c.fillStyle = ink; c.beginPath(); c.moveTo(-w, -h * .34); c.quadraticCurveTo(0, -h * .04, w, -h * .34);
    c.bezierCurveTo(w * .88, h * 1.05, -w * .77, h * 1.12, -w, -h * .34); c.fill();
    if (tongue) { c.save(); c.clip(); oval(c, .024, h * .78, w * .55, h * .37, tongue); c.restore(); }
  }

  function eye(c, side, d, mood, blink, gaze, skin) {
    const g = d.gear, plush = skin === 'plush', cart = skin === 'cartoon', neon = skin === 'neon';
    const ink = (g === 'hat' || neon) ? '#f1ead7' : '#2b2933';
    const cy = g === 'oak' ? .119 : g === 'bucket' ? .026 : -.042;
    const x = side * (g === 'sun' ? .30 : g === 'oak' ? .245 : .30);
    const w = g === 'sun' || g === 'oak' ? .115 : .248, h = g === 'sun' ? .151 : g === 'oak' ? .192 : .297;
    c.save(); c.translate(x, cy); c.rotate(side * (g === 'flame' ? -.075 : .014));
    if (blink < .16 || mood === 'squeeze' || mood === 'glee') {
      if (mood === 'squeeze') { c.strokeStyle = ink; c.lineWidth = .061; c.beginPath(); c.moveTo(-w * .79, -side * .062); c.lineTo(0, side * .035); c.lineTo(w * .80, -side * .07); c.stroke(); }
      else curve(c, ink, .054, -w * .89, .028, 0, mood === 'glee' ? -.154 : -.045, w * .87, .012);
      c.restore(); return;
    }
    c.scale(1, blink);
    if (neon) {
      oval(c, gaze * .03, 0, w * .84, h * .84, d.light);
      oval(c, gaze * .03 - w * .15, -h * .22, w * .24, h * .24, '#ffffff');
      c.restore(); return;
    }
    if (g === 'sun' || g === 'oak') {
      oval(c, gaze * .025, 0, w * (mood === 'startle' ? .77 : 1), h, plush ? '#383039' : '#282834');
      oval(c, -w * .31, -h * .36, w * .19, h * .13, '#fff3d7'); c.restore(); return;
    }
    if (g === 'hat') {
      oval(c, 0, 0, w, h, '#e9ede4'); oval(c, -.015 + gaze * .035, -h * .21, w * .91, h * .97, '#333641'); c.restore(); return;
    }
    const white = cart ? '#fff7e8' : plush ? '#f3ece0' : '#f7f9fb';
    oval(c, 0, .012, w + .015, h + .016, plush ? '#967d79' : cart ? '#594753' : '#5e6b73');
    oval(c, 0, 0, w, h, white); c.save(); c.clip();
    if (g === 'ash') oval(c, 0, .015, w, h, '#39373f');
    const dot = g === 'ivory' ? .147 : g === 'ash' ? .122 : mood === 'startle' ? .136 : .175;
    const px = gaze * .059, py = (mood === 'startle' ? -.022 : .025);
    oval(c, px, py, dot, dot * 1.15, g === 'ash' ? '#eadfd2' : skin === 'porcelain' ? '#1e428a' : plush ? '#342e33' : '#302837');
    if (g === 'ivory') oval(c, px, py, dot * .73, dot * .86, '#f7efe2');
    else oval(c, px - dot * .37, py - dot * .43, dot * (cart ? .18 : .26), dot * (cart ? .18 : .22), '#fff8e7');
    if ((sleepy.has(g) && mood === 'chill') || mood === 'aim') {
      const base = g === 'hood' ? '#5360b1' : d.color;
      const lid = skin === 'porcelain' ? '#dce7f5' : skin === 'glass' ? 'rgba(130,224,234,0.72)' : base;
      const tilt = (mood === 'aim' ? .082 : .014) * side;
      c.fillStyle = lid; c.beginPath(); c.moveTo(-.34, -.37); c.lineTo(.34, -.37); c.lineTo(.34, -.052 + tilt);
      c.quadraticCurveTo(0, -.009, -.34, -.052 - tilt); c.closePath(); c.fill();
      curve(c, '#51424d', .026, -.34, -.052 - tilt, 0, -.009, .34, -.052 + tilt);
    }
    c.restore();
    // Whisker/lash curves cleanly removed per user preference
    if (mood === 'sad' || (g === 'flame' && mood === 'aim')) curve(c, ink, .041, -.18, -h - .025 + side * .054, 0, -h - .07, .18, -h - .026 - side * .054);
    c.restore();
  }

  function digital(c, g, mood, blink, gaze, skin) {
    const bright = skin === 'neon' ? '#7cf7ff' : skin === 'porcelain' ? '#2452a3' : g === 'visor' ? '#27646a' : g === 'bot' ? '#70f8ea' : '#f4f6da';
    const y = g === 'visor' ? -.04 : -.055;
    c.save(); c.translate(0, y); c.lineWidth = .045; c.strokeStyle = bright;
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * .30 + gaze * .027, 0);
      if (mood === 'squeeze' || mood === 'glee' || blink < .2) { curve(c, bright, .064, -.105, .03, 0, -.12, .105, .018); }
      else {
        const w = g === 'terminal' ? .122 : g === 'visor' ? .081 : .13, h = (g === 'terminal' ? .152 : .297) * blink;
        c.fillStyle = bright; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, .048); c.fill();
      } c.restore();
    }
    c.translate(0, .296);
    if (g === 'terminal' && mood !== 'sad' && mood !== 'squeeze') { c.fillStyle = bright; c.beginPath(); c.moveTo(-.097, -.048); c.lineTo(.103, -.048); c.lineTo(0, .098); c.closePath(); c.fill(); }
    else if (mood === 'startle' || mood === 'sing') oval(c, 0, 0, .054, .075, bright);
    else if (mood === 'squeeze' || mood === 'sad') curve(c, bright, .032, -.095, .025, 0, -.06, .098, .025);
    else curve(c, bright, .028, -.085, -.019, .01, .054, .10, -.025);
    c.restore();
  }

  const pixelFace = document.createElement('canvas'); pixelFace.width = 42; pixelFace.height = 40;
  const pixelInk = pixelFace.getContext('2d');

  function features(c, v, t, number = true, skin = active) {
    if (v.wild) { drawWildBody(c, v, t); return; }
    const d = crew[v.level], g = d.gear, seed = v.seed || 0, ph = t + seed;
    let mood = v.mode;
    if (mood === 'idle') {
      if (v.pressure > .12) mood = Math.sin(ph * 1.65) > .12 ? 'squeeze' : 'sad';
      else { const beat = (ph % 7) / 7; mood = beat < .115 ? 'sing' : beat > .84 ? 'happy' : 'chill'; }
    }
    const cycle = (t + seed * 1.89 + .42) % (3.15 + (v.level % 5) * .23);
    const blink = cycle < .15 ? Math.max(.035, Math.abs(cycle - .075) / .075) : 1;
    const gaze = mood === 'aim' ? 0 : Math.sin(t * .94 + seed) * .62 + Math.sin(t * 2.08 + seed) * .22;
    const surface = c;
    if (skin === 'pixel') {
      c = pixelInk; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 42, 40);
      c.save(); c.setTransform(18, 0, 0, 16, 21, 20);
    } else { c.save(); c.transform(v.ax, v.ay, v.bx, v.by, v.x, v.y); }
    c.lineCap = 'round'; c.lineJoin = 'round';

    if (g !== 'bot' && g !== 'terminal' && g !== 'visor' && g !== 'hat' && skin !== 'neon') {
      oval(c, -.46, .22, .12, .072, 'rgba(255, 118, 146, 0.28)');
      oval(c, .46, .22, .12, .072, 'rgba(255, 118, 146, 0.28)');
    }

    if (g === 'bot' || g === 'terminal' || g === 'visor') digital(c, g, mood, blink, gaze, skin);
    else {
      eye(c, -1, d, mood, blink, gaze, skin); eye(c, 1, d, mood, blink, gaze, skin);
      const ink = (g === 'hat' || skin === 'neon') ? '#e7f4ff' : skin === 'porcelain' ? '#1e428a' : '#41313a';
      c.save(); c.translate(0, (g === 'oak' ? .47 : g === 'bucket' ? .4 : .338) + .012 * Math.sin(ph * 3));
      if (mood === 'sad' || mood === 'squeeze') curve(c, ink, .045, -.13, .044, 0, -.091, .136, .037);
      else if (g === 'sun' && mood !== 'startle') smile(c, .275, .267, ink, '#f99874');
      else if (mood === 'startle' || mood === 'sing' || (g === 'ranger' && mood === 'chill') || (g === 'hood' && mood === 'chill')) {
        const h = .074 + .037 * (.5 + .5 * Math.sin(ph * 4)); oval(c, 0, 0, .081, h, ink);
      } else if (mood === 'glee' || mood === 'happy' || sunny.has(g)) smile(c, .157, .14, ink, '#f69b92');
      else if (g === 'spikes') {
        c.fillStyle = '#fff0cd'; c.beginPath(); c.roundRect(-.175, -.052, .35, .084, .035); c.fill(); c.strokeStyle = ink; c.lineWidth = .025; c.stroke();
      } else curve(c, ink, .041, -.125, -.012, .012, .083, .145, -.028);
      c.restore();
    }
    c.restore();
    if (skin === 'pixel') {
      c = surface; c.save(); c.transform(v.ax, v.ay, v.bx, v.by, v.x, v.y); c.imageSmoothingEnabled = false;
      c.drawImage(pixelFace, -21 / 18, -20 / 16, 42 / 18, 40 / 16); c.restore();
    }
    if (v.frozen > 0) drawIceOverlay(surface, v);
    if (!number) return;
    const fs = clamp(v.rx * .29, 9.3, 13.1), val = String(d.value);
    const bx = v.x + v.ax * .54 + v.bx * .62, by = v.y + v.ay * .54 + v.by * .62;
    surface.save(); surface.font = '800 ' + fs + 'px "Avenir Next",Arial,sans-serif'; const w = Math.max(fs * 1.25, surface.measureText(val).width + 5), h = fs * 1.24;
    surface.fillStyle = skin === 'glass' ? 'rgba(18,64,74,.76)' : skin === 'neon' ? 'rgba(18,12,42,.88)' : 'rgba(33,45,47,.84)';
    surface.beginPath(); surface.roundRect(bx - w / 2, by - h / 2, w, h, h / 2); surface.fill();
    surface.fillStyle = '#fff9e8'; surface.textBaseline = 'middle'; surface.textAlign = 'center'; surface.fillText(val, bx, by + .4); surface.restore();
  }

  function tile(c, level, sheet) {
    const k = (sheet.naturalWidth || sheet.width) / 5;
    c.drawImage(sheet, (level % 5) * k, Math.floor(level / 5) * k, k, k, -cellSpan / 2, -cellSpan / (2 * bodyAspect), cellSpan, cellSpan / bodyAspect);
  }

  function flatSkin(c, v, key = active) {
    if (v.wild) return;
    const sheet = imageFor(key);
    const ready = sheet && ((sheet.complete && sheet.naturalWidth) || (sheet.tagName === 'CANVAS' && sheet.width > 0));
    c.save(); c.transform(v.ax, v.ay, v.bx, v.by, v.x, v.y);
    if (key === 'pixel') c.imageSmoothingEnabled = false;
    else { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; }
    if (ready) tile(c, v.level, sheet);
    else oval(c, 0, 0, 1, 1, crew[v.level].color);
    c.restore();
  }

  function warp2D(c, v) {
    // Render each jelly via a single seamless 2x2 affine squash/stretch/shear transform (zero 24-triangle clip seams & 24x faster!)
    flatSkin(c, v);
  }

  const stageCache = document.createElement('canvas');
  let stageCacheKey = '';

  function ensureStageCache(w, h, stageKey) {
    const key = `${Math.round(w)}x${Math.round(h)}:${stageKey}`;
    if (stageCacheKey === key) return;
    stageCacheKey = key;
    stageCache.width = Math.max(1, Math.round(w));
    stageCache.height = Math.max(1, Math.round(h));
    const ctx = stageCache.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    if (stageKey === 'cartoon') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#8ec7ad'); g.addColorStop(.55, '#7ab89c'); g.addColorStop(1, '#66a588');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let x = 0; x < w; x += 48) ctx.fillRect(x, 0, 22, h);
    } else if (stageKey === 'toy3d') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#365b6d'); g.addColorStop(.52, '#284757'); g.addColorStop(1, '#1d3542');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const sp = ctx.createRadialGradient(w * 0.5, h * 0.16, 12, w * 0.5, h * 0.24, w * 0.72);
      sp.addColorStop(0, 'rgba(170, 232, 248, 0.22)');
      sp.addColorStop(1, 'rgba(170, 232, 248, 0)');
      ctx.fillStyle = sp; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(205, 240, 250, 0.14)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(12, 14, w - 24, h - 28);
    } else if (stageKey === 'plush') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ae7d8d'); g.addColorStop(.55, '#966576'); g.addColorStop(1, '#7d5061');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 236, 242, 0.07)';
      for (let x = 0; x < w; x += 40) ctx.fillRect(x, 0, 18, h);
    } else if (stageKey === 'neon') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#120a24'); g.addColorStop(.55, '#1d103c'); g.addColorStop(1, '#2f1448');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255, 72, 196, 0.24)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) { const y = h - 135 + i * i * 2.1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(w * .5 + i * 28, h - 135); ctx.lineTo(w * .5 + i * 98, h); ctx.stroke(); }
      ctx.fillStyle = 'rgba(56, 232, 255, 0.35)'; ctx.fillRect(6, 36, 3, h - 100);
      ctx.fillStyle = 'rgba(255, 72, 196, 0.35)'; ctx.fillRect(w - 9, 36, 3, h - 100);
    } else if (stageKey === 'glass') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1d6678');
      g.addColorStop(0.5, '#297c8f');
      g.addColorStop(1, '#144d5c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(215, 255, 255, 0.18)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.arc((i * 61 + 35) % w, (i * 73 + 60) % h, 6 + (i % 4) * 5, 0, TAU); ctx.stroke();
      }
    } else if (stageKey === 'gummy') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#dfa56d'); g.addColorStop(.55, '#cf8c55'); g.addColorStop(1, '#b87240');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 236, 200, 0.12)';
      for (let x = 0; x < w; x += 44) ctx.fillRect(x, 0, 20, h);
      ctx.fillStyle = 'rgba(255, 240, 214, 0.24)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(i * 80 + 20, h - 10, 56, 0, TAU); ctx.fill(); }
    } else if (stageKey === 'porcelain') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#7c9ab8'); g.addColorStop(.58, '#6282a4'); g.addColorStop(1, '#48688c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(22, 46, 86, 0.22)';
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h - 110);
      ctx.quadraticCurveTo(w * .3, h - 170, w * .62, h - 105);
      ctx.quadraticCurveTo(w * .85, h - 70, w, h - 125); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(224, 238, 255, 0.24)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(10, 12, w - 20, h - 24);
    } else if (stageKey === 'sakura') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#c987a3'); g.addColorStop(.52, '#b06d8c'); g.addColorStop(1, '#8c5170');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    } else if (stageKey === 'holo') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#465d8c'); g.addColorStop(.52, '#544e85'); g.addColorStop(1, '#3b4270');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const ag = ctx.createLinearGradient(0, 50, w, 260);
      ag.addColorStop(0, 'rgba(92, 236, 224, 0.24)');
      ag.addColorStop(.5, 'rgba(154, 174, 255, 0.22)');
      ag.addColorStop(1, 'rgba(255, 168, 236, 0.20)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.moveTo(0, 140); ctx.bezierCurveTo(w * .3, 90, w * .7, 200, w, 125);
      ctx.lineTo(w, 250); ctx.bezierCurveTo(w * .7, 285, w * .3, 195, 0, 235); ctx.closePath(); ctx.fill();
    }
  }

  function drawStage(ctx, w, h, stageKey, t, fever = false) {
    if (stageKey === 'cartoon' || stageKey === 'toy3d' || stageKey === 'plush' || stageKey === 'neon' || stageKey === 'glass' || stageKey === 'gummy' || stageKey === 'porcelain' || stageKey === 'sakura' || stageKey === 'holo') {
      ensureStageCache(w, h, stageKey);
      ctx.drawImage(stageCache, 0, 0, w, h);
      if (stageKey === 'sakura') {
        ctx.save(); ctx.fillStyle = 'rgba(255, 238, 246, 0.54)';
        for (let i = 0; i < 6; i++) {
          const px = (i * 71 + t * (10 + (i % 3) * 4)) % (w + 16) - 8;
          const py = (i * 89 + t * (15 + (i % 3) * 4)) % (h + 16) - 8;
          ctx.beginPath(); ctx.ellipse(px, py, 5, 2.5, t + i, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    }
    if (fever) {
      ctx.save();
      ctx.strokeStyle = `hsla(${(t * 160) % 360}, 95%, 68%, 0.58)`;
      ctx.lineWidth = 5;
      ctx.strokeRect(2.5, 2.5, w - 5, h - 5);
      ctx.restore();
    }
  }

  class SkinLayer {
    constructor(canvas) {
      this.canvas = canvas;
      this.available = false;
      this.textureReady = false;
      this.verts = new Float32Array(0);
      this.start();
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.available = false; this.textureReady = false; });
      canvas.addEventListener('webglcontextrestored', () => this.start());
    }
    start() {
      if (location.protocol === 'file:') return;
      try {
        const gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'high-performance' });
        if (!gl) return;
        this.gl = gl;
        const program = gl.createProgram();
        const vs = `
          attribute vec2 pos; attribute vec2 tex; attribute vec2 flex;
          uniform vec2 field; varying vec2 uv; varying vec2 shine;
          void main(){ gl_Position = vec4(pos / field * vec2(2., -2.) + vec2(-1., 1.), 0., 1.); uv = tex; shine = flex; }`;
        const fs = `
          precision mediump float;
          uniform sampler2D atlas; uniform float mode; uniform float uTime;
          varying vec2 uv; varying vec2 shine;
          void main(){
            vec4 s = texture2D(atlas, uv);
            if (s.a < 0.01) discard;
            vec3 rgb = s.rgb / max(s.a, 0.001);
            vec2 p = (fract(uv * vec2(5., 4.)) - .5) * vec2(3.4, 4.04762);
            float r2 = dot(p, p);
            float z = sqrt(max(.016, 1. - min(.984, r2)));
            vec3 n = normalize(vec3(p.x, -p.y, z));
            float fres = pow(1.0 - max(0.0, n.z), 2.0);
            float rim = pow(1.0 - max(0.0, n.z), 2.4);
            vec3 L = normalize(vec3(-0.36 + shine.x * 0.14, 0.46, 0.80));
            vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
            float ndl = max(0.0, dot(n, L));
            float ndh = max(0.0, dot(n, H));
            float ao = smoothstep(-0.85, 0.45, n.y);
            vec3 ref = reflect(vec3(0., 0., -1.), n);
            float strip = exp(-54. * pow(abs(ref.x + .65 - shine.x * .24), 2.)) * smoothstep(.20, .89, ref.y);
            float outAlpha = s.a;

            if (mode > 0.5 && mode < 1.5) {
              // Metal preserved unchanged
              rgb += vec3(1., .95, .87) * strip * (.048 + shine.y * .22);
            } else if (mode > 1.5 && mode < 2.5) {
              // Coherent 3D sea-salt glass (single Blinn-Phong specular + Fresnel rim + soft bottom caustic)
              float spec = pow(ndh, 54.0);
              float caustic = smoothstep(0.18, 0.86, -n.y) * (1.0 - rim) * 0.24;
              vec3 glassTint = mix(rgb * .84 + vec3(.08, .20, .24), vec3(.86, .98, 1.0), rim * .76);
              rgb = glassTint * (0.86 + 0.18 * ndl) + vec3(1.0) * spec * .78 + vec3(.56, .98, 1.0) * caustic;
              outAlpha = s.a * clamp(0.66 + rim * 0.34 + spec * 0.28 + caustic * 0.15, 0.64, 0.99);
            } else if (mode > 2.5 && mode < 3.5) {
              // Coherent 3D obsidian neon
              float spec = pow(ndh, 36.0);
              rgb = rgb * (0.62 + 0.34 * ndl) + (rgb * 0.82 + vec3(0.18, 0.28, 0.52)) * rim * 1.18 + vec3(0.92, 0.98, 1.0) * spec * 0.34;
            } else if (mode > 3.5 && mode < 4.5) {
              // Coherent 3D juicy fruit gummy (soft candy specular + warm subsurface)
              float spec = pow(ndh, 24.0);
              float sss = smoothstep(-0.15, 0.88, -n.y) * 0.14;
              rgb = rgb * (0.94 + 0.16 * ndl) + vec3(0.16, 0.08, 0.02) * sss + vec3(1.0, 0.99, 0.96) * spec * 0.46 + vec3(1.0, 0.92, 0.82) * rim * 0.16;
              outAlpha = s.a * clamp(0.88 + rim * 0.12 + spec * 0.10, 0.86, 1.0);
            } else if (mode > 4.5 && mode < 5.5) {
              // Coherent 3D Jingdezhen porcelain glaze (single crisp kiln specular + smooth cobalt rim)
              float lum = dot(rgb, vec3(.3, .59, .11));
              vec3 ivory = vec3(.93, .96, .99) + (rgb - vec3(lum)) * .28;
              float spec = pow(ndh, 64.0);
              vec3 bodyCol = mix(ivory, vec3(.14, .34, .74), smoothstep(0.14, 0.92, rim) * .78);
              rgb = bodyCol * (0.82 + 0.20 * ndl) + vec3(1.0) * spec * 0.64;
            } else if (mode > 5.5 && mode < 6.5) {
              // Sakura preserved unchanged
              rgb = rgb * .62 + vec3(.38, .28, .33) + vec3(1., .92, .95) * fres * .34;
            } else if (mode > 6.5 && mode < 7.5) {
              // Coherent 3D mother-of-pearl aurora (smooth angle-based iridescence + single soft pearl sheen)
              float ph = n.x * 2.1 + n.y * 1.7 + rim * 2.6 + shine.x * 1.4 + uTime * 0.75;
              vec3 irid = 0.74 + 0.26 * cos(ph + vec3(0.0, 2.05, 4.15));
              float spec = pow(ndh, 34.0);
              vec3 pearl = mix(rgb * 0.84 + vec3(0.16, 0.18, 0.22), irid, 0.26 + rim * 0.44);
              rgb = pearl * (0.84 + 0.20 * ndl) + vec3(1.0) * spec * 0.50;
            } else if (mode > 7.5) {
              // New 3D Designer Vinyl Toy (潮玩3D): tactile matte-satin 3D sculpture lighting
              float spec = pow(ndh, 14.0);
              rgb = rgb * (0.76 + 0.30 * ndl) * (0.90 + 0.10 * ao) + vec3(1.0, 0.99, 0.97) * spec * 0.32 + vec3(0.84, 0.96, 1.0) * rim * 0.28;
            }
            gl_FragColor = vec4(clamp(rgb, 0.0, 1.0) * outAlpha, outAlpha);
          }`;
        for (const [kind, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
          const sh = gl.createShader(kind); gl.shaderSource(sh, src); gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(sh));
          gl.attachShader(program, sh); gl.deleteShader(sh);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(gl.LINK_STATUS));
        gl.useProgram(program);
        this.field = gl.getUniformLocation(program, 'field');
        this.modeLoc = gl.getUniformLocation(program, 'mode');
        this.timeLoc = gl.getUniformLocation(program, 'uTime');
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        ['pos', 'tex', 'flex'].forEach((name, i) => {
          const a = gl.getAttribLocation(program, name);
          gl.enableVertexAttribArray(a);
          gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 24, i * 8);
        });
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.uniform1i(gl.getUniformLocation(program, 'atlas'), 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        this.textureReady = false; this.available = true;
      } catch { this.available = false; }
    }
    paint(fallback, views, height, offsetX, offsetY, time = 0) {
      const gl = this.gl;
      const theme = themes[active] || themes.cartoon;
      const sheet = imageFor(active);
      const normalViews = views.filter(v => !v.wild);

      if (this.lastBase !== sheet) {
        this.textureReady = false; this.lastBase = sheet;
        if (gl) gl.clear(gl.COLOR_BUFFER_BIT);
      }
      const isReady = sheet && ((sheet.complete && sheet.naturalWidth) || (sheet.tagName === 'CANVAS' && sheet.width > 0));
      if (this.available && !this.textureReady && isReady) {
        try {
          const filter = active === 'pixel' ? gl.NEAREST : gl.LINEAR;
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);
          this.textureReady = true;
        } catch { this.available = false; }
      }
      if (!this.available || !this.textureReady) {
        for (const v of normalViews) warp2D(fallback, v);
        return;
      }
      const count = normalViews.length * N * 3 * 6;
      if (this.verts.length < count) this.verts = new Float32Array(count + N * 18 * 8);
      const data = this.verts; let k = 0;
      for (const v of normalViews) {
        const u = (v.level % 5 + .5) / 5, w = (Math.floor(v.level / 5) + .5) / 4;
        for (let i = 0; i < N; i++) {
          data[k++] = v.x + offsetX; data[k++] = v.y + offsetY;
          data[k++] = u; data[k++] = w; data[k++] = v.shine; data[k++] = v.flash;
          for (let h = 0; h < 2; h++) {
            const j = (i + h) % N, p = v.points[j], d = dirs[j], q = d.outer;
            data[k++] = v.x + (p.x - v.x) * q + offsetX;
            data[k++] = v.y + (p.y - v.y) * q + offsetY;
            data[k++] = u + d.x * q / (5 * cellSpan);
            data[k++] = w + d.y * q * bodyAspect / (4 * cellSpan);
            data[k++] = v.shine; data[k++] = v.flash;
          }
        }
      }
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (k > 0) {
        gl.uniform2f(this.field, Jelly.W, height);
        gl.uniform1f(this.modeLoc, theme.shaderMode);
        gl.uniform1f(this.timeLoc, time);
        gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, k), gl.STREAM_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, k / 6);
      }
    }
  }

  function sticker(c, level, x, y, r, t = 0, opts = {}) {
    const v = pose(makeView(level), level, x, y, r, t, opts);
    flatSkin(c, v, opts.skin || active);
    features(c, v, t, !!opts.number, opts.skin || active);
  }

  Jelly.art = {
    makeView, bodyView, pose, features, sticker, drawStage, SkinLayer, themes, imageFor, setSkin, setStage,
    get skin() { return active; },
    get stage() { return activeStage; },
    get sheet() { return imageFor(active); }
  };
})();

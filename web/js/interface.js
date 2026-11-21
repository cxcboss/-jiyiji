'use strict';

(() => {
  const { crew, art } = Jelly;
  const $ = q => document.querySelector(q), $$ = q => Array.from(document.querySelectorAll(q));

  function fit(canvas) {
    const r = canvas.getBoundingClientRect(), w = r.width, h = r.height;
    if (!w || !h) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.round(w * dpr), height = Math.round(h * dpr);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const c = canvas.getContext('2d');
    c.setTransform(width / w, 0, 0, height / h, 0, 0);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.clearRect(0, 0, w, h);
    return { c, w, h };
  }

  function drawCustomIcon(c, key, strokeCol) {
    const ink = '#24352e';
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (key === 'coin') {
      c.fillStyle = '#ffcb3d'; c.strokeStyle = '#995806'; c.lineWidth = 2;
      c.beginPath(); c.arc(12, 12, 9.2, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#fff0a6'; c.beginPath(); c.arc(9.2, 8.6, 2.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#995806';
      c.beginPath(); c.arc(10.6, 15.2, 2.1, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#995806'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(12.4, 15); c.lineTo(12.4, 7.6); c.lineTo(16.2, 8.8); c.stroke();
    } else if (key === 'plus') {
      c.strokeStyle = '#ffffff'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(12, 5.5); c.lineTo(12, 18.5); c.moveTo(5.5, 12); c.lineTo(18.5, 12); c.stroke();
    } else if (key === 'gift') {
      c.fillStyle = '#ff6b57'; c.strokeStyle = ink; c.lineWidth = 1.9;
      c.beginPath(); c.roundRect(4, 10, 16, 10.5, 3); c.fill(); c.stroke();
      c.fillStyle = '#ff9270';
      c.beginPath(); c.roundRect(3, 6.2, 18, 4.4, 2); c.fill(); c.stroke();
      c.fillStyle = '#ffe052'; c.fillRect(10.3, 6.4, 3.4, 13.8);
      c.strokeStyle = '#ffe052'; c.lineWidth = 2.3;
      c.beginPath(); c.ellipse(9, 4.8, 2.6, 1.7, -.3, 0, Math.PI * 2); c.ellipse(15, 4.8, 2.6, 1.7, .3, 0, Math.PI * 2); c.stroke();
    } else if (key === 'wheel') {
      const cols = ['#ff7eb6', '#ffd24c', '#5ce1e6', '#9b7eff', '#7ae582', '#ff9b54'];
      for (let i = 0; i < 6; i++) {
        c.fillStyle = cols[i];
        c.beginPath(); c.moveTo(12, 12.5);
        c.arc(12, 12.5, 8.8, i * Math.PI / 3, (i + 1) * Math.PI / 3);
        c.closePath(); c.fill();
      }
      c.strokeStyle = ink; c.lineWidth = 1.9;
      c.beginPath(); c.arc(12, 12.5, 8.8, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(12, 12.5, 2.8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#ff4757';
      c.beginPath(); c.moveTo(12, 6.2); c.lineTo(9.4, 2.2); c.lineTo(14.6, 2.2); c.closePath(); c.fill(); c.stroke();
    } else if (key === 'chest') {
      c.fillStyle = '#e88b2e'; c.strokeStyle = ink; c.lineWidth = 1.8;
      c.beginPath(); c.roundRect(3, 9.5, 18, 11, 3); c.fill(); c.stroke();
      c.fillStyle = '#ffbe42';
      c.beginPath(); c.roundRect(2.5, 5, 19, 6.2, 3); c.fill(); c.stroke();
      c.fillStyle = '#fff0a6'; c.beginPath(); c.roundRect(9.8, 9, 4.4, 5, 1.5); c.fill(); c.stroke();
    } else if (key === 'settings') {
      c.fillStyle = '#f2f7f5'; c.strokeStyle = ink; c.lineWidth = 1.8;
      for (let i = 0; i < 6; i++) {
        c.save(); c.translate(12, 12); c.rotate(i * Math.PI / 3);
        c.beginPath(); c.roundRect(-2.4, -9.8, 4.8, 4.2, 1.4); c.fill(); c.stroke(); c.restore();
      }
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(12, 12, 6.4, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#56b4f5'; c.beginPath(); c.arc(12, 12, 2.7, 0, Math.PI * 2); c.fill(); c.stroke();
    } else if (key === 'layers') {
      const cols = ['#6be0a6', '#ffd24c', '#ff7fb6'];
      cols.forEach((col, i) => {
        const y = 14.5 - i * 4.2;
        c.fillStyle = col; c.strokeStyle = ink; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(12, y - 4); c.lineTo(20.5, y); c.lineTo(12, y + 4); c.lineTo(3.5, y); c.closePath(); c.fill(); c.stroke();
      });
    } else if (key === 'grid') {
      const cells = [[3.5, 3.5, '#ff9d47'], [13, 3.5, '#5ad4ee'], [3.5, 13, '#f77bb8'], [13, 13, '#9fe34b']];
      c.strokeStyle = ink; c.lineWidth = 1.7;
      for (const [x, y, col] of cells) { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, 7.5, 7.5, 2.4); c.fill(); c.stroke(); }
    } else if (key === 'trophy' || key === 'medal') {
      c.strokeStyle = '#c47a0e'; c.lineWidth = 2;
      c.beginPath(); c.arc(6.2, 8.2, 3, Math.PI * .5, Math.PI * 1.5); c.stroke();
      c.beginPath(); c.arc(17.8, 8.2, 3, -Math.PI * .5, Math.PI * .5); c.stroke();
      c.fillStyle = '#ffcf40'; c.strokeStyle = ink; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(6.5, 4.2); c.lineTo(17.5, 4.2); c.lineTo(16.6, 10.5); c.quadraticCurveTo(16, 15.2, 12, 15.2); c.quadraticCurveTo(8, 15.2, 7.4, 10.5); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f5a623'; c.fillRect(10.5, 15.2, 3, 3.6);
      c.beginPath(); c.roundRect(7.5, 18.2, 9, 2.6, 1.3); c.fill(); c.stroke();
    } else if (key === 'flag') {
      c.strokeStyle = ink; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(6.2, 20.5); c.lineTo(6.2, 3.8); c.stroke();
      c.fillStyle = '#ff5e57'; c.strokeStyle = ink; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(6.4, 4.4); c.lineTo(19.5, 8.8); c.lineTo(6.4, 13.6); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffe066'; c.beginPath(); c.arc(10.2, 9, 1.6, 0, Math.PI * 2); c.fill();
    } else if (key === 'flame') {
      c.fillStyle = '#ff6b35'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.moveTo(12, 2.8); c.bezierCurveTo(17.5, 7.2, 19.5, 12.2, 18.2, 16.2); c.bezierCurveTo(16.8, 20.2, 13.8, 21.2, 12, 21.2); c.bezierCurveTo(7.2, 21.2, 5, 17.6, 5.8, 13.5); c.bezierCurveTo(6.4, 10.2, 9.2, 8.4, 12, 2.8); c.fill(); c.stroke();
      c.fillStyle = '#ffe052';
      c.beginPath(); c.moveTo(12, 10.2); c.bezierCurveTo(15, 13, 15.4, 16.2, 14, 18.4); c.bezierCurveTo(12.8, 19.8, 10.6, 19.6, 9.6, 17.8); c.bezierCurveTo(8.8, 16, 10, 13.4, 12, 10.2); c.fill();
    } else if (key === 'wave') {
      c.fillStyle = '#ffe052'; c.strokeStyle = ink; c.lineWidth = 1.8;
      c.beginPath(); c.roundRect(3.5, 4.5, 17, 6, 2.2); c.fill(); c.stroke();
      c.strokeStyle = '#1e88e5'; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(12, 12.2); c.lineTo(12, 19.5); c.moveTo(8.2, 16); c.lineTo(12, 19.8); c.lineTo(15.8, 16); c.stroke();
    } else if (key === 'infinity') {
      c.strokeStyle = '#ff981a'; c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(12, 12); c.bezierCurveTo(9, 7, 3.5, 7.5, 3.5, 12); c.bezierCurveTo(3.5, 16.5, 9, 17, 12, 12);
      c.bezierCurveTo(15, 7, 20.5, 7.5, 20.5, 12); c.bezierCurveTo(20.5, 16.5, 15, 17, 12, 12);
      c.stroke();
    } else if (key === 'hammer') {
      c.save(); c.translate(12, 12); c.rotate(-.72);
      c.fillStyle = '#f5b856'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.roundRect(-2, -1, 4, 11.5, 2); c.fill(); c.stroke();
      c.fillStyle = '#ff6b6b';
      c.beginPath(); c.roundRect(-7.5, -8.2, 15, 7.6, 3.2); c.fill(); c.stroke();
      c.fillStyle = '#ffe082'; c.fillRect(-5.5, -6.5, 2.2, 4.2); c.fillRect(3.3, -6.5, 2.2, 4.2);
      c.restore();
    } else if (key === 'shake') {
      c.fillStyle = '#a970ff'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.arc(12, 12, 5.4, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#fff2a6'; c.beginPath(); c.arc(10.4, 10.4, 1.8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ff9f2e'; c.lineWidth = 2.2;
      c.beginPath(); c.arc(12, 12, 8.8, -.65, .65); c.stroke();
      c.beginPath(); c.arc(12, 12, 8.8, Math.PI - .65, Math.PI + .65); c.stroke();
    } else if (key === 'spark') {
      const g = c.createLinearGradient(4, 4, 20, 20);
      g.addColorStop(0, '#ff6ec4'); g.addColorStop(.5, '#ffe14d'); g.addColorStop(1, '#4be8ff');
      c.fillStyle = g; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath();
      c.moveTo(12, 2.5); c.quadraticCurveTo(13.8, 10.2, 21.5, 12);
      c.quadraticCurveTo(13.8, 13.8, 12, 21.5); c.quadraticCurveTo(10.2, 13.8, 2.5, 12);
      c.quadraticCurveTo(10.2, 10.2, 12, 2.5); c.closePath(); c.fill(); c.stroke();
    } else if (key === 'lift') {
      c.fillStyle = '#ffd43b'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.roundRect(3, 4.2, 18, 4.8, 2); c.fill(); c.stroke();
      c.fillStyle = '#38d989'; c.strokeStyle = ink; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(12, 10.2); c.lineTo(17.2, 15.8); c.lineTo(14.2, 15.8); c.lineTo(14.2, 20.5); c.lineTo(9.8, 20.5); c.lineTo(9.8, 15.8); c.lineTo(6.8, 15.8); c.closePath(); c.fill(); c.stroke();
    } else if (key === 'snow') {
      c.strokeStyle = '#38bdf8'; c.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) {
        c.save(); c.translate(12, 12); c.rotate(i * Math.PI / 3);
        c.beginPath(); c.moveTo(0, -8.8); c.lineTo(0, 8.8);
        c.moveTo(-2.4, -6); c.lineTo(0, -4); c.lineTo(2.4, -6);
        c.moveTo(-2.4, 6); c.lineTo(0, 4); c.lineTo(2.4, 6);
        c.stroke(); c.restore();
      }
      c.fillStyle = '#e0f7ff'; c.beginPath(); c.arc(12, 12, 2.4, 0, Math.PI * 2); c.fill();
    } else if (key === 'clock') {
      c.fillStyle = '#ffffff'; c.strokeStyle = strokeCol; c.lineWidth = 2;
      c.beginPath(); c.arc(12, 12.5, 8.5, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = '#ef4444'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(12, 7.8); c.lineTo(12, 12.5); c.lineTo(15.6, 14.2); c.stroke();
    } else if (key === 'num' || key === 'num_off') {
      c.fillStyle = key === 'num' ? '#ffdd57' : '#d5dfd8'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.roundRect(3, 5, 18, 14, 5); c.fill(); c.stroke();
      c.fillStyle = ink; c.font = '900 9.5px Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('12', 12, 12.6);
      if (key === 'num_off') {
        c.strokeStyle = '#e11d48'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(4.5, 19); c.lineTo(19.5, 5); c.stroke();
      }
    } else if (key === 'video') {
      c.fillStyle = '#fff5cc'; c.strokeStyle = '#9a4706'; c.lineWidth = 1.6;
      c.beginPath(); c.roundRect(2.5, 5.5, 19, 13, 4.2); c.fill(); c.stroke();
      c.fillStyle = '#ea6c0a';
      c.beginPath(); c.moveTo(9.8, 9); c.lineTo(16.2, 12); c.lineTo(9.8, 15); c.closePath(); c.fill();
    } else if (key === 'star' || key === 'star_empty') {
      c.fillStyle = key === 'star' ? '#ffca2c' : '#d9e0d0';
      c.strokeStyle = key === 'star' ? '#a66205' : '#9aa896'; c.lineWidth = 1.7;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 === 0 ? 9.2 : 4.2;
        if (i === 0) c.moveTo(12 + Math.cos(a) * rad, 12.5 + Math.sin(a) * rad);
        else c.lineTo(12 + Math.cos(a) * rad, 12.5 + Math.sin(a) * rad);
      }
      c.closePath(); c.fill(); c.stroke();
    } else if (key === 'lock') {
      c.strokeStyle = '#ffe082'; c.lineWidth = 2.2;
      c.beginPath(); c.arc(12, 9.5, 4, Math.PI, 0); c.stroke();
      c.fillStyle = '#ffca2c'; c.strokeStyle = ink; c.lineWidth = 1.6;
      c.beginPath(); c.roundRect(6, 10, 12, 9.5, 2.5); c.fill(); c.stroke();
    } else if (key === 'check') {
      c.fillStyle = '#22c55e'; c.beginPath(); c.arc(12, 12, 9.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.8;
      c.beginPath(); c.moveTo(7.5, 12.2); c.lineTo(10.8, 15.5); c.lineTo(16.8, 8.8); c.stroke();
    } else if (key === 'play') {
      c.fillStyle = '#187a42';
      c.beginPath(); c.moveTo(8.5, 5.8); c.lineTo(19, 12); c.lineTo(8.5, 18.2); c.closePath(); c.fill();
    } else if (key === 'pause') {
      c.fillStyle = strokeCol;
      c.beginPath(); c.roundRect(6.5, 5.5, 4, 13, 2); c.roundRect(13.5, 5.5, 4, 13, 2); c.fill();
    } else if (key === 'sound' || key === 'muted') {
      c.fillStyle = strokeCol;
      c.beginPath(); c.moveTo(4, 9.5); c.lineTo(8.2, 9.5); c.lineTo(13, 5.2); c.lineTo(13, 18.8); c.lineTo(8.2, 14.5); c.lineTo(4, 14.5); c.closePath(); c.fill();
      c.strokeStyle = strokeCol; c.lineWidth = 2.2;
      if (key === 'sound') {
        c.beginPath(); c.arc(13.5, 12, 3.6, -.85, .85); c.stroke();
        c.beginPath(); c.arc(13.5, 12, 6.8, -.85, .85); c.stroke();
      } else {
        c.strokeStyle = '#ef4444';
        c.beginPath(); c.moveTo(16, 9); c.lineTo(20.8, 15); c.moveTo(20.8, 9); c.lineTo(16, 15); c.stroke();
      }
    } else if (key === 'close') {
      c.strokeStyle = strokeCol; c.lineWidth = 3.0;
      c.beginPath(); c.moveTo(7, 7); c.lineTo(17, 17); c.moveTo(17, 7); c.lineTo(7, 17); c.stroke();
    } else if (key === 'right') {
      c.strokeStyle = strokeCol; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(9.2, 6.2); c.lineTo(15.4, 12); c.lineTo(9.2, 17.8); c.stroke();
    } else if (key === 'gesture') {
      c.fillStyle = '#ffe0bd'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.roundRect(9.5, 4, 4.4, 11, 2.2); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(7, 11, 10.5, 9, 4.2); c.fill(); c.stroke();
    } else if (key === 'merge') {
      c.fillStyle = '#ff9338'; c.strokeStyle = ink; c.lineWidth = 1.6;
      c.beginPath(); c.arc(7, 12, 4.2, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#68dfea'; c.beginPath(); c.arc(17, 12, 4.2, 0, Math.PI * 2); c.fill(); c.stroke();
    } else if (key === 'bars') {
      const hs = [[4.5, 13, 7, '#ff7b7b'], [10.2, 6, 14, '#ffd24c'], [15.9, 9.5, 10.5, '#4be0a0']];
      c.strokeStyle = ink; c.lineWidth = 1.5;
      for (const [x, y, h, col] of hs) { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, 4.2, h, 2); c.fill(); c.stroke(); }
    } else if (key === 'disc') {
      c.fillStyle = '#384452'; c.strokeStyle = ink; c.lineWidth = 1.7;
      c.beginPath(); c.arc(12, 12, 9, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#ff9d47'; c.beginPath(); c.arc(12, 12, 3.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(12, 12, 1.3, 0, Math.PI * 2); c.fill();
    } else if (key === 'music') {
      c.fillStyle = '#a855f7'; c.strokeStyle = ink; c.lineWidth = 1.8;
      c.beginPath(); c.arc(7.5, 16.5, 2.8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.arc(16.5, 14.5, 2.8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(10, 16); c.lineTo(10, 6); c.lineTo(19, 4.2); c.lineTo(19, 14); c.stroke();
    }
  }

  function icon(canvas, override) {
    const box = fit(canvas); if (!box) return;
    const { c, w, h } = box, size = Math.min(w, h), key = override || canvas.dataset.icon;
    c.save(); c.translate((w - size) / 2, (h - size) / 2); c.scale(size / 24, size / 24);
    drawCustomIcon(c, key, getComputedStyle(canvas).color);
    c.restore();
  }

  function iconNode(id, cls = '') {
    const el = document.createElement('canvas');
    el.dataset.icon = id; if (cls) el.className = cls; el.ariaHidden = 'true';
    return el;
  }
  function element(tag, cls, content) { const e = document.createElement(tag); if (cls) e.className = cls; if (content !== undefined) e.textContent = content; return e; }

  function portrait(canvas, level, time, opts = {}) {
    const box = fit(canvas); if (!box) return;
    const { c, w, h } = box, r = Math.min(w * .36, h * .36);
    art.sticker(c, level, w * .5, h * .57, r, time, opts);
  }

  const palettes = {
    cartoon:   ['#76be9d', '#4ea37d', '#1c4236', '#ffd85e', '#effff5'],
    toy3d:     ['#3b6a7d', '#244757', '#132730', '#7cf2e2', '#e8fbff'],
    metal:     ['#537485', '#34505e', '#192a33', '#e0f7a0', '#dce9ed'],
    glass:     ['#2d8b9c', '#1a6170', '#0c313b', '#d8fbff', '#e5ffff'],
    neon:      ['#28134f', '#4b1f82', '#120829', '#ff54c8', '#7cf7ff'],
    plush:     ['#b88394', '#945d70', '#4f2c3a', '#ffe299', '#fff0f2'],
    pixel:     ['#61659e', '#44487d', '#232640', '#ffd76b', '#e7e5f7'],
    gummy:     ['#de9e62', '#bf763b', '#5e2f0a', '#fff3a8', '#fffaf0'],
    porcelain: ['#7696b8', '#4f7196', '#1b3863', '#ffffff', '#f0f7ff'],
    sakura:    ['#c4819e', '#9c5c7a', '#57243d', '#fff0f5', '#fff8fa'],
    holo:      ['#4e6499', '#4d4682', '#20264d', '#86f7e8', '#ffffff']
  };

  function oval(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  function polygon(c, points, fill) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fill; c.fill(); }
  function glimmer(c, x, y, r, color) { polygon(c, [[x, y - r], [x + r * .22, y - r * .21], [x + r, y], [x + r * .2, y + r * .19], [x, y + r], [x - r * .19, y + r * .22], [x - r, y], [x - r * .19, y - r * .22]], color); }

  function cover(canvas, skinKey, stageKey, t, hop = 0) {
    const size = fit(canvas); if (!size) return;
    const { c, w, h } = size;
    const [topCol, midCol, ink, accent, spark] = palettes[stageKey || skinKey] || palettes.cartoon;

    // Vibrant full-bleed sky-to-stage game backdrop
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, topCol);
    g.addColorStop(0.58, midCol);
    g.addColorStop(1, ink);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    // Slowly rotating casual-game sunburst rays behind logo & mascots
    c.save();
    c.translate(w * 0.5, h * 0.42);
    c.rotate(t * 0.12);
    const maxR = Math.hypot(w, h);
    c.fillStyle = 'rgba(255, 255, 255, 0.09)';
    for (let i = 0; i < 12; i++) {
      const a0 = (i * Math.PI * 2) / 12;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, maxR, a0, a0 + Math.PI / 12);
      c.closePath();
      c.fill();
    }
    c.restore();

    // Soft curved arcade stage hill in lower half
    c.fillStyle = 'rgba(255, 255, 255, 0.18)';
    c.beginPath();
    c.ellipse(w * 0.5, h * 0.72, w * 0.78, h * 0.28, 0, 0, Math.PI * 2);
    c.fill();

    // Floating twinkles
    for (const [nx, ny, r, ph] of [[.18, .28, 10, 0], [.82, .26, 9, 1.5], [.26, .52, 7, 3.1], [.78, .48, 8, 4.2]]) {
      const pulse = 0.65 + 0.35 * Math.sin(t * 2.6 + ph);
      glimmer(c, w * nx, h * ny, r * pulse, spark);
    }

    // 3 big lively interactive mascots standing center-stage (positioned comfortably below lowered logo)
    const scale = Math.min(w, h * 0.85);
    const bounce = hop > 0 ? Math.sin(hop * Math.PI) * 24 : 0;
    const heads = [
      [1, .24, .52, .142, -.12],
      [3, .76, .51, .146, .12],
      [0, .50, .55, .208, -.04]
    ];
    for (const [level, nx, ny, rr, angle] of heads) {
      const idleBob = Math.sin(t * 2.8 + level * 1.4) * 5;
      const x = nx * w;
      const y = ny * h + idleBob - bounce * (level === 0 ? 1.15 : .75);
      const r = scale * rr;
      c.save(); c.translate(x, y); c.rotate(angle);
      oval(c, 2, r * .88 - idleBob * 0.5 + bounce * .5, r * .92, r * .16, 'rgba(14,32,26,.28)');
      art.sticker(c, level, 0, 0, r, t + level * .34, { skin: skinKey, seed: level + 1.4, still: true, mode: hop > 0 ? 'glee' : 'idle' });
      c.restore();
    }
  }

  function preview(canvas, skinKey, stageKey, t) {
    const box = fit(canvas); if (!box) return;
    const { c, w, h } = box;
    art.drawStage(c, w, h, stageKey, t, false);
    const ss = Math.min(w * .155, h * .31);
    for (const [i, n, r, rot] of [[1, .225, .64, -.11], [0, .50, 1.02, -.055], [3, .773, .76, .105]]) {
      c.save(); c.translate(w * n, h * .64); c.rotate(rot);
      oval(c, 0, ss * r * .79, ss * r * .82, ss * r * .11, 'rgba(20,32,38,.22)');
      art.sticker(c, i, 0, 0, ss * r, t + i * .4, { skin: skinKey, seed: 1.32 + i, still: true }); c.restore();
    }
  }

  function drawWheel(canvas, angle) {
    const box = fit(canvas); if (!box) return;
    const { c, w, h } = box;
    const cx = w / 2, cy = h / 2, rad = Math.min(w, h) * .44;
    const prizes = Jelly.club.wheelPrizes;
    const step = (Math.PI * 2) / prizes.length;

    c.save();
    c.translate(cx, cy);
    c.rotate(angle);
    for (let i = 0; i < prizes.length; i++) {
      const a0 = -Math.PI / 2 - step / 2 + i * step;
      const a1 = a0 + step;
      c.fillStyle = prizes[i].color;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rad, a0, a1); c.closePath(); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();

      c.save();
      c.rotate(i * step);
      c.fillStyle = '#24352e';
      c.font = '900 12px "PingFang SC","Microsoft YaHei",sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(prizes[i].label, 0, -rad * .64);
      c.restore();
    }
    c.strokeStyle = '#ff9f2e'; c.lineWidth = 6;
    c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#fff9e0'; c.strokeStyle = '#7a3f04'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 18, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();

    c.save();
    c.fillStyle = '#ef4444'; c.strokeStyle = '#ffffff'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(cx, cy - rad + 12); c.lineTo(cx - 11, cy - rad - 10); c.lineTo(cx + 11, cy - rad - 10); c.closePath();
    c.fill(); c.stroke();
    c.restore();
  }

  class HUD {
    constructor(actions, progress) {
      this.actions = actions;
      this.progress = progress;
      this.modalTiles = [];
      this.lastPaint = -1;
      this.coverHop = 0;
      this.wheelAngle = 0;
      this.wheelSpinning = false;
      this.wheelCanvas = null;
      this.dialog = $('#dialog');
      this.body = $('#dialogBody');
      this.buttons = $('#dialogActions');
      this.scoreNodes = $$('[data-score]');
      this.bestNodes = $$('[data-best]');
      this.coinNodes = $$('[data-coins]');
      this.toastTimer = 0;
      this.tipTimer = 0;
      this.wardrobeTab = 'skin';
      this.dailyTab = 'checkin';

      const bind = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };
      bind('#pause', () => actions.panel('pause'));
      bind('#homeGuide', () => actions.panel('guide'));
      bind('#homeSettings', () => actions.panel('settings'));
      bind('#coverSkins', e => { e.stopPropagation(); actions.panel('skins'); });
      bind('#homeSkins', () => actions.panel('skins'));
      bind('#homeCheckin', () => actions.panel('checkin'));
      bind('#homeWheel', () => actions.panel('wheel'));
      bind('#homeBadges', () => actions.panel('badges'));
      bind('#freeCoinsBtn', () => actions.freeCoins());
      bind('#saveBtn', () => actions.emergencySave());
      bind('#newCharBanner', () => actions.claimNewCharDouble());
      bind('#sound', actions.sound);
      bind('#numToggle', actions.toggleNumbers);
      bind('#start', actions.start);

      bind('#sleeveBox', () => { this.coverHop = 1; actions.pokeMascot?.(); });

      $$('.prop-btn[data-prop]').forEach(btn => { btn.onclick = () => actions.triggerProp(btn.dataset.prop); });

      this.dialog.addEventListener('cancel', e => { e.preventDefault(); actions.dismiss(); });
      this.dialog.addEventListener('click', e => {
        if (e.target !== this.dialog) return;
        const r = this.dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) actions.dismiss();
      });

      this.syncHome(false);
      this.syncNumToggle(progress.showNumbers);
      this.refresh();
      window.addEventListener('crewready', () => this.paint(performance.now() / 1000, true));
    }

    syncNumToggle(on) {
      const b = $('#numToggle'); if (!b) return;
      b.setAttribute('aria-pressed', String(on));
      const c = b.querySelector('canvas');
      if (c) { c.dataset.icon = on ? 'num' : 'num_off'; icon(c); }
    }

    syncHome(hasRun) {
      const p = this.progress;
      const skinTheme = art.themes[p.skin] || art.themes.cartoon;
      const stageTheme = art.themes[p.activeStage] || skinTheme;

      const setTxt = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
      setTxt('#coverStage', p.stageMode === 'auto' ? skinTheme.name : `${skinTheme.name}·${stageTheme.stage}`);
      this.coinNodes.forEach(n => n.textContent = p.coins);
      this.bestNodes.forEach(n => n.textContent = p.modeBest.endless || p.stats.record);

      const checkinDot = $('#checkinDot'); if (checkinDot) checkinDot.hidden = !p.hasClaimableDaily();
      const wheelDot = $('#wheelDot'); if (wheelDot) wheelDot.hidden = !p.canFreeWheel();
      const badgeDot = $('#badgeDot'); if (badgeDot) badgeDot.hidden = p.unclaimedBadges().length === 0;
      setTxt('#startLabel', hasRun ? '继续游戏' : '开始游戏');
    }

    syncProps(activePropId = null) {
      const p = this.progress;
      $$('.prop-btn[data-prop]').forEach(btn => {
        const id = btn.dataset.prop;
        const count = p.props[id] || 0;
        const badge = btn.querySelector('.prop-count');
        const label = btn.querySelector('.prop-label');
        if (id === 'freeze' && label) label.textContent = '双倍冻';
        if (badge) {
          badge.textContent = String(count);
          badge.classList.toggle('is-empty', count <= 0);
        }
        btn.classList.toggle('is-active', activePropId === id);
      });
    }

    updateTimer() {}

    updateGoalBar(mode, levelObj, state) {
      const sec = Math.floor(state.elapsed || 0);
      const m = Math.floor(sec / 60), rem = sec % 60;
      const timeEl = $('#hudTime');
      if (timeEl) timeEl.textContent = `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
      const phaseEl = $('#hudPhase');
      if (phaseEl) {
        const tierNames = ['热身节奏', '地板抬升', '冰封危机', '终极狂潮'];
        const tIdx = state.endlessTier || 0;
        if (state.doubleLeft > 0) {
          phaseEl.textContent = `双倍冻 · ${Math.ceil(state.doubleLeft)}s`;
          phaseEl.className = 'hud-phase-pill is-double';
        } else {
          phaseEl.textContent = tierNames[tIdx] || '热身节奏';
          phaseEl.className = 'hud-phase-pill' + (tIdx >= 2 ? ' is-boss' : '');
        }
      }
    }

    floatTip(text, autoHideMs = 0) {
      const el = $('#floatTip'); if (!el) return;
      clearTimeout(this.tipTimer);
      if (!text) { el.hidden = true; return; }
      el.textContent = text; el.hidden = false;
      if (autoHideMs > 0) this.tipTimer = setTimeout(() => { el.hidden = true; }, autoHideMs);
    }

    showEmergencySave(show) {
      const btn = $('#saveBtn');
      if (btn) { btn.hidden = !show; if (show) btn.querySelectorAll('[data-icon]').forEach(e => icon(e)); }
    }

    showNewCharBanner(name) {
      const b = $('#newCharBanner');
      if (!b) return;
      if (!name) { b.hidden = true; return; }
      $('#newCharText').textContent = `新伙伴「${name}」加入！点此双倍领 +50 币`;
      b.hidden = false;
      b.querySelectorAll('[data-icon]').forEach(e => icon(e));
    }

    home(show, hasRun) {
      $('#home').hidden = !show;
      $('#gameView').inert = show;
      $('#gameView').setAttribute('aria-hidden', String(show));
      $('#gameView').classList.toggle('behind', show);
      if (show) { this.syncHome(hasRun); this.paint(0, true); this.refresh(); }
    }

    refresh() { $$('[data-icon]').forEach(e => icon(e)); this.paint(0, true); }

    paint(t, force = false) {
      if (this.coverHop > 0) { this.coverHop = Math.max(0, this.coverHop - 0.08); force = true; }
      if (!force && t >= this.lastPaint && t - this.lastPaint < .04) return;
      this.lastPaint = t;
      if (!$('#home').hidden && !this.dialog.open) cover($('#sleeveArt'), this.progress.skin, this.progress.activeStage, t, this.coverHop);
      if (this.page === 'skins' && this.previewCanvas) preview(this.previewCanvas, this.previewSkin, this.previewStage, t);
      if (this.page === 'wheel' && this.wheelCanvas && !this.wheelSpinning) drawWheel(this.wheelCanvas, this.wheelAngle);
      for (const tile of this.modalTiles) {
        if (tile.small) {
          const b = fit(tile.canvas);
          if (b) {
            if (tile.isStage) art.drawStage(b.c, b.w, b.h, tile.stage, t, false);
            else art.sticker(b.c, tile.level, b.w * .50, b.h * .62, Math.min(b.w * .31, b.h * .31), t, { skin: tile.skin, seed: 2.45, still: true });
          }
        } else {
          portrait(tile.canvas, tile.level, t * .75 + tile.level * .5, { mode: tile.mode || 'idle' });
        }
      }
    }

    score(n, best, bump = false) {
      this.scoreNodes.forEach(e => e.textContent = String(n).padStart(4, '0'));
      this.bestNodes.forEach(e => e.textContent = best);
      if (bump) { const el = $('.score'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    }
    queue(slots) { $('#queueText').textContent = slots.map((s, i) => (i + 1) + '号位 ' + (s.wild ? '彩虹万能球' : crew[s.level].name)).join('。'); }
    audio(on) {
      const b = $('#sound'); if (!b) return;
      const text = on ? '关闭声音' : '开启声音';
      b.setAttribute('aria-label', text); b.setAttribute('aria-pressed', String(on)); b.title = text;
      const c = b.querySelector('canvas'); if (c) { c.dataset.icon = on ? 'sound' : 'muted'; icon(c); }
    }
    announce(text) { $('#announce').textContent = text; }
    cheer(text) { const e = $('#callout'); e.textContent = text; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }

    toast(text, iconName = 'medal') {
      clearTimeout(this.toastTimer);
      const inModal = this.dialog.open;
      const target = inModal ? $('#dialogToast') : $('#toast');
      const other = inModal ? $('#toast') : $('#dialogToast');
      if (other) other.hidden = true;
      if (!target) return;
      target.querySelector('span').textContent = text;
      const ic = target.querySelector('canvas');
      ic.dataset.icon = iconName || 'medal';
      target.hidden = false;
      icon(ic);
      this.toastTimer = setTimeout(() => { target.hidden = true; }, 2000);
    }

    badgesEarned(items) {
      if (!items || !items.length) return;
      this.toast(`获得奖杯「${items[0].name}」（+${items[0].reward}币）`, 'trophy');
    }

    resetFx() { $('#callout').classList.remove('show'); $('#danger').hidden = true; this.floatTip(''); this.showEmergencySave(false); this.showNewCharBanner(''); }
    danger(value) { $('#danger').hidden = !value; }
    rule(id, title, body) { const row = element('div', 'rule'), side = element('div'); row.append(iconNode(id), side); side.append(element('strong', '', title), element('p', '', body)); this.body.append(row); }
    button(label, click, variant = '', iconId = '') {
      const b = element('button', 'action' + (variant ? ' ' + variant : ''));
      if (iconId) b.append(iconNode(iconId));
      b.append(element('span', '', label));
      b.onclick = click;
      this.buttons.append(b);
      return b;
    }

    animateWheelTo(targetIdx, onDone) {
      if (!this.wheelCanvas || this.wheelSpinning) return;
      this.wheelSpinning = true;
      const prizes = Jelly.club.wheelPrizes;
      const step = (Math.PI * 2) / prizes.length;
      const startAngle = this.wheelAngle;
      const desiredMod = ((-targetIdx * step) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const currentMod = ((startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let delta = desiredMod - currentMod;
      if (delta <= 0) delta += Math.PI * 2;
      const totalSpin = Math.PI * 2 * 4 + delta;
      const t0 = performance.now(), dur = 1650;

      const stepAnim = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - k, 3);
        this.wheelAngle = startAngle + totalSpin * ease;
        if (this.wheelCanvas) drawWheel(this.wheelCanvas, this.wheelAngle);
        if (k < 1) requestAnimationFrame(stepAnim);
        else { this.wheelSpinning = false; onDone?.(); }
      };
      requestAnimationFrame(stepAnim);
    }

    wheelModal() {
      const p = this.progress;
      const canFree = p.canFreeWheel();
      const adLeft = p.wheelAdLeft();
      const toPity = Math.max(1, 5 - (p.wheel.pity || 0));

      const wrap = element('div', 'wheel-wrap');
      this.wheelCanvas = element('canvas', 'wheel-canvas');
      wrap.append(this.wheelCanvas);
      this.body.append(wrap);
      this.body.append(element('div', 'wheel-pity', `再抽 ${toPity} 次必中限定皮肤或 300 音符币大奖！`));

      setTimeout(() => { if (this.wheelCanvas) drawWheel(this.wheelCanvas, this.wheelAngle); }, 10);

      if (canFree) {
        const b = this.button('今日免费抽 1 次', () => {
          if (this.wheelSpinning) return;
          b.disabled = true;
          this.actions.spinWheel(false);
        }, '', 'wheel');
      } else if (adLeft > 0) {
        const b = this.button(`免费再抽 1 次（剩 ${adLeft} 次）`, () => {
          if (this.wheelSpinning) return;
          b.disabled = true;
          this.actions.spinWheel(true);
        }, 'ad-btn', 'video');
      } else {
        this.button('今日次数已用完，明天再来', this.actions.dismiss, 'secondary');
      }
    }

    checkinModal() {
      const p = this.progress;
      p.ensureToday();

      const tabs = element('div', 'sheet-tabs');
      const t1 = element('button', 'sheet-tab' + (this.dailyTab === 'checkin' ? ' active' : ''), '每日签到');
      const t2 = element('button', 'sheet-tab' + (this.dailyTab === 'quests' ? ' active' : ''), '每日任务');
      t1.onclick = () => { this.dailyTab = 'checkin'; this.open('checkin', {}); };
      t2.onclick = () => { this.dailyTab = 'quests'; this.open('checkin', {}); };
      tabs.append(t1, t2);
      this.body.append(tabs);

      if (this.dailyTab === 'checkin') {
        const can = p.canCheckinToday(), nextIdx = p.nextCheckinDayIndex();
        this.body.append(element('p', 'sheet-note', can
          ? `今天是第 ${nextIdx + 1} 天，点橙色按钮可以直接双倍领取！`
          : `今天已经领过啦（累计 ${p.checkin.total} 天），明天再来！`));

        const grid = element('div', 'checkin-grid');
        Jelly.club.checkinRewards.forEach((item, idx) => {
          const claimed = idx < (p.checkin.streak % 7) || (!can && idx === ((p.checkin.streak - 1 + 7) % 7));
          const isToday = can && idx === nextIdx;
          const card = element('div', 'checkin-card' + (idx === 6 ? ' day7' : '') + (claimed ? ' claimed' : '') + (isToday ? ' today' : ''));
          card.append(
            element('span', 'checkin-day', item.badge),
            iconNode(item.icon || 'gift', 'checkin-icon'),
            element('strong', '', item.title),
            element('small', '', claimed ? '已领取' : isToday ? '今日可领' : '待解锁')
          );
          grid.append(card);
        });
        this.body.append(grid);

        const demoRow = element('div', 'demo-row');
        const simBtn = element('button', 'quiet-btn', '试玩测试：跳到下一天');
        simBtn.onclick = () => this.actions.simulateNextDay();
        demoRow.append(simBtn);
        this.body.append(demoRow);

        if (can) {
          this.button('双倍领取', () => this.actions.claimCheckin(true), 'ad-btn', 'video');
          this.button('直接领取', () => this.actions.claimCheckin(false), 'secondary');
        } else {
          this.button('好哒', this.actions.dismiss);
        }
      } else {
        this.body.append(element('p', 'sheet-note', '每天完成 3 个小目标，即可开启今日大宝箱！'));
        const list = element('div', 'quest-list');
        for (const q of Jelly.club.dailyQuestDefs) {
          const cur = Math.min(q.target, p.daily[q.field] || 0);
          const done = cur >= q.target;
          const claimed = p.daily.claimed.includes(q.id);
          const row = element('div', 'quest-row' + (done ? ' done' : ''));
          const ic = element('span', 'quest-ic'); ic.append(iconNode(q.icon));
          const info = element('div', 'quest-info');
          info.append(element('strong', '', q.title), element('small', '', `进度 ${cur}/${q.target} · 奖 ${q.rewardText}`));
          row.append(ic, info);
          if (done && !claimed) {
            const cb = element('button', 'claim-btn', '领取');
            cb.onclick = () => this.actions.claimDailyQuest(q.id);
            row.append(cb);
          } else {
            row.append(element('b', 'badge-count', claimed ? '已领' : `${cur}/${q.target}`));
          }
          list.append(row);
        }
        this.body.append(list);

        const doneAll = p.daily.claimed.length >= Jelly.club.dailyQuestDefs.length;
        const chest = element('div', 'chest-box');
        chest.append(iconNode('chest'));
        const cTxt = element('div');
        cTxt.append(
          element('strong', '', '今日大宝箱：150 音符币 + 彩虹球 ×1'),
          element('small', '', p.daily.chestClaimed ? '今日大宝箱已开启！' : doneAll ? '全部小目标已达成，快开箱！' : `已完成 ${p.daily.claimed.length} / 3 个任务`)
        );
        chest.append(cTxt);
        this.body.append(chest);

        if (doneAll && !p.daily.chestClaimed) {
          this.button('双倍开大宝箱', () => this.actions.claimDailyChest(true), 'ad-btn', 'video');
          this.button('普通开箱', () => this.actions.claimDailyChest(false), 'secondary');
        } else {
          this.button('去玩一局完成任务', () => { this.actions.dismiss(); this.actions.start(); });
        }
      }
    }

    wardrobe() {
      const p = this.progress;
      this.previewSkin = p.skin;
      this.previewStage = p.activeStage;

      const tabs = element('div', 'sheet-tabs');
      const tSkin = element('button', 'sheet-tab' + (this.wardrobeTab === 'skin' ? ' active' : ''), '角色皮肤');
      const tStage = element('button', 'sheet-tab' + (this.wardrobeTab === 'stage' ? ' active' : ''), '舞台背景');
      tSkin.onclick = () => { this.wardrobeTab = 'skin'; this.open('skins', {}); };
      tStage.onclick = () => { this.wardrobeTab = 'stage'; this.open('skins', {}); };
      tabs.append(tSkin, tStage);
      this.body.append(tabs);

      const stageBox = element('div', 'skin-preview');
      this.previewCanvas = element('canvas');
      const title = element('span', 'preview-stage');
      stageBox.append(this.previewCanvas, title);
      this.body.append(stageBox);

      const grid = element('div', 'swatch-grid');
      this.body.append(grid);

      const updateActionButtons = () => {
        this.buttons.replaceChildren();
        if (this.wardrobeTab === 'skin') {
          const key = this.previewSkin, d = art.themes[key];
          stageBox.dataset.stage = this.previewStage;
          title.textContent = `${d.name} · ${art.themes[this.previewStage].stage}`;
          if (p.isSkinUnlocked(key)) {
            this.button(key === p.skin ? '已穿戴' : `穿戴「${d.name}」`, () => this.actions.wear(key));
          } else {
            const cat = Jelly.club.skinCatalog[key];
            this.button('免费立刻解锁', () => this.actions.adUnlockSkin(key), 'ad-btn', 'video');
            this.button(`${cat.coins} 币解锁`, () => this.actions.buySkin(key), 'secondary', 'coin');
          }
        } else {
          const key = this.previewStage, d = art.themes[key];
          stageBox.dataset.stage = key;
          title.textContent = `舞台 · ${d.stage}`;
          if (p.isStageUnlocked(key)) {
            const isCurrent = p.stageMode === key || (p.stageMode === 'auto' && p.skin === key);
            this.button(isCurrent ? '当前舞台' : `使用「${d.stage}」`, () => this.actions.wearStage(key));
            if (p.stageMode !== 'auto') this.button('跟随皮肤', () => this.actions.wearStage('auto'), 'secondary');
          } else {
            const cat = Jelly.club.stageCatalog[key];
            this.button('免费立刻解锁', () => this.actions.adUnlockStage(key), 'ad-btn', 'video');
            this.button(`${cat.coins} 币解锁`, () => this.actions.buyStage(key), 'secondary', 'coin');
          }
        }
        this.button('关闭', this.actions.dismiss, 'close-btn');
        this.buttons.querySelectorAll('[data-icon]').forEach(e => icon(e));
        this.paint(performance.now() / 1000, true);
      };

      const pick = (key, playSample = false) => {
        if (this.wardrobeTab === 'skin') {
          this.previewSkin = key;
          if (p.stageMode === 'auto') this.previewStage = key;
          if (playSample) this.actions.previewSkinSound?.(key);
        } else {
          this.previewStage = key;
        }
        for (const b of grid.children) b.setAttribute('aria-pressed', String(b.dataset.key === key));
        updateActionButtons();
      };

      for (const [key, d] of Object.entries(art.themes)) {
        const unlocked = this.wardrobeTab === 'skin' ? p.isSkinUnlocked(key) : p.isStageUnlocked(key);
        const wearing = this.wardrobeTab === 'skin' ? p.skin === key : p.activeStage === key;
        const b = element('button', 'swatch' + (unlocked ? '' : ' locked'));
        b.dataset.key = key;
        const chip = element('div', 'swatch-picture'); chip.style.backgroundColor = d.shade;
        const pic = element('canvas'); chip.append(pic);
        if (!unlocked) {
          const tag = element('span', 'lock-tag'); tag.append(iconNode('lock'), element('span', '', '免费')); chip.append(tag);
        }
        const line = element('span', 'swatch-name', this.wardrobeTab === 'skin' ? d.name : d.stage);
        if (wearing) line.append(iconNode('check', 'wearing'));
        b.append(chip, line); b.onclick = () => pick(key, true); grid.append(b); art.imageFor(key);
        this.modalTiles.push(
          this.wardrobeTab === 'skin'
            ? { canvas: pic, level: 0, skin: key, small: true }
            : { canvas: pic, stage: key, small: true, isStage: true }
        );
      }
      pick(this.wardrobeTab === 'skin' ? this.previewSkin : this.previewStage, false);
    }

    levelsModal() {
      const p = this.progress, maxUnlocked = p.highestUnlockedLevel();
      const totalStars = Object.values(p.levelStars).reduce((a, b) => a + b, 0);
      this.body.append(element('p', 'sheet-note', `12 个趣味物理机关关卡 · 已收集 ${totalStars} / ${JellyLevels.length * 3} 颗金星`));
      const grid = element('div', 'level-grid');
      for (const lv of JellyLevels) {
        const stars = p.levelStars[lv.id] || 0, unlocked = lv.id <= maxUnlocked;
        const cls = 'level-card' + (lv.id === p.currentLevel ? ' active' : '') + (lv.gimmick === 'boss' ? ' is-boss' : '') + (unlocked ? '' : ' locked');
        const btn = element('button', cls);
        btn.disabled = !unlocked;
        btn.append(
          element('span', 'lv-num', `第 ${lv.id} 关`),
          element('span', 'lv-gimmick', lv.gimmickName),
          element('strong', '', lv.title)
        );
        const sRow = element('div', 'lv-stars');
        if (unlocked) { for (let i = 0; i < 3; i++) sRow.append(iconNode(i < stars ? 'star' : 'star_empty')); }
        else sRow.append(iconNode('lock'));
        btn.append(sRow);
        btn.onclick = () => this.actions.playLevel(lv.id);
        grid.append(btn);
      }
      this.body.append(grid);
    }

    badgesModal() {
      const all = Jelly.club.badges, s = this.progress.stats;
      this.body.append(element('p', 'sheet-note', `已点亮 ${this.progress.earned().length} / ${all.length} 个奖杯`));
      const list = element('div', 'badges-list');
      this.body.append(list);
      for (const b of all) {
        const n = Math.min(b.max, b.read(s)), done = n >= b.max, claimed = this.progress.claimedBadges.includes(b.id);
        const row = element('div', 'badge-row' + (done ? ' done' : ''));
        const stamp = element('span', 'badge-stamp'); stamp.append(iconNode(b.icon));
        const content = element('div', 'badge-content');
        content.append(element('strong', '', b.name), element('small', '', `${b.goal}（+${b.reward}币）`));
        const rail = element('span', 'badge-bar'), fill = element('i'); fill.style.width = (n / b.max * 100) + '%'; rail.append(fill); content.append(rail);
        row.append(stamp, content);
        if (done && !claimed) {
          const claimBtn = element('button', 'claim-btn', `领 ${b.reward}`);
          claimBtn.onclick = () => this.actions.claimBadge(b.id);
          row.append(claimBtn);
        } else {
          const fmtTime = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
          const formatted = (b.id === 'silver' || b.id === 'all')
            ? (n ? String(2 ** n) : '0') + '/' + (2 ** b.max)
            : (b.id === 'survive3' || b.id === 'survive6')
              ? `${fmtTime(n)} / ${fmtTime(b.max)}`
              : `${n}/${b.max}`;
          row.append(element('b', 'badge-count', claimed ? '已领取' : formatted));
        }
        list.append(row);
      }
    }

    guideModal() {
      const p = this.progress;
      const head = element('div', 'band-header');
      const txt = element('div');
      txt.append(
        element('strong', '', `角色声音图鉴（已收集 ${p.discovered.length} / ${crew.length}）`),
        element('small', '', '合出新角色自动点亮，点击已解锁角色即可试听它的专属乐器声！')
      );
      const concertBtn = element('button', 'band-play-btn');
      concertBtn.append(iconNode('music'), element('span', '', '全员合奏'));
      concertBtn.onclick = () => this.actions.playBandConcert(p.discovered);
      head.append(txt, concertBtn);
      this.body.append(head);

      const list = element('div', 'atlas-all');
      crew.forEach((d, i) => {
        const unlocked = p.discovered.includes(i);
        const item = element('div', 'atlas-item ' + (unlocked ? 'is-discovered' : 'is-locked'));
        const pic = element('canvas');
        item.style.setProperty('--tone', d.color);
        item.append(pic, element('strong', '', unlocked ? d.name : '未解锁'), element('b', '', String(d.value)));
        const tile = { canvas: pic, level: i, mode: 'idle' };
        if (unlocked) {
          item.onclick = () => {
            tile.mode = 'glee';
            this.actions.playBandNote(i);
            setTimeout(() => { tile.mode = 'idle'; }, 600);
          };
        }
        list.append(item);
        this.modalTiles.push(tile);
      });
      this.body.append(list);
    }

    setting(text, description, checked, fn, available = true) {
      const row = element('button', 'setting'); row.type = 'button'; row.setAttribute('role', 'switch'); row.setAttribute('aria-checked', String(checked && available)); row.disabled = !available;
      const box = element('span'); box.append(element('strong', '', text)); if (description) box.append(element('small', '', description));
      row.append(box, element('i', 'switch'));
      row.onclick = () => { const n = row.getAttribute('aria-checked') !== 'true'; fn(n); row.setAttribute('aria-checked', String(n)); };
      this.body.append(row);
    }

    addResultHero(level, mood, starsCount = 0) {
      const hero = element('div', 'result-hero');
      const mascot = element('canvas', 'result-mascot');
      hero.append(mascot);
      this.modalTiles.push({ canvas: mascot, level, mode: mood });
      if (starsCount > 0) {
        const sr = element('div', 'clear-stars-row');
        for (let i = 0; i < 3; i++) sr.append(iconNode(i < starsCount ? 'star' : 'star_empty'));
        hero.append(sr);
      }
      this.body.append(hero);
      return hero;
    }

    open(page, game) {
      this.page = page;
      this.body.replaceChildren();
      this.buttons.replaceChildren();
      this.modalTiles = [];
      this.previewCanvas = null;
      this.wheelCanvas = null;
      this.dialog.className = 'sheet sheet-' + page;

      const titles = {
        skins: '换装与舞台',
        checkin: '每日福利',
        wheel: '幸运转盘',
        badges: '我的奖杯',
        settings: '游戏设置',
        help: '玩法说明',
        guide: '角色图鉴',
        pause: '游戏暂停',
        prop_ad_prompt: '获取道具',
        confirm_restart: '重新开始',
        confirm_home: '返回主页',
        revive_prompt: '快挤满舞台啦！',
        loss: '本局结束',
        win: '终极黑胶达成！'
      };
      $('#dialogTitle').textContent = titles[page] || '提示';

      if (page === 'skins') {
        this.wardrobe();
      } else if (page === 'checkin') {
        this.checkinModal();
        this.button('关闭', this.actions.dismiss, 'close-btn');
      } else if (page === 'wheel') {
        this.wheelModal();
        this.button('关闭', this.actions.dismiss, 'close-btn');
      } else if (page === 'badges') {
        this.badgesModal();
        this.button('关闭', this.actions.dismiss, 'close-btn');
      } else if (page === 'guide') {
        this.guideModal();
        this.button('关闭', this.actions.dismiss, 'close-btn');
      } else if (page === 'settings') {
        const o = this.actions.options();
        this.setting('角色数字显示', '在每个果冻右下角显示合成数字', o.showNumbers, v => this.actions.setShowNumbers(v));
        this.setting('游戏音效', '', o.sound, v => this.actions.setSound(v));
        this.setting('背景音乐', '', o.music, v => this.actions.setMusic(v));
        this.setting('合成震动', o.supported ? '' : '当前设备不支持', o.vibration, v => this.actions.setVibration(v), o.supported);
        this.button('关闭', this.actions.dismiss, 'close-btn');
      } else if (page === 'help') {
        this.rule('gesture', '轻点直落 · 下滑瞄准 · 踩点暴击', '轻点任意果冻下方直接掉落，按住下滑可拉弹弓瞄准方向和力度；在节拍光环变金瞬间松手还能触发 2 倍暴击！');
        this.rule('infinity', '无尽挤压挑战', '顶部横杆会随时间加速下压，合成新果冻可缓慢抬升横杆；坚持到 3 分钟后底部地板会缓慢抬升并出现冰冻果冻，越往后越刺激！');
        this.rule('spark', '4 大战术道具', '小锤子消除或破冰，彩虹球碰谁升谁，双倍冻可冻住横杆 12 秒并双倍得分，抬杠可强力顶起上下横杆！');
        this.button('重看新手小手引导', () => this.actions.replayTutorial(), 'secondary');
        this.button('关闭', this.actions.dismiss, 'close-btn');
      } else if (page === 'pause') {
        const line = element('div', 'pause-score'), sticker = element('canvas');
        line.append(element('div', 'result-score', String(game.score)), sticker);
        this.body.append(element('p', 'sheet-note', '得分'), line);
        this.modalTiles.push({ canvas: sticker, level: game.slots[game.choice]?.level || 0 });
        this.button('继续游戏', this.actions.dismiss);
        this.button('重新开始', () => this.actions.panel('confirm_restart'), 'secondary');
        this.button('更换装扮', () => this.actions.panel('skins'), 'secondary');
        this.button('游戏设置', () => this.actions.panel('settings'), 'secondary');
        this.button('返回主页', () => this.actions.panel('confirm_home'), 'secondary');
      } else if (page === 'prop_ad_prompt') {
        const prop = (typeof JellyProps !== 'undefined' && JellyProps.find(x => x.id === game.pendingProp)) || { name: '道具', desc: '使用此道具帮助你化解危机。', icon: 'spark' };
        const card = element('div', 'prop-prompt-card');
        const ic = element('span', 'prop-prompt-ic'); ic.append(iconNode(prop.icon || 'spark'));
        const info = element('div');
        info.append(element('strong', '', prop.name), element('p', '', prop.desc));
        card.append(ic, info);
        this.body.append(card, element('p', 'sheet-note', '背包中暂无该道具，是否观看广告免费获取 1 次？'));
        this.button('是，看广告获取', () => this.actions.confirmPropAd(), 'ad-btn', 'video');
        this.button('否', this.actions.dismiss, 'secondary');
      } else if (page === 'confirm_restart') {
        this.body.append(element('p', 'sheet-note', '确定要放弃当前进度并重新开始一局吗？'));
        this.button('是，重新开始', this.actions.restart);
        this.button('否', this.actions.dismiss, 'secondary');
      } else if (page === 'confirm_home') {
        this.body.append(element('p', 'sheet-note', '确定要返回主页吗？当前对局进度会为你保留。'));
        this.button('是，返回主页', this.actions.home);
        this.button('否', this.actions.dismiss, 'secondary');
      } else if (page === 'revive_prompt') {
        const hero = this.addResultHero(Math.max(0, game.maxLevel || 0), 'squeeze');
        hero.append(
          element('div', 'result-score', String(game.score)),
          element('p', 'sheet-note', '是否使用免费复活？复活将恢复上下横杆并清空顶部果冻继续挑战！')
        );
        this.button('是，免费复活', () => this.actions.adRevive(), 'ad-btn', 'video');
        this.button('否，结束本局', () => this.actions.declineRevive(), 'secondary');
      } else if (page === 'loss') {
        const hero = this.addResultHero(Math.max(0, game.maxLevel || 0), 'sad');
        const sec = Math.floor(game.elapsed || 0);
        const timeStr = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
        hero.append(
          element('div', 'result-score', String(game.score)),
          element('p', 'sheet-note', `坚持 ${timeStr} · 最高 ${game.best} · 获得 +${game.earnedCoins || 0} 币`)
        );
        if (!game.doubledCoins && game.earnedCoins > 0) this.button(`双倍领币 (+${game.earnedCoins})`, () => this.actions.adDoubleCoins(), 'ad-btn', 'video');
        this.button('再来一局', this.actions.restart);
        this.button('回主页', this.actions.home, 'secondary');
      } else {
        const hero = this.addResultHero(Math.max(0, game.maxLevel || 19), 'glee', 3);
        hero.append(element('div', 'result-score', String(game.score)), element('p', 'sheet-note', `无尽最高 ${game.best} · 获得 +${game.earnedCoins || 0} 币`));
        this.button('再来一局', this.actions.restart);
        this.button('回主页', this.actions.home, 'secondary');
      }

      if (!this.dialog.open) this.dialog.showModal();
      this.dialog.scrollTop = 0; this.body.scrollTop = 0;
      this.refresh();
    }

    close() {
      if (this.dialog.open) this.dialog.close();
      const dt = $('#dialogToast'); if (dt) dt.hidden = true;
      this.modalTiles = []; this.page = null; this.previewCanvas = null; this.wheelCanvas = null;
    }
  }

  Jelly.UI = { HUD, icon };
})();

// V2: LIVE Israel (5.00-6.63) -> NETFLIX (6.70-7.95) -> DISNEY+ (8.00-9.05), tail whip-out to 9.35.
(() => {
  const { clamp, lerp, inv, ease, hash, rng, TAU } = A;
  const W = 1080, H = 1920;
  const eo = V.eo, eob = V.eob, eio = V.eio, ein = V.ein, lin = V.lin, rad = V.rad, glow = V.glow, rr = V.rr;
  const L = (k, w, h, f) => A.layer('v2o_' + k, w, h, f);
  const SC = {};
  const scratch = (k, w, h) => { let c = SC[k]; if (!c) { c = SC[k] = document.createElement('canvas'); c.width = w; c.height = h; } const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowColor = 'transparent'; g.clearRect(0, 0, w, h); return [c, g]; };
  const T_WA = 6.60, T_WA2 = 6.84, T_WC = 7.90, T_WC2 = 8.16, T_TAIL = 9.05;

  // ------------------------------------------------------------------ POSTER ART (original)
  const ptitle = (g, s, y, fill, size = 46, w = 300) => {
    g.save(); g.font = `900 ${size}px Rubik`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '3px';
    g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = fill; g.fillText(s, w / 2, y); g.restore();
  };
  const pframe = (g, w, h, draw, rim = 'rgba(255,255,255,.85)') => {
    g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 20); g.clip(); draw(g, w, h);
    g.fillStyle = lin(g, 0, 0, w, h, [[0, 'rgba(255,255,255,.22)'], [.35, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.28)']]); g.fillRect(0, 0, w, h);
    g.restore(); g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 19); g.lineWidth = 4; g.strokeStyle = rim; g.stroke();
  };
  const stars = (g, n, seed, w, h, ymax, col = '#fff') => { const r = rng(seed); for (let i = 0; i < n; i++) { g.globalAlpha = .3 + r() * .7; g.fillStyle = col; g.beginPath(); g.arc(r() * w, r() * ymax, .6 + r() * 1.6, 0, TAU); g.fill(); } g.globalAlpha = 1; };
  const figure = (g, x, base, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - 18 * s, base); g.lineTo(x - 14 * s, base - 70 * s); g.quadraticCurveTo(x - 12 * s, base - 92 * s, x - 5 * s, base - 96 * s); g.lineTo(x + 5 * s, base - 96 * s); g.quadraticCurveTo(x + 12 * s, base - 92 * s, x + 14 * s, base - 70 * s); g.lineTo(x + 18 * s, base); g.closePath(); g.fill(); g.beginPath(); g.arc(x, base - 108 * s, 12 * s, 0, TAU); g.fill(); };
  const POSTER = {
    midnight: () => L('p_mid', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#0b2a3d'], [.5, '#1f6470'], [1, '#03070c']]); g.fillRect(0, 0, w, h);
      stars(g, 40, 3, w, 200, 220, '#cfffff');
      g.fillStyle = rad(g, 150, 150, 0, 150, [[0, 'rgba(255,255,230,.95)'], [.3, 'rgba(190,240,235,.45)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, 320);
      g.fillStyle = '#f7fbe6'; g.beginPath(); g.arc(150, 150, 50, 0, TAU); g.fill();
      for (let i = 0; i < 4; i++) { g.fillStyle = lin(g, 0, 250 + i * 34, w, 250 + i * 34, [[0, 'rgba(160,220,220,0)'], [.5, `rgba(160,220,220,${.28 - i * .04})`], [1, 'rgba(160,220,220,0)']]); g.fillRect(0, 240 + i * 34, w, 60); }
      g.fillStyle = '#04090f'; g.beginPath(); g.moveTo(0, 400); for (let i = 0; i <= 10; i++) g.lineTo(i * 30, 380 - hash(i * 3) * 60 - (i % 2) * 20); g.lineTo(w, 400); g.fill();
      figure(g, 150, 372, 1.25, '#02050a'); g.fillStyle = '#02050a'; g.beginPath(); g.ellipse(150, 249, 25, 5, 0, 0, TAU); g.fill(); g.fillRect(138, 236, 24, 14);
      g.fillStyle = 'rgba(255,255,220,.35)'; g.beginPath(); g.ellipse(150, 384, 60, 8, 0, 0, TAU); g.fill();
      ptitle(g, 'MIDNIGHT', 415, '#e9fbff', 40);
    })),
    neon: () => L('p_neon', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#1a0640'], [.45, '#a3157e'], [.62, '#ff6a4a'], [.63, '#160a34'], [1, '#0a0420']]); g.fillRect(0, 0, w, h);
      g.save(); g.beginPath(); g.arc(150, 200, 80, 0, TAU); g.clip(); g.fillStyle = lin(g, 0, 120, 0, 280, [[0, '#ffe066'], [.5, '#ff5aa0'], [1, '#c01eb4']]); g.fillRect(60, 110, 180, 180); g.fillStyle = '#a3157e'; for (let i = 0; i < 6; i++) g.fillRect(60, 210 + i * 14, 180, 2 + i * 1.6); g.restore();
      const r = rng(11); g.fillStyle = '#0a0424'; g.beginPath(); g.moveTo(0, 280); let x = 0; while (x < w) { const bw = 20 + r() * 30, bh = 40 + r() * 90; g.lineTo(x, 280 - bh); g.lineTo(x + bw, 280 - bh); x += bw; } g.lineTo(w, 280); g.fill();
      const r2 = rng(12); for (let i = 0; i < 40; i++) { g.fillStyle = r2() > .5 ? '#5ad1ff' : '#ff4fa0'; g.fillRect(r2() * w, 180 + r2() * 95, 3, 4); }
      g.strokeStyle = '#38d9f5'; g.lineWidth = 2; g.shadowColor = '#38d9f5'; g.shadowBlur = 8;
      for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(150 + i * 12, 282); g.lineTo(150 + i * 60, 450); g.stroke(); }
      for (let i = 0; i < 6; i++) { const y = 282 + Math.pow(i / 5, 2) * 168; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.shadowBlur = 0; ptitle(g, 'NEON', 408, '#5ad1ff', 62);
    }, 'rgba(255,120,220,.9)')),
    forever: () => L('p_rom', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#4a1a6a'], [.35, '#ff6a8a'], [.6, '#ffb070'], [1, '#3a0f3a']]); g.fillRect(0, 0, w, h);
      g.fillStyle = rad(g, 150, 250, 0, 200, [[0, 'rgba(255,240,180,.9)'], [1, 'rgba(255,120,120,0)']]); g.fillRect(0, 60, w, 360);
      g.fillStyle = '#2a0a2c'; g.beginPath(); g.moveTo(0, 380); g.quadraticCurveTo(150, 290, w, 390); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      figure(g, 128, 338, 1, '#1a061c'); figure(g, 176, 336, 1.08, '#1a061c');
      g.fillStyle = '#ff3a6a'; g.shadowColor = '#ff3a6a'; g.shadowBlur = 22; g.beginPath(); g.moveTo(152, 226); g.bezierCurveTo(110, 190, 130, 152, 152, 176); g.bezierCurveTo(174, 152, 194, 190, 152, 226); g.fill(); g.shadowBlur = 0;
      const r = rng(5); for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(255,${150 + r() * 60 | 0},${170 + r() * 60 | 0},${.5 + r() * .4})`; g.beginPath(); g.ellipse(r() * w, r() * 300, 4, 2, r() * 3, 0, TAU); g.fill(); }
      ptitle(g, 'FOREVER', 415, '#fff0f4', 42);
    })),
    orbit: () => L('p_orb', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#040a2c'], [.6, '#122a7a'], [1, '#050818']]); g.fillRect(0, 0, w, h); stars(g, 90, 8, w, h, h, '#dfe8ff');
      g.save(); g.translate(160, 210); g.rotate(-.35);
      g.strokeStyle = 'rgba(255,200,140,.55)'; g.lineWidth = 12; g.beginPath(); g.ellipse(0, 0, 150, 34, 0, Math.PI, TAU); g.stroke();
      g.fillStyle = rad(g, -30, -30, 6, 96, [[0, '#ffc47a'], [.55, '#e0662c'], [1, '#5a1a1a']]); g.beginPath(); g.arc(0, 0, 88, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,215,160,.9)'; g.lineWidth = 12; g.beginPath(); g.ellipse(0, 0, 150, 34, 0, 0, Math.PI); g.stroke(); g.restore();
      g.save(); g.translate(72, 340); g.rotate(-.5); g.fillStyle = '#e9f1ff'; g.beginPath(); g.moveTo(-26, 0); g.lineTo(10, -8); g.lineTo(34, 0); g.lineTo(10, 8); g.closePath(); g.fill(); g.fillStyle = '#5ad1ff'; g.fillRect(-8, -10, 10, 5);
      g.fillStyle = lin(g, -26, 0, -120, 0, [[0, 'rgba(255,190,90,.9)'], [1, 'rgba(255,190,90,0)']]); g.beginPath(); g.moveTo(-26, -4); g.lineTo(-120, 0); g.lineTo(-26, 4); g.fill(); g.restore();
      ptitle(g, 'ORBIT', 412, '#dfe8ff', 54);
    }, 'rgba(160,200,255,.9)')),
    hunted: () => L('p_hun', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = '#050204'; g.fillRect(0, 0, w, h);
      g.fillStyle = rad(g, 150, 200, 0, 200, [[0, 'rgba(255,60,50,.95)'], [.25, 'rgba(200,20,30,.55)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,90,80,.55)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { const x = i * 37.5; g.beginPath(); g.moveTo(150, 200); g.lineTo(x, 0); g.moveTo(150, 200); g.lineTo(x, 400); g.stroke(); }
      for (let i = 1; i < 7; i++) { const s = i / 7; g.strokeRect(150 - 150 * s, 200 - 200 * s, 300 * s, 400 * s); }
      g.fillStyle = '#ff3a30'; g.fillRect(120, 178, 60, 44);
      figure(g, 150, 232, .5, '#020102');
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.5; const r = rng(2); for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 22); g.stroke(); }
      ptitle(g, 'HUNTED', 412, '#ff4a40', 50);
    }, 'rgba(255,90,80,.9)')),
    balloons: () => L('p_bal', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#4ab8ff'], [.6, '#bfe6ff'], [1, '#fff2c0']]); g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.95)'; [[60, 300, 50], [130, 320, 60], [230, 300, 55], [180, 130, 40], [60, 90, 34]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r * .8, y + 8, r * .8, 0, TAU); g.arc(x - r * .8, y + 10, r * .7, 0, TAU); g.fill(); });
      const B = [[150, 170, 62, '#ff4a5a', '#ffd23a'], [76, 250, 42, '#3a7bff', '#5ad1ff'], [230, 240, 46, '#a05bff', '#ff8ad0']];
      B.forEach(([x, y, r, c1, c2]) => { g.strokeStyle = 'rgba(80,60,40,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - r * .5, y + r * .9); g.lineTo(x - 8, y + r * 1.5); g.moveTo(x + r * .5, y + r * .9); g.lineTo(x + 8, y + r * 1.5); g.stroke(); g.fillStyle = '#7a4a2a'; g.fillRect(x - 10, y + r * 1.5, 20, 14);
        g.fillStyle = rad(g, x - r * .3, y - r * .3, 4, r * 1.2, [[0, c2], [1, c1]]); g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.5, y - r * .1, x - r * .9, y - r * 1.3, x, y - r * 1.2); g.bezierCurveTo(x + r * .9, y - r * 1.3, x + r * 1.5, y - r * .1, x, y + r); g.fill();
        g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - r * .35, y - r * .5, r * .16, r * .34, .5, 0, TAU); g.fill(); });
      g.fillStyle = '#5cc86a'; g.beginPath(); g.moveTo(0, 390); g.quadraticCurveTo(150, 340, w, 395); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      ptitle(g, 'UP HIGH', 418, '#ffffff', 42);
    }, 'rgba(255,255,255,.95)')),
    voyage: () => L('p_voy', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#0a2a5a'], [.45, '#ff9a5a'], [.62, '#ffd08a'], [.63, '#0d4a7a'], [1, '#051a3a']]); g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(230, 130, 32, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,240,180,.25)'; g.beginPath(); g.arc(230, 130, 60, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,220,140,.5)'; for (let i = 0; i < 10; i++) g.fillRect(150 + hash(i) * 120, 285 + i * 12, 40 + hash(i + 3) * 60, 3);
      g.fillStyle = '#1a0f1a'; g.beginPath(); g.moveTo(80, 300); g.lineTo(230, 300); g.lineTo(210, 322); g.lineTo(100, 322); g.fill(); g.fillRect(154, 150, 5, 150);
      g.fillStyle = '#f7e9c8'; g.beginPath(); g.moveTo(158, 156); g.quadraticCurveTo(220, 210, 208, 285); g.lineTo(158, 285); g.fill(); g.beginPath(); g.moveTo(150, 170); g.quadraticCurveTo(98, 220, 104, 285); g.lineTo(150, 285); g.fill();
      g.fillStyle = '#0b3a6a'; g.beginPath(); g.moveTo(0, 340); for (let x = 0; x <= 300; x += 15) g.lineTo(x, 335 + Math.sin(x * .09) * 8); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#082a52'; g.beginPath(); g.moveTo(0, 380); for (let x = 0; x <= 300; x += 15) g.lineTo(x, 372 + Math.sin(x * .07 + 2) * 10); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      ptitle(g, 'VOYAGE', 416, '#fff2c0', 46);
    }, 'rgba(255,220,150,.95)')),
    royal: () => L('p_roy', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#3a2a9a'], [.5, '#c07aff'], [1, '#ffb0d8']]); g.fillRect(0, 0, w, h); stars(g, 40, 9, w, 260, 260, '#fff');
      g.fillStyle = '#5a3aa8'; g.beginPath(); g.rect(60, 190, 24, 130); g.rect(216, 190, 24, 130); g.rect(120, 150, 60, 170); g.fill(); g.fillStyle = '#ffd86a'; [[72, 190], [228, 190], [150, 150]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 20, y); g.lineTo(x, y - 46); g.lineTo(x + 20, y); g.fill(); });
      g.fillStyle = '#ffe9a0'; [[72, 240], [228, 240], [150, 200]].forEach(([x, y]) => g.fillRect(x - 3, y, 6, 12));
      g.fillStyle = rad(g, 150, 330, 0, 190, [[0, 'rgba(255,240,200,.85)'], [1, 'rgba(255,200,240,0)']]); g.fillRect(0, 140, w, 300);
      g.fillStyle = '#ff5aa8'; g.beginPath(); g.moveTo(132, 300); g.lineTo(168, 300); g.lineTo(200, 410); g.quadraticCurveTo(150, 430, 100, 410); g.fill();
      g.fillStyle = '#ffd0b0'; g.beginPath(); g.arc(150, 284, 15, 0, TAU); g.fill(); g.fillStyle = '#5a2a1a'; g.beginPath(); g.arc(150, 278, 17, Math.PI, TAU); g.fill();
      g.fillStyle = '#ffd86a'; g.shadowColor = '#ffd86a'; g.shadowBlur = 12; g.beginPath(); g.moveTo(138, 268); g.lineTo(142, 254); g.lineTo(150, 264); g.lineTo(158, 254); g.lineTo(162, 268); g.closePath(); g.fill(); g.shadowBlur = 0;
      ptitle(g, 'ROYAL', 428, '#fff6d8', 46);
    }, 'rgba(255,230,160,.95)')),
    happy: () => L('p_hap', 300, 450, (g, w, h) => pframe(g, w, h, () => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#19c2b0'], [1, '#ffe14a']]); g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(150, 230); g.arc(150, 230, 400, i * TAU / 9, i * TAU / 9 + TAU / 18); g.fill(); }
      const r = rng(4); for (let i = 0; i < 24; i++) { g.fillStyle = ['#ff4a8a', '#fff', '#5a3aff', '#ff8a2a'][i % 4]; g.save(); g.translate(r() * w, r() * 380); g.rotate(r() * 6); g.fillRect(-4, -8, 8, 16); g.restore(); }
      g.fillStyle = rad(g, 120, 190, 10, 130, [[0, '#ff8ab8'], [1, '#e0286a']]); g.beginPath(); g.ellipse(150, 250, 105, 100, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; [[118, 220], [182, 220]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 24, 30, 0, 0, TAU); g.fill(); }); g.fillStyle = '#1a1030'; [[122, 226], [178, 226]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }); g.fillStyle = '#fff'; [[126, 220], [182, 220]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); });
      g.fillStyle = '#7a0f3a'; g.beginPath(); g.moveTo(108, 268); g.quadraticCurveTo(150, 330, 192, 268); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(126, 268, 48, 10);
      g.fillStyle = '#ff4a8a'; g.beginPath(); g.moveTo(112, 168); g.lineTo(126, 130); g.lineTo(140, 164); g.fill(); g.beginPath(); g.moveTo(160, 164); g.lineTo(174, 130); g.lineTo(188, 168); g.fill();
      ptitle(g, 'HAPPY', 418, '#ffffff', 52);
    }, 'rgba(255,255,255,.95)')),
  };

  // ------------------------------------------------------------------ thumbnails for monitors (live)
  function thumb(g, kind, t, w, h) {
    if (kind === 0) {
      g.fillStyle = '#1a8a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#1f9a44' : '#188034'; g.fillRect(i * w / 9, 0, w / 9, h); }
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.strokeRect(14, 14, w - 28, h - 28); g.beginPath(); g.moveTo(w / 2, 14); g.lineTo(w / 2, h - 14); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 34, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++) { const x = w * (.15 + .7 * ((i * .137 + Math.sin(t * 1.3 + i) * .06 + 1) % 1)), y = h * (.2 + .6 * ((i * .291 + Math.cos(t * 1.1 + i * 2) * .06 + 1) % 1)); g.fillStyle = i < 4 ? '#ff3a4a' : '#5ad1ff'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(w * (.5 + Math.sin(t * 2.1) * .3), h * (.5 + Math.cos(t * 1.7) * .25), 6, 0, TAU); g.fill();
    } else if (kind === 1) {
      g.fillStyle = lin(g, 0, 0, w, h, [[0, '#1b3fb0'], [1, '#0a1a5a']]); g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(120,180,255,.3)'; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 7, 0); g.lineTo(i * w / 7 - 30, h); g.stroke(); }
      g.fillStyle = '#0c1440'; g.beginPath(); g.ellipse(w / 2, h * .95, 100, 70, 0, Math.PI, TAU); g.fill();
      g.fillStyle = '#e8b894'; g.beginPath(); g.arc(w / 2, h * .36 + Math.sin(t * 2) * 1.5, 24, 0, TAU); g.fill(); g.fillStyle = '#2a1a12'; g.beginPath(); g.arc(w / 2, h * .34, 26, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      g.fillStyle = '#12123a'; g.beginPath(); g.ellipse(w / 2, h * .82, 76, 56, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w / 2 - 12, h * .62); g.lineTo(w / 2 + 12, h * .62); g.lineTo(w / 2, h * .8); g.fill(); g.fillStyle = '#e02a3a'; g.fillRect(w / 2 - 4, h * .66, 8, 26);
      g.fillStyle = '#ffffff'; g.fillRect(0, h - 26, w, 26); g.fillStyle = '#e02a3a'; g.fillRect(0, h - 26, 70, 26);
    } else {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#2a0a5a'], [1, '#12042a']]); g.fillRect(0, 0, w, h);
      g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const a = Math.sin(t * 1.4 + i * 1.3) * .5; g.save(); g.translate(w * (.15 + i * .18), -10); g.rotate(a); g.fillStyle = lin(g, 0, 0, 0, h, [[0, ['#ff4fa0', '#5ad1ff', '#ffc24a', '#8a5bff', '#3ddc84'][i] + 'cc'], [1, 'rgba(0,0,0,0)']]); g.beginPath(); g.moveTo(-4, 0); g.lineTo(-44, h * 1.1); g.lineTo(44, h * 1.1); g.lineTo(4, 0); g.fill(); g.restore(); } g.restore();
      g.fillStyle = '#05010e'; g.beginPath(); g.moveTo(0, h); for (let i = 0; i <= 14; i++) g.lineTo(i * w / 14, h * .8 - hash(i) * 20 + Math.sin(t * 5 + i) * 3); g.lineTo(w, h); g.fill();
      g.fillStyle = '#05010e'; g.beginPath(); g.arc(w / 2, h * .62, 12, 0, TAU); g.fill(); g.fillRect(w / 2 - 12, h * .66, 24, 40);
    }
  }
  const MON_LABEL = ['ספורט', 'חדשות', 'מוזיקה'];
  function monitor(ctx, t, kind, cx, cy, w, h, ry, rx, sc = 1) {
    const [c, g] = scratch('mon' + kind, 400, 270);
    g.fillStyle = '#0a0f30'; g.beginPath(); g.roundRect(0, 0, 400, 270, 30); g.fill();
    g.save(); g.beginPath(); g.roundRect(14, 14, 372, 208, 18); g.clip(); g.translate(14, 14); thumb(g, kind, t + kind * 3, 372, 208); g.restore();
    g.fillStyle = '#e8203a'; g.beginPath(); g.roundRect(28, 28, 82, 30, 15); g.fill(); g.fillStyle = '#fff'; g.globalAlpha = .6 + .4 * Math.sin(t * 8 + kind); g.beginPath(); g.arc(46, 43, 6, 0, TAU); g.fill(); g.globalAlpha = 1; g.font = '800 20px Rubik'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('LIVE', 60, 44);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.font = '700 30px Rubik'; g.textAlign = 'right'; g.direction = 'rtl'; g.fillText(MON_LABEL[kind], 380, 248);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(24, 244, 150, 8); g.fillStyle = '#ffc24a'; g.fillRect(24, 244, 150 * ((t * .2 + kind * .3) % 1), 8);
    g.fillStyle = lin(g, 0, 0, 400, 270, [[0, 'rgba(255,255,255,.30)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.08)']]); g.beginPath(); g.roundRect(0, 0, 400, 270, 30); g.fill();
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.roundRect(2, 2, 396, 266, 29); g.stroke();
    glow(ctx, cx, cy, w * .9, '#5AD1FF', .18);
    ctx.save(); ctx.shadowColor = 'rgba(0,10,50,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 26; ctx.globalAlpha = 0; ctx.restore();
    V.card3d(ctx, c, cx, cy, w * sc, h * sc, ry, rx, 1500, 6, 4);
  }

  // ------------------------------------------------------------------ SCENE A: LIVE ISRAEL
  const FW = 900, FH = 655;
  const flagTex = () => L('flagtex', FW, FH, (g, w, h) => {
    g.fillStyle = '#fbfcff'; g.fillRect(0, 0, w, h);
    const u = h / 160; g.fillStyle = '#0b3fb8'; g.fillRect(0, 25 * u, w, 25 * u); g.fillRect(0, 110 * u, w, 25 * u);
    g.strokeStyle = '#0b3fb8'; g.lineWidth = 5.5 * u; g.lineJoin = 'miter'; const R = 28 * u, cx = w / 2, cy = h / 2;
    for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3 + k * Math.PI; g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.closePath(); g.stroke(); }
  });
  function drawFlag(ctx, t, x0, y0, amp, sx = 1) {
    const tex = flagTex(), N = 150, sw = FW / N;
    for (let i = 0; i < N; i++) {
      const u = i / N, ramp = .12 + .88 * u, ph = u * 6.4 - t * 5.4, ph2 = u * 12.5 - t * 8.3 + 1.3;
      const off = (Math.sin(ph) * amp + Math.sin(ph2) * amp * .28) * ramp;
      const d = (Math.cos(ph) * 6.4 * amp + Math.cos(ph2) * 12.5 * amp * .28) * ramp / (amp * 7 + .001);
      const sh = clamp(d, -1, 1), dx = x0 + i * sw * sx, hh = FH * (1 + .04 * Math.sin(ph + 1) * ramp);
      ctx.drawImage(tex, i * sw, 0, sw + 1, FH, dx, y0 + off - (hh - FH) / 2, sw * sx + 1.6, hh);
      if (sh > 0) { ctx.fillStyle = `rgba(255,255,255,${sh * .34})`; } else { ctx.fillStyle = `rgba(6,16,80,${-sh * .5})`; }
      ctx.fillRect(dx, y0 + off - (hh - FH) / 2, sw * sx + 1.6, hh);
    }
  }
  const skyClouds = () => L('sky', 1400, 1100, g => {
    const r = rng(21);
    for (let i = 0; i < 26; i++) { const x = r() * 1400, y = 300 + r() * 650, w = 300 + r() * 600, hh = 12 + r() * 30, warm = y > 640; g.fillStyle = rad(g, x, y, 0, w / 2, [[0, warm ? 'rgba(255,150,120,.35)' : 'rgba(170,140,255,.22)'], [1, 'rgba(0,0,0,0)']]); g.save(); g.translate(x, y); g.scale(1, hh / (w / 2)); g.translate(-x, -y); g.fillRect(x - w / 2, y - w / 2, w, w); g.restore(); }
    g.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { g.globalAlpha = .2 + r() * .6; g.beginPath(); g.arc(r() * 1400, r() * 520, .7 + r() * 1.3, 0, TAU); g.fill(); } g.globalAlpha = 1;
  });
  const BASE = 1080, M = 160;
  const skylineFar = () => L('sk_far', W + 2 * M, 1200, g => {
    const r = rng(31); let x = 0;
    while (x < W + 2 * M) { const bw = 40 + r() * 70, bh = 90 + r() * 200; g.fillStyle = lin(g, 0, BASE - bh, 0, BASE, [[0, '#4a3a8a'], [1, '#2a2a7a']]); g.fillRect(x, BASE - bh, bw, bh + 100); g.fillStyle = 'rgba(255,200,140,.5)'; for (let k = 0; k < bh / 22; k++) if (r() > .55) g.fillRect(x + 6 + r() * (bw - 14), BASE - bh + 8 + k * 20, 4, 5); x += bw + r() * 6; }
  });
  const skylineMid = () => L('sk_mid', W + 2 * M, 1200, g => {
    const r = rng(41); let x = 0;
    while (x < W + 2 * M) { const bw = 50 + r() * 80, bh = 60 + r() * 230; if (x + M > 560 && x + M < 1060) { x += bw; continue; }
      g.fillStyle = lin(g, 0, BASE - bh, 0, BASE, [[0, '#1c2270'], [1, '#101550']]); g.fillRect(x, BASE - bh, bw, bh + 100);
      for (let k = 0; k < bh / 18; k++) for (let j = 0; j < bw / 16; j++) if (r() > .6) { g.fillStyle = r() > .5 ? 'rgba(255,214,140,.85)' : 'rgba(150,210,255,.7)'; g.fillRect(x + 6 + j * 16, BASE - bh + 8 + k * 18, 6, 8); } x += bw + r() * 8; }
    // Azrieli: round, triangular, square
    const T = (bx, bw, bh, kind) => {
      const top = BASE - bh; const x = bx + M;
      const body = lin(g, x, 0, x + bw, 0, [[0, '#3a4aa8'], [.35, '#25309a'], [1, '#0e1450']]);
      g.fillStyle = body;
      if (kind === 0) { g.fillRect(x, top + 20, bw, bh + 100); g.beginPath(); g.ellipse(x + bw / 2, top + 20, bw / 2, 20, 0, 0, TAU); g.fill(); g.fillStyle = '#7a8ae0'; g.beginPath(); g.ellipse(x + bw / 2, top + 20, bw / 2 - 4, 15, 0, 0, TAU); g.fill(); }
      if (kind === 1) { g.beginPath(); g.moveTo(x, top + 40); g.lineTo(x + bw * .5, top - 22); g.lineTo(x + bw, top + 40); g.lineTo(x + bw, BASE + 100); g.lineTo(x, BASE + 100); g.fill(); g.fillStyle = 'rgba(140,160,255,.35)'; g.beginPath(); g.moveTo(x + bw * .5, top - 22); g.lineTo(x + bw, top + 40); g.lineTo(x + bw, BASE + 100); g.lineTo(x + bw * .5, BASE + 100); g.fill(); }
      if (kind === 2) { g.fillRect(x, top, bw, bh + 100); g.fillStyle = '#7a8ae0'; g.fillRect(x, top, bw, 8); g.fillStyle = 'rgba(140,160,255,.25)'; g.fillRect(x + bw * .55, top + 8, bw * .45, bh + 92); }
      const rr2 = rng(bx);
      for (let yy = top + 40; yy < BASE - 20; yy += 16) { g.fillStyle = 'rgba(190,220,255,.35)'; g.fillRect(x + 4, yy, bw - 8, 2); for (let j = 0; j < bw / 14; j++) if (rr2() > .45) { g.fillStyle = rr2() > .4 ? 'rgba(255,224,150,.95)' : 'rgba(170,220,255,.9)'; g.fillRect(x + 8 + j * 14, yy + 4, 7, 9); } }
    };
    T(690, 120, 600, 0); T(820, 130, 570, 1); T(960, 140, 660, 2);
    // rim light / haze
    g.fillStyle = lin(g, 0, 300, 0, BASE, [[0, 'rgba(255,140,120,0)'], [1, 'rgba(255,140,120,.28)']]); g.fillRect(0, 300, W + 2 * M, BASE);
  });
  function palm(ctx, x, by, h, lean, t, seed, col = '#040824') {
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col;
    const tx = x + lean, ty = by - h, N = 14, L1 = [], R1 = [];
    for (let i = 0; i <= N; i++) { const u = i / N, cx = lerp(x, tx, u) + Math.sin(u * 3 + seed) * 14 * u, cy = lerp(by, ty, u), wd = lerp(17, 8, u); L1.push([cx - wd, cy]); R1.push([cx + wd, cy]); }
    ctx.beginPath(); L1.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); R1.reverse().forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    const top = [tx + Math.sin(3 + seed) * 14, ty];
    for (let f = 0; f < 10; f++) {
      const a = -Math.PI + f * Math.PI / 9 + .05, len = 150 + hash(f + seed) * 90, sw = Math.sin(t * 1.6 + f + seed) * 10;
      const ex = top[0] + Math.cos(a) * len, ey = top[1] + Math.sin(a) * len * .55 + 70 + sw, cx = top[0] + Math.cos(a) * len * .5, cy = top[1] + Math.sin(a) * len * .8 - 20;
      ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      for (let j = 1; j < 14; j++) { const u = j / 14, px = (1 - u) * (1 - u) * top[0] + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * top[1] + 2 * (1 - u) * u * cy + u * u * ey, ll = 46 * (1 - u * .7); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (Math.cos(a + 1.3) * ll), py + Math.abs(Math.sin(a + 1.3)) * ll * .9 + 8); ctx.moveTo(px, py); ctx.lineTo(px + (Math.cos(a - 1.3) * ll), py + Math.abs(Math.sin(a - 1.3)) * ll * .9 + 8); ctx.stroke(); }
    }
    ctx.beginPath(); ctx.arc(top[0], top[1] + 8, 15, 0, TAU); ctx.fill(); ctx.restore();
  }
  function liveBadge(ctx, x, y, s, t) {
    const pu = .5 + .5 * Math.sin(t * TAU * 1.5);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    glow(ctx, 0, 0, 200 + pu * 40, '#ff2a3a', .5 + .3 * pu);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; rr(ctx, -110, -38, 220, 76, 38); ctx.fillStyle = lin(ctx, 0, -38, 0, 38, [[0, '#FF5560'], [1, '#D30F24']]); ctx.fill(); ctx.shadowColor = 'transparent';
    rr(ctx, -108, -36, 216, 72, 36); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(ctx, -100, -34, 200, 30, 30); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-66, 0, 12 + pu * 3, 0, TAU); ctx.fill(); ctx.globalAlpha = .5 * (1 - pu); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-66, 0, 16 + pu * 22, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = '900 46px Rubik'; ctx.letterSpacing = '5px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('LIVE', 26, 3); ctx.restore();
  }
  const TICK = 'חדשות · ספורט · תרבות · שידור חי · ';
  function ticker(ctx, t, y, appear) {
    const u = eo(inv(appear, appear + .3, t)); if (u <= 0) return;
    ctx.save(); ctx.translate(0, (1 - u) * 120);
    ctx.fillStyle = 'rgba(6,10,40,.92)'; ctx.fillRect(0, y, W, 56); ctx.fillStyle = lin(ctx, 0, y, W, y, [[0, '#FFC24A'], [1, '#FFF3C4']]); ctx.fillRect(0, y, W, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y + 4, 900, 52); ctx.clip(); ctx.font = '700 32px Rubik'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    const cyc = ctx.measureText(TICK).width, off = ((t - appear) * 300) % cyc;
    for (let i = -1; i < 4; i++) ctx.fillText(TICK, -cyc + off + i * cyc, y + 31); ctx.restore();
    ctx.fillStyle = lin(ctx, 0, y, 0, y + 56, [[0, '#FF4650'], [1, '#C40D22']]); ctx.fillRect(900, y + 4, 180, 52); ctx.font = '900 30px Rubik'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.direction = 'rtl'; ctx.fillText('שידור חי', 990, y + 32);
    ctx.restore();
  }
  function streaks(ctx, t, n, col, a, seed, spd = 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(seed);
    for (let i = 0; i < n; i++) { const y = 150 + r() * 1100, len = 300 + r() * 700, x = ((r() * 2600 + t * (300 + r() * 500) * spd) % 2600) - 700, wd = 3 + r() * 6;
      ctx.globalAlpha = a * (.4 + r() * .6); ctx.fillStyle = lin(ctx, x - len, 0, x, 0, [[0, 'rgba(0,0,0,0)'], [.85, col], [1, '#fff']]); ctx.beginPath(); ctx.ellipse(x - len / 2, y, len / 2, wd, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawA(ctx, t) {
    const u = inv(5.0, 6.8, t), zIn = 1 - eo(inv(5.0, 5.6, t));
    const zoom = 1.02 + .42 * zIn + .05 * (1 - u), dx = lerp(70, -50, eio(u)), dy = lerp(-170, 50, eio(u));
    ctx.save(); ctx.translate(540, 900); ctx.scale(zoom, zoom); ctx.translate(-540, -900);
    // sky
    ctx.fillStyle = lin(ctx, 0, -300, 0, 1100, [[0, '#060c3a'], [.4, '#1b2a86'], [.7, '#7a4aa4'], [.88, '#ff8a70'], [1, '#ffcf98']]); ctx.fillRect(-400, -400, W + 800, 1600);
    ctx.drawImage(skyClouds(), -160 + dx * .15 + Math.sin(t * .3) * 10, -200 + dy * .15);
    glow(ctx, 300 + dx * .2, 980 + dy * .3, 900, '#ff7a6a', .55); glow(ctx, 760 + dx * .2, 900 + dy * .3, 700, '#ff5aa0', .25);
    ctx.drawImage(skylineFar(), -M + dx * .3, dy * .3 - 30);
    ctx.drawImage(skylineMid(), -M + dx * .55, dy * .55 - 10);
    // Azrieli blinking aircraft lights
    [[690 + 60, 480], [820 + 65, 508], [960 + 70, 420]].forEach(([x, y], i) => { const b = Math.sin(t * 5 + i * 2) > 0 ? 1 : .25; glow(ctx, x + dx * .55, y + dy * .55 - 10 + 120 - 120, 60, '#ff3040', .8 * b); });
    // sea
    const seaTop = 1035 + dy * .8;
    ctx.fillStyle = lin(ctx, 0, seaTop, 0, 1950, [[0, '#f08a7a'], [.08, '#7a5aa0'], [.3, '#1f2c86'], [1, '#080e3a']]); ctx.fillRect(-100, seaTop, W + 200, 1950 - seaTop);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 170; i++) { const r1 = hash(i * 3.1), r2 = hash(i * 7.7), y = seaTop + Math.pow(r1, 1.5) * 800 + 6, band = (y - seaTop) / 800, x = (r2 * 1500 - 210 + Math.sin(t * .8 + i) * (10 + band * 30)) + dx * .8, len = 20 + band * 160 * r2, a = (.25 + .6 * Math.max(0, Math.sin(t * 3 + i * 1.9))) * (1 - band * .45);
      const nearT = Math.exp(-Math.pow((x - 850) / 300, 2)), warm = Math.exp(-Math.pow((x - 300) / 260, 2)); ctx.globalAlpha = a * (.4 + nearT + warm);
      ctx.fillStyle = warm > nearT ? '#ffb08a' : (i % 3 ? '#9fc4ff' : '#ffe6b0'); ctx.fillRect(x, y, len, 2 + band * 5); }
    ctx.restore();
    // beach + foam
    const by = 1440 + dy;
    ctx.fillStyle = lin(ctx, 0, by, 0, 1950, [[0, '#e8b98a'], [.2, '#b0805a'], [1, '#4a3050']]); ctx.beginPath(); ctx.moveTo(-100, by + 80); for (let x = -100; x <= W + 100; x += 40) ctx.lineTo(x, by + 40 + Math.sin(x * .006 + t * .8) * 22 + (x / W) * -60); ctx.lineTo(W + 100, 1950); ctx.lineTo(-100, 1950); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 8; ctx.beginPath(); for (let x = -100; x <= W + 100; x += 40) { const y = by + 40 + Math.sin(x * .006 + t * .8) * 22 + (x / W) * -60; x === -100 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    // palms
    palm(ctx, 990 + dx * 1.1, 1520 + dy * 1.1, 640, -120, t, 1); palm(ctx, 70 + dx * 1.2, 1560 + dy * 1.2, 560, 110, t, 4, '#03061c');
    ctx.restore();
    // light streaks + flag foreground
    streaks(ctx, t, 7, '#ffd9a0', .35, 8);
    // flag
    const fu = eo(inv(4.95, 5.5, t)), fl = (1 - fu);
    ctx.save(); ctx.translate(-30 + dx * 1.5 - fl * 260, 110 + dy * 1.4 - fl * 300); ctx.rotate(-.05 + fl * .1); ctx.scale(.82, .82);
    ctx.shadowColor = 'rgba(0,0,40,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 30; ctx.fillStyle = 'rgba(0,0,0,.01)'; ctx.fillRect(0, 0, FW, FH); ctx.shadowColor = 'transparent';
    drawFlag(ctx, t, 0, 0, 34 + fl * 40, 1);
    // pole
    ctx.fillStyle = lin(ctx, -20, 0, 6, 0, [[0, '#8a6a20'], [.5, '#ffe9a0'], [1, '#a07a24']]); ctx.fillRect(-14, -70, 16, FH + 400);
    ctx.restore();
  }

  // ------------------------------------------------------------------ SCENE A overlays (HUD, monitors, title)
  function hudA(ctx, t) {
    // LIVE badge
    const bu = eob(inv(5.10, 5.4, t)); if (bu > 0) liveBadge(ctx, 860, 190, bu, t);
    // clock chip
    const cu = eo(inv(5.2, 5.5, t)); if (cu > 0) { ctx.save(); ctx.globalAlpha = cu; V.glass(ctx, 60, 160, 260, 66, 33, { tint: '#5AD1FF', alpha: .2, shadow: 20, shadowY: 8 }); ctx.font = '700 32px Rubik'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('תל אביב · 20:00', 190, 194); ctx.restore(); }
    // monitors
    const mons = [[0, 800, 500, 300, 200, -.42, .05, 5.45], [1, 690, 690, 280, 186, -.35, .04, 5.62], [2, 930, 700, 220, 146, -.5, .06, 5.78]];
    mons.forEach(([k, x, y, w, h, ry, rx, t0]) => { const mu = eob(inv(t0, t0 + .32, t)); if (mu <= 0.01) return; const fy = Math.sin(t * 2 + k * 2) * 10; monitor(ctx, t, k, x + (1 - mu) * 260, y + fy - (1 - mu) * 120, w, h, ry + (1 - mu) * 1.0, rx, mu); });
  }
  function titleA(ctx, t) {
    const u1 = inv(5.22, 5.58, t), u2 = inv(5.80, 6.14, t);
    const word = (s, u, y, size, gradient, extra) => {
      if (u <= 0) return; const e = eob(u), sc = lerp(2.4, 1, ease.out(clamp(u * 1.2))) * (e > 1 ? 1 : 1);
      ctx.save(); ctx.translate(540, y); ctx.scale(Math.max(.01, sc), Math.max(.01, e)); ctx.rotate((1 - eo(clamp(u * 1.3))) * -.06); ctx.globalAlpha = clamp(u * 4);
      if (extra) extra(ctx, u);
      V.text(ctx, s, 0, 0, size, { grad: gradient, stroke: '#0A1450', sw: size * .16, shadowBlur: 40, shadowY: 18 });
      ctx.restore();
    };
    word('שידורים', u1, 830, 230, V.WHITE_GRAD, null);
    word('חיים', u2, 1000, 290, V.GOLD_GRAD, (c, u) => { glow(c, 0, 10, 380, '#ff2a3a', .55 * (.6 + .4 * Math.sin(t * 9))); });
    // red LIVE dot accent next to חיים
    if (u2 > .3) { const p = .5 + .5 * Math.sin(t * TAU * 1.5); ctx.save(); ctx.translate(830, 900); ctx.fillStyle = '#ff2a3a'; glow(ctx, 0, 0, 90, '#ff2a3a', .8); ctx.beginPath(); ctx.arc(0, 0, 22 + p * 4, 0, TAU); ctx.fill(); ctx.restore(); }
    // light sweep across title
    const sw = inv(5.55, 6.05, t); if (sw > 0 && sw < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * Math.sin(sw * Math.PI); ctx.translate(lerp(-100, 1200, sw), 830); ctx.rotate(.3); ctx.fillStyle = lin(ctx, -60, 0, 60, 0, [[0, 'rgba(255,255,255,0)'], [.5, '#fff'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-60, -230, 120, 460); ctx.restore(); }
    // lower third
    const lu = eo(inv(6.08, 6.4, t));
    if (lu > 0) { ctx.save(); ctx.translate((1 - lu) * 1100, 0); V.glass(ctx, 150, 1092, 840, 84, 24, { tint: '#0B1450', alpha: .6, shadow: 30, shadowY: 12 });
      ctx.fillStyle = lin(ctx, 0, 1092, 0, 1176, [[0, '#FFF3C4'], [1, '#E48A12']]); ctx.beginPath(); ctx.roundRect(960, 1100, 16, 68, 6); ctx.fill();
      V.text(ctx, 'ישראל בשידור חי', 930, 1136, 58, { align: 'right', fill: '#fff', shadowBlur: 10, shadowY: 4, weight: 800 });
      ctx.fillStyle = '#ff2a3a'; ctx.beginPath(); ctx.arc(190, 1134, 12, 0, TAU); ctx.fill(); ctx.restore(); }
  }

  // ------------------------------------------------------------------ SCENE B: NETFLIX
  const curtain = () => L('curtain', 1080, 1920, g => {
    const side = (dir) => { g.save(); if (dir) { g.translate(W, 0); g.scale(-1, 1); }
      g.beginPath(); g.moveTo(0, 0); g.lineTo(170, 0); g.bezierCurveTo(140, 500, 110, 1000, 40, 1920); g.lineTo(0, 1920); g.closePath(); g.clip();
      const N = 26; for (let i = 0; i < N; i++) { const x0 = i * 10, k = .5 + .5 * Math.sin(i * 1.3 + .4); g.fillStyle = lin(g, x0, 0, x0 + 10, 0, [[0, `rgb(${40 + k * 130 | 0},${2 + k * 8 | 0},${8 + k * 14 | 0})`], [1, `rgb(${20 + k * 60 | 0},1,4)`]]); g.fillRect(x0, 0, 11, 1920); }
      g.fillStyle = lin(g, 0, 0, 260, 0, [[0, 'rgba(0,0,0,.35)'], [.6, 'rgba(0,0,0,0)'], [1, 'rgba(255,60,60,.25)']]); g.fillRect(0, 0, 260, 1920);
      g.fillStyle = lin(g, 0, 0, 0, 300, [[0, 'rgba(0,0,0,.7)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, 260, 300); g.restore(); };
    side(0); side(1);
    g.fillStyle = lin(g, 0, 0, 0, 120, [[0, '#120104'], [1, '#5a060e']]); g.fillRect(0, 0, W, 60); g.fillStyle = '#c01020'; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(i * 100 + 50, 60, 60, 26, 0, 0, Math.PI); g.fill(); }
  });
  function popcorn(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#F2B632'; ctx.beginPath(); ctx.ellipse(0, 22, 14, 9, 0, 0, TAU); ctx.fill();
    [[-14, 0, 17], [14, 2, 16], [0, -12, 19], [-4, 8, 15], [20, -10, 13]].forEach(([px, py, r]) => { ctx.fillStyle = rad(ctx, px - r * .3, py - r * .3, 1, r, [[0, '#FFFFFF'], [.6, '#FFF3CC'], [1, '#F2CE7A']]); ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function nfChip(ctx, cx, cy, sc, t, tHit) {
    const [c, g] = scratch('nf', 980, 320); g.translate(490, 160);
    g.shadowColor = 'rgba(255,20,40,.7)'; g.shadowBlur = 40; g.fillStyle = 'rgba(8,0,3,.86)'; g.beginPath(); g.roundRect(-460, -130, 920, 260, 56); g.fill(); g.shadowBlur = 0;
    g.lineWidth = 6; g.strokeStyle = lin(g, -460, -130, 460, 130, [[0, '#ff6a6a'], [.5, '#a0101e'], [1, '#ff4a5a']]); g.beginPath(); g.roundRect(-458, -128, 916, 256, 55); g.stroke();
    g.save(); g.scale(.86, 1); g.font = '900 170px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '4px';
    for (let d = 18; d >= 1; d--) { g.fillStyle = A.mixc('#7a0610', '#3a0208', d / 18); g.fillText('NETFLIX', 0, 6 + d); }
    g.fillStyle = lin(g, 0, -110, 0, 110, [[0, '#FF5A66'], [.45, '#E50914'], [1, '#A70611']]); g.fillText('NETFLIX', 0, 6);
    g.strokeStyle = 'rgba(255,200,200,.55)'; g.lineWidth = 2; g.strokeText('NETFLIX', 0, 6); g.restore();
    g.fillStyle = lin(g, 0, -130, 0, 0, [[0, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.roundRect(-450, -122, 900, 122, [50, 50, 0, 0]); g.fill();
    const sw = inv(tHit + .05, tHit + .5, t); if (sw > 0 && sw < 1) { g.globalCompositeOperation = 'source-atop'; g.save(); g.translate(lerp(-560, 560, sw), 0); g.rotate(.35); g.fillStyle = lin(g, -70, 0, 70, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-70, -300, 140, 600); g.restore(); }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.drawImage(c, -490, -160); ctx.restore();
  }
  function drawB(ctx, t) {
    const push = 1 + (t - 6.6) * .028, sx = Math.sin(t * .9) * 12;
    ctx.save(); ctx.translate(540, 900); ctx.scale(push, push); ctx.translate(-540 + sx, -900);
    ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, '#040001'], [.4, '#1c0409'], [.75, '#42060e'], [1, '#0a0102']]); ctx.fillRect(-100, -100, W + 200, 2200);
    glow(ctx, 540, 1180, 1000, '#ff1a2a', .32); glow(ctx, 540, 330, 800, '#ff3a3a', .16);
    ctx.save(); ctx.translate(0, 0); ctx.scale(1, -1); ctx.translate(0, -0); ctx.restore();
    ctx.save(); ctx.translate(0, 0); V.beams(ctx, 540, 1900, t, '#ffd0c0', 5, 2000, 1.0, .06); ctx.restore();
    V.bokeh(ctx, t, { seed: 17, alpha: .8, cols: ['#ff3040', '#ff8a5a', '#ffc24a', '#ff2a6a'], n: 22 });
    // floor sheen
    ctx.fillStyle = lin(ctx, 0, 1150, 0, 1500, [[0, 'rgba(255,60,60,.0)'], [.3, 'rgba(255,60,60,.22)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 1150, W, 350);
    // posters
    const P = ['midnight', 'neon', 'forever', 'orbit', 'hunted'].map(k => POSTER[k]()), ang = [-.66, -.33, 0, .33, .66], order = [0, 4, 1, 3, 2], t0s = [6.80, 6.86, 6.74, 6.83, 6.77];
    const pv = { x: 540, y: 1290 }, arm = 520;
    order.forEach(i => {
      const u = inv(t0s[i], t0s[i] + .34, t); if (u <= 0) return; const e = eob(u), fan = lerp(.2, 1, eo(inv(t0s[i], t0s[i] + .5, t)));
      const a = ang[i] * fan + Math.sin(t * 1.2 + i) * .012, sc = i === 2 ? 1.1 : 1, flip = lerp(1.5, 0, e);
      ctx.save(); ctx.translate(pv.x, pv.y); ctx.rotate(a); ctx.translate(0, -arm * (i === 2 ? 1.02 : 1) + (1 - eo(u)) * 250);
      ctx.globalAlpha = clamp(u * 3); glow(ctx, 0, 0, 260, i === 2 ? '#ff3040' : '#a01020', .28);
      V.card3d(ctx, P[i], 0, 0, 336 * sc, 504 * sc, flip + (i - 2) * -.06, -.05, 1500, 6, 8);
      if (u >= 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(-168 * sc, -252 * sc, 336 * sc, 504 * sc, 22); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const sw = ((t * .5 + i * .27) % 1.6) - .3; ctx.fillStyle = lin(ctx, (sw * 500 - 250) - 60, 0, (sw * 500 - 250) + 60, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-200, -260, 400, 520); ctx.restore(); }
      ctx.restore();
    });
    // NETFLIX chip slam
    const th = 7.12, cu = inv(th, th + .22, t);
    if (cu > 0) { const e = eob(cu), s2 = lerp(2.6, 1, e), shake = t < th + .35 ? Math.sin((t - th) * 90) * 8 * (1 - (t - th) / .35) : 0; glow(ctx, 540, 320, 700 + 150 * (.5 + .5 * Math.sin(t * 6)), '#ff1a2a', .55 * clamp(cu * 2)); ctx.save(); ctx.globalAlpha = clamp(cu * 4); nfChip(ctx, 540 + shake, 320, s2 * (1 + .015 * Math.sin(t * 3)), t, th); ctx.restore();
      V.ring(ctx, 540, 320, 100 + (t - th) * 2400, 30 * (1 - clamp((t - th) / .5)) + 2, '#ff5a5a', .8 * (1 - clamp((t - th) / .5))); }
    ctx.restore();
    ctx.drawImage(curtain(), 0, 0);
    // popcorn burst from bottom corners
    const tp = t - 7.14; if (tp > 0) for (let i = 0; i < 30; i++) { const r1 = hash(i * 1.7), r2 = hash(i * 4.3), left = i % 2 === 0, vx = (left ? 1 : -1) * (250 + r1 * 700), vy = -(1500 + r2 * 1100), x = (left ? 40 : 1040) + vx * tp, y = 1450 + vy * tp + 2900 * tp * tp; if (y > 2050 || y < -150) continue; popcorn(ctx, x, y, .7 + r1 * .7, tp * (4 + r2 * 6) * (left ? 1 : -1)); }
    // sparkles
    for (let i = 0; i < 16; i++) { const st = 7.14 + hash(i) * .8, k = inv(st, st + .5, t); if (k <= 0 || k >= 1) continue; const x = 140 + hash(i + 9) * 800, y = 200 + hash(i + 4) * 420; V.sparkle(ctx, x, y, 30 * Math.sin(k * Math.PI) + 4, i % 2 ? '#fff' : '#ff9a9a', k * 2, Math.sin(k * Math.PI)); }
    // light bar sweep
    const lb = inv(7.06, 7.30, t); if (lb > 0 && lb < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const x = lerp(-300, 1400, ease.inOut(lb)); ctx.translate(x, 700); ctx.rotate(.22); ctx.fillStyle = lin(ctx, -140, 0, 140, 0, [[0, 'rgba(255,60,60,0)'], [.45, 'rgba(255,230,230,.9)'], [.55, 'rgba(255,230,230,.9)'], [1, 'rgba(255,60,60,0)']]); ctx.fillRect(-140, -1500, 280, 3000); ctx.restore(); }
    // entry light bar at the whip seam
    V.flash(ctx, t, 7.12, .25, '#ff4a4a', .35);
  }

  // ------------------------------------------------------------------ SCENE C: DISNEY+
  const skyC = () => L('skyC', W, 1400, g => {
    g.fillStyle = lin(g, 0, 0, 0, 1400, [[0, '#040a3a'], [.35, '#0f2a9a'], [.62, '#3a6ae0'], [.75, '#8ab8ff'], [.8, '#ffd9a0'], [1, '#1a2a8a']]); g.fillRect(0, 0, W, 1400);
    const r = rng(77);
    for (let i = 0; i < 8; i++) { g.fillStyle = rad(g, r() * W, r() * 800, 0, 400, [[0, i % 2 ? 'rgba(138,91,255,.32)' : 'rgba(90,209,255,.26)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, W, 1400); }
    for (let i = 0; i < 260; i++) { g.globalAlpha = .25 + r() * .75; g.fillStyle = r() > .85 ? '#ffe9a8' : '#fff'; g.beginPath(); g.arc(r() * W, Math.pow(r(), 1.2) * 1000, .6 + r() * 1.5, 0, TAU); g.fill(); } g.globalAlpha = 1;
    // milky way band
    g.save(); g.translate(540, 300); g.rotate(-.5); g.fillStyle = rad(g, 0, 0, 0, 700, [[0, 'rgba(200,220,255,.2)'], [1, 'rgba(0,0,0,0)']]); g.scale(1, .18); g.fillRect(-700, -700, 1400, 1400); g.restore();
  });
  const castle = () => L('castle', W + 200, 800, g => {
    g.translate(100, 0); const base = 700;
    const spire = (x, w, h, roofH, col) => { g.fillStyle = col; g.fillRect(x - w / 2, base - h, w, h + 100); g.beginPath(); g.moveTo(x - w / 2 - 6, base - h); g.lineTo(x, base - h - roofH); g.lineTo(x + w / 2 + 6, base - h); g.fill(); g.fillRect(x - 1.5, base - h - roofH - 30, 3, 34); g.beginPath(); g.moveTo(x + 1.5, base - h - roofH - 30); g.lineTo(x + 26, base - h - roofH - 22); g.lineTo(x + 1.5, base - h - roofH - 14); g.fill(); };
    const col = '#0a1466'; g.fillStyle = col;
    g.beginPath(); g.moveTo(-100, base + 40); g.quadraticCurveTo(200, base - 60, 540, base - 30); g.quadraticCurveTo(880, base - 60, 1180, base + 40); g.lineTo(1180, 800); g.lineTo(-100, 800); g.fill();
    g.fillRect(400, base - 220, 280, 260);
    spire(540, 76, 400, 150, col); spire(456, 50, 300, 110, col); spire(624, 50, 300, 110, col); spire(400, 44, 210, 90, col); spire(680, 44, 210, 90, col); spire(340, 40, 140, 70, col); spire(740, 40, 140, 70, col); spire(500, 34, 380, 100, col); spire(580, 34, 380, 100, col);
    g.fillStyle = col; g.fillRect(340, base - 110, 400, 160);
    g.beginPath(); g.moveTo(500, base + 30); g.lineTo(500, base - 40); g.quadraticCurveTo(540, base - 90, 580, base - 40); g.lineTo(580, base + 30); g.fillStyle = '#ffdc80'; g.fill();
    const r = rng(6); g.fillStyle = '#ffdc80'; [[540, 330], [456, 280], [624, 280], [400, 180], [680, 180], [500, 360], [580, 360], [540, 230], [340, 130], [740, 130], [470, 190], [610, 190]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 6, base - y + 18); g.lineTo(x - 6, base - y + 4); g.quadraticCurveTo(x, base - y - 8, x + 6, base - y + 4); g.lineTo(x + 6, base - y + 18); g.fill(); });
    g.fillStyle = 'rgba(255,230,160,.25)'; for (let i = 0; i < 16; i++) g.fillRect(360 + r() * 340, base - 90 + r() * 90, 6, 10);
    g.fillStyle = lin(g, 0, base - 500, 0, base + 60, [[0, 'rgba(140,190,255,0)'], [1, 'rgba(255,200,140,.25)']]); g.globalCompositeOperation = 'source-atop'; g.fillRect(0, base - 500, W + 200, 600); g.globalCompositeOperation = 'source-over';
  });
  function cometPos(u) { // arc from left up over the top and down to right
    const P0 = [-140, 520], P1 = [540, -330], P2 = [1240, 560]; return [(1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1]];
  }
  function dpChip(ctx, cx, cy, sc, t, tHit) {
    const [c, g] = scratch('dp', 980, 340); g.translate(490, 170);
    g.shadowColor = 'rgba(120,180,255,.9)'; g.shadowBlur = 50; g.fillStyle = lin(g, 0, -140, 0, 140, [[0, 'rgba(40,80,200,.85)'], [1, 'rgba(10,20,110,.9)']]); g.beginPath(); g.roundRect(-450, -140, 900, 280, 70); g.fill(); g.shadowBlur = 0;
    g.lineWidth = 6; g.strokeStyle = lin(g, -450, -140, 450, 140, [[0, '#fff'], [.5, '#8ab8ff'], [1, '#ffe9a8']]); g.beginPath(); g.roundRect(-448, -138, 896, 276, 69); g.stroke();
    g.font = '700 215px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.letterSpacing = '2px';
    g.strokeStyle = '#0a2a9a'; g.lineWidth = 30; g.strokeText('Disney', -90, 24);
    g.fillStyle = lin(g, 0, -80, 0, 120, [[0, '#ffffff'], [1, '#c8dcff']]); g.fillText('Disney', -90, 24);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-330, -80); g.quadraticCurveTo(-90, -160, 150, -80); g.stroke();
    // gold plus
    g.save(); g.translate(330, 14); g.shadowColor = '#ffc24a'; g.shadowBlur = 30; g.fillStyle = lin(g, 0, -80, 0, 80, [[0, '#FFF3C4'], [.5, '#FFC24A'], [1, '#E48A12']]); g.strokeStyle = '#7a4a0a'; g.lineWidth = 8;
    g.beginPath(); g.roundRect(-22, -80, 44, 160, 14); g.roundRect(-80, -22, 160, 44, 14); g.fill(); g.restore();
    const sw = inv(tHit + .05, tHit + .5, t); if (sw > 0 && sw < 1) { g.globalCompositeOperation = 'source-atop'; g.save(); g.translate(lerp(-560, 560, sw), 0); g.rotate(.35); g.fillStyle = lin(g, -70, 0, 70, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-70, -300, 140, 600); g.restore(); }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.drawImage(c, -490, -170); ctx.restore();
  }
  function drawC(ctx, t) {
    const push = 1 + (t - 7.9) * .035, sx = Math.sin(t * .7) * 14;
    ctx.save(); ctx.translate(540, 900); ctx.scale(push, push); ctx.translate(-540, -900);
    ctx.drawImage(skyC(), 0, -60 + Math.sin(t * .5) * 6);
    // twinkle field
    for (let i = 0; i < 70; i++) { const p = .5 + .5 * Math.sin(t * (2 + hash(i) * 3) + i * 5); V.sparkle(ctx, hash(i * 2.3) * W, 60 + hash(i * 5.1) * 900, 3 + p * (6 + hash(i + 2) * 12), hash(i) > .7 ? '#ffe9a8' : '#fff', hash(i) * 3, .3 + .7 * p); }
    glow(ctx, 540, 1040, 800, '#8ab8ff', .22); glow(ctx, 540, 960, 400, '#ffd9a0', .22);
    ctx.save(); ctx.translate(540 + sx * .3, 1085); ctx.scale(1.05, 1.05); ctx.drawImage(castle(), -640, -700); ctx.restore();
    ctx.save(); ctx.translate(540, 1085); ctx.scale(1.05, -.5); ctx.globalAlpha = .22; ctx.drawImage(castle(), -640, -700 + 60); ctx.restore();
    // mist
    ctx.fillStyle = lin(ctx, 0, 1000, 0, 1500, [[0, 'rgba(160,200,255,0)'], [.22, 'rgba(160,200,255,.28)'], [.3, 'rgba(20,40,150,.85)'], [1, '#050a3a']]); ctx.fillRect(0, 1000, W, 950);
    for (let i = 0; i < 40; i++) { const p = Math.max(0, Math.sin(t * 3 + i * 2.1)); ctx.globalAlpha = .6 * p; ctx.fillStyle = '#cfe0ff'; ctx.fillRect(hash(i * 3) * W, 1120 + hash(i * 7) * 500, 20 + hash(i) * 60, 2); } ctx.globalAlpha = 1;
    
    // cards
    const P = ['balloons', 'voyage', 'royal', 'happy'].map(k => POSTER[k]()), cfg = [[125, 830, -.55, 8.10, -.12], [335, 900, -.28, 8.16, -.05], [745, 900, .28, 8.13, .05], [955, 830, .55, 8.07, .12]];
    cfg.forEach(([x, y, ry, t0, rz], i) => { const u = inv(t0, t0 + .4, t); if (u <= 0) return; const e = eob(u), fy = Math.sin(t * 1.8 + i * 1.7) * 14; ctx.save(); ctx.translate(x, y + fy + (1 - e) * 500); ctx.rotate(rz + Math.sin(t + i) * .02); ctx.globalAlpha = clamp(u * 3); glow(ctx, 0, 0, 260, '#8ab8ff', .3);
      V.card3d(ctx, P[i], 0, 0, 240, 360, ry, -.05, 1400, 6, 8);
      if (u >= 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(-120, -180, 240, 360, 18); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const sw = ((t * .45 + i * .3) % 1.7) - .35; ctx.fillStyle = lin(ctx, sw * 430 - 215 - 50, 0, sw * 430 - 215 + 50, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-150, -210, 300, 420); ctx.restore(); }
      ctx.restore(); });
    // chip
    const th = 8.40, cu = inv(th, th + .24, t);
    if (cu > 0) { const e = eob(cu), s2 = lerp(2.2, 1, e); glow(ctx, 540, 420, 800, '#8ab8ff', .55 * clamp(cu * 2)); glow(ctx, 540, 420, 420, '#ffc24a', .3 * clamp(cu * 2)); ctx.save(); ctx.globalAlpha = clamp(cu * 4); dpChip(ctx, 540, 420, s2 * (1 + .012 * Math.sin(t * 3)), t, th); ctx.restore();
      V.ring(ctx, 540, 420, 60 + (t - th) * 2200, 26 * (1 - clamp((t - th) / .5)) + 2, '#fff', .7 * (1 - clamp((t - th) / .5)));
      for (let i = 0; i < 26; i++) { const a = hash(i) * TAU, sp = 300 + hash(i + 3) * 700, k = t - th; if (k < 0 || k > .9) continue; const x = 540 + Math.cos(a) * sp * k, y = 420 + Math.sin(a) * sp * k + 500 * k * k; V.sparkle(ctx, x, y, 22 * (1 - k / .9) + 3, i % 3 ? '#ffe9a8' : '#fff', k * 5, 1 - k / .9); } }
    // comet
    const cu2 = inv(8.0, 8.85, t);
    if (cu2 > 0 && cu2 < 1.2) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 60; k >= 0; k--) { const uu = cu2 - k * .0085; if (uu < 0 || uu > 1) continue; const [x, y] = cometPos(uu), f = 1 - k / 60; ctx.globalAlpha = f * f * .9; ctx.fillStyle = rad(ctx, x, y, 0, 46 * f + 6, [[0, '#ffffff'], [.4, '#8ab8ff'], [1, 'rgba(90,150,255,0)']]); ctx.beginPath(); ctx.arc(x, y, 46 * f + 6, 0, TAU); ctx.fill();
        if (k % 2 === 0) { const jx = (hash(k * 3 + 1) - .5) * 70 * (1 - f), jy = (hash(k * 3 + 2) - .5) * 70 * (1 - f) + (1 - f) * 40; V.sparkle(ctx, x + jx, y + jy, 4 + 14 * hash(k) * f, k % 4 ? '#ffe9a8' : '#fff', k, f); } }
      if (cu2 <= 1) { const [hx, hy] = cometPos(cu2); glow(ctx, hx, hy, 220, '#8ab8ff', .9); V.sparkle(ctx, hx, hy, 90, '#fff', t * 2, 1); V.sparkle(ctx, hx, hy, 60, '#ffe9a8', t * 2 + .8, 1); }
      ctx.restore();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ MAIN
  A.scene({ name: 'v2_live_ott', start: 5.0, end: 9.35, draw(ctx, s) {
    const t = s.t;
    const wa = ease.inOut(inv(T_WA, T_WA2, t)), wc = inv(T_WC, T_WC2, t), wt = ease.in(inv(T_TAIL, 9.33, t));
    ctx.fillStyle = '#060a1e'; ctx.fillRect(0, 0, W, H);
    // A
    if (t < T_WA2 + .02) { ctx.save(); ctx.translate(-wa * 1300, 0); drawA(ctx, t); hudA(ctx, t); titleA(ctx, t); ticker(ctx, t, 1180, 5.55); ctx.restore(); }
    // B
    if (t >= T_WA - .01 && t < T_WC2 + .05) { ctx.save(); ctx.translate((1 - wa) * 1300, 0); drawB(ctx, t); ctx.restore(); }
    // whip seam light bar
    if (wa > 0 && wa < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const x = (1 - wa) * 1300 - wa * 0; ctx.translate(x, 0); ctx.fillStyle = lin(ctx, -220, 0, 60, 0, [[0, 'rgba(255,40,50,0)'], [.7, 'rgba(255,90,90,.75)'], [1, 'rgba(255,255,255,1)']]); ctx.fillRect(-220, 0, 280, H); ctx.restore();
      streaks(ctx, t, 14, '#ff8a8a', .6, 3, 6); }
    // C
    if (t >= T_WC) { ctx.save(); if (t > T_TAIL) { ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, '#0a1466'], [1, '#FFF3C4']]); ctx.fillRect(0, 0, W, H); ctx.translate(-wt * 1500, 0); }
      if (wc < 1) { ctx.beginPath(); ctx.arc(700, 640, ease.out(wc) * 1500, 0, TAU); ctx.clip(); }
      drawC(ctx, t); ctx.restore();
      if (wc > 0 && wc < 1) { const r = ease.out(wc) * 1500; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,225,255,.9)'; ctx.lineWidth = 40 * (1 - wc) + 4; ctx.beginPath(); ctx.arc(700, 640, r, 0, TAU); ctx.stroke(); ctx.restore();
        for (let i = 0; i < 34; i++) { const a = hash(i) * TAU, x = 700 + Math.cos(a) * r, y = 640 + Math.sin(a) * r; V.sparkle(ctx, x, y, 30 + hash(i + 2) * 40, i % 2 ? '#ffe9a8' : '#fff', i, 1 - wc); } } }
    if (t > T_TAIL) { streaks(ctx, t, 16, '#cfe0ff', .8 * wt + .1, 12, 8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const x = W - wt * 1500 + 1500 * 0; ctx.fillStyle = lin(ctx, x - 300, 0, x + 40, 0, [[0, 'rgba(255,240,200,0)'], [1, 'rgba(255,243,196,.9)']]); ctx.fillRect(Math.max(0, W - wt * 1500 - 100), 0, 340, H); ctx.restore(); }
    // entry burst: gold-white flash + rays
    const eu = inv(5.0, 5.32, t);
    if (eu < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = (1 - eu) * (1 - eu);
      ctx.globalAlpha = a; ctx.fillStyle = '#FFF3C4'; ctx.fillRect(0, 0, W, H);
      ctx.translate(540, 900); for (let i = 0; i < 28; i++) { const an = i / 28 * TAU + .1, len = 500 + eu * 1600; ctx.save(); ctx.rotate(an); ctx.globalAlpha = a * .8; ctx.fillStyle = lin(ctx, 0, 0, len, 0, [[0, 'rgba(255,243,196,.9)'], [1, 'rgba(255,194,74,0)']]); ctx.beginPath(); ctx.moveTo(0, -6 - hash(i) * 30); ctx.lineTo(len, 0); ctx.lineTo(0, 6 + hash(i) * 30); ctx.fill(); ctx.restore(); }
      ctx.restore(); }
  } });
})();

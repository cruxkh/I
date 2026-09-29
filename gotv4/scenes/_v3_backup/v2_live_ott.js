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
  function popcorn(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#F2B632'; ctx.beginPath(); ctx.ellipse(0, 22, 14, 9, 0, 0, TAU); ctx.fill();
    [[-14, 0, 17], [14, 2, 16], [0, -12, 19], [-4, 8, 15], [20, -10, 13]].forEach(([px, py, r]) => { ctx.fillStyle = rad(ctx, px - r * .3, py - r * .3, 1, r, [[0, '#FFFFFF'], [.6, '#FFF3CC'], [1, '#F2CE7A']]); ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
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

  // =====================================================================================================
  // ROUND 2 (WOW): shared helpers
  // =====================================================================================================
  const punch = (t, hs, amp, dec = .2) => { let s = 0; for (const h of hs) { const k = t - h; if (k >= 0 && k < dec) s += amp * Math.pow(1 - k / dec, 2); } return s; };
  const camT = (ctx, zoom, rot, dx, dy, cx = 540, cy = 900) => { ctx.translate(cx + dx, cy + dy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy); };
  const shakeXY = (t, hs, amp, dec = .25) => { const p = punch(t, hs, 1, dec); return [A.noise1(t * 40) * amp * p, A.noise1(t * 40 + 30) * amp * p]; };
  function rays(ctx, x, y, t, t0, col, n = 20, len = 1300, dur = .38, seed = 1) {
    const k = (t - t0) / dur; if (k < 0 || k > 1) return; const a = (1 - k) * (1 - k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y);
    for (let i = 0; i < n; i++) { const an = i / n * TAU + hash(i + seed) * .3, ln = len * (.35 + .65 * eo(k)) * (.5 + hash(i * 3 + seed)), wd = 5 + hash(i + 9 + seed) * 22;
      ctx.save(); ctx.rotate(an); ctx.globalAlpha = a * .9; ctx.fillStyle = lin(ctx, 0, 0, ln, 0, [[0, col], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.moveTo(30 + eo(k) * 60, -wd); ctx.lineTo(ln, 0); ctx.lineTo(30 + eo(k) * 60, wd); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function burst(ctx, x, y, t, t0, n, cols, sp = 900, dur = .8, g = 900, seed = 3) {
    const k = t - t0; if (k < 0 || k > dur) return; const f = k / dur;
    for (let i = 0; i < n; i++) { const a = hash(i + seed) * TAU, s = sp * (.25 + hash(i + seed + 40)), px = x + Math.cos(a) * s * k, py = y + Math.sin(a) * s * k + g * k * k;
      V.sparkle(ctx, px, py, (6 + hash(i + 7) * 22) * (1 - f) + 2, cols[i % cols.length], k * 6 + i, 1 - f); }
  }
  function hband(ctx, y, a, col = '#fff', h = 6, x0 = -100, x1 = W + 100) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = lin(ctx, x0, 0, x1, 0, [[0, 'rgba(0,0,0,0)'], [.5, col], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x0, y - h / 2, x1 - x0, h); ctx.restore(); }
  function shootStar(ctx, x, y, ang, len, a, col = '#fff') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = lin(ctx, -len, 0, 0, 0, [[0, 'rgba(0,0,0,0)'], [1, col]]); ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, -5); ctx.lineTo(8, 0); ctx.lineTo(0, 5); ctx.fill(); glow(ctx, 0, 0, 40, col, .9); ctx.restore(); }
  function dust(ctx, t, n, seed, cols, o = {}) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const r1 = hash(i * 3.1 + seed), r2 = hash(i * 7.7 + seed), r3 = hash(i * 1.3 + seed), sp = (o.speed ?? 70) * (.4 + r3);
      const x = (r1 * 1200 - 60) + Math.sin(t * (.6 + r2) + i) * (o.sway ?? 30), y = (((r2 * 2100 - t * sp) % 2100) + 2100) % 2100 - 60; const tw = .5 + .5 * Math.sin(t * (3 + r3 * 5) + i * 4);
      const s = (o.size ?? 9) * (.4 + r1) * (.5 + tw); ctx.globalAlpha = (o.alpha ?? 1) * (.25 + .75 * tw); V.sparkle(ctx, x, y, s, cols[i % cols.length], i + t * (o.spin ?? 1), 1); }
    ctx.restore();
  }
  function fastStreaks(ctx, t, n, col, a, seed, spd, y0 = 100, y1 = 1300) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(seed);
    for (let i = 0; i < n; i++) { const y = y0 + r() * (y1 - y0), len = 200 + r() * 600, x = ((r() * 2600 + t * (spd * (.6 + r() * .8))) % 2600) - 700, wd = 2 + r() * 4;
      ctx.globalAlpha = a * (.4 + r() * .6); ctx.fillStyle = lin(ctx, x - len, 0, x, 0, [[0, 'rgba(0,0,0,0)'], [.85, col], [1, '#fff']]); ctx.beginPath(); ctx.ellipse(x - len / 2, y, len / 2, wd, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // light sweep clipped to the alpha of what is already on the offscreen canvas g
  function sweepAtop(g, w, h, u, a = .95, wd = 150, ang = .35, col = '255,255,255') {
    if (u <= 0 || u >= 1) return; g.save(); g.globalCompositeOperation = 'source-atop'; g.translate(lerp(-wd * 2, w + wd * 2, u), h / 2); g.rotate(ang);
    g.fillStyle = lin(g, -wd, 0, wd, 0, [[0, `rgba(${col},0)`], [.5, `rgba(${col},${a})`], [1, `rgba(${col},0)`]]); g.fillRect(-wd, -h * 2, wd * 2, h * 4); g.restore();
  }

  // =====================================================================================================
  // REAL LOGO PLATES (glass monitors)
  // =====================================================================================================
  const PL = { kan11: ['d', '#5AD1FF'], keshet12: ['l', '#FFB23A'], reshet13: ['l', '#FF4FA0'], ch14: ['d', '#FF3B4A'], ch9: ['l', '#5AD1FF'], i24: ['d', '#FF5560'] };
  const PLS = { kan11: [.74, .5], keshet12: [.6, .72], reshet13: [.62, .74], ch14: [.62, .7], ch9: [.56, .7], i24: [.74, .56] };
  function plate(name, t, ph, fl = 0, w = 420, h = 290) {
    const [c, g] = scratch('pl_' + name, w, h), [mode, acc] = PL[name], dark = mode === 'd';
    g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 46); g.clip();
    g.fillStyle = dark ? lin(g, 0, 0, w, h, [[0, '#1B2C8A'], [.55, '#0A1250'], [1, '#040822']]) : lin(g, 0, 0, w, h, [[0, '#FFFFFF'], [1, '#D6E0FF']]); g.fillRect(0, 0, w, h);
    if (dark) { g.globalAlpha = .07; g.fillStyle = '#9fc4ff'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2); g.globalAlpha = 1; g.fillStyle = rad(g, w / 2, h * .5, 0, w * .6, [[0, hexS(acc, .32)], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h); }
    else { g.fillStyle = rad(g, w / 2, h * .55, 0, w * .55, [[0, hexS(acc, .22)], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, h); }
    const [fw, fh] = PLS[name]; V.drawLogo(g, name, w / 2, h * .52, w * fw, h * fh, { shadow: false });
    // LIVE pill
    g.fillStyle = 'rgba(232,32,58,1)'; g.beginPath(); g.roundRect(22, 20, 100, 36, 18); g.fill();
    const pu = .5 + .5 * Math.sin(t * 9 + ph * 3); g.fillStyle = '#fff'; g.globalAlpha = .55 + .45 * pu; g.beginPath(); g.arc(42, 38, 7 + pu * 1.5, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.font = '900 22px Rubik'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.letterSpacing = '2px'; g.fillStyle = '#fff'; g.fillText('LIVE', 58, 39); g.letterSpacing = '0px';
    // progress bar
    g.fillStyle = dark ? 'rgba(255,255,255,.2)' : 'rgba(10,20,80,.18)'; g.fillRect(28, h - 24, w - 56, 7); g.fillStyle = acc; g.fillRect(28, h - 24, (w - 56) * ((t * .35 + ph * .21) % 1), 7);
    // gloss
    g.fillStyle = lin(g, 0, 0, 0, h * .55, [[0, 'rgba(255,255,255,.34)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.ellipse(w * .4, -h * .1, w * .8, h * .5, 0, 0, TAU); g.fill();
    sweepAtop(g, w, h, ((t * .8 + ph * .37) % 2.4) / .9, .55, 70);
    if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, w, h); }
    g.restore();
    g.lineWidth = 5; g.strokeStyle = lin(g, 0, 0, w, h, [[0, 'rgba(255,255,255,.95)'], [.5, hexS(acc, .5)], [1, 'rgba(255,255,255,.7)']]); g.beginPath(); g.roundRect(2.5, 2.5, w - 5, h - 5, 44); g.stroke();
    return c;
  }
  const hexS = (h, a) => V.hexA(h, a);
  // a plate that pops in on its beat: flip from depth, overshoot, ring + sparks + glow
  function popPlate(ctx, name, t, t0, cx, cy, w, h, ry = 0, rx = 0, o = {}) {
    const k = t - t0; if (k < 0) return; const e = ease.outBack(clamp(k / .3)); if (e < .02) return;
    const ph = o.ph || 0, fy = Math.sin(t * 2.4 + ph * 2) * (o.bob ?? 9), flip = (1 - ease.out(clamp(k / .36))) * 1.5 * (o.fd || 1), acc = PL[name][1];
    const c = plate(name, t, ph, Math.max(0, 1 - k / .14) * .9);
    ctx.save(); ctx.globalAlpha = clamp(k * 12);
    glow(ctx, cx, cy + fy, w * .95, acc, .2 + .55 * Math.max(0, 1 - k / .3));
    V.card3d(ctx, c, cx, cy + fy + (1 - e) * (o.drop ?? 160), w * e, h * e, ry + flip + Math.sin(t * 1.7 + ph) * .03, rx, 1300, 6, 5);
    ctx.restore();
    if (k < .5) { V.ring(ctx, cx, cy + fy, 40 + eo(k / .5) * w * .8, 22 * (1 - k / .5) + 2, acc, .8 * (1 - k / .5)); burst(ctx, cx, cy + fy, t, t0, 9, ['#fff', acc], 520, .5, 300, ph * 5 + 1); }
  }

  // =====================================================================================================
  // SHOT 1: skyline hero (5.00-5.56) + floating logo plates
  // =====================================================================================================
  function hudA2(ctx, t) {
    const bu = eob(inv(5.08, 5.3, t)); if (bu > 0) liveBadge(ctx, 860, 190, bu, t);
    const cu = eo(inv(5.12, 5.34, t)); if (cu > 0) { ctx.save(); ctx.globalAlpha = cu; V.glass(ctx, 60, 160, 260, 66, 33, { tint: '#5AD1FF', alpha: .2, shadow: 20, shadowY: 8 }); ctx.font = '700 32px Rubik'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('תל אביב · 20:00', 190, 194); ctx.restore(); }
    popPlate(ctx, 'kan11', t, 5.22, 800, 520, 300, 205, -.42, .05, { ph: 1 });
    popPlate(ctx, 'keshet12', t, 5.30, 665, 715, 280, 195, -.36, .04, { ph: 2 });
    popPlate(ctx, 'i24', t, 5.38, 935, 730, 240, 165, -.5, .06, { ph: 3 });
  }
  function titleA2(ctx, t) {
    const word = (s, u, y, size, gradient, extra) => {
      if (u <= 0) return; const e = eob(u), sc = lerp(2.4, 1, ease.out(clamp(u * 1.2)));
      ctx.save(); ctx.translate(540, y); ctx.scale(Math.max(.01, sc), Math.max(.01, e)); ctx.rotate((1 - eo(clamp(u * 1.3))) * -.06); ctx.globalAlpha = clamp(u * 4);
      if (extra) extra(ctx, u);
      V.text(ctx, s, 0, 0, size, { grad: gradient, stroke: '#0A1450', sw: size * .16, shadowBlur: 40, shadowY: 18 }); ctx.restore();
    };
    word('שידורים', inv(5.14, 5.4, t), 830, 230, V.WHITE_GRAD, null);
    word('חיים', inv(5.30, 5.56, t), 1000, 290, V.GOLD_GRAD, (c, u) => { glow(c, 0, 10, 380, '#ff2a3a', .55 * (.6 + .4 * Math.sin(t * 9))); });
    const u2 = inv(5.30, 5.56, t);
    if (u2 > .3) { const p = .5 + .5 * Math.sin(t * TAU * 1.5); ctx.save(); ctx.translate(830, 900); ctx.fillStyle = '#ff2a3a'; glow(ctx, 0, 0, 90, '#ff2a3a', .8); ctx.beginPath(); ctx.arc(0, 0, 22 + p * 4, 0, TAU); ctx.fill(); ctx.restore(); }
    const sw = inv(5.36, 5.6, t); if (sw > 0 && sw < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * Math.sin(sw * Math.PI); ctx.translate(lerp(-100, 1200, sw), 830); ctx.rotate(.3); ctx.fillStyle = lin(ctx, -60, 0, 60, 0, [[0, 'rgba(255,255,255,0)'], [.5, '#fff'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-60, -230, 120, 460); ctx.restore(); }
  }
  function shot1(ctx, t) {
    const u = inv(5.0, 5.6, t), [sx, sy] = shakeXY(t, [5.0, 5.14, 5.30], 10);
    ctx.save(); camT(ctx, 1.1 + punch(t, [5.0, 5.14, 5.30], .05, .18) + .05 * u, lerp(.06, -.04, eio(u)) + Math.sin(t * 9) * .003, sx + lerp(40, -30, u), sy);
    drawA(ctx, t); hudA2(ctx, t); titleA2(ctx, t); ticker(ctx, t, 1180, 5.3);
    fastStreaks(ctx, t, 8, '#ffe0b0', .35, 91, 2200, 200, 1200);
    ctx.restore();
  }

  // =====================================================================================================
  // SHOT 2: control-room / studio video wall (5.56-6.00)
  // =====================================================================================================
  const T_S1 = 5.56, T_S2 = 6.0, T_S3 = 6.60, T_NF = 6.70, T_DS = 7.98, T_TAIL2 = 9.05;
  const STUDIO_LOGOS = [['kan11', 1, 5.60], ['ch14', 4, 5.66], ['keshet12', 6, 5.72], ['i24', 9, 5.78], ['reshet13', 2, 5.84], ['ch9', 11, 5.90]];
  function wallCanvas(t) {
    const CW = 300, CH = 232, G = 22, cols = 3, rows = 4, [c, g] = scratch('wall', 960, 1000);
    g.fillStyle = '#04081c'; g.beginPath(); g.roundRect(0, 0, 960, 1000, 36); g.fill();
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const idx = r * cols + q, x = 12 + q * (CW + G), y = 14 + r * (CH + G), lg = STUDIO_LOGOS.find(l => l[1] === idx);
      g.save(); g.translate(x, y); g.beginPath(); g.roundRect(0, 0, CW, CH, 22); g.clip();
      if (lg) { const k = t - lg[2]; const pc = plate(lg[0], t, idx, k > 0 ? Math.max(0, 1 - k / .14) * .9 : 0); g.fillStyle = '#0a0f30'; g.fillRect(0, 0, CW, CH); if (k > 0) { const e = ease.outBack(clamp(k / .25)); g.translate(CW / 2, CH / 2); g.scale(e, e); g.drawImage(pc, -CW / 2, -CH / 2, CW, CH); } }
      else { g.save(); g.translate(0, 0); g.scale(CW / 372, CH / 208); thumb(g, idx % 3, t + idx * 1.7, 372, 208); g.restore();
        g.fillStyle = '#e8203a'; g.beginPath(); g.roundRect(12, 12, 62, 24, 12); g.fill(); g.fillStyle = '#fff'; g.globalAlpha = .5 + .5 * Math.sin(t * 9 + idx); g.beginPath(); g.arc(27, 24, 5, 0, TAU); g.fill(); g.globalAlpha = 1; g.font = '800 15px Rubik'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('LIVE', 38, 25);
        const fl = Math.max(0, Math.sin(t * 13 + idx * 4.1) - .92) * 6; if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl * .5})`; g.fillRect(0, 0, CW, CH); } }
      g.restore();
      g.lineWidth = 4; g.strokeStyle = 'rgba(160,190,255,.55)'; g.beginPath(); g.roundRect(x + 2, y + 2, CW - 4, CH - 4, 20); g.stroke();
    }
    return c;
  }
  function shot2(ctx, t) {
    const u = inv(T_S1, T_S2 + .1, t), sw = ease.out(inv(T_S1 + .02, T_S1 + .34, t));
    ctx.save(); camT(ctx, 1.02 + .24 * ein(u) + punch(t, [5.6, 5.78], .04), lerp(.09, -.035, eio(u)), lerp(-70, 50, u), lerp(20, -40, u));
    ctx.fillStyle = lin(ctx, 0, -300, 0, 1500, [[0, '#050a2e'], [.5, '#0b1450'], [1, '#03051a']]); ctx.fillRect(-500, -500, W + 1000, 2600);
    glow(ctx, 540, 600, 1000, '#2F6BFF', .35); glow(ctx, 200, 1100, 700, '#ff3b4a', .16); glow(ctx, 900, 200, 600, '#5AD1FF', .18);
    V.beams(ctx, 540 + Math.sin(t * 5) * 200, -80, t * 3, '#9fc4ff', 6, 2200, 1.5, .1);
    // sweeping spotlights
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; [[-.4, '#5AD1FF'], [.5, '#FFC24A']].forEach(([b, col], i) => { const a = b + Math.sin(t * 6 + i * 2) * .35; ctx.save(); ctx.translate(i ? 980 : 100, -60); ctx.rotate(a); ctx.fillStyle = lin(ctx, 0, 0, 0, 1700, [[0, hexS(col, .5)], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-210, 1700); ctx.lineTo(210, 1700); ctx.lineTo(18, 0); ctx.fill(); ctx.restore(); }); ctx.restore();
    // wall (3D) + reflection
    const wc = wallCanvas(t), ry = lerp(1.0, -.12, sw) + Math.sin(t * 3) * .01, cx = 540, cy = 590;
    glow(ctx, cx, cy, 800, '#5AD1FF', .22);
    V.card3d(ctx, wc, cx, cy, 1010, 1040, ry, -.07, 1250, 14, 16);
    ctx.save(); ctx.globalAlpha = .18; ctx.translate(0, 2 * (cy + 520) + 60); ctx.scale(1, -1); V.card3d(ctx, wc, cx, cy, 1010, 1040, ry, .07, 1250, 8, 8); ctx.restore();
    // desk
    const dy = 1085; ctx.fillStyle = lin(ctx, 0, dy, 0, dy + 400, [[0, '#182466'], [.08, '#0a1040'], [1, '#02030f']]); ctx.beginPath(); ctx.moveTo(-500, dy + 30); ctx.lineTo(1580, dy - 30); ctx.lineTo(1580, 2300); ctx.lineTo(-500, 2300); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, '#FFC24A'], [.5, '#FFF3C4'], [1, '#E48A12']]); ctx.beginPath(); ctx.moveTo(-500, dy + 30); ctx.lineTo(1580, dy - 30); ctx.lineTo(1580, dy - 20); ctx.lineTo(-500, dy + 40); ctx.fill();
    fastStreaks(ctx, t, 6, '#9fc4ff', .3, 44, 2600, 100, 1200);
    ctx.restore();
  }

  // =====================================================================================================
  // SHOT 3: logo wall (6.00-6.60)
  // =====================================================================================================
  const WALLP = [['kan11', 0, 0, 6.02], ['ch14', 1, 1, 6.10], ['ch9', 0, 2, 6.18], ['keshet12', 1, 0, 6.26], ['i24', 1, 2, 6.34], ['reshet13', 0, 1, 6.42]];
  function shot3(ctx, t) {
    const u = inv(T_S2, T_S3, t), yaw = lerp(.28, -.22, eio(u)), [sx, sy] = shakeXY(t, [6.02, 6.18, 6.34, 6.5], 9);
    ctx.save(); camT(ctx, 1.0 + .07 * ein(u) + punch(t, [6.02, 6.18, 6.34, 6.5], .035, .16), lerp(-.1, .035, eio(u)), sx + lerp(-50, 50, u), sy);
    ctx.fillStyle = lin(ctx, 0, -300, 0, 1500, [[0, '#070d3a'], [.5, '#0d1a6a'], [1, '#040620']]); ctx.fillRect(-500, -500, W + 1000, 2700);
    glow(ctx, 540, 640, 1100, '#2F6BFF', .4); glow(ctx, 540 + yaw * 500, 1000, 700, '#ff3b4a', .16);
    // perspective floor grid + vertical lines (deep parallax)
    ctx.save(); ctx.globalAlpha = .28; ctx.strokeStyle = '#5AD1FF'; ctx.lineWidth = 2;
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 40 + yaw * 200, 640); ctx.lineTo(540 + i * 330 + yaw * 400, 2100); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const y = 640 + Math.pow(((i + t * 2.2) % 12) / 12, 2.2) * 1500; ctx.beginPath(); ctx.moveTo(-100, y); ctx.lineTo(1180, y); ctx.stroke(); }
    ctx.restore();
    V.beams(ctx, 540, 1900, t * 2, '#9fc4ff', 7, 2300, 1.4, .07);
    V.bokeh(ctx, t * 3, { seed: 12, alpha: 1.1, n: 24 });
    fastStreaks(ctx, t, 10, '#9fc4ff', .35, 71, 2400, 100, 1300);
    // plates
    const cxs = [290, 790], cys = [430, 730, 1030];
    WALLP.forEach(([nm, col, row, t0], i) => {
      const side = col ? 1 : -1, ry = side * .3 + yaw * .5, x = cxs[col] + yaw * 60 * (col ? 1 : -1) * 0 + Math.sin(t * 2 + i) * 4;
      popPlate(ctx, nm, t, t0, x, cys[row], 400, 276, ry, (row - 1) * -.05, { ph: i + 1, fd: side, bob: 7, drop: 220 });
    });
    // headline
    const hu = inv(6.30, 6.5, t); if (hu > 0) { const e = eob(hu); ctx.save(); ctx.translate(540, 212); ctx.scale(e, e); ctx.rotate((1 - hu) * .1); glow(ctx, 0, 0, 380, '#ffc24a', .3); V.text(ctx, 'בישראל', 0, 0, 132, { grad: V.GOLD_GRAD, stroke: '#0A1450', sw: 20, shadowBlur: 40, shadowY: 16 }); ctx.restore(); }
    ctx.restore();
    // corner rays on each pop
    WALLP.forEach(([nm, col, row, t0]) => { rays(ctx, cxs[col], cys[row], t, t0, PL[nm][1], 12, 500, .3, row * 3 + col); });
  }

  // =====================================================================================================
  // NETFLIX (6.60-7.98): real logo hero
  // =====================================================================================================
  const NF_HITS = [6.70, 6.95, 7.20, 7.48, 7.72];
  function nfLogo(t, dim, sweepU, sweep2U) {
    const [c, g] = scratch('nfh', 1000, 300); const lg = V.logoImg('netflix'); if (!lg) return c;
    const sc = 940 / lg.width; g.drawImage(lg, 500 - lg.width * sc / 2, 150 - lg.height * sc / 2, lg.width * sc, lg.height * sc);
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(0,0,0,${1 - dim})`; g.fillRect(0, 0, 1000, 300); g.restore();
    sweepAtop(g, 1000, 300, sweepU, .95, 170, .4); sweepAtop(g, 1000, 300, sweep2U, .8, 110, -.4, '255,210,210');
    return c;
  }
  function drawB(ctx, t) {
    const k = t - T_NF, [sx, sy] = shakeXY(t, NF_HITS, 14, .22);
    const zoom = 1.06 + (t - 6.6) * .03 + punch(t, NF_HITS, .07, .2), rot = Math.sin(t * 3.1) * .012 + lerp(-.07, 0, eo(inv(6.7, 7.3, t)));
    ctx.save(); camT(ctx, zoom, rot, sx, sy, 540, 640);
    ctx.fillStyle = lin(ctx, 0, -300, 0, 1500, [[0, '#000000'], [.45, '#080203'], [.75, '#1c0408'], [1, '#040001']]); ctx.fillRect(-500, -500, W + 1000, 2700);
    const pulse = .6 + .4 * Math.sin(t * 7);
    glow(ctx, 540, 1250, 1000, '#ff1a2a', .22); glow(ctx, 540, 430, 600 + punch(t, NF_HITS, 400, .25), '#ff2a3a', .12 * eo(clamp(k * 6)));
    V.beams(ctx, 540, 1950, t * 2, '#ffd0c0', 6, 2200, 1.1, .07); V.beams(ctx, 540, -60, t * 1.5 + 2, '#ff6a6a', 5, 1800, 1.0, .05);
    dust(ctx, t, 40, 5, ['#fff', '#ff9a8a', '#ffd0a0'], { speed: 40, size: 7, alpha: .8 });
    // side poster columns (parallax, continuous fall)
    const P = ['midnight', 'neon', 'forever', 'orbit', 'hunted', 'balloons'].map(q => POSTER[q]());
    [[95, 300, .62, .75], [985, 470, -.62, .75], [-30, 610, .7, .45], [1110, 240, -.7, .45]].forEach(([x, v, ry, br], ci) => {
      const cu = eo(inv(6.74 + ci * .03, 6.98 + ci * .03, t)); if (cu <= 0) return; const sz = br > .6 ? 1 : .78;
      for (let i = 0; i < 4; i++) { const y = (((i * 430 + (t - 6.7) * v + ci * 200) % 1720) + 1720) % 1720 - 260; ctx.save(); ctx.globalAlpha = cu * (br > .6 ? .95 : .7); glow(ctx, x, y, 200, '#ff2a3a', .2);
        V.card3d(ctx, P[(i + ci * 2) % 6], x - (1 - cu) * 200 * Math.sign(x - 540), y, 232 * sz, 348 * sz, ry, 0, 1200, 4, 6); ctx.restore(); }
    });
    // floor sheen
    ctx.fillStyle = lin(ctx, 0, 1160, 0, 1500, [[0, 'rgba(255,60,60,0)'], [.3, 'rgba(255,60,60,.2)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-100, 1160, W + 200, 350);
    // front poster fan
    const ang = [-.7, -.35, 0, .35, .7], order = [0, 4, 1, 3, 2], t0s = [6.90, 6.96, 6.84, 6.93, 6.87], pv = { x: 540, y: 1440 }, arm = 610;
    order.forEach(i => {
      const u = inv(t0s[i], t0s[i] + .3, t); if (u <= 0) return; const e = eob(u), fan = lerp(.2, 1, eo(inv(t0s[i], t0s[i] + .45, t))), a = ang[i] * fan + Math.sin(t * 1.4 + i) * .014, sc = i === 2 ? 1.06 : 1, flip = lerp(1.6, 0, e);
      ctx.save(); ctx.translate(pv.x, pv.y); ctx.rotate(a); ctx.translate(0, -arm * (i === 2 ? 1.02 : 1) + (1 - eo(u)) * 300); ctx.globalAlpha = clamp(u * 3); glow(ctx, 0, 0, 240, i === 2 ? '#ff3040' : '#a01020', .3);
      V.card3d(ctx, P[i], 0, 0, 286 * sc, 430 * sc, flip + (i - 2) * -.07, -.05, 1500, 6, 8);
      if (u >= 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(-143 * sc, -215 * sc, 286 * sc, 430 * sc, 20); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const sw = ((t * .8 + i * .27) % 1.6) - .3; ctx.fillStyle = lin(ctx, (sw * 450 - 225) - 50, 0, (sw * 450 - 225) + 50, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-200, -260, 400, 520); ctx.restore(); }
      ctx.restore(); if (u < 1) burst(ctx, pv.x + Math.sin(a) * arm, pv.y - Math.cos(a) * arm, t, t0s[i] + .25, 6, ['#fff', '#ff6a6a'], 450, .4, 400, i);
    });
    // HERO: opening red line -> logo slam
    const line = inv(6.60, 6.70, t);
    if (k < .04) { hband(ctx, 430, 1, '#ff3a3a', 10 - line * 4, 540 - 500 * eo(line), 540 + 500 * eo(line)); glow(ctx, 540, 430, 300 * line, '#ff2a2a', .7); }
    if (k >= 0) {
      const e = ease.outBack(clamp(k / .32)), s2 = lerp(2.0, 1, ease.out(clamp(k / .3))), ry = lerp(-1.1, -.16, e) + Math.sin(t * 2.6) * .07, rx = Math.sin(t * 2.1 + 1) * .05 - .04;
      const dim = lerp(.55, 1, inv(6.86, 7.16, t)), sw1 = inv(6.80, 7.15, t), sw2 = inv(7.42, 7.7, t);
      const lc = nfLogo(t, Math.min(1, dim + punch(t, NF_HITS, 1, .1)), sw1, sw2);
      ctx.save(); ctx.globalAlpha = clamp(k * 14);
      glow(ctx, 540, 430, 560, '#e50914', .16 + .1 * pulse);
      // reflection
      ctx.save(); ctx.globalAlpha *= .22; ctx.translate(0, 860 + 8); ctx.scale(1, -1); V.card3d(ctx, lc, 540, 430, 780 * s2 * e, 234 * s2 * e, ry, rx, 1300, 12, 3); ctx.restore();
      V.card3d(ctx, lc, 540, 430, 780 * s2 * Math.max(e, .01), 234 * s2 * Math.max(e, .01), ry, rx, 1300, 14, 4);
      ctx.restore();
      NF_HITS.forEach((h, i) => { rays(ctx, 540, 430, t, h, i % 2 ? '#ff9080' : '#c01020', 20, 1300, .3, i * 5); hband(ctx, 430, Math.max(0, 1 - (t - h) / .3) * .9, i % 2 ? '#ffd0d0' : '#ff5a5a', 12); });
      V.ring(ctx, 540, 430, 80 + k * 2600, 34 * (1 - clamp(k / .5)) + 2, '#ff5a5a', .85 * (1 - clamp(k / .5)));
      if (k < .5) V.ring(ctx, 540, 430, 40 + k * 1500, 16, '#fff', .8 * (1 - k / .5));
      burst(ctx, 540, 430, t, 6.70, 26, ['#fff', '#ff8a8a', '#ffc24a'], 1100, .8, 700, 8);
      burst(ctx, 540, 430, t, 7.20, 14, ['#fff', '#ff8a8a'], 800, .6, 600, 21);
      burst(ctx, 540, 430, t, 7.72, 16, ['#fff', '#ff8a8a', '#ffc24a'], 900, .6, 600, 33);
    }
    ctx.restore();
    // popcorn waves
    [[6.82, 30, 1], [7.36, 34, 2]].forEach(([w0, n, sd]) => { const tp = t - w0; if (tp > 0) for (let i = 0; i < n; i++) { const r1 = hash(i * 1.7 + sd), r2 = hash(i * 4.3 + sd), left = i % 2 === 0, vx = (left ? 1 : -1) * (250 + r1 * 700), vy = -(1500 + r2 * 1100), x = (left ? 40 : 1040) + vx * tp, y = 1450 + vy * tp + 2900 * tp * tp; if (y > 2050 || y < -150) continue; popcorn(ctx, x, y, .7 + r1 * .7, tp * (4 + r2 * 6) * (left ? 1 : -1)); } });
    // vignette
    ctx.fillStyle = rad(ctx, 540, 900, 600, 1300, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]); ctx.fillRect(0, 0, W, H);
  }

  // =====================================================================================================
  // DISNEY+ (7.98-9.05): real logo hero
  // =====================================================================================================
  const DS_HITS = [8.12, 8.48, 8.74, 8.98];
  const glassPoster = k => L('gp_' + k, 250, 380, (g, w, h) => { V.glass(g, 6, 6, w - 12, h - 12, 28, { tint: '#9fc4ff', alpha: .3, shadow: 20, shadowY: 8 }); g.save(); g.beginPath(); g.roundRect(20, 20, w - 40, h - 40, 18); g.clip(); g.drawImage(POSTER[k](), 20, 20, w - 40, h - 40); g.restore(); });
  const ARC = [[.14, .3], [.24, .14], [.36, .06], [.5, .02], [.625, .04], [.6875, .08], [.75, .14], [.8125, .23], [.875, .37], [.93, .5]];
  function arcPt(u) { const f = u * (ARC.length - 1), i = Math.min(ARC.length - 2, Math.floor(f)), q = f - i; return [lerp(ARC[i][0], ARC[i + 1][0], q), lerp(ARC[i][1], ARC[i + 1][1], q)]; }
  function dsLogo(t, sweepU) {
    const [c, g] = scratch('dsh', 1000, 560); const lg = V.logoImg('disney'); if (!lg) return c;
    const sc = 880 / lg.width; g.drawImage(lg, 500 - lg.width * sc / 2, 280 - lg.height * sc / 2, lg.width * sc, lg.height * sc);
    sweepAtop(g, 1000, 560, sweepU, .9, 150, .35, '255,243,196'); return c;
  }
  function drawC(ctx, t) {
    const k = t - 8.10, [sx, sy] = shakeXY(t, DS_HITS, 8, .22);
    ctx.save(); camT(ctx, 1.03 + (t - 8) * .05 + punch(t, DS_HITS, .045, .22), Math.sin(t * 2.2) * .012 + lerp(.05, 0, eo(inv(8.0, 8.4, t))), sx, sy, 540, 700);
    ctx.drawImage(skyC(), 0, -60 + Math.sin(t * .5) * 6);
    dust(ctx, t, 60, 2, ['#fff', '#ffe9a8', '#a8d0ff'], { speed: 20, size: 8, alpha: .9, sway: 10 });
    glow(ctx, 540, 1040, 800, '#8ab8ff', .22); glow(ctx, 540, 960, 400, '#ffd9a0', .22);
    // castle (parallax push + reflection)
    const cast = () => { ctx.save(); ctx.translate(540, 1150); ctx.scale(1.08, 1.08); ctx.drawImage(castle(), -640, -700); ctx.restore(); };
    cast(); ctx.save(); ctx.translate(0, 2300 + 40); ctx.scale(1, -1); ctx.globalAlpha = .18; cast(); ctx.restore();
    // castle window twinkle + fireworks
    for (let i = 0; i < 4; i++) { const f0 = 8.3 + i * .22, kk = t - f0; if (kk < 0 || kk > .6) continue; const fx = 220 + hash(i * 4) * 640, fy = 620 + hash(i * 9) * 200; burst(ctx, fx, fy, t, f0, 16, ['#ffe9a8', '#8ab8ff', '#fff', '#ff9acb'], 260, .6, 120, i * 3); glow(ctx, fx, fy, 200, '#8ab8ff', .4 * (1 - kk / .6)); }
    // mist
    ctx.fillStyle = lin(ctx, 0, 1080, 0, 1500, [[0, 'rgba(160,200,255,0)'], [.22, 'rgba(160,200,255,.28)'], [.3, 'rgba(20,40,150,.85)'], [1, '#050a3a']]); ctx.fillRect(-100, 1080, W + 200, 950);
    for (let i = 0; i < 40; i++) { const p = Math.max(0, Math.sin(t * 3 + i * 2.1)); ctx.globalAlpha = .6 * p; ctx.fillStyle = '#cfe0ff'; ctx.fillRect(hash(i * 3) * W, 1180 + hash(i * 7) * 500, 20 + hash(i) * 60, 2); } ctx.globalAlpha = 1;
    // glass poster cards
    const cfg = [['balloons', 125, 930, -.55, 8.12, -.12], ['voyage', 345, 1010, -.28, 8.18, -.05], ['royal', 735, 1010, .28, 8.15, .05], ['happy', 955, 930, .55, 8.09, .12]];
    cfg.forEach(([kk, x, y, ry, t0, rz], i) => { const u = inv(t0, t0 + .36, t); if (u <= 0) return; const e = eob(u), fy = Math.sin(t * 1.9 + i * 1.7) * 14; ctx.save(); ctx.translate(x, y + fy + (1 - e) * 500); ctx.rotate(rz + Math.sin(t + i) * .02); ctx.globalAlpha = clamp(u * 3); glow(ctx, 0, 0, 220, '#8ab8ff', .3);
      V.card3d(ctx, glassPoster(kk), 0, 0, 200, 304, ry + (1 - e) * 1.2, -.05, 1400, 5, 6);
      if (u >= 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(-100, -152, 200, 304, 18); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const sw = ((t * .6 + i * .3) % 1.7) - .35; ctx.fillStyle = lin(ctx, sw * 380 - 190 - 40, 0, sw * 380 - 190 + 40, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-150, -210, 300, 420); ctx.restore(); }
      ctx.restore(); });
    // HERO logo
    if (k > -.02) {
      const e = ease.outBack(clamp(k / .34)), s2 = lerp(2.4, 1, ease.out(clamp(k / .3))), ry = lerp(.9, 0, e) + Math.sin(t * 2.3) * .08, rx = Math.sin(t * 1.9) * .04 - .03, cy = 410 + Math.sin(t * 2.6) * 8;
      const lc = dsLogo(t, inv(8.24, 8.62, t));
      glow(ctx, 540, cy, 720, '#5a8aff', .5); glow(ctx, 540, cy, 400, '#ffe9a8', .32 + punch(t, DS_HITS, 1.5, .2));
      ctx.save(); ctx.globalAlpha = clamp((k + .02) * 14);
      V.card3d(ctx, lc, 540, cy, 820 * s2 * Math.max(e, .01), 459 * s2 * Math.max(e, .01), ry, rx, 1300, 14, 8);
      ctx.restore();
      // comet-orb running along the logo arc
      const au = inv(8.30, 8.72, t); if (au > 0 && au < 1) { const [ax, ay] = arcPt(au), lx = 540 + (ax - .5) * 880, ly = cy + (ay - .5) * 880 * 278 / 512; glow(ctx, lx, ly, 150, '#fff', .9); V.sparkle(ctx, lx, ly, 70, '#fff', t * 4, 1);
        for (let j = 1; j < 14; j++) { const u2 = au - j * .018; if (u2 < 0) break; const [bx, by] = arcPt(u2), px = 540 + (bx - .5) * 880, py = cy + (by - .5) * 880 * 278 / 512; V.sparkle(ctx, px + (hash(j) - .5) * 20, py + (hash(j + 4) - .5) * 20 + j * 2, 18 * (1 - j / 14) + 3, j % 2 ? '#ffe9a8' : '#a8d0ff', j + t * 3, 1 - j / 14); } }
      rays(ctx, 540, cy, t, 8.10, '#ffe9a8', 24, 1400, .4, 3); rays(ctx, 540, cy, t, 8.48, '#a8d0ff', 16, 1000, .3, 7); rays(ctx, 540, cy, t, 8.74, '#ffe9a8', 16, 1000, .3, 11);
      V.ring(ctx, 540, cy, 60 + k * 2400, 30 * (1 - clamp(k / .5)) + 2, '#fff', .8 * (1 - clamp(k / .5)));
      burst(ctx, 540, cy, t, 8.10, 36, ['#ffe9a8', '#fff', '#a8d0ff'], 1000, .95, 500, 5); burst(ctx, 540, cy, t, 8.48, 18, ['#ffe9a8', '#fff'], 700, .6, 300, 15); burst(ctx, 540, cy, t, 8.74, 18, ['#ffe9a8', '#a8d0ff'], 700, .6, 300, 25);
    }
    // shooting stars
    [[8.30, 900, 380, .55], [8.55, 1000, 150, .5], [8.85, 640, 60, .6]].forEach(([s0, x, y, an]) => { const kk = (t - s0) / .35; if (kk < 0 || kk > 1) return; shootStar(ctx, x - kk * 900, y + kk * 700 * Math.tan(an) * 1, an + Math.PI, 420, 1 - kk * kk, '#fff'); });
    // comet (magic trail)
    const cu2 = inv(7.98, 8.7, t);
    if (cu2 > 0 && cu2 < 1.2) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let q = 70; q >= 0; q--) { const uu = cu2 - q * .0075; if (uu < 0 || uu > 1) continue; const [x, y] = cometPos(uu), f = 1 - q / 70; ctx.globalAlpha = f * f * .9; ctx.fillStyle = rad(ctx, x, y, 0, 46 * f + 6, [[0, '#ffffff'], [.4, '#8ab8ff'], [1, 'rgba(90,150,255,0)']]); ctx.beginPath(); ctx.arc(x, y, 46 * f + 6, 0, TAU); ctx.fill();
        if (q % 2 === 0) { const jx = (hash(q * 3 + 1) - .5) * 80 * (1 - f), jy = (hash(q * 3 + 2) - .5) * 80 * (1 - f) + (1 - f) * 50; V.sparkle(ctx, x + jx, y + jy, 4 + 16 * hash(q) * f, q % 4 ? '#ffe9a8' : '#fff', q, f); } }
      if (cu2 <= 1) { const [hx, hy] = cometPos(cu2); glow(ctx, hx, hy, 240, '#8ab8ff', .9); V.sparkle(ctx, hx, hy, 100, '#fff', t * 2, 1); V.sparkle(ctx, hx, hy, 66, '#ffe9a8', t * 2 + .8, 1); }
      ctx.restore();
    }
    dust(ctx, t, 26, 9, ['#fff', '#ffe9a8'], { speed: 160, size: 14, alpha: .9, sway: 50, spin: 3 });
    ctx.restore();
  }

  // =====================================================================================================
  // designed transitions
  // =====================================================================================================
  // shard mesh for the glass shatter
  const SH = (() => { const cols = 6, rows = 10, P = []; for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) P.push([i * W / cols + (i > 0 && i < cols ? (hash(i * 7 + j * 13) - .5) * 100 : 0), j * H / rows + (j > 0 && j < rows ? (hash(i * 11 + j * 5) - .5) * 120 : 0)]);
    const T = [], id = (i, j) => j * (cols + 1) + i; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = P[id(i, j)], b = P[id(i + 1, j)], c = P[id(i + 1, j + 1)], d = P[id(i, j + 1)]; if (hash(i + j * 9) > .5) { T.push([a, b, c]); T.push([a, c, d]); } else { T.push([a, b, d]); T.push([b, c, d]); } } return T; })();
  function shatter(ctx, snap, k, ix, iy) {
    SH.forEach((tri, n) => {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, dx = cx - ix, dy = cy - iy, d = Math.hypot(dx, dy) + 1, dl = clamp((k - d / 12000) / (.9 - d / 12000)), e = Math.pow(dl, 1.4);
      const vx = dx / d * (400 + hash(n) * 1400) * e, vy = dy / d * (400 + hash(n) * 1400) * e + 1400 * e * e * .6, rot = (hash(n + 3) - .5) * 3.4 * e, sc = 1 + e * (.2 + hash(n + 9) * .5), al = 1 - clamp((dl - .5) / .5);
      if (al <= 0) return; ctx.save(); ctx.globalAlpha = al; ctx.translate(cx + vx, cy + vy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      ctx.beginPath(); ctx.moveTo(tri[0][0], tri[0][1]); ctx.lineTo(tri[1][0], tri[1][1]); ctx.lineTo(tri[2][0], tri[2][1]); ctx.closePath(); ctx.clip();
      const x0 = Math.min(tri[0][0], tri[1][0], tri[2][0]) - 2, y0 = Math.min(tri[0][1], tri[1][1], tri[2][1]) - 2, x1 = Math.max(tri[0][0], tri[1][0], tri[2][0]) + 2, y1 = Math.max(tri[0][1], tri[1][1], tri[2][1]) + 2;
      ctx.drawImage(snap, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    });
  }
  const snapCanvas = () => scratch('snap', W, H);
  function glitchDraw(ctx, snap, g0) {
    const [cr, gr] = scratch('tR', W, H), [cc, gc] = scratch('tC', W, H);
    gr.drawImage(snap, 0, 0); gr.globalCompositeOperation = 'multiply'; gr.fillStyle = '#ff0000'; gr.fillRect(0, 0, W, H);
    gc.drawImage(snap, 0, 0); gc.globalCompositeOperation = 'multiply'; gc.fillStyle = '#00ffff'; gc.fillRect(0, 0, W, H);
    const fr = Math.floor(g0 * 30), rr2 = i => hash(fr * 13.7 + i * 3.1), sp = 14 + g0 * 46;
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    const N = 22; let y = 0; for (let i = 0; i < N; i++) { const hh = (i === N - 1) ? H - y : 40 + rr2(i) * 170 * (1 - g0 * .3); const hit = rr2(i + 40) > .45, off = hit ? (rr2(i + 90) - .5) * 300 * (.3 + g0) : 0;
      ctx.drawImage(cr, 0, y, W, hh, off - sp, y, W, hh); ctx.drawImage(cc, 0, y, W, hh, off + sp, y, W, hh); y += hh; if (y >= H) break; }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = .5; ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { ctx.fillStyle = rr2(i + 200) > .5 ? 'rgba(255,60,80,.6)' : 'rgba(80,255,255,.5)'; ctx.fillRect(0, rr2(i + 150) * H, W, 4 + rr2(i + 170) * 30); } ctx.restore();
  }

  // =====================================================================================================
  // MAIN
  // =====================================================================================================
  A.scene({ name: 'v2_live_ott', start: 5.0, end: 9.35, draw(ctx, s) {
    const t = s.t;
    ctx.fillStyle = '#060a1e'; ctx.fillRect(0, 0, W, H);
    const wa = ease.inOut(inv(5.50, 5.60, t));
    // ---- SHOT 1 (skyline) -> whip
    if (t < 5.62) { ctx.save(); ctx.translate(-wa * 1500, 0); ctx.transform(1, 0, wa * .25, 1, 0, 0); shot1(ctx, t); ctx.restore(); }
    // ---- NETFLIX (reveal under the push-through) with glitch exit
    if (t >= T_S3 - .04 && t < 8.2) {
      if (t >= 7.90 && t < 8.18) { const [sc, sg] = snapCanvas(); drawB(sg, t); ctx.save(); glitchDraw(ctx, sc, inv(7.90, 8.12, t)); ctx.restore(); if (t > 7.99 && t < 8.06) V.flash(ctx, t, 7.99, .07, '#fff', .7); }
      else { ctx.save(); drawB(ctx, t); ctx.restore(); }
    }
    // ---- SHOT 2 (studio wall) -> SHATTER -> SHOT 3 (logo wall)
    if (t >= 5.49 && t < T_S2) { ctx.save(); ctx.translate((1 - wa) * 1500, 0); ctx.transform(1, 0, -(1 - wa) * .25, 1, 0, 0); shot2(ctx, t); ctx.restore(); }
    if (wa > 0 && wa < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate((1 - wa) * 1500, 0); ctx.fillStyle = lin(ctx, -260, 0, 60, 0, [[0, 'rgba(90,209,255,0)'], [.7, 'rgba(120,200,255,.7)'], [1, 'rgba(255,255,255,1)']]); ctx.fillRect(-260, 0, 320, H); ctx.restore(); streaks(ctx, t, 16, '#bfe0ff', .7, 3, 8); }
    if (t >= T_S2 && t < T_S3 + .12) {
      const zi = inv(T_S3 - .04, T_S3 + .1, t);
      ctx.save(); if (zi > 0) { ctx.globalAlpha = 1 - ease.in(inv(T_S3 + .02, T_S3 + .1, t)); ctx.translate(540, 700); const zs = 1 + ein(zi) * 5; ctx.scale(zs, zs); ctx.translate(-540, -700); }
      shot3(ctx, t); ctx.restore();
      const kk = (t - T_S2) / .4; if (kk < 1) { const [sc, sg] = snapCanvas(); shot2(sg, Math.min(t, 5.999)); ctx.save(); shatter(ctx, sc, kk, 540, 640); ctx.restore(); V.flash(ctx, t, T_S2, .12, '#fff', .8); }
    }
    // ---- DISNEY+ under comet iris
    if (t >= T_DS) {
      const wc = inv(T_DS, T_DS + .24, t); ctx.save(); const cu = t > T_TAIL2 ? ease.in(inv(T_TAIL2, 9.33, t)) : 0;
      if (t > T_TAIL2) { ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, '#0a1466'], [1, '#FFF3C4']]); ctx.fillRect(0, 0, W, H); ctx.translate(-cu * 1500, 0); ctx.transform(1, 0, cu * .25, 1, 0, 0); }
      if (wc < 1) { ctx.beginPath(); ctx.arc(600, 560, ease.out(wc) * 1500, 0, TAU); ctx.clip(); }
      drawC(ctx, t); ctx.restore();
      if (wc > 0 && wc < 1) { const r = ease.out(wc) * 1500; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,225,255,.95)'; ctx.lineWidth = 44 * (1 - wc) + 4; ctx.beginPath(); ctx.arc(600, 560, r, 0, TAU); ctx.stroke(); ctx.restore();
        for (let i = 0; i < 34; i++) { const a = hash(i) * TAU, x = 600 + Math.cos(a) * r, y = 560 + Math.sin(a) * r; V.sparkle(ctx, x, y, 30 + hash(i + 2) * 40, i % 2 ? '#ffe9a8' : '#fff', i, 1 - wc); } }
      if (t > T_TAIL2) { const wt = cu; streaks(ctx, t, 16, '#cfe0ff', .8 * wt + .1, 12, 8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lin(ctx, W - wt * 1500 - 300, 0, W - wt * 1500 + 40, 0, [[0, 'rgba(255,240,200,0)'], [1, 'rgba(255,243,196,.9)']]); ctx.fillRect(Math.max(0, W - wt * 1500 - 100), 0, 340, H); ctx.restore(); }
    }
    // ---- entry burst (gold flash + rays), covers the previous scene
    const eu = inv(5.0, 5.3, t);
    if (eu < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = (1 - eu) * (1 - eu);
      ctx.globalAlpha = a; ctx.fillStyle = '#FFF3C4'; ctx.fillRect(0, 0, W, H);
      ctx.translate(540, 900); for (let i = 0; i < 28; i++) { const an = i / 28 * TAU + .1, len = 500 + eu * 1600; ctx.save(); ctx.rotate(an); ctx.globalAlpha = a * .8; ctx.fillStyle = lin(ctx, 0, 0, len, 0, [[0, 'rgba(255,243,196,.9)'], [1, 'rgba(255,194,74,0)']]); ctx.beginPath(); ctx.moveTo(0, -6 - hash(i) * 30); ctx.lineTo(len, 0); ctx.lineTo(0, 6 + hash(i) * 30); ctx.fill(); ctx.restore(); }
      ctx.restore(); }
  } });
})();

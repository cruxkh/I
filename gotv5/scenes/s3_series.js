// SERIES: three hand-made paper drama posters (Turkish / Korean / anime) + avalanche of small posters. Window 11.8 to 15.9.
(() => {
  const { clamp, lerp, ease, hash } = A, C = CL.C, INK = C.ink, TAU = Math.PI * 2, W = 1080;
  const PW = 620, PH = 700, PAD = 50;
  // CUE 12.39 turkish poster slam | CUE 13.095 korean poster slam | CUE 13.99 anime poster flip | CUE 14.8 avalanche | CUE 15.11 second wave

  // ---------- paper-cut helpers
  const cut = (g, fn, fill, o = {}) => { g.save(); const sh = o.sh ?? 6; if (sh) { g.translate(sh * .6, sh); g.fillStyle = 'rgba(40,20,0,.3)'; fn(g); g.fill(); g.translate(-sh * .6, -sh); } g.fillStyle = fill; fn(g); g.fill(); if (o.lw !== 0) { g.lineWidth = o.lw ?? 6; g.strokeStyle = o.stroke || INK; g.lineJoin = 'round'; g.stroke(); } g.restore(); };
  const heart = (s, cx = 0, cy = 0) => g => { g.beginPath(); g.moveTo(cx, cy + s * .9); g.bezierCurveTo(cx - s * 1.25, cy + s * .15, cx - s * .65, cy - s * .85, cx, cy - s * .3); g.bezierCurveTo(cx + s * .65, cy - s * .85, cx + s * 1.25, cy + s * .15, cx, cy + s * .9); g.closePath(); };
  const circ = (x, y, r) => g => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
  const ell = (x, y, rx, ry, rot = 0) => g => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const poly = pts => g => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  const star4 = (x, y, r, rot = 0) => g => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU - Math.PI / 2, rr = i % 2 ? r * .26 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  const blossom = (g, x, y, r, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; cut(g, ell(Math.cos(a) * r * .52, Math.sin(a) * r * .52, r * .5, r * .4, a), '#FFF0F6', { lw: 4, sh: 0 }); } cut(g, circ(0, 0, r * .2), '#FF5FA8', { lw: 3, sh: 0 }); g.restore(); };

  // ---------- big poster art (poster-local coords, origin at centre, 620 x 700)
  function turkish(g) {
    g.fillStyle = '#A50F1E'; g.fillRect(-320, -360, 640, 720);
    g.fillStyle = '#C21B2E'; for (let i = 0; i < 16; i += 2) { const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU; g.beginPath(); g.moveTo(0, -20); g.lineTo(Math.cos(a0) * 900, -20 + Math.sin(a0) * 900); g.lineTo(Math.cos(a1) * 900, -20 + Math.sin(a1) * 900); g.closePath(); g.fill(); }
    CL.halftone(g, -310, -350, 620, 220, '#FFC629', 20, .5, { alpha: .32, fade: 'b' });
    cut(g, circ(0, -20, 178), '#FFC629', { lw: 7 }); cut(g, circ(0, -20, 136), '#FFDD66', { lw: 0, sh: 0 });
    // Bosphorus bridge silhouette
    const D = '#2b0a10'; g.strokeStyle = D; g.fillStyle = D; g.lineWidth = 6; g.lineCap = 'round';
    g.fillRect(-330, 105, 660, 20);
    for (const x of [-125, 125]) { g.fillRect(x - 13, -45, 26, 170); g.fillRect(x - 20, -45, 40, 10); g.fillRect(x - 17, -2, 34, 10); g.fillRect(x - 17, 48, 34, 10); }
    g.beginPath(); g.moveTo(-125, -45); g.quadraticCurveTo(0, 130, 125, -45); g.stroke();
    g.beginPath(); g.moveTo(-125, -45); g.quadraticCurveTo(-235, 55, -330, 100); g.stroke(); g.beginPath(); g.moveTo(125, -45); g.quadraticCurveTo(235, 55, 330, 100); g.stroke();
    g.lineWidth = 3; for (let t = .1; t < .95; t += .08) { const u = 1 - t, x = -125 + 250 * t, y = u * u * -45 + 2 * u * t * 130 + t * t * -45; g.beginPath(); g.moveTo(x, y); g.lineTo(x, 105); g.stroke(); }
    for (let k = 0; k < 4; k++) {
      const y0 = 125 + k * 42, col = ['#0B1F5C', '#17318A', '#2A57FF', '#0B1F5C'][k];
      g.beginPath(); g.moveTo(-330, y0); for (let x = -330; x <= 330; x += 20) g.lineTo(x, y0 + Math.sin(x * .05 + k * 2) * 8); g.lineTo(330, 420); g.lineTo(-330, 420); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      g.fillStyle = '#FFC629'; for (let x = -280 + k * 37; x < 300; x += 130) g.fillRect(x, y0 + 16, 44, 7);
    }
    // torn heart in two halves
    const s = 108, cx = 0, cy = -62, zig = []; for (let y = -cy - 200, k = 0; y <= 200; y += 34, k++) zig.push([(k % 2 ? 16 : -16), y + cy]);
    const half = (side) => {
      g.save(); g.translate(side * 13, side > 0 ? 8 : -2); g.rotate(side * .05);
      g.beginPath(); zig.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineTo(side * 400, zig[zig.length - 1][1]); g.lineTo(side * 400, zig[0][1]); g.closePath(); g.clip();
      g.lineJoin = 'round'; heart(s, cx, cy)(g); g.strokeStyle = '#fff'; g.lineWidth = 30; g.stroke();
      cut(g, heart(s, cx, cy), '#FF3B30', { lw: 8, sh: 8 }); cut(g, ell(-52, -95, 24, 14, -.6), '#FF8A80', { lw: 0, sh: 0 });
      g.beginPath(); zig.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = '#fff'; g.lineWidth = 9; g.stroke(); g.restore();
    };
    half(-1); half(1);
    // tulip
    g.save(); g.translate(-232, 20); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); g.moveTo(0, 46); g.lineTo(0, 200); g.stroke(); g.strokeStyle = C.green; g.lineWidth = 11; g.stroke();
    cut(g, g => { g.beginPath(); g.moveTo(0, 190); g.bezierCurveTo(-90, 150, -80, 90, -70, 70); g.bezierCurveTo(-30, 100, -5, 140, 0, 190); }, C.green, { lw: 5, sh: 4 });
    cut(g, g => { g.beginPath(); g.moveTo(0, 170); g.bezierCurveTo(85, 130, 80, 80, 68, 62); g.bezierCurveTo(30, 90, 5, 130, 0, 170); }, '#20A070', { lw: 5, sh: 4 });
    cut(g, g => { g.beginPath(); g.moveTo(-46, -72); g.bezierCurveTo(-58, -10, -42, 42, 0, 52); g.bezierCurveTo(42, 42, 58, -10, 46, -72); g.lineTo(24, -36); g.lineTo(0, -84); g.lineTo(-24, -36); g.closePath(); }, '#FF2D4A', { lw: 6, sh: 5 });
    cut(g, g => { g.beginPath(); g.moveTo(0, -84); g.bezierCurveTo(-22, -30, -18, 20, 0, 46); g.bezierCurveTo(18, 20, 22, -30, 0, -84); }, '#FF6B7D', { lw: 4, sh: 0 });
    g.restore();
    CL.title(g, 'טורקיות', 0, -288, { size: 122, fill: '#FFD60A', rot: -.02 });
  }
  function korean(g) {
    g.fillStyle = '#FFC4DC'; g.fillRect(-320, -360, 640, 720);
    CL.halftone(g, -320, -360, 640, 720, '#FFFDF6', 30, .5, { alpha: .8, k: .55 });
    cut(g, circ(40, 10, 270), '#B8F0DC', { lw: 7 });
    for (let i = 0; i < 7; i++) cut(g, circ(-300 + i * 100, 350, 55), i % 2 ? '#FFFDF6' : '#8FE3C6', { lw: 5, sh: 0 });   // scalloped bottom
    // branch with blossoms
    g.strokeStyle = '#6b3f2a'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(-318, -120); g.quadraticCurveTo(-200, -190, -70, -235); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(-230, -165); g.quadraticCurveTo(-200, -120, -160, -100); g.stroke();
    // umbrella
    g.save(); g.translate(60, -30); g.rotate(.14);
    g.strokeStyle = INK; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 250); g.quadraticCurveTo(0, 310, -50, 300); g.stroke(); g.strokeStyle = '#FFFDF6'; g.lineWidth = 10; g.stroke();
    const can = g => { g.beginPath(); g.moveTo(-215, 40); g.quadraticCurveTo(-215, -220, 0, -240); g.quadraticCurveTo(215, -220, 215, 40); for (let i = 0; i < 5; i++) g.quadraticCurveTo(215 - i * 86 - 43, 96, 215 - (i + 1) * 86, 40); g.closePath(); };
    g.save(); g.translate(8, 10); g.fillStyle = 'rgba(40,20,0,.3)'; can(g); g.fill(); g.restore();
    g.save(); can(g); g.clip(); g.fillStyle = '#FFFDF6'; g.fillRect(-230, -260, 460, 400);
    for (let i = 0; i < 5; i++) { const xa = -215 + i * 86, xb = xa + 86; if (i % 2 === 0) { g.fillStyle = '#FF8FC0'; g.beginPath(); g.moveTo(0, -244); g.lineTo(xa, 120); g.lineTo(xb, 120); g.closePath(); g.fill(); } }
    g.strokeStyle = INK; g.lineWidth = 5; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(0, -244); g.lineTo(-215 + i * 86, 80); g.stroke(); }
    g.restore(); can(g); g.lineWidth = 8; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
    cut(g, circ(0, -244, 12), INK, { lw: 0, sh: 0 });
    g.restore();
    // paper-cut hearts
    [[-250, 60, 34, '#FF5FA8'], [-205, 165, 26, '#FFFDF6'], [255, -130, 30, '#FF5FA8'], [-150, 250, 30, '#FFFDF6'], [110, 300, 22, '#FF5FA8']].forEach(([x, y, s, f]) => cut(g, heart(s, x, y), f, { lw: 5, sh: 4 }));
    // blossoms
    [[-235, -175, 34, .2], [-140, -215, 40, .9], [-300, -95, 28, 1.5], [260, -20, 34, .5], [-260, 215, 36, 2], [215, 150, 30, 1.2], [0, 310, 34, 0], [-30, 250, 24, 1]].forEach(a => blossom(g, ...a));
    // K-pop lightstick
    g.save(); g.translate(218, 180); g.rotate(.4);
    cut(g, g2 => g2.roundRect(-17, -20, 34, 200, 12), '#3a3a52', { lw: 6, sh: 5 }); cut(g, g2 => g2.roundRect(-20, 30, 40, 26, 6), '#8FE3C6', { lw: 5, sh: 0 }); cut(g, g2 => g2.roundRect(-20, 80, 40, 14, 5), '#FFD60A', { lw: 4, sh: 0 });
    cut(g, circ(0, -38, 48), '#FFFDF6', { lw: 6, sh: 5 }); cut(g, heart(34, 0, -42), '#FF3E8E', { lw: 5, sh: 0 }); cut(g, g2 => g2.roundRect(-26, -14, 52, 12, 5), '#B8F0DC', { lw: 4, sh: 0 });
    g.restore();
    CL.title(g, 'קוריאניות', 0, -288, { size: 100, fill: '#FF5FA8', rot: .02 });
  }
  function animeFace(g) {
    g.fillStyle = '#8FD8FF'; g.fillRect(-320, -360, 640, 720);
    CL.halftone(g, -320, -360, 640, 720, '#FFFDF6', 28, .5, { alpha: .6, k: .6 });
    g.save(); g.translate(0, 45);
    // sound-effect burst behind the head
    g.save(); g.translate(0, 70); g.beginPath(); for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, r = i % 2 ? 250 : 330 + (i % 4 ? 0 : 20); g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.02); } g.closePath(); g.fillStyle = '#FFD60A'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); g.restore();
    // back hair
    const hair = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI, r = i % 2 ? 235 : 345; hair.push([Math.cos(a) * r * .95, 70 + Math.sin(a) * r * 1.0 * (i % 2 ? .95 : .9)]); } hair.push([200, 300], [-200, 300]);
    cut(g, poly(hair), '#1B2A8F', { lw: 8, sh: 8 });
    g.save(); poly(hair)(g); g.clip(); g.fillStyle = '#3F63FF'; for (let i = 1; i < 14; i += 2) { g.beginPath(); g.moveTo(hair[i][0], hair[i][1]); g.lineTo(hair[i + 1][0] * .8, hair[i + 1][1] * .8 + 10); g.lineTo(hair[i - 1][0] * .8, hair[i - 1][1] * .8 + 10); g.closePath(); g.fill(); } g.restore();
    // face
    cut(g, ell(0, 110, 178, 205), '#FFDDBE', { lw: 8, sh: 6 });
    [-1, 1].forEach(sd => { cut(g, ell(sd * 112, 215, 42, 22), '#FF9DB8', { lw: 0, sh: 0 }); g.strokeStyle = '#E0587F'; g.lineWidth = 5; g.lineCap = 'round'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(sd * 112 + k * 20 - 8, 226); g.lineTo(sd * 112 + k * 20 + 6, 204); g.stroke(); } });
    // eyes
    [-1, 1].forEach(sd => {
      g.save(); g.translate(sd * 88, 160);
      cut(g, ell(0, 0, 58, 76), '#FFFFFF', { lw: 7, sh: 0 });
      g.save(); ell(0, 0, 58, 76)(g); g.clip(); cut(g, ell(0, 6, 46, 64), '#6B3BE0', { lw: 0, sh: 0 }); g.fillStyle = '#FF7AB8'; g.beginPath(); g.ellipse(0, 24, 40, 40, 0, 0, Math.PI); g.fill(); g.fillStyle = '#3a1a9a'; g.beginPath(); g.ellipse(0, -30, 46, 30, 0, Math.PI, TAU); g.fill();
      cut(g, ell(0, 8, 21, 30), INK, { lw: 0, sh: 0 }); g.restore();
      cut(g, circ(-17, -22, 18), '#fff', { lw: 0, sh: 0 }); cut(g, circ(16, 30, 9), '#fff', { lw: 0, sh: 0 }); cut(g, star4(22, -32, 11), '#fff', { lw: 0, sh: 0 });
      g.strokeStyle = INK; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.ellipse(0, 0, 58, 76, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      g.lineWidth = 8; g.beginPath(); g.moveTo(sd * 52, -46); g.lineTo(sd * 76, -62); g.stroke();
      g.restore();
    });
    // nose + mouth
    g.strokeStyle = '#B5674A'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, 236); g.lineTo(6, 248); g.stroke();
    g.beginPath(); g.moveTo(-34, 276); g.quadraticCurveTo(0, 336, 34, 276); g.closePath(); g.fillStyle = '#C81E3A'; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = '#fff'; g.fillRect(-22, 278, 44, 9);
    // fringe
    const fr = [[-200, -20]]; for (let x = -190; x <= 190; x += 38) fr.push([x, (Math.round((x + 190) / 38) % 2) ? 40 : 96 + (Math.abs(x) < 50 ? 14 : 0)]);
    fr.push([200, -20]);
    g.save(); g.translate(0, 0); const frontH = g2 => { g2.beginPath(); g2.moveTo(-205, 90); g2.quadraticCurveTo(-215, -110, -50, -190); g2.quadraticCurveTo(70, -160, 205, 90); for (let i = fr.length - 2; i >= 1; i--) g2.lineTo(fr[i][0], fr[i][1]); g2.closePath(); };
    cut(g, frontH, '#1B2A8F', { lw: 8, sh: 6 }); g.save(); frontH(g); g.clip(); g.fillStyle = '#3F63FF'; g.beginPath(); g.moveTo(-120, -80); g.lineTo(-40, -150); g.lineTo(-90, 20); g.closePath(); g.fill(); g.beginPath(); g.moveTo(60, -140); g.lineTo(130, -30); g.lineTo(40, -20); g.closePath(); g.fill(); g.restore(); g.restore();
    g.restore();
    CL.title(g, 'אנימה', 0, -288, { size: 150, fill: '#1F4FFF', rot: .02 });
  }

  const POSTERS = [
    { key: 'tur', fn: turkish, t0: 12.39, home: [330, 490], rot: -.07, from: [-700, 300], rotFrom: -.9, seed: 1, ov: 'tur' },
    { key: 'kor', fn: korean, t0: 13.095, home: [755, 770], rot: .06, from: [1500, 700], rotFrom: 1.0, seed: 2, ov: 'kor' },
    { key: 'ani', fn: animeFace, t0: 13.99, home: [345, 1000], rot: -.035, from: [345, 2200], rotFrom: .3, seed: 3, ov: 'ani', flip: true },
  ];
  const posterLayer = P => CL.layer('s3poster:' + P.key, PW + PAD * 2, PH + PAD * 2, (g, w, h) => { g.translate(w / 2, h / 2); CL.scrap(g, 0, 0, PW, PH, { fill: P.key === 'tur' ? '#A50F1E' : P.key === 'kor' ? '#FFC4DC' : '#8FD8FF', seed: 11 + P.seed * 5, rough: 5, shadow: 16, draw: P.fn }); });

  // live overlays (poster coords, 12 fps)
  const OV = {
    tur(g, q, t0) {
      const cyc = .9, u = (((q - t0) % cyc) + cyc) % cyc / cyc, y = -10 + u * 200, a = u > .8 ? 1 - (u - .8) / .2 : 1;
      g.save(); g.globalAlpha = a; g.translate(4, y); g.scale(1.5, 1.5); cut(g, g2 => { g2.beginPath(); g2.moveTo(0, -26); g2.bezierCurveTo(24, 4, 17, 24, 0, 24); g2.bezierCurveTo(-17, 24, -24, 4, 0, -26); }, '#4FB3FF', { lw: 5, sh: 3 }); cut(g, ell(-6, 6, 4, 8, .3), '#fff', { lw: 0, sh: 0 }); g.restore();
      for (let i = 0; i < 3; i++) { const p = (q * 1.5 + i * .33) % 1; CL.star(g, -270 + i * 270 + (hash(i + Math.floor(q * 2)) - .5) * 20, -180 - (i % 2) * 20, 12 * (1 - Math.abs(p - .5) * 1.2), 4, { lw: 4, rot: p }); }
    },
    kor(g, q, t0) {
      g.save(); g.beginPath(); g.rect(-310, -350, 620, 700); g.clip();
      for (let i = 0; i < 9; i++) { const ph = ((q - t0) * .28 + i / 9) % 1, x = -300 + hash(i * 3.1) * 600 + Math.sin(ph * 9 + i) * 26, y = -370 + ph * 740; g.save(); g.translate(x, y); g.rotate(q * 2.4 + i); cut(g, ell(0, 0, 15, 9), i % 2 ? '#FFF0F6' : '#FF9EC8', { lw: 3, sh: 3 }); g.restore(); }
      g.restore();
      for (let i = 0; i < 3; i++) { const k = Math.floor(q * 12 + i * 3) % 4; cut(g, star4(255 + [-26, 30, 4][i] - (i === 2 ? 0 : 0), 120 + [-40, -60, -105][i], [15, 11, 18][i] * (k % 2 ? 1 : .6), .3 * k), i === 1 ? '#FFD60A' : '#FFFDF6', { lw: 4, sh: 0 }); }
    },
    ani(g, q, t0) {
      g.save(); g.translate(205, 290); g.rotate(-.18 + Math.sin(q * 30) * .03); const sc = 1 + (Math.floor(q * 12) % 2) * .06; g.scale(sc, sc);
      g.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, r = i % 2 ? 62 : 118; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#FF3B30'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
      g.font = '400 92px Bangers'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.lineWidth = 12; g.strokeStyle = INK; g.strokeText('!!', 0, 4); g.fillStyle = '#FFFDF6'; g.fillText('!!', 0, 4); g.restore();
      [[-250, -190, 30], [250, -220, 24], [-262, 80, 26], [258, 60, 20], [-140, 320, 22], [120, -320, 18]].forEach(([x, y, r], i) => { const k = (Math.floor(q * 12) + i * 2) % 5, s = [1, .6, .9, .5, .8][k]; cut(g, star4(x, y, r * s, k * .1), ['#FFFDF6', '#FFD60A', '#FF7AB8'][i % 3], { lw: 5, sh: 3 }); });
    },
  };

  function drawPoster(ctx, t, P) {
    const fly = .3, land = P.t0 - .03, ts = land - fly; if (t < ts) return;
    const q = CL.q(t, 12), u = clamp((q - ts) / fly), e = ease.out(u), j = CL.j(t, P.seed * 3, 5);
    const x = lerp(P.from[0], P.home[0], e), y = lerp(P.from[1], P.home[1], e), rot = lerp(P.rotFrom, P.rot, e) + j[2];
    const sinceLand = q - land, squash = sinceLand < 0 ? 1 : [1.09, .96, 1.03, 1][Math.min(3, Math.floor(sinceLand * 12 + 1e-6))];
    const shk = CL.shake(t, land, .45, 10);
    ctx.save(); ctx.translate(x + j[0] * .5 + shk[0], y + j[1] * .5 + shk[1]); ctx.rotate(rot); ctx.scale(squash, squash);
    let flipX = 1, back = false; if (P.flip && u < 1) { flipX = Math.cos((1 - e) * Math.PI); back = flipX < 0; flipX = Math.abs(flipX) < .06 ? .06 : Math.abs(flipX); }
    ctx.scale(flipX, 1);
    if (back) { CL.scrap(ctx, 0, 0, PW, PH, { fill: '#F4ECD8', seed: 30, shadow: 16 }); CL.halftone(ctx, -280, -320, 560, 640, C.red, 34, .5, { alpha: .3 }); }
    else {
      ctx.drawImage(posterLayer(P), -(PW + PAD * 2) / 2, -(PH + PAD * 2) / 2);
      if (u >= 1) { ctx.save(); OV[P.ov](ctx, q, P.t0); ctx.restore(); }
      const tp = CL.pop(t, land + .05, .3);
      if (tp > 0) { CL.tape(ctx, -245, -348, -.55, 150, 46); CL.tape(ctx, 245, -348, .55, 150, 46); }
    }
    ctx.restore();
    if (sinceLand >= 0 && sinceLand < .3) { ctx.save(); ctx.translate(P.home[0], P.home[1]); CL.sparks(ctx, 0, 0, 385, 385 + 70, 18, t, { lw: 9 }); ctx.restore(); }
  }

  // ---------- avalanche of small posters
  const BG = ['#FF7AB8', '#FFD60A', '#2BC48A', '#1F4FFF', '#FF8A1F', '#FF3B30', '#B8F0DC', '#8FD8FF', '#C7A6FF', '#F4ECD8', '#FFC4DC', '#FFE14D'];
  const FG = ['#FFFDF6', '#FF3B30', '#FFFDF6', '#FFD60A', '#FFFDF6', '#FFD60A', '#FF3E8E', '#1F4FFF', '#5B2EE0', '#FF3B30', '#2BC48A', '#1F4FFF'];
  const mini = v => CL.layer('s3mini' + v, 340, 460, (g, w, h) => {
    g.translate(w / 2, h / 2);
    CL.scrap(g, 0, 0, 290, 400, { fill: BG[v], seed: 40 + v, rough: 4, shadow: 10, draw: (g, cw) => {
      CL.halftone(g, -150, -200, 300, 400, 'rgba(255,255,255,.55)', 26, .5, { alpha: .6, k: .5, fade: 't' });
      g.save(); g.translate(0, -40); const f = FG[v], k = v % 8;
      if (k === 0) cut(g, heart(90), f, { lw: 8 }); else if (k === 1) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 50 : 105; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); cut(g, () => { }, f, { lw: 0, sh: 0 }); cut(g, g2 => { g2.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 50 : 105; g2.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g2.closePath(); }, f, { lw: 8 }); }
      else if (k === 2) { cut(g, circ(0, 0, 92), f, { lw: 8 }); cut(g, poly([[-30, -48], [-30, 48], [52, 0]]), INK, { lw: 0, sh: 0 }); }
      else if (k === 3) { for (let i = 0; i < 6; i++) blossom(g, Math.cos(i / 6 * TAU) * 60, Math.sin(i / 6 * TAU) * 60, 50, i); blossom(g, 0, 0, 44, 0); }
      else if (k === 4) { cut(g, circ(0, 0, 95), '#FFDDBE', { lw: 8 }); cut(g, ell(-34, -8, 16, 24), INK, { lw: 0, sh: 0 }); cut(g, ell(34, -8, 16, 24), INK, { lw: 0, sh: 0 }); g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(0, 26, 34, .2, Math.PI - .2); g.stroke(); }
      else if (k === 5) cut(g, poly([[20, -110], [-56, 12], [-4, 12], [-26, 110], [58, -20], [4, -20]]), f, { lw: 8 });
      else if (k === 6) { cut(g, g2 => g2.roundRect(-100, -70, 200, 140, 18), INK, { lw: 8 }); cut(g, g2 => g2.roundRect(-84, -54, 168, 108, 10), f, { lw: 0, sh: 0 }); cut(g, poly([[-20, -26], [-20, 26], [26, 0]]), '#fff', { lw: 5, sh: 0 }); }
      else { cut(g, circ(0, 0, 90), f, { lw: 8 }); cut(g, circ(34, -18, 78), BG[v], { lw: 0, sh: 0 }); }
      g.restore();
      g.fillStyle = 'rgba(20,20,20,.85)'; g.beginPath(); g.roundRect(-100, 96, 200, 22, 8); g.fill(); g.fillStyle = 'rgba(20,20,20,.55)'; g.beginPath(); g.roundRect(-70, 132, 140, 14, 7); g.fill();
    } });
  });
  const N = 36, ITEMS = Array.from({ length: N }, (_, i) => {
    const wave = i < 18 ? 0 : 1, side = hash(i * 6.7 + 2), tx = 90 + hash(i * 1.7 + .3) * 900, ty = 560 + Math.pow(hash(i * 2.9 + 1), .8) * 780;
    return { i, v: i % 12, ts: (wave ? 15.11 + (i - 18) * .014 : 14.8 + i * .016) - .03, tx, ty, rot: (hash(i * 4.1) - .5) * .9, spin: (hash(i * 3.3) - .5) * 3, sc: .95 + hash(i * 5.3) * .5,
      sx: side > .9 ? 1450 : side > .8 ? -350 : tx + (hash(i * 8.1) - .5) * 400, sy: side > .8 ? ty - 350 : -420 };
  });
  function avalanche(ctx, t) {
    const q = CL.q(t, 24);
    for (const it of ITEMS) {
      if (q < it.ts) continue; const dur = .5, u = clamp((q - it.ts) / dur), j = u >= 1 ? CL.j(t, it.i, 3) : [0, 0, 0];
      const y = lerp(it.sy, it.ty, ease.outBounce(u)), x = lerp(it.sx, it.tx, ease.out(u)), rot = it.rot + (1 - ease.out(u)) * it.spin;
      ctx.save(); ctx.translate(x + j[0], y + j[1]); ctx.rotate(rot + j[2]); ctx.scale(it.sc, it.sc); ctx.drawImage(mini(it.v), -170, -230);
      if (u >= 1 && it.i % 3 === 0) CL.tape(ctx, 0, -205, (it.i % 2 ? -.2 : .25), 100, 34);
      ctx.restore();
    }
  }

  // ---------- scene
  A.scene({ name: 's3_series', start: 11.8, end: 15.9, draw: (ctx, s) => {
    const t = s.t, tr = clamp((t - 11.8) / .3);
    ctx.save();
    if (tr < 1) {   // torn paper wipe, right to left
      const q = CL.q(t, 12), edge = W * (1 - ease.inOut(tr)) - 40, pts = [];
      for (let y = -40; y <= 1960; y += 50) pts.push([edge + (hash(y * .1 + q * 7) - .5) * 70, y]);
      const path = (dx, dy) => { ctx.beginPath(); ctx.moveTo(1200, -60); pts.forEach(p => ctx.lineTo(p[0] + dx, p[1] + dy)); ctx.lineTo(1200, 1980); ctx.closePath(); };
      ctx.fillStyle = 'rgba(40,20,0,.4)'; path(-22, 8); ctx.fill(); ctx.fillStyle = C.white; path(-14, 0); ctx.fill();
      path(0, 0); ctx.clip();
    }
    CL.paper(ctx, 'kraft', { dots: '#FF7AB8', dotSize: 34, dotAlpha: .14 });
    // "סדרות" ransom chip on its word
    const cp = CL.pop(t, 11.99, .3), av = t < 14.8;
    if (cp > 0 && av) { const j = CL.j(t, 9, 4); CL.chip(ctx, 'סדרות', 540 + j[0], 74 + j[1], { size: 82, rot: -.03 + j[2], scale: cp, fill: C.yellow, seed: 4 }); }
    for (const P of POSTERS) drawPoster(ctx, t, P);
    avalanche(ctx, t);
    // titles on the avalanche words
    const a = CL.pop(t, 14.77, .3), b = CL.pop(t, 15.08, .3);
    if (a > 0) { const j = CL.j(t, 21, 4); CL.title(ctx, 'המון', 720 + j[0], 215 + j[1], { size: 210, rot: .06 + j[2], scale: a, fill: C.yellow }); }
    if (b > 0) { const j = CL.j(t, 22, 4); CL.title(ctx, 'תוכן!', 360 + j[0], 430 + j[1], { size: 200, rot: -.07 + j[2], scale: b, fill: '#fff' }); }
    ctx.restore();
  } });
})();

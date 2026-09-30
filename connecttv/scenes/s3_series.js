// s3_series (LANDSCAPE 1920x1080): "סדרות טורקיות" (8.88 / 9.215) + "סדרות הודיות" (10.0 / 10.345). Holds: tur at v=9.98, ind at v=11.03.
// Two designed glossy wide key-art posters (no real faces): Turkish drama (rose/burgundy, velvet curtain, moon, couple silhouettes,
// torn heart, big title) and Bollywood (pink/orange/gold, mandala, dancers, title). Scene clock s.t freezes in holds -> idle life runs on A.T.
(() => {
  const { clamp, lerp, inv, ease, hash, rng, TAU } = A; const C = CL.C; const W = 1920, H = 1080;
  const PW = 1040, PH = 580, SS = 1.5, PCX = 960, PCY = 505, PSC = 1.12;      // poster size (own space), supersample, centre on screen
  const GOLD = ['#fff4c8', '#ffb400'];

  // ---------- small helpers
  const fitTitle = (g, s, maxW, size) => { g.save(); g.font = `900 ${size}px Rubik`; g.direction = 'rtl'; const w = g.measureText(s).width; g.restore(); return Math.min(size, size * maxW / w); };
  function heartPts(s, n = 72) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; p.push([s / 17 * 16 * Math.pow(Math.sin(a), 3), -s / 17 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]); } return p; }
  function silhouette(g, shapes, rim, fill, rimW = 6) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    const path = sh => {
      if (sh.b) A.blob(g, sh.b);
      else if (sh.e) { g.beginPath(); g.ellipse(sh.e[0], sh.e[1], sh.e[2], sh.e[3], sh.e[4] || 0, 0, TAU); }
      else { g.beginPath(); g.moveTo(sh.c[0][0], sh.c[0][1]); for (let i = 1; i < sh.c.length; i++) g.lineTo(sh.c[i][0], sh.c[i][1]); }
    };
    shapes.forEach(sh => { path(sh); g.strokeStyle = rim; g.lineWidth = (sh.c ? sh.w || 16 : 0) + rimW * 2; g.stroke(); });
    shapes.forEach(sh => { path(sh); if (sh.c) { g.strokeStyle = fill; g.lineWidth = sh.w || 16; g.stroke(); } else { g.fillStyle = fill; g.fill(); g.strokeStyle = fill; g.lineWidth = 1; g.stroke(); } });
  }
  const petal = (g, s, col1, col2) => { g.beginPath(); g.moveTo(0, -s * 1.3); g.bezierCurveTo(s * .95, -s * .7, s * .8, s * .8, 0, s * 1.2); g.bezierCurveTo(-s * .8, s * .8, -s * .95, -s * .7, 0, -s * 1.3); g.fillStyle = A.linear(g, 0, -s, 0, s, [[0, col1], [1, col2]]); g.fill(); g.strokeStyle = 'rgba(120,40,0,.35)'; g.lineWidth = Math.max(1, s * .08); g.stroke(); };

  // ---------- liquid reveal: candy bands sweep across, the NEW scene lives behind the last band. dir 'up' | 'left'
  function bandReveal(ctx, p, dir, cols, drawNew) {
    if (p <= 0) return; const N = cols.length, vert = dir === 'up', far = (vert ? H : W) + 340, amp = vert ? 60 : 70;
    const path = i => {
      const e = ease.inOut(clamp(p * 1.4 - i * .13)), base = lerp(far, -360, e); ctx.beginPath();
      if (vert) { ctx.moveTo(-70, H + 600); for (let x = -70; x <= W + 70; x += 40) ctx.lineTo(x, base + Math.sin(x * .008 + i * 2 + p * 7) * amp); ctx.lineTo(W + 70, H + 600); }
      else { ctx.moveTo(W + 600, -70); for (let y = -70; y <= H + 70; y += 30) ctx.lineTo(base + Math.sin(y * .012 + i * 2 + p * 7) * amp, y); ctx.lineTo(W + 600, H + 70); }
      ctx.closePath(); return base;
    };
    let lead = 0;
    for (let i = 0; i < N; i++) { const b = path(i); if (i === 0) lead = b; ctx.fillStyle = cols[i]; ctx.fill(); ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 8; ctx.translate(vert ? 0 : 14, vert ? 14 : 0); path(i); ctx.stroke(); ctx.restore(); }
    // candy drops flying ahead of the leading edge
    if (p < .9) for (let j = 0; j < 10; j++) { const k = hash(j * 5.3 + 1), a = hash(j * 2.7 + 4), r = 14 + hash(j + 8) * 30, d = 40 + a * 220, pos = k * (vert ? W : H); const x = vert ? pos : lead - d, y = vert ? lead - d : pos; CL.drop(ctx, x, y, r, cols[j % N], p * 6, j); }
    ctx.save(); path(N); ctx.clip(); drawNew(); ctx.restore();
  }

  // ======================================================================= TURKISH POSTER ART (cached, 1040x580)
  function artTur(g) {
    const rg = rng(11), hz = 468;
    g.fillStyle = A.linear(g, 0, 0, 0, PH, [[0, '#1c000f'], [.3, '#6b0834'], [.6, '#d63a68'], [.8, '#ff9a9a'], [1, '#2a0018']]); g.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,220,230,${.25 + rg() * .5})`; g.beginPath(); g.arc(rg() * PW, 12 + rg() * 250, .8 + rg() * 1.6, 0, TAU); g.fill(); }
    g.fillStyle = A.radial(g, 290, 215, 50, 330, [[0, 'rgba(255,225,215,.95)'], [.3, 'rgba(255,170,190,.5)'], [1, 'rgba(255,90,140,0)']]); g.fillRect(0, 0, PW, PH);
    g.beginPath(); g.arc(290, 215, 150, 0, TAU); g.fillStyle = A.radial(g, 262, 180, 20, 160, [[0, '#fffaf0'], [.7, '#ffd7dc'], [1, '#ffb0c4']]); g.fill();
    g.fillStyle = 'rgba(255,140,170,.20)'; [[250, 190, 32], [325, 250, 24], [285, 290, 16], [335, 165, 13]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    // Istanbul-style skyline: buildings + domes + minarets
    g.fillStyle = '#4a0b2c';
    let x = 0; while (x < PW) { const w = 34 + rg() * 44, h = 22 + rg() * 44; g.fillRect(x, hz - h, w, h + 4); x += w + 2; }
    const mosque = (cx, r, mh) => { g.beginPath(); g.arc(cx, hz - 18, r, Math.PI, 0); g.fill(); g.fillRect(cx - r, hz - 18, r * 2, 24); g.beginPath(); g.arc(cx - r * .95, hz - 8, r * .34, Math.PI, 0); g.arc(cx + r * .95, hz - 8, r * .34, Math.PI, 0); g.fill(); g.beginPath(); g.moveTo(cx - 3, hz - 18 - r); g.lineTo(cx, hz - 32 - r); g.lineTo(cx + 3, hz - 18 - r); g.fill();
      [-1, 1].forEach(sd => { const mx = cx + sd * (r + 34); g.fillRect(mx - 6, hz - mh, 12, mh + 6); g.fillRect(mx - 10, hz - mh * .62, 20, 7); g.beginPath(); g.moveTo(mx - 8, hz - mh); g.lineTo(mx, hz - mh - 46); g.lineTo(mx + 8, hz - mh); g.fill(); }); };
    mosque(96, 56, 190); mosque(560, 46, 150); mosque(880, 40, 130);
    g.fillStyle = 'rgba(255,214,120,.8)'; for (let i = 0; i < 70; i++) g.fillRect(rg() * PW, hz - 46 + rg() * 40, 3, 4);
    // water + moon reflection
    g.fillStyle = A.linear(g, 0, hz, 0, PH, [[0, '#8a1a44'], [.4, '#3a0620'], [1, '#14000c']]); g.fillRect(0, hz, PW, PH - hz);
    for (let i = 0; i < 8; i++) { const y = hz + 5 + i * 11, w = 190 - i * 14 + rg() * 30; g.fillStyle = `rgba(255,190,205,${.5 - i * .05})`; g.beginPath(); g.ellipse(290 + (rg() - .5) * 20, y, w / 2, 3 + rg() * 2, 0, 0, TAU); g.fill(); }
    // couple silhouettes (backlit by the moon)
    g.save(); g.translate(-40, -155);
    const couple = [
      { b: [[310, 296], [292, 288], [266, 298], [250, 326], [242, 380], [220, 450], [176, 522], [208, 506], [240, 470], [262, 440], [276, 400], [300, 362]] },
      { e: [297, 331, 29, 33, .1] }, { b: [[318, 328], [334, 340], [320, 346]] },
      { b: [[290, 360], [286, 386], [258, 398], [240, 430], [236, 484], [252, 544], [228, 600], [190, 655], [340, 655], [334, 600], [312, 544], [322, 484], [326, 430], [314, 398], [308, 384], [306, 360]] },
      { e: [372, 328, 32, 35, -.1] }, { e: [374, 305, 33, 21, -.1] }, { b: [[340, 324], [326, 338], [342, 344]] },
      { b: [[356, 360], [350, 388], [324, 402], [326, 440], [342, 500], [346, 560], [342, 655], [470, 655], [466, 560], [476, 480], [480, 420], [454, 398], [396, 388], [390, 360]] },
      { c: [[326, 430], [352, 470], [350, 510]], w: 20 },
    ];
    silhouette(g, couple, '#ffc2d2', '#150009', 5); g.restore();
    g.fillStyle = A.linear(g, 0, 470, 0, PH, [[0, 'rgba(255,190,205,.45)'], [1, 'rgba(20,0,12,.9)']]); g.fillRect(0, 498, PW, PH - 498);
    g.fillStyle = 'rgba(255,190,205,.55)'; g.beginPath(); g.ellipse(290, 500, 220, 8, 0, 0, TAU); g.fill();
    // dark side for the title
    g.fillStyle = A.linear(g, 560, 0, PW, 0, [[0, 'rgba(20,0,12,0)'], [.35, 'rgba(20,0,12,.8)'], [1, 'rgba(20,0,12,.95)']]); g.fillRect(560, 0, PW - 560, PH);
    // title art (two big lines), tagline, label
    const cx = 850, s1 = fitTitle(g, 'אסורה', 300, 150), s2 = fitTitle(g, 'אהבה', 300, 150), sz = Math.min(s1, s2);
    CL.title(g, 'אהבה', cx, 195, { size: sz, fill: GOLD, outline: '#3a0020', shadowCol: 'rgba(0,0,0,.55)' });
    CL.title(g, 'אסורה', cx, 335, { size: sz, fill: ['#ffd0d8', '#ff5a7a'], outline: '#3a0020', shadowCol: 'rgba(0,0,0,.55)' });
    g.fillStyle = '#ffd7a0'; g.fillRect(cx - 130, 415, 260, 3); A.text(g, 'אהבה. בגידה. סוד.', cx, 452, { font: '600 34px Rubik', fill: '#ffc6d6', dir: 'rtl' });
    g.fillStyle = 'rgba(20,0,12,.75)'; g.beginPath(); g.roundRect(cx - 150, 50, 300, 58, 29); g.fill(); g.strokeStyle = '#ffcf6b'; g.lineWidth = 3; g.stroke();
    A.text(g, 'דרמה טורקית', cx, 80, { font: '800 36px Rubik', fill: '#ffe7b0', dir: 'rtl' });
    CL.spark(g, cx - 128, 79, 12, 0, '#ffe7b0'); CL.spark(g, cx + 128, 79, 12, 0, '#ffe7b0');
  }
  function frameLayer(key, col, inW, fn) {   // glossy gel frame ring drawn over the art
    return CL.layer(key, PW * SS, PH * SS, g => {
      g.scale(SS, SS); g.beginPath(); g.roundRect(0, 0, PW, PH, 44); g.roundRect(inW, inW, PW - inW * 2, PH - inW * 2, 28); g.fillStyle = A.linear(g, 0, 0, PW, PH, col); g.fill('evenodd');
      g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.roundRect(2, 2, PW - 4, PH - 4, 42); g.stroke(); g.strokeStyle = 'rgba(60,10,0,.55)'; g.beginPath(); g.roundRect(inW, inW, PW - inW * 2, PH - inW * 2, 28); g.stroke();
      g.save(); g.beginPath(); g.roundRect(0, 0, PW, PH, 44); g.roundRect(inW, inW, PW - inW * 2, PH - inW * 2, 28); g.clip('evenodd'); g.fillStyle = A.linear(g, 0, 0, 0, PH * .5, [[0, 'rgba(255,255,255,.65)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, PW, PH * .5); g.restore();
      if (fn) fn(g);
    });
  }
  const curtainLayer = () => CL.layer('s3_curtain', (PW / 2 + 12) * SS, PH * SS, g => {
    g.scale(SS, SS); const w = PW / 2 + 12; g.fillStyle = '#7a0a2a'; g.fillRect(0, 0, w, PH);
    const st = [[0, '#3c0212']]; const N = 9; for (let i = 0; i < N; i++) { st.push([(i + .35) / N, '#d0245a']); st.push([(i + .7) / N, '#5a0620']); st.push([(i + 1) / N, '#3c0212']); }
    g.fillStyle = A.linear(g, 0, 0, w, 0, st); g.fillRect(0, 0, w, PH);
    g.fillStyle = A.linear(g, 0, 0, 0, PH, [[0, 'rgba(0,0,0,.45)'], [.2, 'rgba(0,0,0,0)'], [.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.5)']]); g.fillRect(0, 0, w, PH);
    g.fillStyle = '#ffcf6b'; g.fillRect(w - 6, 0, 6, PH); for (let x = 4; x < w; x += 12) g.fillRect(x, PH - 38, 4, 32);
  });

  // ---- torn heart (live; beats and drifts apart)
  function tornHeart(g, cx, cy, s, idle, appear) {
    const beat = 1 + .05 * Math.sin(idle * 7) * Math.max(0, Math.sin(idle * 7)) * 2, gap = 7 + 3 * Math.sin(idle * 2.2), pts = heartPts(s * beat), crack = [[0, -.3], [-.13, .05], [.10, .32], [-.10, .58], [.06, .8], [0, 1.05]].map(([x, y]) => [x * s, y * s]);
    g.save(); g.translate(cx, cy); g.scale(appear, appear); A.glow(g, 0, 0, s * 2.1, 'rgba(255,40,80,.85)', .8);
    [-1, 1].forEach(sd => {
      g.save(); g.translate(sd * gap, -sd * 2); g.rotate(sd * (.07 + .02 * Math.sin(idle * 2.2)));
      g.beginPath(); g.moveTo(sd * 400, -400); crack.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(sd * 400, 400); g.closePath(); g.clip();
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
      g.fillStyle = A.radial(g, -s * .3, -s * .3, s * .1, s * 1.5, [[0, '#ff8a9a'], [.35, '#ff2e4e'], [.75, '#b3001b'], [1, '#5a0010']]); g.fill(); g.lineWidth = 6; g.strokeStyle = '#3a0010'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-s * .5, -s * .5, s * .22, s * .1, -.7, 0, TAU); g.fill();
      g.restore();
    });
    g.strokeStyle = 'rgba(255,230,230,.7)'; g.lineWidth = 3; g.beginPath(); crack.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    g.restore();
  }

  function posterTur(ctx, t, idle) {   // origin = poster centre. Draws art, rain, heart, curtain, frame, gloss sweep.
    ctx.translate(-PW / 2, -PH / 2);
    ctx.fillStyle = 'rgba(2,4,30,.5)'; ctx.beginPath(); ctx.roundRect(12, 26, PW, PH, 44); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(22, 22, PW - 44, PH - 44, 28); ctx.clip();
    ctx.drawImage(CL.layer('s3_artTur', PW * SS, PH * SS, g => { g.scale(SS, SS); artTur(g); }), 0, 0, PW, PH);
    ctx.strokeStyle = 'rgba(255,220,235,.32)'; ctx.lineWidth = 2; ctx.beginPath();     // rain across the poster (idle time)
    for (let i = 0; i < 60; i++) { const sp = 800 + hash(i) * 500, x = ((hash(i * 3.3) * (PW + 260) - idle * 120) % (PW + 260) + PW + 260) % (PW + 260) - 130, y = ((idle * sp + hash(i * 9) * PH) % (PH + 120)) - 60; ctx.moveTo(x, y); ctx.lineTo(x - 16, y + 60); }
    ctx.stroke();
    tornHeart(ctx, 585, 205, 62, idle, CL.pop(t, 8.95, .35) || 0);
    const cu = (g => g * g * (3 - 2 * g))(inv(9.0, 9.43, t));    // velvet curtain rips open on 9.215
    if (cu < 1) { const cl = curtainLayer(), w = PW / 2 + 12, sx = lerp(1, .12, cu); ctx.save(); ctx.translate(22, 0); ctx.scale(sx, 1); ctx.drawImage(cl, 0, 0, w, PH); ctx.restore(); ctx.save(); ctx.translate(PW - 22, 0); ctx.scale(-sx, 1); ctx.drawImage(cl, 0, 0, w, PH); ctx.restore(); }
    const gs = inv(9.25, 9.95, t); if (gs > 0 && gs < 1) { ctx.globalAlpha = Math.sin(gs * Math.PI) * .55; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(lerp(-200, PW + 200, gs), 0); ctx.transform(1, 0, -.35, 1, 0, 0); ctx.fillRect(-50, 0, 100, PH); ctx.restore(); ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.drawImage(frameLayer('s3_frameTur', [[0, '#ffe6a8'], [.5, '#e8a0b0'], [1, '#c98a2c']], 22), 0, 0, PW, PH);
    CL.spark(ctx, 40, 40, 16 + 6 * Math.sin(idle * 4), 0, '#fff'); CL.spark(ctx, PW - 44, PH - 44, 14 + 5 * Math.sin(idle * 3.4 + 1), 0, '#fff');
  }

  // ======================================================================= BOLLYWOOD POSTER ART (1040x580)
  function mandalaRing(g, n, r0, len, wid, c1, c2, rot) {
    for (let i = 0; i < n; i++) { g.save(); g.rotate(rot + i / n * TAU); g.beginPath(); g.moveTo(0, -r0); g.bezierCurveTo(wid, -r0 - len * .25, wid * .7, -r0 - len * .8, 0, -r0 - len); g.bezierCurveTo(-wid * .7, -r0 - len * .8, -wid, -r0 - len * .25, 0, -r0);
      g.fillStyle = A.linear(g, 0, -r0, 0, -r0 - len, [[0, c1], [1, c2]]); g.fill(); g.strokeStyle = 'rgba(255,214,80,.95)'; g.lineWidth = 3; g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(0, -r0 - len * .48, wid * .16, 0, TAU); g.fill(); g.restore(); }
  }
  function mandala(g, sc, rt) {   // full mandala at origin, outer radius ~ 280*sc
    g.save(); g.scale(sc, sc);
    mandalaRing(g, 28, 236, 44, 26, '#ff2e93', '#ffd23f', -rt); mandalaRing(g, 20, 178, 62, 34, '#ffffff', '#ff5aa8', rt * 1.3); mandalaRing(g, 16, 122, 56, 32, '#ffd23f', '#ff6a00', -rt * 1.6);
    g.fillStyle = A.radial(g, -20, -25, 8, 116, [[0, '#fffbe0'], [.35, '#ffd23f'], [1, '#ff7a00']]); g.beginPath(); g.arc(0, 0, 112, 0, TAU); g.fill(); g.lineWidth = 6; g.strokeStyle = '#a34a00'; g.stroke();
    g.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + rt * 2; g.beginPath(); g.arc(Math.cos(a) * 92, Math.sin(a) * 92, 5, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-30, -52, 44, 16, -.5, 0, TAU); g.fill(); g.restore();
  }
  function artIndBase(g) {
    g.fillStyle = A.radial(g, 320, 290, 20, 700, [[0, '#fff3a0'], [.2, '#ffc21a'], [.42, '#ff7a00'], [.72, '#ff2e93'], [1, '#7a0a6a']]); g.fillRect(0, 0, PW, PH);
  }
  function artIndFront(g) {   // ground/stage + dancers + title (static, over the live mandala)
    g.fillStyle = A.linear(g, 0, 440, 0, PH, [[0, 'rgba(90,0,80,0)'], [.35, 'rgba(90,0,80,.9)'], [1, 'rgba(50,0,60,.98)']]); g.fillRect(0, 440, PW, PH - 440);
    for (let i = 0; i < 14; i++) { g.save(); g.translate(30 + i * 76, 528); petal(g, 24, '#ffd23f', '#ff2e93'); g.restore(); }
    g.save(); g.translate(320, 510); g.scale(.9, .9); g.translate(-315, -655);   // dancers, ground line y=655 in their own space
    const rim = '#ffd23f', fill = '#3b0a4d';
    const she = [
      { c: [[255, 356], [296, 308], [302, 232]], w: 15 }, { c: [[214, 356], [170, 384], [126, 352]], w: 15 },
      { b: [[222, 440], [190, 480], [140, 555], [96, 636], [150, 660], [212, 642], [268, 664], [328, 642], [344, 612], [300, 540], [264, 476], [250, 440]] },
      { b: [[231, 338], [214, 350], [206, 386], [214, 426], [236, 444], [260, 424], [268, 384], [256, 348]] },
      { e: [240, 306, 24, 27, .15] }, { e: [222, 278, 15, 13, 0] }, { c: [[212, 306], [188, 370], [176, 440]], w: 10 },
    ];
    silhouette(g, she, rim, fill, 5);
    const he = [
      { c: [[436, 560], [402, 612], [372, 656]], w: 34 }, { c: [[452, 560], [500, 612], [534, 656]], w: 34 },
      { c: [[412, 360], [372, 306], [354, 232]], w: 18 }, { c: [[474, 360], [514, 306], [530, 238]], w: 18 },
      { b: [[424, 338], [404, 352], [394, 402], [388, 470], [376, 540], [372, 606], [444, 620], [516, 606], [510, 540], [496, 470], [488, 404], [478, 352], [458, 338]] },
      { e: [441, 310, 27, 30, 0] }, { e: [441, 292, 28, 17, 0] },
    ];
    silhouette(g, he, rim, fill, 5);
    g.strokeStyle = '#ff4fa3'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(302, 232); g.bezierCurveTo(352, 190, 392, 250, 350, 290); g.bezierCurveTo(316, 326, 360, 372, 400, 352); g.stroke(); g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.stroke();
    g.restore();
    // dark magenta panel + title art on the right
    g.fillStyle = A.linear(g, 600, 0, PW, 0, [[0, 'rgba(70,0,70,0)'], [.3, 'rgba(70,0,70,.72)'], [1, 'rgba(60,0,64,.92)']]); g.fillRect(600, 0, PW - 600, PH);
    const cx = 850, s1 = fitTitle(g, 'האהבה', 310, 150), s2 = fitTitle(g, 'ריקוד', 310, 150), sz = Math.min(s1, s2);
    CL.title(g, 'ריקוד', cx, 195, { size: sz, fill: GOLD, outline: '#6a0a5a', shadowCol: 'rgba(0,0,0,.5)' });
    CL.title(g, 'האהבה', cx, 335, { size: sz, fill: ['#ffe0f0', '#ff5aa8'], outline: '#6a0a5a', shadowCol: 'rgba(0,0,0,.5)' });
    g.fillStyle = '#ffe08a'; g.fillRect(cx - 130, 415, 260, 3); A.text(g, 'אהבה. ריקוד. שמחה.', cx, 452, { font: '600 34px Rubik', fill: '#ffe08a', dir: 'rtl' });
    g.fillStyle = A.linear(g, 0, 40, 0, 100, [[0, '#ffe15a'], [1, '#ff8a1f']]); g.beginPath(); g.roundRect(cx - 150, 50, 300, 62, 31); g.fill(); g.lineWidth = 4; g.strokeStyle = '#7a0a5a'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx, 64, 125, 8, 0, 0, TAU); g.fill();
    A.text(g, 'बॉलीवुड', cx, 83, { font: '800 40px Deva', fill: '#7a0a5a' });
  }
  const garland = g => {   // marigold beads on the frame centreline, going round the perimeter
    const w = PW - 30, h = PH - 30, per = 2 * (w + h), n = Math.round(per / 25);
    for (let i = 0; i < n; i++) { let d = i / n * per, x, y;
      if (d < w) { x = 15 + d; y = 15; } else if (d < w + h) { x = 15 + w; y = 15 + d - w; } else if (d < 2 * w + h) { x = 15 + w - (d - w - h); y = 15 + h; } else { x = 15; y = 15 + h - (d - 2 * w - h); }
      g.fillStyle = i % 2 ? '#ff8a1f' : '#ffd23f'; g.beginPath(); g.arc(x, y, 10, 0, TAU); g.fill(); g.strokeStyle = '#a34a00'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - 3, y - 3, 3, 0, TAU); g.fill(); }
  };
  function posterInd(ctx, t, idle) {
    ctx.translate(-PW / 2, -PH / 2);
    ctx.fillStyle = 'rgba(2,4,30,.5)'; ctx.beginPath(); ctx.roundRect(12, 26, PW, PH, 44); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(30, 30, PW - 60, PH - 60, 26); ctx.clip();
    ctx.drawImage(CL.layer('s3_artIndB', PW * SS, PH * SS, g => { g.scale(SS, SS); artIndBase(g); }), 0, 0, PW, PH);
    ctx.save(); ctx.translate(320, 290); ctx.rotate(idle * .25); for (let i = 0; i < 24; i++) { ctx.rotate(TAU / 24); ctx.fillStyle = i % 2 ? 'rgba(255,240,150,.28)' : 'rgba(255,46,147,.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-80, -900); ctx.lineTo(80, -900); ctx.fill(); } ctx.restore();
    ctx.save(); ctx.translate(320, 290); mandala(ctx, .93, idle * .18); ctx.restore();
    ctx.drawImage(CL.layer('s3_artIndF', PW * SS, PH * SS, g => { g.scale(SS, SS); artIndFront(g); }), 0, 0, PW, PH);
    const gs = inv(10.355, 11.0, t); if (gs > 0 && gs < 1) { ctx.globalAlpha = Math.sin(gs * Math.PI) * .55; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(lerp(-200, PW + 200, gs), 0); ctx.transform(1, 0, -.35, 1, 0, 0); ctx.fillRect(-50, 0, 100, PH); ctx.restore(); ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.drawImage(frameLayer('s3_frameInd', [[0, '#fff2b0'], [.5, '#ffb400'], [1, '#d9700a']], 30, garland), 0, 0, PW, PH);
  }

  // ======================================================================= SCENE BACKDROPS + CHOREOGRAPHY
  const drapeLayer = () => CL.layer('s3_drape', 300, H, g => {   // velvet stage curtain hanging on the left edge (mirrored for the right)
    const st = [[0, '#2a0210']]; const N = 6; for (let i = 0; i < N; i++) { st.push([(i + .35) / N, '#c21a52']); st.push([(i + .7) / N, '#560620']); st.push([(i + 1) / N, '#2a0210']); }
    g.beginPath(); g.moveTo(0, 0); g.lineTo(270, 0); g.bezierCurveTo(250, 300, 180, 700, 95, H); g.lineTo(0, H); g.closePath(); g.fillStyle = A.linear(g, 0, 0, 260, 0, st); g.fill();
    g.fillStyle = A.linear(g, 0, 0, 0, H, [[0, 'rgba(0,0,0,.5)'], [.3, 'rgba(0,0,0,0)'], [.75, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); g.fill();
    g.strokeStyle = '#ffcf6b'; g.lineWidth = 7; g.beginPath(); g.moveTo(270, 0); g.bezierCurveTo(250, 300, 180, 700, 95, H); g.stroke();
  });
  function drawTur(ctx, t, idle) {
    CL.bg(ctx, idle * .6, { base: '#2A0A34', tint: [C.pink, '#C2185B', C.purple] });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gx = 960 + Math.sin(idle * .7) * 160; ctx.fillStyle = A.radial(ctx, gx, 560, 0, 900, [[0, 'rgba(255,40,90,.30)'], [1, 'rgba(255,40,90,0)']]); ctx.fillRect(0, 0, W, H);
    [[0, 1], [1, -1]].forEach(([i, sd]) => { const bx = 560 + i * 800, sw = Math.sin(idle * .9 + i * 2) * 60; ctx.fillStyle = A.linear(ctx, bx, -40, bx + sd * 120 + sw, 900, [[0, 'rgba(255,200,215,.30)'], [1, 'rgba(255,200,215,0)']]); ctx.beginPath(); ctx.moveTo(bx - 40, -40); ctx.lineTo(bx + 40, -40); ctx.lineTo(bx + sd * 120 + sw + 240, 900); ctx.lineTo(bx + sd * 120 + sw - 240, 900); ctx.fill(); });
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,200,225,.14)'; ctx.lineWidth = 3; ctx.beginPath();      // slow rain over the whole frame
    for (let i = 0; i < 60; i++) { const sp = 1100 + hash(i + 5) * 800, x = hash(i * 1.7) * (W + 300), y = ((idle * sp + hash(i * 4.4) * H) % (H + 200)) - 100; ctx.moveTo(x, y); ctx.lineTo(x - 26, y + 100); }
    ctx.stroke();
    // CUE 9.215 turkish-splash (big candy splash + curtain rip; drama sting comes with the hold at 9.98)
    const sp = CL.spring(t, 9.12, 1.6); if (sp > 0) CL.splash(ctx, PCX, PCY, 780, sp * (1 + .03 * Math.sin(idle * 3)), 4, [C.pink, C.red, C.orange, C.purple, '#FF7A9C']);
    const rp = inv(9.215, 9.98, t); if (rp > 0 && rp < 1) CL.ring(ctx, PCX, PCY, 900, rp, '#ffd0dc', 26);
    // floating glossy hearts drifting up on the sides (idle time)
    for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1, x = 960 + side * (640 + hash(i) * 250), y = 1180 - ((idle * (60 + hash(i * 3) * 50) + hash(i * 7) * H) % (H + 240)), s = 26 + hash(i * 5) * 26, pts = heartPts(s); ctx.save(); ctx.translate(x + Math.sin(idle * 1.4 + i) * 18, y); ctx.rotate(Math.sin(idle + i) * .3); ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = A.radial(ctx, -s * .3, -s * .3, 2, s * 1.4, [[0, '#ffb0bd'], [.4, '#ff2e4e'], [1, '#7a0018']]); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3a0010'; ctx.stroke(); ctx.restore(); }
    // side drapes frame the stage
    const dl = drapeLayer(); ctx.drawImage(dl, 0, 0); ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(dl, 0, 0); ctx.restore();
    // poster: pendulum swing-in (8.88), bump on 9.215, whip away (10.0)
    const uu = Math.max(0, t - 8.85), ang = .42 * Math.exp(-2.6 * uu) * Math.cos(TAU * uu / 1.15) + Math.sin(idle * 1.3) * .005;
    const wp = inv(10.0, 10.6, t), we = ease.inOut(wp), k = t - 9.09, bump = k < 0 ? 0 : .08 * Math.sin(Math.min(1, k / .25) * Math.PI / 2) * Math.exp(-Math.max(0, k - .25) * 3) * Math.cos(Math.max(0, k - .25) * 8);
    ctx.save(); ctx.translate(PCX, PCY); ctx.scale(1 - .12 * we, 1 - .12 * we); ctx.rotate(-.18 * we); ctx.translate(-PCX - we * 1100, -PCY - we * 40);
    ctx.translate(960, -300); ctx.rotate(ang); ctx.translate(-960, 300);
    const ra = 1 - inv(9.1, 9.5, t);   // cords retract as the poster pops
    if (ra > 0 && t >= 8.85) { ctx.strokeStyle = `rgba(255,214,140,${ra})`; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(700, -300); ctx.lineTo(PCX - 460, PCY - PH * PSC / 2 + 28); ctx.moveTo(1220, -300); ctx.lineTo(PCX + 460, PCY - PH * PSC / 2 + 28); ctx.stroke(); }
    ctx.translate(PCX, PCY); ctx.scale(PSC * (1 + bump), PSC * (1 + bump)); posterTur(ctx, t, idle); ctx.restore();
    CL.twinkle(ctx, idle, 240, 60, 1440, 900, 16, 3, ['#fff', '#ffb3c6', '#ffd23f']);
    const fl = 1 - inv(9.215, 9.28, t); if (fl > 0 && t >= 9.215) { ctx.fillStyle = `rgba(255,235,240,${fl * .35})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawInd(ctx, t, idle, mode) {
    if (mode !== 'fg') {
    CL.bg(ctx, idle * .6, { base: '#3A0A4A', tint: [C.orange, C.pink, C.yellow] });
    ctx.save(); ctx.translate(PCX, PCY); ctx.rotate(-idle * .3); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { ctx.rotate(TAU / 16); ctx.fillStyle = i % 2 ? 'rgba(255,138,31,.22)' : 'rgba(255,46,147,.2)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-130, -2300); ctx.lineTo(130, -2300); ctx.fill(); } ctx.restore();
    // huge rotating mandalas on both side edges
    [[0, 1], [W, -1]].forEach(([x, sd]) => { ctx.save(); ctx.translate(x, 560); ctx.globalAlpha = .9; mandala(ctx, 1.25, sd * idle * .16); ctx.restore(); });
    // hanging marigold garlands (idle sway)
    [[0, 960], [960, 1920]].forEach(([a, b], gi) => { for (let i = 0; i <= 34; i++) { const u = i / 34, x = lerp(a, b, u), y = 30 + 88 * Math.sin(u * Math.PI) + Math.sin(idle * 1.6 + u * 6 + gi) * 5; ctx.fillStyle = i % 2 ? '#ff8a1f' : '#ffd23f'; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a34a00'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 4.5, 0, TAU); ctx.fill(); } });
    }
    if (mode === 'bg') return;
    // CUE 10.345 bollywood-burst (petals, sparkles, splash; the Bollywood sting comes with the hold at 11.03)
    const sp = CL.spring(t, 10.24, 1.6); if (sp > 0) CL.splash(ctx, PCX, PCY, 800, sp * (1 + .03 * Math.sin(idle * 3)), 9, [C.orange, C.pink, C.yellow, '#FF5A00', '#D81B8A']);
    const pop = CL.pop(t, 10.17, .5), xe = ease.inOut(inv(11.05, 11.5, t));
    if (pop > 0) { ctx.save(); ctx.translate(PCX, PCY - xe * 1500); ctx.rotate((1 - Math.min(1, pop)) * -.7 + Math.sin(idle * 1.2) * .006 + xe * .5); ctx.scale(pop * PSC, pop * PSC); posterInd(ctx, t, idle); ctx.restore(); }
    const u = t - 10.315;    // marigold petal burst + sparkle ring + flash
    if (u > 0 && u < .715) { const a = 1 - u / .715, w = u / 1.9;
      for (let i = 0; i < 90; i++) { const an = hash(i * 3.1) * TAU, spd = 700 + hash(i * 7.7) * 1400, d = spd * (1 - Math.exp(-w * 3.5)) / 3.5, x = PCX + Math.cos(an) * d * 1.25, y = PCY + Math.sin(an) * d * .8 + 520 * w * w; ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.6); ctx.translate(x, y); ctx.rotate(i + w * (4 + hash(i) * 7)); ctx.scale(1, .55 + .45 * Math.cos(w * 9 + i)); petal(ctx, 14 + hash(i * 4) * 16, i % 3 ? '#ffd23f' : '#ff7a00', i % 3 ? '#ff8a1f' : '#ff2e93'); ctx.restore(); }
      for (let i = 0; i < 30; i++) { const an = i / 30 * TAU + hash(i) * .4, d = (400 + hash(i * 2) * 520) * ease.out(clamp(u / 1.0)); CL.spark(ctx, PCX + Math.cos(an) * d * 1.3, PCY + Math.sin(an) * d * .85, (28 + hash(i * 3) * 36) * a, u * 3, i % 2 ? '#fff' : C.yellow); }
      CL.ring(ctx, PCX, PCY, 900, inv(10.345, 11.03, t), '#fff3a0', 26);
    }
    const fl = 1 - inv(10.345, 10.41, t); if (fl > 0 && t >= 10.345) { ctx.fillStyle = `rgba(255,240,180,${fl * .35})`; ctx.fillRect(0, 0, W, H); }
    CL.twinkle(ctx, idle, 200, 100, 1520, 880, 26, 8, ['#fff', C.yellow, '#ffb3d9', C.orange]);
  }

  A.scene({
    name: 's3_series', start: 8.8, end: 11.5,
    draw(ctx, s) {
      const t = s.t, idle = A.T || 0;
      CL.HOLDFOC.tur = [1056, 418, 1.2];   // wide poster centre lands at ~59% of frame height, top clear of the "Neden?!" bubble
      CL.HOLDFOC.ind = [880, 418, 1.2];
      if (t < 8.85) return;                // the cinema hold (Charlton) owns the frame until v=8.85
      // CUE 8.85 liquid-whoosh (candy wave floods over the sports scene)  // CUE 8.88 frame-swing-in
      const p1 = inv(8.85, 9.3, t), p2 = inv(10.0, 10.6, t);
      if (p2 <= 0) {
        if (p1 < 1) bandReveal(ctx, p1, 'up', [C.pink, C.orange, C.purple], () => drawTur(ctx, t, idle)); else drawTur(ctx, t, idle);
      } else if (p2 < 1) {
        // CUE 10.00 poster-whip-away (liquid wipe sweeps left, turkish poster flies off)
        drawTur(ctx, t, idle); bandReveal(ctx, p2, 'left', [C.purple, C.pink, C.yellow], () => drawInd(ctx, t, idle, 'bg')); drawInd(ctx, t, idle, 'fg');   // Bollywood poster bursts through the liquid, overlapping both
      } else drawInd(ctx, t, idle);
      // CUE 11.05 poster-exit (bollywood poster whips up as the live scene takes over)
    },
  });
})();

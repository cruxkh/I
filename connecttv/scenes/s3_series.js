// s3_series: "סדרות טורקיות" (8.88 / 9.27) + "סדרות הודיות" (10.0 / 10.39). Holds: tur at v=9.98, ind at v=11.03.
// Two designed glossy posters (no real faces): Turkish drama (rose/burgundy, velvet curtain, moon, couple silhouettes, torn heart)
// and Bollywood (pink/orange/gold, mandala, dancers). Scene clock s.t freezes in holds, so idle life runs on A.T.
(() => {
  const { clamp, lerp, inv, ease, hash, rng, TAU } = A; const C = CL.C; const W = 1080, H = 1920;
  const PW = 660, PH = 850, SS = 1.5, PCX = 540, PCY = 925;      // poster size (own space), supersample, centre on screen
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
    if (p <= 0) return; const N = cols.length, vert = dir === 'up', far = (vert ? H : W) + 340, amp = 64;
    const path = i => {
      const e = ease.inOut(clamp(p * 1.4 - i * .13)), base = lerp(far, -360, e); ctx.beginPath();
      if (vert) { ctx.moveTo(-70, H + 600); for (let x = -70; x <= W + 70; x += 30) ctx.lineTo(x, base + Math.sin(x * .011 + i * 2 + p * 7) * amp); ctx.lineTo(W + 70, H + 600); }
      else { ctx.moveTo(W + 600, -70); for (let y = -70; y <= H + 70; y += 30) ctx.lineTo(base + Math.sin(y * .011 + i * 2 + p * 7) * amp, y); ctx.lineTo(W + 600, H + 70); }
      ctx.closePath(); return base;
    };
    let lead = 0;
    for (let i = 0; i < N; i++) { const b = path(i); if (i === 0) lead = b; ctx.fillStyle = cols[i]; ctx.fill(); ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 8; ctx.translate(vert ? 0 : 14, vert ? 14 : 0); path(i); ctx.stroke(); ctx.restore(); }
    // candy drops flying ahead of the leading edge
    if (p < .9) for (let j = 0; j < 9; j++) { const k = hash(j * 5.3 + 1), a = hash(j * 2.7 + 4), r = 12 + hash(j + 8) * 26, d = 40 + a * 190, pos = k * (vert ? W : H); const x = vert ? pos : lead - d, y = vert ? lead - d : pos; CL.drop(ctx, x, y, r, cols[j % N], p * 6, j); }
    ctx.save(); path(N); ctx.clip(); drawNew(); ctx.restore();
  }

  // ======================================================================= TURKISH POSTER ART (cached)
  function artTur(g) {
    const rg = rng(11);
    g.fillStyle = A.linear(g, 0, 0, 0, PH, [[0, '#1c000f'], [.3, '#6b0834'], [.52, '#d63a68'], [.7, '#ff9a9a'], [1, '#2a0018']]); g.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,220,230,${.25 + rg() * .5})`; g.beginPath(); g.arc(rg() * PW, 30 + rg() * 260, .8 + rg() * 1.6, 0, TAU); g.fill(); }
    g.fillStyle = A.radial(g, 330, 330, 60, 340, [[0, 'rgba(255,225,215,.95)'], [.3, 'rgba(255,170,190,.5)'], [1, 'rgba(255,90,140,0)']]); g.fillRect(0, 0, PW, PH);
    g.beginPath(); g.arc(330, 330, 160, 0, TAU); g.fillStyle = A.radial(g, 300, 290, 20, 170, [[0, '#fffaf0'], [.7, '#ffd7dc'], [1, '#ffb0c4']]); g.fill();
    g.fillStyle = 'rgba(255,140,170,.20)'; [[290, 300, 34], [365, 360, 26], [320, 400, 18], [372, 285, 14]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    // Istanbul-style skyline: domes + minarets
    const sk = '#4a0b2c', hz = 604; g.fillStyle = sk;
    let x = 0; while (x < PW) { const w = 34 + rg() * 40, h = 24 + rg() * 46; g.fillRect(x, hz - h, w, h + 4); x += w + 2; }
    const mosque = (cx, r, mh) => { g.beginPath(); g.arc(cx, hz - 20, r, Math.PI, 0); g.fill(); g.fillRect(cx - r, hz - 20, r * 2, 26); g.beginPath(); g.arc(cx - r * .95, hz - 8, r * .34, Math.PI, 0); g.arc(cx + r * .95, hz - 8, r * .34, Math.PI, 0); g.fill(); g.beginPath(); g.moveTo(cx - 3, hz - 20 - r); g.lineTo(cx, hz - 34 - r); g.lineTo(cx + 3, hz - 20 - r); g.fill();
      [-1, 1].forEach(sd => { const mx = cx + sd * (r + 34); g.fillRect(mx - 6, hz - mh, 12, mh + 6); g.fillRect(mx - 10, hz - mh * .62, 20, 7); g.beginPath(); g.moveTo(mx - 8, hz - mh); g.lineTo(mx, hz - mh - 46); g.lineTo(mx + 8, hz - mh); g.fill(); }); };
    mosque(120, 62, 200); mosque(545, 46, 165);
    g.fillStyle = 'rgba(255,214,120,.8)'; for (let i = 0; i < 50; i++) g.fillRect(rg() * PW, hz - 50 + rg() * 44, 3, 4);
    // water + moon reflection
    g.fillStyle = A.linear(g, 0, hz, 0, PH, [[0, '#8a1a44'], [.35, '#3a0620'], [1, '#14000c']]); g.fillRect(0, hz, PW, PH - hz);
    for (let i = 0; i < 14; i++) { const y = hz + 6 + i * 12, w = 190 - i * 9 + rg() * 30; g.fillStyle = `rgba(255,190,205,${.5 - i * .03})`; g.beginPath(); g.ellipse(330 + (rg() - .5) * 20, y, w / 2, 3 + rg() * 2, 0, 0, TAU); g.fill(); }
    // couple silhouettes (backlit by the moon)
    const rim = '#ffc2d2', dark = '#150009';
    const couple = [
      { b: [[310, 296], [292, 288], [266, 298], [250, 326], [242, 380], [220, 450], [176, 522], [208, 506], [240, 470], [262, 440], [276, 400], [300, 362]] },               // her hair
      { e: [297, 331, 29, 33, .1] }, { b: [[318, 328], [334, 340], [320, 346]] },                                                                                          // her head + nose
      { b: [[290, 360], [286, 386], [258, 398], [240, 430], [236, 484], [252, 544], [228, 600], [190, 655], [340, 655], [334, 600], [312, 544], [322, 484], [326, 430], [314, 398], [308, 384], [306, 360]] }, // her dress
      { e: [372, 328, 32, 35, -.1] }, { e: [374, 305, 33, 21, -.1] }, { b: [[340, 324], [326, 338], [342, 344]] },                                                       // his head, hair, nose
      { b: [[356, 360], [350, 388], [324, 402], [326, 440], [342, 500], [346, 560], [342, 655], [470, 655], [466, 560], [476, 480], [480, 420], [454, 398], [396, 388], [390, 360]] }, // his suit
      { c: [[326, 430], [352, 470], [350, 510]], w: 20 },                                                                                                               // her arm on him
    ];
    silhouette(g, couple, rim, dark, 5);
    g.fillStyle = 'rgba(255,190,205,.5)'; g.beginPath(); g.ellipse(330, 655, 300, 10, 0, 0, TAU); g.fill();
    // bottom shade for the title
    g.fillStyle = A.linear(g, 0, 610, 0, PH, [[0, 'rgba(20,0,12,0)'], [.35, 'rgba(20,0,12,.86)'], [1, 'rgba(20,0,12,.97)']]); g.fillRect(0, 610, PW, PH - 610);
    // title art
    const sz = fitTitle(g, 'אהבה אסורה', 520, 132); CL.title(g, 'אהבה אסורה', PW / 2, 722, { size: sz, fill: GOLD, outline: '#3a0020', shadowCol: 'rgba(0,0,0,.55)' });
    g.fillStyle = '#ffd7a0'; g.fillRect(PW / 2 - 200, 790, 400, 3); A.text(g, 'אהבה. בגידה. סוד.', PW / 2, 814, { font: '600 30px Rubik', fill: '#ffc6d6', dir: 'rtl' });
    // top label
    g.fillStyle = 'rgba(20,0,12,.7)'; g.beginPath(); g.roundRect(PW / 2 - 165, 54, 330, 58, 29); g.fill(); g.strokeStyle = '#ffcf6b'; g.lineWidth = 3; g.stroke();
    A.text(g, 'דרמה טורקית', PW / 2, 84, { font: '800 36px Rubik', fill: '#ffe7b0', dir: 'rtl' });
    CL.spark(g, PW / 2 - 140, 83, 12, 0, '#ffe7b0'); CL.spark(g, PW / 2 + 140, 83, 12, 0, '#ffe7b0');
  }
  function frameLayer(key, col, inW, fn) {   // glossy gel frame ring drawn over the art
    return CL.layer(key, PW * SS, PH * SS, g => {
      g.scale(SS, SS); g.beginPath(); g.roundRect(0, 0, PW, PH, 46); g.roundRect(inW, inW, PW - inW * 2, PH - inW * 2, 32); g.fillStyle = A.linear(g, 0, 0, PW, PH, col); g.fill('evenodd');
      g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.roundRect(2, 2, PW - 4, PH - 4, 44); g.stroke(); g.strokeStyle = 'rgba(60,10,0,.55)'; g.beginPath(); g.roundRect(inW, inW, PW - inW * 2, PH - inW * 2, 32); g.stroke();
      g.save(); g.beginPath(); g.roundRect(0, 0, PW, PH, 46); g.roundRect(inW, inW, PW - inW * 2, PH - inW * 2, 32); g.clip('evenodd'); g.fillStyle = A.linear(g, 0, 0, 0, PH * .5, [[0, 'rgba(255,255,255,.65)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, PW, PH * .5); g.restore();
      if (fn) fn(g);
    });
  }
  const curtainLayer = () => CL.layer('s3_curtain', (PW / 2 + 12) * SS, PH * SS, g => {
    g.scale(SS, SS); const w = PW / 2 + 12; g.fillStyle = '#7a0a2a'; g.fillRect(0, 0, w, PH);
    const st = [[0, '#3c0212']]; const N = 7; for (let i = 0; i < N; i++) { st.push([(i + .35) / N, '#d0245a']); st.push([(i + .7) / N, '#5a0620']); st.push([(i + 1) / N, '#3c0212']); }
    g.fillStyle = A.linear(g, 0, 0, w, 0, st); g.fillRect(0, 0, w, PH);
    g.fillStyle = A.linear(g, 0, 0, 0, PH, [[0, 'rgba(0,0,0,.45)'], [.2, 'rgba(0,0,0,0)'], [.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.5)']]); g.fillRect(0, 0, w, PH);
    g.fillStyle = '#ffcf6b'; g.fillRect(w - 6, 0, 6, PH); for (let x = 4; x < w; x += 12) { g.fillRect(x, PH - 40, 4, 34); }
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
    ctx.fillStyle = 'rgba(2,4,30,.5)'; ctx.beginPath(); ctx.roundRect(12, 26, PW, PH, 46); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(22, 22, PW - 44, PH - 44, 30); ctx.clip();
    ctx.drawImage(CL.layer('s3_artTur', PW * SS, PH * SS, g => { g.scale(SS, SS); artTur(g); }), 0, 0, PW, PH);
    // rain across the poster (idle time)
    ctx.strokeStyle = 'rgba(255,220,235,.32)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 46; i++) { const sp = 900 + hash(i) * 500, x = ((hash(i * 3.3) * (PW + 260) - idle * 120) % (PW + 260) + PW + 260) % (PW + 260) - 130, y = ((idle * sp + hash(i * 9) * PH) % (PH + 120)) - 60; ctx.moveTo(x, y); ctx.lineTo(x - 16, y + 60); }
    ctx.stroke();
    tornHeart(ctx, 330, 190, 74, idle, CL.pop(t, 8.95, .35) || 0);
    // velvet curtain, rips open on 9.27
    const cu = ease.inOut(inv(9.24, 9.46, t));
    if (cu < 1) { const cl = curtainLayer(), w = PW / 2 + 12, sx = lerp(1, .12, cu); ctx.save(); ctx.translate(22, 0); ctx.scale(sx, 1); ctx.drawImage(cl, 0, 0, w, PH); ctx.restore(); ctx.save(); ctx.translate(PW - 22, 0); ctx.scale(-sx, 1); ctx.drawImage(cl, 0, 0, w, PH); ctx.restore(); }
    // gloss sweep after the reveal
    const gs = inv(9.3, 9.75, t); if (gs > 0 && gs < 1) { ctx.globalAlpha = Math.sin(gs * Math.PI) * .55; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(lerp(-200, PW + 200, gs), 0); ctx.transform(1, 0, -.35, 1, 0, 0); ctx.fillRect(-40, 0, 80, PH); ctx.restore(); ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.drawImage(frameLayer('s3_frameTur', [[0, '#ffe6a8'], [.5, '#e8a0b0'], [1, '#c98a2c']], 22), 0, 0, PW, PH);
    // pelmet glints
    CL.spark(ctx, 40, 40, 16 + 6 * Math.sin(idle * 4), 0, '#fff'); CL.spark(ctx, PW - 44, PH - 44, 14 + 5 * Math.sin(idle * 3.4 + 1), 0, '#fff');
  }

  // ======================================================================= BOLLYWOOD POSTER ART
  function mandalaRing(g, n, r0, len, wid, c1, c2, rot) {
    for (let i = 0; i < n; i++) { g.save(); g.rotate(rot + i / n * TAU); g.beginPath(); g.moveTo(0, -r0); g.bezierCurveTo(wid, -r0 - len * .25, wid * .7, -r0 - len * .8, 0, -r0 - len); g.bezierCurveTo(-wid * .7, -r0 - len * .8, -wid, -r0 - len * .25, 0, -r0);
      g.fillStyle = A.linear(g, 0, -r0, 0, -r0 - len, [[0, c1], [1, c2]]); g.fill(); g.strokeStyle = 'rgba(255,214,80,.95)'; g.lineWidth = 3; g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(0, -r0 - len * .48, wid * .16, 0, TAU); g.fill(); g.restore(); }
  }
  function artIndBase(g) {
    g.fillStyle = A.radial(g, 330, 360, 20, 560, [[0, '#fff3a0'], [.2, '#ffc21a'], [.42, '#ff7a00'], [.72, '#ff2e93'], [1, '#7a0a6a']]); g.fillRect(0, 0, PW, PH);
  }
  function artIndFront(g) {   // ground/stage + dancers + title (static, over the live mandala)
    g.fillStyle = A.linear(g, 0, 600, 0, PH, [[0, 'rgba(90,0,80,0)'], [.3, 'rgba(90,0,80,.9)'], [1, 'rgba(50,0,60,.98)']]); g.fillRect(0, 600, PW, PH - 600);
    // lotus scallops on the ground
    for (let i = 0; i < 9; i++) { g.save(); g.translate(30 + i * 75, 662); petal(g, 26, '#ffd23f', '#ff2e93'); g.restore(); }
    const rim = '#ffd23f', fill = '#3b0a4d';
    const she = [
      { c: [[255, 356], [296, 308], [302, 232]], w: 15 }, { c: [[214, 356], [170, 384], [126, 352]], w: 15 },
      { b: [[222, 440], [190, 480], [140, 555], [96, 636], [150, 660], [212, 642], [268, 664], [328, 642], [344, 612], [300, 540], [264, 476], [250, 440]] },   // lehenga
      { b: [[231, 338], [214, 350], [206, 386], [214, 426], [236, 444], [260, 424], [268, 384], [256, 348]] },                                                       // torso
      { e: [240, 306, 24, 27, .15] }, { e: [222, 278, 15, 13, 0] }, { c: [[212, 306], [188, 370], [176, 440]], w: 10 },
    ];
    silhouette(g, she, rim, fill, 4);
    const he = [
      { c: [[440, 520], [402, 596], [382, 654]], w: 26 }, { c: [[440, 520], [498, 596], [524, 652]], w: 26 },
      { c: [[412, 358], [372, 304], [352, 234]], w: 16 }, { c: [[472, 358], [512, 304], [524, 238]], w: 16 },
      { b: [[426, 338], [408, 352], [400, 402], [398, 470], [392, 540], [406, 580], [470, 580], [488, 540], [484, 470], [482, 404], [472, 352], [456, 338]] },
      { e: [441, 306, 26, 29, 0] }, { e: [441, 288, 27, 15, 0] },
    ];
    silhouette(g, he, rim, fill, 4);
    // flowing dupatta from her raised hand
    g.strokeStyle = '#ff4fa3'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(302, 232); g.bezierCurveTo(352, 190, 392, 250, 350, 290); g.bezierCurveTo(316, 326, 360, 372, 400, 352); g.stroke(); g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.stroke();
    // title art
    g.fillStyle = 'rgba(50,0,60,.55)'; g.beginPath(); g.roundRect(PW / 2 - 260, 696, 520, 128, 28); g.fill();
    const sz = fitTitle(g, 'ריקוד האהבה', 500, 122); CL.title(g, 'ריקוד האהבה', PW / 2, 748, { size: sz, fill: ['#fff4c8', '#ffb400'], outline: '#6a0a5a', shadowCol: 'rgba(0,0,0,.5)' });
    A.text(g, 'אהבה. ריקוד. שמחה.', PW / 2, 812, { font: '600 28px Rubik', fill: '#ffe08a', dir: 'rtl' });
    // top ribbon
    g.fillStyle = A.linear(g, 0, 40, 0, 100, [[0, '#ffe15a'], [1, '#ff8a1f']]); g.beginPath(); g.roundRect(PW / 2 - 170, 46, 340, 62, 31); g.fill(); g.lineWidth = 4; g.strokeStyle = '#7a0a5a'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(PW / 2, 60, 140, 8, 0, 0, TAU); g.fill();
    A.text(g, 'बॉलीवुड', PW / 2, 79, { font: '800 40px Deva', fill: '#7a0a5a' });
  }
  const garland = g => {   // marigold beads on the frame centreline
    const n = 26; for (let i = 0; i < n * 2 + 14; i++) { let x, y; const p = i; const top = n, side = 17;
      if (i < top) { x = 44 + i * (PW - 88) / top; y = 13; } else if (i < top + side) { x = PW - 13; y = 44 + (i - top) * (PH - 88) / side; } else if (i < top * 2 + side) { x = PW - 44 - (i - top - side) * (PW - 88) / top; y = PH - 13; } else { x = 13; y = PH - 44 - (i - top * 2 - side) * (PH - 88) / side; }
      g.fillStyle = i % 2 ? '#ff8a1f' : '#ffd23f'; g.beginPath(); g.arc(x, y, 10, 0, TAU); g.fill(); g.strokeStyle = '#a34a00'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - 3, y - 3, 3, 0, TAU); g.fill(); }
  };
  function posterInd(ctx, t, idle) {
    ctx.translate(-PW / 2, -PH / 2);
    ctx.fillStyle = 'rgba(2,4,30,.5)'; ctx.beginPath(); ctx.roundRect(12, 26, PW, PH, 46); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(24, 24, PW - 48, PH - 48, 30); ctx.clip();
    ctx.drawImage(CL.layer('s3_artIndB', PW * SS, PH * SS, g => { g.scale(SS, SS); artIndBase(g); }), 0, 0, PW, PH);
    // rotating sunburst rays + rotating mandala (idle time)
    ctx.save(); ctx.translate(330, 360); ctx.rotate(idle * .25); for (let i = 0; i < 24; i++) { ctx.rotate(TAU / 24); ctx.fillStyle = i % 2 ? 'rgba(255,240,150,.28)' : 'rgba(255,46,147,.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -640); ctx.lineTo(60, -640); ctx.fill(); } ctx.restore();
    ctx.save(); ctx.translate(330, 360); const rt = idle * .18;
    mandalaRing(ctx, 28, 236, 44, 26, '#ff2e93', '#ffd23f', -rt); mandalaRing(ctx, 20, 178, 62, 34, '#ffffff', '#ff5aa8', rt * 1.3); mandalaRing(ctx, 16, 122, 56, 32, '#ffd23f', '#ff6a00', -rt * 1.6);
    ctx.fillStyle = A.radial(ctx, -20, -25, 8, 116, [[0, '#fffbe0'], [.35, '#ffd23f'], [1, '#ff7a00']]); ctx.beginPath(); ctx.arc(0, 0, 112, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#a34a00'; ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + rt * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 92, Math.sin(a) * 92, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(-30, -52, 44, 16, -.5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.drawImage(CL.layer('s3_artIndF', PW * SS, PH * SS, g => { g.scale(SS, SS); artIndFront(g); }), 0, 0, PW, PH);
    const gs = inv(10.4, 10.85, t); if (gs > 0 && gs < 1) { ctx.globalAlpha = Math.sin(gs * Math.PI) * .55; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(lerp(-200, PW + 200, gs), 0); ctx.transform(1, 0, -.35, 1, 0, 0); ctx.fillRect(-40, 0, 80, PH); ctx.restore(); ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.drawImage(frameLayer('s3_frameInd', [[0, '#fff2b0'], [.5, '#ffb400'], [1, '#d9700a']], 30, garland), 0, 0, PW, PH);
  }

  // ======================================================================= SCENES
  function drawTur(ctx, t, idle) {
    CL.bg(ctx, idle * .6, { base: '#2A0A34', tint: [C.pink, '#C2185B', C.purple] });
    // moody red light pools + slow rain in the whole frame
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gx = 540 + Math.sin(idle * .7) * 120; ctx.fillStyle = A.radial(ctx, gx, 930, 0, 760, [[0, 'rgba(255,40,90,.30)'], [1, 'rgba(255,40,90,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.strokeStyle = 'rgba(255,200,225,.14)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 40; i++) { const sp = 1400 + hash(i + 5) * 900, x = hash(i * 1.7) * (W + 300), y = ((idle * sp + hash(i * 4.4) * H) % (H + 200)) - 100; ctx.moveTo(x, y); ctx.lineTo(x - 26, y + 100); }
    ctx.stroke();
    // CUE 9.27 turkish-splash (big candy splash + curtain rip; drama sting comes with the hold at 9.98)
    const sp = CL.spring(t, 9.2, .65); if (sp > 0) CL.splash(ctx, PCX, PCY, 660, sp * (1 + .03 * Math.sin(idle * 3)), 4, [C.pink, C.red, C.orange, C.purple, '#FF7A9C']);
    const rp = inv(9.26, 9.75, t); if (rp > 0 && rp < 1) { CL.ring(ctx, PCX, PCY, 620, rp, '#ffd0dc', 26); CL.ring(ctx, PCX, PCY, 460, inv(9.3, 9.75, t), '#ff5a8a', 16); }
    // poster: pendulum swing-in (8.88), bump on 9.27, whip away (10.0)
    const uu = Math.max(0, t - 8.85), ang = .55 * Math.exp(-3.6 * uu) * Math.cos(TAU * uu / .92) + Math.sin(idle * 1.3) * .006;
    const wp = inv(10.0, 10.3, t), we = ease.in(wp), k = t - 9.2, bump = k < 0 ? 0 : .1 * Math.min(1, k / .07) * Math.exp(-Math.max(0, k - .07) * 6) * Math.cos(Math.max(0, k - .07) * 18);
    ctx.save(); ctx.translate(-we * 1500, -we * 120); ctx.rotate(-.55 * we);
    ctx.translate(540, -140); ctx.rotate(ang); ctx.translate(-540, 140);
    const ra = 1 - inv(9.24, 9.4, t);   // cords retract upward as the poster pops
    if (ra > 0 && t >= 8.85) { ctx.strokeStyle = `rgba(255,214,140,${ra})`; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(400, -140); ctx.lineTo(PCX - 250, PCY - PH / 2 + 24); ctx.moveTo(680, -140); ctx.lineTo(PCX + 250, PCY - PH / 2 + 24); ctx.stroke(); }
    ctx.translate(PCX, PCY); ctx.scale(1 + bump, 1 + bump); posterTur(ctx, t, idle); ctx.restore();
    CL.twinkle(ctx, idle, 60, 380, 960, 1000, 14, 3, ['#fff', '#ffb3c6', '#ffd23f']);
    const fl = 1 - inv(9.26, 9.42, t); if (fl > 0 && t >= 9.26) { ctx.fillStyle = `rgba(255,235,240,${fl * .55})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawInd(ctx, t, idle) {
    CL.bg(ctx, idle * .6, { base: '#3A0A4A', tint: [C.orange, C.pink, C.yellow] });
    ctx.save(); ctx.translate(PCX, PCY); ctx.rotate(-idle * .3); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); ctx.fillStyle = i % 2 ? 'rgba(255,138,31,.22)' : 'rgba(255,46,147,.2)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-110, -1300); ctx.lineTo(110, -1300); ctx.fill(); } ctx.restore();
    // CUE 10.39 bollywood-burst (petals, sparkles, splash; the Bollywood sting comes with the hold at 11.03)
    const sp = CL.spring(t, 10.3, .65); if (sp > 0) CL.splash(ctx, PCX, PCY, 680, sp * (1 + .03 * Math.sin(idle * 3)), 9, [C.orange, C.pink, C.yellow, '#FF5A00', '#D81B8A']);
    const pop = CL.pop(t, 10.27, .3), xe = ease.in(inv(11.05, 11.32, t));
    if (pop > 0) {
      ctx.save(); ctx.translate(PCX, PCY - xe * 1600); ctx.rotate((1 - Math.min(1, pop)) * -.7 + Math.sin(idle * 1.2) * .008 + xe * .5); ctx.scale(pop, pop); posterInd(ctx, t, idle); ctx.restore();
    }
    // marigold petal burst + sparkle ring + flash
    const u = t - 10.36;
    if (u > 0 && u < .8) { const a = 1 - u / .8;
      for (let i = 0; i < 70; i++) { const an = hash(i * 3.1) * TAU, spd = 500 + hash(i * 7.7) * 950, d = spd * (1 - Math.exp(-u * 3.5)) / 3.5, x = PCX + Math.cos(an) * d, y = PCY + Math.sin(an) * d * .9 + 520 * u * u; ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.6); ctx.translate(x, y); ctx.rotate(i + u * (4 + hash(i) * 7)); ctx.scale(1, .55 + .45 * Math.cos(u * 9 + i)); petal(ctx, 12 + hash(i * 4) * 14, i % 3 ? '#ffd23f' : '#ff7a00', i % 3 ? '#ff8a1f' : '#ff2e93'); ctx.restore(); }
      for (let i = 0; i < 26; i++) { const an = i / 26 * TAU + hash(i) * .4, d = (300 + hash(i * 2) * 380) * ease.out(clamp(u / .5)); CL.spark(ctx, PCX + Math.cos(an) * d, PCY + Math.sin(an) * d, (26 + hash(i * 3) * 34) * a, u * 3, i % 2 ? '#fff' : C.yellow); }
      CL.ring(ctx, PCX, PCY, 620, inv(10.36, 10.85, t), '#fff3a0', 26);
    }
    const fl = 1 - inv(10.37, 10.52, t); if (fl > 0 && t >= 10.37) { ctx.fillStyle = `rgba(255,240,180,${fl * .5})`; ctx.fillRect(0, 0, W, H); }
    CL.twinkle(ctx, idle, 40, 360, 1000, 1080, 22, 8, ['#fff', C.yellow, '#ffb3d9', C.orange]);
  }

  A.scene({
    name: 's3_series', start: 8.8, end: 11.5,
    draw(ctx, s) {
      const t = s.t, idle = A.T || 0;
      CL.HOLDFOC.tur = [540, 890, 1.3];   // poster centre lands at ~52% of the frame, clear of the "Neden?!" bubble
      CL.HOLDFOC.ind = [540, 890, 1.3];
      if (t < 8.85) return;               // the cinema hold (Charlton) owns the frame until v=8.85
      // CUE 8.85 liquid-whoosh (candy wave floods over the sports scene)  // CUE 8.88 frame-swing-in
      const p1 = inv(8.85, 9.2, t), p2 = inv(10.0, 10.32, t);
      if (p2 <= 0) {
        if (p1 < 1) bandReveal(ctx, p1, 'up', [C.pink, C.orange, C.purple], () => drawTur(ctx, t, idle)); else drawTur(ctx, t, idle);
      } else if (p2 < 1) {
        // CUE 10.00 poster-whip-away (liquid wipe sweeps left, turkish poster flies off)
        drawTur(ctx, t, idle); bandReveal(ctx, p2, 'left', [C.purple, C.pink, C.yellow], () => drawInd(ctx, t, idle));
      } else drawInd(ctx, t, idle);
      // CUE 11.05 poster-exit (bollywood poster whips up as the live scene takes over)
    },
  });
})();

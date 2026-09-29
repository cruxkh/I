// GOTV logo: original 2.5D gold wordmark, glossy blue play-button "O". Adds V.logo, V.logoMark, V.logoFrame, V.logoSize.
// V.logo(ctx, x, y, w, {t, shine (0..1 sweep or -1), glow (0..1), extrude (0..1), alpha, reflect (0..1)})  centred at (x,y), total width w.
// V.logoMark(ctx, x, y, size, {t, shine, glow, alpha})  the play-O ring alone (size = outer diameter).
// V.logoFrame({shine,extrude}) -> canvas of composed art (aspect 1215:440, centre = logo centre); V.logoSize(w) -> {dw,dh} to draw it with V.card3d. V.logo opt art:false draws only glow/reflection.
(() => {
  const SC = 1.3, UW = 1055, CWU = 1215, CHU = 440, OX = 80, OY = 80;   // design units
  const STEP = [0.56, 0.98], NMAX = 24, LEVELS = [0, 0.34, 0.67, 1];
  const RC = [415, 130], RO = 140, RI = 80;

  // ---- geometry (design units; baseline y 0..260)
  const D2R = Math.PI / 180;
  const pG = new Path2D(); {
    const cx = 115, cy = 130; pG.arc(cx, cy, 130, -40 * D2R, 0, true); pG.lineTo(245, 98); pG.lineTo(126, 98); pG.lineTo(126, 138);
    pG.lineTo(cx + Math.cos(7 * D2R) * 66, cy + Math.sin(7 * D2R) * 66); pG.arc(cx, cy, 66, 7 * D2R, 320 * D2R, false); pG.closePath();
  }
  const pT = new Path2D(); { [[585, 0], [805, 0], [805, 62], [726, 62], [726, 260], [664, 260], [664, 62], [585, 62]].forEach(([x, y], i) => i ? pT.lineTo(x, y) : pT.moveTo(x, y)); pT.closePath(); }
  const pV = new Path2D(); { [[825, 0], [899, 0], [940, 170], [981, 0], [1055, 0], [977, 260], [903, 260]].forEach(([x, y], i) => i ? pV.lineTo(x, y) : pV.moveTo(x, y)); pV.closePath(); }
  const LET = [{ p: pG, x0: 0, x1: 245 }, { p: pT, x0: 585, x1: 805 }, { p: pV, x0: 825, x1: 1055 }];
  const GOLD = new Path2D(); LET.forEach(l => GOLD.addPath(l.p));
  const ringP = new Path2D(); ringP.arc(RC[0], RC[1], RO, 0, A.TAU); ringP.moveTo(RC[0] + RI, RC[1]); ringP.arc(RC[0], RC[1], RI, 0, A.TAU, true);
  const mixc = (a, b, t) => A.mixc(a, b, t);
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const T = (dx, dy) => { const m = new DOMMatrix(); m.translateSelf(dx, dy); return m; };
  const shifted = (p, dx, dy) => { const q = new Path2D(); q.addPath(p, T(dx, dy)); return q; };

  // rounded gold play triangle, centre (cx,cy)
  function playTri(g, cx, cy, sc, lvl) {
    const pts = [[-26, -40], [46, 0], [-26, 40]].map(([x, y]) => [cx + x * sc + 6, cy + y * sc]);
    const path = (dx = 0, dy = 0) => { const q = new Path2D(); pts.forEach(([x, y], i) => i ? q.lineTo(x + dx, y + dy) : q.moveTo(x + dx, y + dy)); q.closePath(); return q; };
    g.lineJoin = 'round';
    const n = Math.round(9 * lvl);
    for (let i = n; i >= 1; i--) { const q = path(i * .5, i * .85); g.fillStyle = g.strokeStyle = mixc('#D98410', '#6B3604', i / 9); g.lineWidth = 16; g.fill(q); g.stroke(q); }
    const q = path(); g.fillStyle = g.strokeStyle = lg(g, 0, cy - 50, 0, cy + 50, [[0, '#FFF6CF'], [.4, '#FFCB55'], [.55, '#F0A020'], [1, '#FFD067']]); g.lineWidth = 16; g.fill(q); g.stroke(q);
    // bevel
    g.save(); g.clip(q); g.lineWidth = 9; g.strokeStyle = lg(g, cx - 30, cy - 40, cx + 40, cy + 40, [[0, 'rgba(255,255,245,.95)'], [.5, 'rgba(255,220,120,0)'], [1, 'rgba(160,80,0,.6)']]); g.stroke(q);
    g.fillStyle = lg(g, 0, cy - 44, 0, cy, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(cx - 40, cy - 50, 100, 52); g.restore();
  }
  // ring + hole + play, at design coords
  function paintRing(g, lvl) {
    const [cx, cy] = RC, n = Math.round(NMAX * lvl), dx = STEP[0] * NMAX * lvl, dy = STEP[1] * NMAX * lvl;
    // dark screen inside the hole (deep)
    g.save(); g.beginPath(); g.arc(cx + dx, cy + dy, RI, 0, A.TAU); g.fillStyle = A.radial(g, cx + dx, cy + dy, 4, RI, [[0, '#1B3FB0'], [.7, '#0A1A66'], [1, '#040A30']]); g.fill(); g.restore();
    for (let i = n; i >= 1; i--) { g.fillStyle = mixc('#2D86FF', '#08155E', i / NMAX); g.fill(shifted(ringP, i * STEP[0], i * STEP[1]), 'evenodd'); }
    // face
    g.fillStyle = lg(g, 0, cy - RO, 0, cy + RO, [[0, '#C8F6FF'], [.22, '#63CFFF'], [.5, '#2F7BFF'], [.8, '#1533B4'], [1, '#33A0F5']]); g.fill(ringP, 'evenodd');
    g.save(); g.clip(ringP, 'evenodd');
    g.strokeStyle = 'rgba(8,30,140,.32)'; g.lineWidth = 34; g.stroke(ringP);
    g.strokeStyle = lg(g, cx - RO, cy - RO, cx + RO, cy + RO, [[0, 'rgba(240,255,255,.95)'], [.42, 'rgba(120,220,255,0)'], [.6, 'rgba(120,220,255,0)'], [1, 'rgba(120,235,255,.75)']]); g.lineWidth = 14; g.stroke(ringP);
    // glossy arcs
    g.lineCap = 'round';
    g.strokeStyle = lg(g, cx - 100, cy - 100, cx + 20, cy - 110, [[0, 'rgba(255,255,255,.0)'], [.35, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); g.lineWidth = 12; g.beginPath(); g.arc(cx, cy, 111, 195 * D2R, 285 * D2R); g.stroke();
    g.strokeStyle = 'rgba(150,245,255,.55)'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, 110, 15 * D2R, 80 * D2R); g.stroke();
    g.restore();
    g.lineWidth = 3; g.strokeStyle = 'rgba(190,250,255,.9)'; g.beginPath(); g.arc(cx, cy, RI - 1, 0, A.TAU); g.stroke();
    // inside the hole: glow + glass streak + play
    g.save(); g.beginPath(); g.arc(cx, cy, RI - 2, 0, A.TAU); g.clip();
    g.globalCompositeOperation = 'lighter'; g.fillStyle = A.radial(g, cx + 8, cy, 0, 78, [[0, 'rgba(255,190,60,.42)'], [1, 'rgba(255,190,60,0)']]); g.fillRect(cx - 80, cy - 80, 160, 160);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = lg(g, cx - 60, cy - 70, cx + 20, cy + 10, [[0, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.moveTo(cx - 80, cy - 20); g.lineTo(cx - 20, cy - 80); g.lineTo(cx + 30, cy - 80); g.lineTo(cx - 80, cy + 30); g.fill();
    g.restore();
    playTri(g, cx, cy, 1, lvl);
  }
  function paintLetters(g, lvl) {
    const n = Math.round(NMAX * lvl);
    for (let i = n; i >= 1; i--) { g.fillStyle = mixc('#E39012', '#4E2402', Math.pow(i / NMAX, .75)); g.fill(shifted(GOLD, i * STEP[0], i * STEP[1])); }
    if (n) { g.save(); g.globalAlpha = .5; g.strokeStyle = '#3A1C00'; g.lineWidth = 1.5; g.stroke(shifted(GOLD, n * STEP[0], n * STEP[1])); g.restore(); }
    g.fillStyle = lg(g, 0, 0, 0, 260, [[0, '#FFF0B0'], [.2, '#FFD255'], [.46, '#FFA91C'], [.5, '#DA7B0A'], [.55, '#F59A14'], [.82, '#FFBE3C'], [1, '#FFE07E']]); g.fill(GOLD);
    g.save(); g.clip(GOLD);
    g.lineJoin = 'miter'; g.strokeStyle = 'rgba(190,90,0,.22)'; g.lineWidth = 22; g.stroke(GOLD);
    for (const l of LET) { g.strokeStyle = lg(g, l.x0, 0, l.x1, 260, [[0, 'rgba(255,255,235,.95)'], [.4, 'rgba(255,225,130,0)'], [.62, 'rgba(230,140,20,0)'], [1, 'rgba(150,70,0,.75)']]); g.lineWidth = 12; g.stroke(l.p); }
    g.fillStyle = lg(g, 0, -10, 0, 132, [[0, 'rgba(255,255,255,.42)'], [.6, 'rgba(255,255,255,.08)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, -10, UW, 110);
    g.restore();
  }
  function paintArt(g, lvl) {
    g.save(); g.scale(SC, SC); g.translate(OX, OY); g.lineJoin = 'round';
    paintRing(g, lvl); paintLetters(g, lvl); g.restore();
  }
  const art = i => A.layer('vlogo_art' + i, Math.ceil(CWU * SC), Math.ceil(CHU * SC), g => paintArt(g, LEVELS[i]));
  const mask = () => A.layer('vlogo_mask', Math.ceil(CWU * SC), Math.ceil(CHU * SC), g => {
    g.scale(SC, SC); g.translate(OX, OY); g.fillStyle = '#fff'; g.fill(GOLD); g.fill(ringP, 'evenodd');
    g.beginPath(); g.arc(RC[0], RC[1], RI, 0, A.TAU); g.fillStyle = '#fff'; g.fill();
  });
  const halo = wide => A.layer('vlogo_halo' + wide, CWU >> 1, CHU >> 1, g => {
    const s = .5, c = document.createElement('canvas'); c.width = CWU >> 1; c.height = CHU >> 1; const q = c.getContext('2d');
    q.scale(s, s); q.translate(OX, OY); q.fillStyle = '#3FA8FF'; for (let i = 0; i <= 24; i += 4) { q.fill(shifted(GOLD, i * STEP[0], i * STEP[1])); q.fill(shifted(ringP, i * STEP[0], i * STEP[1]), 'evenodd'); }
    g.filter = `blur(${wide ? 16 : 4}px)`; g.drawImage(c, 0, 0); g.drawImage(c, 0, 0); g.filter = 'none';
  });
  const refl = () => A.layer('vlogo_refl', Math.ceil(CWU * SC), Math.ceil(170 * SC), g => {
    g.save(); g.translate(0, (OY + 296) * SC); g.scale(1, -1); g.drawImage(art(3), 0, 0); g.restore();
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = lg(g, 0, 0, 0, 170 * SC, [[0, 'rgba(255,255,255,.5)'], [.55, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, CWU * SC, 170 * SC);
  });
  // scratch canvases (pure scratch: fully overwritten every call)
  const scratch = (k, w, h) => { const c = A.layer('vlogo_s' + k, w, h, () => { }); return c; };
  const AW = Math.ceil(CWU * SC), AH = Math.ceil(CHU * SC);

  // composed art (with extrusion blend + shine sweep). Returns canvas of AW x AH; centre of the canvas = logo centre.
  function frame(o = {}) {
    const ex = A.clamp(o.extrude ?? 1), sh = o.shine ?? -1, f = ex * 3, i = Math.min(2, Math.floor(f)), fr = f - i;
    if (sh < 0 && (fr < .02 || ex >= .999)) return art(ex >= .999 ? 3 : i);
    const LF = scratch('LF', AW, AH), g = LF.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, AW, AH);
    if (ex >= .999) g.drawImage(art(3), 0, 0); else { g.drawImage(art(i), 0, 0); if (fr > .02) { g.globalAlpha = fr; g.drawImage(art(i + 1), 0, 0); g.globalAlpha = 1; } }
    if (sh >= 0) {
      const SS = scratch('SS', AW, AH), s = SS.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, AW, AH);
      const cx = A.lerp(-.2, 1.2, sh) * AW, hw = 105 * SC;
      s.save(); s.translate(cx, AH / 2); s.transform(1, 0, -.36, 1, 0, 0);
      s.fillStyle = lg(s, -hw, 0, hw, 0, [[0, 'rgba(255,255,255,0)'], [.35, 'rgba(255,245,210,.35)'], [.5, 'rgba(255,255,255,1)'], [.65, 'rgba(255,245,210,.35)'], [1, 'rgba(255,255,255,0)']]); s.fillRect(-hw, -AH, hw * 2, AH * 2);
      s.fillStyle = lg(s, -hw, 0, hw, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.8)'], [1, 'rgba(255,255,255,0)']]); s.fillRect(-hw * 2.4 - 26 * SC, -AH, 30 * SC, AH * 2);
      s.restore();
      s.globalCompositeOperation = 'destination-in'; s.drawImage(mask(), 0, 0); s.globalCompositeOperation = 'source-over';
      g.globalCompositeOperation = 'lighter'; g.drawImage(SS, 0, 0); g.globalCompositeOperation = 'source-over';
    }
    return LF;
  }

  function logo(ctx, x, y, w, o = {}) {
    const k = w / UW, al = o.alpha ?? 1, gl = o.glow ?? .6, rf = o.reflect ?? 0;
    if (al <= 0.001) return;
    const cv = frame(o), dw = CWU * k, dh = CHU * k, x0 = x - dw / 2, y0 = y - dh / 2;
    ctx.save(); ctx.globalAlpha = al; ctx.imageSmoothingQuality = 'high';
    if (gl > 0) {
      ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, x, y, w * .8, 'rgba(50,110,255,1)', .34 * gl * al);
      ctx.globalAlpha = al * gl * .75; ctx.drawImage(halo(1), x0, y0, dw, dh);
      ctx.globalAlpha = al * gl * .9; ctx.drawImage(halo(0), x0, y0, dw, dh);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = al;
    }
    if (rf > 0) { ctx.save(); ctx.globalAlpha = al * rf; const ry = y0 + (OY + 296 + 8) * k; ctx.drawImage(refl(), x0, ry, dw, 170 * k); ctx.restore(); }
    if (o.art !== false) ctx.drawImage(cv, x0, y0, dw, dh);
    ctx.restore();
  }
  // ring alone; size = outer diameter
  const MKU = 330, MK = 1.6;
  const markArt = () => A.layer('vlogo_mark', Math.ceil(MKU * MK), Math.ceil(MKU * MK), g => { g.scale(MK, MK); g.translate(MKU / 2 - RC[0], MKU / 2 - RC[1] - 10); g.lineJoin = 'round'; paintRing(g, 1); });
  function logoMark(ctx, x, y, size, o = {}) {
    const k = size / (RO * 2), al = o.alpha ?? 1, gl = o.glow ?? .6, sh = o.shine ?? -1, dw = MKU * k;
    if (al <= .001) return;
    ctx.save(); ctx.globalAlpha = al; ctx.imageSmoothingQuality = 'high';
    if (gl > 0) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, x, y, size * .95, 'rgba(50,120,255,1)', .5 * gl * al); A.glow(ctx, x, y, size * .55, 'rgba(255,190,70,1)', .18 * gl * al); ctx.globalCompositeOperation = 'source-over'; }
    let src = markArt();
    if (sh >= 0) {
      const S = scratch('MK', src.width, src.height), g = S.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S.width, S.height); g.drawImage(src, 0, 0);
      const cx = A.lerp(-.2, 1.2, sh) * S.width, hw = 60 * MK; g.save(); g.globalCompositeOperation = 'source-atop'; g.translate(cx, S.height / 2); g.transform(1, 0, -.36, 1, 0, 0);
      g.fillStyle = lg(g, -hw, 0, hw, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-hw, -S.height, hw * 2, S.height * 2); g.restore(); src = S;
    }
    ctx.drawImage(src, x - dw / 2, y - dw / 2 + 10 * k, dw, dw);
    ctx.restore();
  }
  // px size helper: returns {dw, dh, k} of the art canvas for a logo of total width w
  const logoSize = w => { const k = w / UW; return { dw: CWU * k, dh: CHU * k, k }; };
  V.logo = logo; V.logoMark = logoMark; V.logoFrame = frame; V.logoSize = logoSize;
})();

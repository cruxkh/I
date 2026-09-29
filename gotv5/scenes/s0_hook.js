// S0 HOOK 0..5.0: chaos desk -> everything sucked into ONE paper TV -> GOTV cut-out logo.
(() => {
  const { clamp, lerp, ease, hash, rng, wob, key } = A;
  const C = CL.C, W = 1080;
  const TS = 1.98;                       // CUE 1.98 slam  (במקום)
  const TVX = 540, TVY = 790, TVW = 700, TVH = 560;

  // ---------- local marker helper (white halo + colour), progress p
  const mk = (ctx, pts, p, col, lw, halo = true) => {
    const n = Math.max(2, Math.floor(pts.length * clamp(p))); if (p <= 0) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); pts.slice(0, n).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); };
    if (halo) { ctx.strokeStyle = '#fff'; ctx.lineWidth = lw + 14; path(); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = lw; path(); ctx.stroke(); ctx.restore();
  };
  const lerpPts = (a, n = 6) => { const o = []; for (let i = 0; i < a.length - 1; i++) for (let k = 0; k < n; k++) o.push([lerp(a[i][0], a[i + 1][0], k / n), lerp(a[i][1], a[i + 1][1], k / n)]); o.push(a[a.length - 1]); return o; };
  const qmark = (ctx, x, y, s, col, rot, t, seed) => {
    const j = CL.j(t, seed, 3); ctx.save(); ctx.translate(x + j[0], y + j[1]); ctx.rotate(rot + j[2]); ctx.scale(s, s);
    ctx.font = '900 150px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 34; ctx.strokeText('?', 0, 0); ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.strokeText('?', 0, 0); ctx.fillStyle = col; ctx.fillText('?', 0, 0); ctx.restore();
  };

  // ---------- desk background (cached)
  const desk = () => CL.layer('s0desk', W, 1920, (g) => {
    CL.paper(g, 'kraft');
    // taped cream sheets, cutting-mat grid, so it reads as a real messy desk
    g.save(); g.translate(540, 980); g.rotate(.03);
    CL.scrap(g, 0, 0, 960, 1500, { fill: '#EFE3C6', seed: 4, rough: 9, shadow: 16, border: 0, draw: (c, w, h) => { c.strokeStyle = 'rgba(31,79,255,.13)'; c.lineWidth = 2; for (let x = -w / 2; x < w / 2; x += 54) { c.beginPath(); c.moveTo(x, -h / 2); c.lineTo(x, h / 2); c.stroke(); } for (let y = -h / 2; y < h / 2; y += 54) { c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); c.stroke(); } } });
    g.restore();
    CL.tape(g, 150, 300, -.6, 190, 52); CL.tape(g, 950, 330, .6, 190, 52); CL.tape(g, 120, 1530, .5, 190, 52); CL.tape(g, 960, 1560, -.55, 190, 52);
    CL.halftone(g, 0, 1350, W, 570, 'rgba(120,70,10,.5)', 30, .5, { alpha: .13, fade: 'b' });
    // coffee ring
    g.strokeStyle = 'rgba(110,60,20,.28)'; g.lineWidth = 14; g.beginPath(); g.arc(930, 1240, 78, .3, 5.6); g.stroke();
  });

  // ---------- scrap items
  const N = 40, R = rng(91), items = [];
  const kinds = ['guide', 'icon', 'sticky', 'ball', 'num', 'remote', 'poster', 'guide', 'icon', 'ball', 'poster', 'num'];
  const icoCol = [C.red, C.blue, C.green, C.pink, C.orange, C.yellow, '#8B5CF6', '#12B5CB'];
  const glyph = ['▶', 'S', '+', '★', 'N', 'TV', '♫', 'HD'];
  for (let i = 0; i < N; i++) {
    let x, y, tries = 0;
    do { x = 40 + R() * 1000; y = 60 + R() * 1300; tries++; } while (tries < 20 && ((x > 240 && x < 840 && y > 1000 && y < 1300) || (y > 200 && y < 520 && x > 100 && x < 980 && i % 2)));   // keep centre-lower calmer
    items.push({ i, kind: kinds[i % kinds.length], x, y, rot: (R() - .5) * 1.4, sz: .8 + R() * .55, seed: 3 + i, col: icoCol[i % icoCol.length], gl: glyph[i % glyph.length], d: R(), fly: i >= 30 });
  }
  const times = ['20:30', '21:00', '19:45', '22:15', '18:00', '23:40'], hebs = ['חדשות', 'סרט', 'כדורגל', 'סדרה', 'ילדים', 'אקטואליה'];
  const drawItem = (ctx, it, sc) => {
    const s = it.sz * sc, k = it.i;
    switch (it.kind) {
      case 'guide': CL.scrap(ctx, 0, 0, 300 * s, 150 * s, { fill: k % 3 ? C.cream : '#F7E58C', seed: it.seed, shadow: 9, draw: (c, w, h) => {
        c.fillStyle = C.blue; c.fillRect(-w / 2, -h / 2, w, 34 * s); c.fillStyle = '#fff'; c.font = `800 ${22 * s}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText('TV  ' + times[k % 6], 0, -h / 2 + 18 * s);
        c.fillStyle = C.ink; c.font = `600 ${20 * s}px Rubik`; c.direction = 'rtl'; c.textAlign = 'right'; for (let r = 0; r < 3; r++) { c.fillText(hebs[(k + r) % 6], w / 2 - 14, -h / 2 + 62 * s + r * 30 * s); c.fillRect(-w / 2 + 14, -h / 2 + 56 * s + r * 30 * s, 70 * s * (.5 + hash(k + r) * .8), 6 * s); }
      } }); break;
      case 'icon': { const w = 120 * s; ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 7, -w / 2 + 10, w, w, w * .24); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-w / 2 - 7, -w / 2 - 7, w + 14, w + 14, w * .28); ctx.fill(); ctx.fillStyle = it.col; ctx.beginPath(); ctx.roundRect(-w / 2, -w / 2, w, w, w * .24); ctx.fill();
        ctx.fillStyle = it.col === C.yellow ? C.ink : '#fff'; ctx.font = `900 ${w * .5}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(it.gl, 0, w * .04); break; }
      case 'sticky': CL.scrap(ctx, 0, 0, 170 * s, 170 * s, { fill: '#FFE45C', seed: it.seed, shadow: 9, border: 0, rough: 3, draw: (c, w, h) => { c.strokeStyle = C.ink; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 12; i++) c.lineTo(-w * .3 + i * w * .055, -h * .1 + Math.sin(i * 2.1 + k) * h * .16); c.stroke(); c.fillStyle = C.red; c.font = `900 ${90 * s}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText('?', 0, h * .22); } }); break;
      case 'ball': { const r = 62 * s, rr = rng(k * 5 + 1); ctx.fillStyle = 'rgba(40,20,0,.25)'; ctx.beginPath(); ctx.arc(8, 12, r, 0, 6.3); ctx.fill(); ctx.fillStyle = k % 2 ? '#F4EFE3' : '#E6DCC4'; ctx.beginPath(); for (let a = 0; a < 11; a++) { const an = a / 11 * 6.283, rad = r * (.82 + rr() * .3); ctx.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,30,.5)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.moveTo((rr() - .5) * r * 1.4, (rr() - .5) * r * 1.4); ctx.lineTo((rr() - .5) * r * 1.4, (rr() - .5) * r * 1.4); ctx.lineTo((rr() - .5) * r * 1.4, (rr() - .5) * r * 1.4); ctx.stroke(); } break; }
      case 'num': CL.scrap(ctx, 0, 0, 140 * s, 130 * s, { fill: it.col, seed: it.seed, shadow: 8, draw: (c, w, h) => { c.fillStyle = it.col === C.yellow ? C.ink : '#fff'; c.font = `900 ${96 * s}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText(String(2 + (k * 7) % 13), 0, 6); } }); break;
      case 'remote': { const w = 90 * s, h = 250 * s; ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 8, -h / 2 + 11, w, h, 22); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-w / 2 - 7, -h / 2 - 7, w + 14, h + 14, 28); ctx.fill(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 21); ctx.fill(); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, -h * .36, w * .17, 0, 6.3); ctx.fill(); for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 3; c2++) { ctx.fillStyle = (r + c2) % 3 ? '#777' : C.yellow; ctx.beginPath(); ctx.arc((c2 - 1) * w * .27, -h * .12 + r * h * .14, w * .09, 0, 6.3); ctx.fill(); } break; }
      case 'poster': CL.scrap(ctx, 0, 0, 150 * s, 210 * s, { fill: it.col, seed: it.seed, shadow: 9, draw: (c, w, h) => { CL.halftone(c, -w / 2, -h / 2, w, h, 'rgba(255,255,255,.35)', 22 * s, .5, { fade: 'b' }); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(0, -h * .1, w * .28, 0, 6.3); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-w * .08, -h * .1 - w * .13); c.lineTo(w * .14, -h * .1); c.lineTo(-w * .08, -h * .1 + w * .13); c.fill(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-w * .36, h * .25, w * .72, 10 * s); c.fillRect(-w * .36, h * .33, w * .45, 10 * s); } }); break;
    }
  };
  // base (pre-suck) position of an item at time t
  const basePos = (it, t) => {
    if (it.fly) {                              // crumpled papers flying across the desk
      const per = 1.1 + it.d * .5, f = ((t / per + it.d * 3) % 1), dir = it.i % 2 ? 1 : -1;
      const x0 = dir > 0 ? -150 : 1230, x1 = dir > 0 ? 1230 : -150, y0 = 200 + it.d * 1000;
      return [lerp(x0, x1, f), y0 - Math.sin(f * Math.PI) * (260 + it.d * 200), t * dir * (4 + it.d * 4)];
    }
    const wx = wob(t, it.i, .6) * 16, wy = wob(t, it.i + 50, .6) * 16;
    return [it.x + wx, it.y + wy, it.rot + wob(t, it.i + 9, .5) * .12];
  };
  const suck = (ctx, t) => {
    const tq = CL.q(t);
    for (const it of items) {
      const tt = Math.min(tq, TS), b = basePos(it, tt), st = TS + it.d * .34, u = clamp((t - st) / .42);
      if (u >= 1) continue;
      let x = b[0], y = b[1], rot = b[2], sc = 1;
      // fly items are alive earlier (bigger paper balls)
      if (t > TS - .2) { const w = clamp((t - (TS - .2)) / .2) * (1 - clamp((t - st) / .06)); const dx = x - TVX, dy = y - TVY, L = Math.hypot(dx, dy) || 1; x += dx / L * 34 * w; y += dy / L * 34 * w; sc = 1 + .08 * w; }
      if (t >= st) { const e = ease.in(u), sw = e * 2.4 * (it.i % 2 ? 1 : -1), dx = x - TVX, dy = y - TVY - 20, ca = Math.cos(sw), sa = Math.sin(sw), k = 1 - e; x = TVX + (dx * ca - dy * sa) * k; y = TVY + 20 + (dx * sa + dy * ca) * k; sc = lerp(1, .18, e); rot += e * 5; }
      const j = CL.j(t, it.i, t < TS ? 3 : 0);
      if (x < -200 || x > 1280) continue;
      ctx.save(); ctx.translate(x + j[0], y + j[1]); ctx.rotate(rot + j[2]); ctx.scale(sc, sc); drawItem(ctx, it, 1); ctx.restore();
    }
  };
  const arrived = t => { let n = 0; for (const it of items) if (t > TS + it.d * .34 + .38) n++; return n / N; };

  // ---------- magnifier searching the desk
  const magnifier = (ctx, t) => {
    if (t > TS - .05) return;
    const tq = CL.q(t), x = 540 + Math.sin(tq * 2.1) * 330, y = 900 + Math.sin(tq * 3.3 + 1) * 260 - 60, j = CL.j(t, 77, 4), r = 105;
    ctx.save(); ctx.translate(x + j[0], y + j[1]); ctx.rotate(-.5 + j[2]);
    ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.beginPath(); ctx.arc(10, 14, r + 14, 0, 6.3); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 46; ctx.beginPath(); ctx.moveTo(r * .72, r * .72); ctx.lineTo(r * 1.9, r * 1.9); ctx.stroke(); ctx.strokeStyle = C.orange; ctx.lineWidth = 26; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 36; ctx.stroke(); ctx.strokeStyle = C.ink; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, 6.3); ctx.stroke(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, 0, r - 8, 0, 6.3); ctx.stroke();
    ctx.restore();
  };

  // ---------- TV
  const tvScreen = (ctx, sw, sh, t) => {
    const f = arrived(t), q = CL.q(t, 12);
    ctx.fillStyle = '#20202a'; ctx.fillRect(0, 0, sw, sh);
    const cols = 4, rows = 3, cw = sw / cols, ch = sh / rows, pal = [C.red, C.blue, C.yellow, C.green, C.pink, C.orange, '#8B5CF6', C.blue, C.green, C.red, C.yellow, C.pink];
    if (f < 1) { const r = rng(q * 3 + 5); for (let i = 0; i < 260; i++) { ctx.fillStyle = r() > .5 ? '#d8d8d8' : '#555'; ctx.fillRect(r() * sw, r() * sh, 8 + r() * 26, 6); } }
    for (let i = 0; i < 12; i++) {
      if (f < (i + 1) / 12 * .96) continue; const cx = (i % cols) * cw, cy = Math.floor(i / cols) * ch, pp = CL.pop(t, TS + .3 + i * .012, .25) || 1;
      ctx.fillStyle = pal[i]; ctx.fillRect(cx + 4, cy + 4, cw - 8, ch - 8); CL.halftone(ctx, cx + 4, cy + 4, cw - 8, ch - 8, 'rgba(255,255,255,.4)', 18, .5, { fade: 'b' });
      ctx.fillStyle = pal[i] === C.yellow ? C.ink : '#fff'; ctx.beginPath(); ctx.moveTo(cx + cw * .4, cy + ch * .3); ctx.lineTo(cx + cw * .64, cy + ch * .5); ctx.lineTo(cx + cw * .4, cy + ch * .7); ctx.fill();
    }
  };
  const tv = (ctx, t) => {
    if (t < 1.8) return;
    const fall = ease.in(clamp((t - 1.8) / .18)), s = 1 + 1.4 * (1 - fall), dy = -(1 - fall) * 420;
    let rot = 0, x = TVX, y = TVY + dy, sc = s;
    const sh = CL.shake(t, TS, .5, 16);
    // nod on "אם כן"
    if (t > 3.0 && t < 3.5) rot = Math.sin((CL.q(t, 24) - 3.0) * 20) * .07 * Math.exp(-(t - 3.0) * 3);
    // kicked into the corner as the logo arrives
    const ex = clamp((t - 3.44) / .14);
    if (ex > 0) { const e = ease.out(ex); x = lerp(TVX, 150, e); y = lerp(TVY, 200, e); sc = lerp(1, .36, e); rot = lerp(0, -.35, e); }
    const j = CL.j(t, 5, 2);
    ctx.save(); ctx.translate(x + sh[0] + j[0], y + sh[1] + j[1]); ctx.rotate(rot + j[2]); ctx.scale(sc, sc);
    // antenna
    ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, -TVH / 2 + 4); ctx.lineTo(-130, -TVH / 2 - 130); ctx.moveTo(20, -TVH / 2 + 4); ctx.lineTo(120, -TVH / 2 - 150); ctx.stroke();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(-130, -TVH / 2 - 130, 16, 0, 6.3); ctx.arc(120, -TVH / 2 - 150, 16, 0, 6.3); ctx.fill();
    // legs
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-250, TVH / 2 - 10); ctx.lineTo(-210, TVH / 2 + 50); ctx.lineTo(-160, TVH / 2 - 10); ctx.moveTo(250, TVH / 2 - 10); ctx.lineTo(210, TVH / 2 + 50); ctx.lineTo(160, TVH / 2 - 10); ctx.fill();
    CL.tv(ctx, 0, 0, TVW, TVH, { body: C.orange, chin: 96, draw: (c, sw, sh2) => tvScreen(c, sw, sh2, t) });
    // knobs, speaker, tape, white die-cut edge feel
    ctx.fillStyle = C.ink; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(230 + i * 0, TVH / 2 - 62 + i * 0, 0, 0, 1); } ctx.beginPath(); ctx.arc(250, TVH / 2 - 52, 24, 0, 6.3); ctx.fill(); ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(250, TVH / 2 - 52, 15, 0, 6.3); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 8; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-290 + i * 22, TVH / 2 - 84); ctx.lineTo(-290 + i * 22, TVH / 2 - 24); ctx.stroke(); }
    CL.tape(ctx, -260, -TVH / 2 + 10, -.5, 130, 42);
    ctx.restore();
    // impact dust on the table
    const du = t - TS; if (du >= 0 && du < .3) { const k = Math.floor(du * 12) / 12; ctx.save(); ctx.translate(TVX, TVY + TVH / 2 + 40); CL.star(ctx, 0, 0, 260 * (.5 + k * 3), 14, { fill: C.cream, lw: 0, rot: k * 2 }); ctx.restore(); CL.sparks(ctx, TVX, TVY + 40, 400, 520 + k * 300, 16, t, { lw: 9 }); }
  };

  // ---------- chaos-phase lettering (paper chips) and the ONE PLACE title
  const chips = (ctx, t) => {
    const defs = [['מחפשים', .1, 690, 170, -.07, C.yellow, C.ink, 120], ['התוכן', .77, 400, 320, .05, C.blue, '#fff', 130], ['אוהבים', 1.34, 690, 470, -.04, C.pink, C.ink, 120]];
    defs.forEach(([s, t0, x, y, rot, fill, ink, size], i) => {
      const p = CL.pop(t, t0); if (!p) return;
      let px = x, py = y, sc = p, r = rot;
      if (t > TS - .2) { const st = TS + i * .08, u = clamp((t - st) / .4), e = ease.in(u); if (u >= 1) return; px = lerp(x, TVX, e); py = lerp(y, TVY, e); sc *= lerp(1, .15, e); r += e * 4; }
      const j = CL.j(t, 20 + i, 3); CL.chip(ctx, s, px + j[0], py + j[1], { size, fill, ink, rot: r + j[2], scale: sc, seed: 5 + i });
    });
  };
  const bigPlace = (ctx, t) => {
    if (t >= 3.5) return; const ex = clamp((t - 3.3) / .2);
    const a = CL.pop(t, TS, .3), b = CL.pop(t, 2.46, .3);
    if (a) { const j = CL.j(t, 31, 3); CL.title(ctx, 'במקום', 400 + j[0], 215 + j[1], { size: 170, fill: C.yellow, rot: -.07 + j[2], scale: a * (1 - ex) }); }
    if (b) { const j = CL.j(t, 32, 3), sk = CL.shake(t, 2.46, .35, 10); CL.title(ctx, 'אחד', 690 + j[0] + sk[0], 385 + j[1] + sk[1], { size: 250, fill: C.blue, outer: '#fff', rot: .06 + j[2], scale: b * (1 - ex), font: '900 250px Rubik' }); }
  };

  // ---------- marker decoration in the chaos phase (question marks, circles, crosses, hearts)
  const chaosMarks = (ctx, t) => {
    if (t >= TS - .12) return; const fade = 1;
    const Q = [[.1, 130, 540, -.3, C.red], [.14, 900, 780, .25, C.blue], [.19, 210, 1130, .1, C.orange], [.26, 620, 1020, -.2, C.green], [.83, 950, 1250, .3, C.red], [1.0, 90, 850, -.2, C.pink], [1.5, 520, 620, .15, C.blue], [1.62, 880, 1010, -.3, C.orange]];
    Q.forEach(([t0, x, y, rot, col], i) => { const p = CL.pop(t, t0, .3); if (p) qmark(ctx, x, y, p * .95, col, rot, t, 40 + i); });
    // marker circles round random scraps
    const cs = [[.77, 300, 720, 150, 110], [1.05, 800, 1150, 130, 150], [1.2, 250, 1020, 120, 100]];
    cs.forEach(([t0, x, y, rx, ry], i) => { const p = clamp((t - t0) / .22); if (p > 0) CL.circle(ctx, x, y, rx, ry, p, { color: C.red, seed: i + 2 }); });
    // hearts on "אוהבים"
    const hearts = [[1.34, 170, 260], [1.42, 900, 560], [1.5, 470, 1180]];
    hearts.forEach(([t0, x, y], i) => { const p = CL.pop(t, t0, .3); if (!p) return; const j = CL.j(t, 60 + i, 3); ctx.save(); ctx.translate(x + j[0], y + j[1]); ctx.scale(p * 1.5, p * 1.5); ctx.rotate(-.2 + i * .2); ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-58, -8, -34, -52, 0, -22); ctx.bezierCurveTo(34, -52, 58, -8, 0, 30); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); });
    // crosses for "can't find it"
    const xs = [[.95, 740, 640], [1.1, 130, 700]];
    xs.forEach(([t0, x, y], i) => { const p = clamp((t - t0) / .15); if (p > 0) CL.cross(ctx, x, y, 44, p, { color: C.ink, lw: 16 }); });
  };

  // ---------- GOTV logo
  const LX = 540, LY = 800;
  const tile = (ctx, ch, i, t, t0) => {
    const p = CL.pop(t, t0); if (!p) return;
    const cfg = [[-318, -14, -.09, C.yellow, C.blue, 240, 290], [-105, 20, .06, C.blue, C.yellow, 250, 250], [104, -18, -.05, C.yellow, C.blue, 240, 290], [317, 14, .1, C.blue, C.yellow, 250, 270]][i];
    const j = CL.j(t, 90 + i, 3);
    ctx.save(); ctx.translate(LX + cfg[0] + j[0], LY + cfg[1] + j[1]); ctx.rotate(cfg[2] + j[2]); ctx.scale(p, p);
    if (i === 1) {   // O = round tile with a play button
      ctx.fillStyle = 'rgba(40,20,0,.32)'; ctx.beginPath(); ctx.arc(12, 16, 132, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 134, 0, 6.3); ctx.fill(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(0, 0, 122, 0, 6.3); ctx.fill();
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(0, 0, 80, 0, 6.3); ctx.stroke(); ctx.fillStyle = C.yellow; ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-22, -44); ctx.lineTo(50, 0); ctx.lineTo(-22, 44); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 122, 0, 6.3); ctx.stroke();
    } else {
      CL.scrap(ctx, 0, 0, cfg[5], cfg[6], { fill: cfg[3], seed: 11 + i, rough: 5, shadow: 14 });
      ctx.font = '900 280px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round';
      ctx.strokeStyle = C.ink; ctx.lineWidth = 26; ctx.strokeText(ch, 0, 18); ctx.fillStyle = cfg[4]; ctx.fillText(ch, 0, 18);
    }
    if (i === 0) CL.tape(ctx, -70, -cfg[6] / 2 + 4, -.5, 120, 40); if (i === 3) CL.tape(ctx, 70, cfg[6] / 2 - 2, -.4, 120, 40);
    ctx.restore();
  };
  const logo = (ctx, t) => {
    const T0 = 3.58; if (t < T0) return;
    // backing sheets
    const pb = CL.pop(t, T0, .3), sb = 1 + .012 * Math.sin(Math.max(0, t - 4.3) * 9) * (t > 4.6 ? 0 : 1);
    ctx.save(); ctx.translate(LX, LY + 10); ctx.scale(pb * sb, pb * sb); ctx.rotate(.045);
    CL.scrap(ctx, 0, 0, 1010, 700, { fill: C.blue, seed: 21, rough: 9, shadow: 18 }); ctx.restore();
    ctx.save(); ctx.translate(LX, LY); ctx.scale(pb * sb, pb * sb); ctx.rotate(-.03);
    CL.scrap(ctx, 0, 0, 990, 660, { fill: C.cream, seed: 22, rough: 9, shadow: 0, draw: (c, w, h) => { CL.halftone(c, -w / 2, -h / 2, w, h, C.blue, 34, .5, { alpha: .22, fade: 'r' }); CL.halftone(c, -w / 2, -h / 2, w, h, C.yellow, 40, .3, { alpha: .9, fade: 'l', k: .7 }); } });
    CL.tape(ctx, -430, -320, -.6, 170, 50); CL.tape(ctx, 440, 310, -.6, 170, 50); ctx.restore();
    'GOTV'.split('').forEach((ch, i) => tile(ctx, ch, i, t, T0 + .04 + i * .06));
    // stars / sparks
    const ps = CL.pop(t, T0 + .15, .3); if (ps) { CL.star(ctx, 930, 1010, 78 * ps, 12, { fill: C.pink, rot: CL.q(t) * .8 }); CL.star(ctx, 120, 470, 66 * ps, 10, { fill: C.yellow, rot: -CL.q(t) * .8 }); }
    if (t < T0 + .45) CL.sparks(ctx, LX, LY, 420, 560, 18, t, { lw: 10 });
    // underline scribble under logo, marker arrow + "כאן", check mark
    const pu = clamp((t - 3.92) / .3); if (pu > 0) CL.underline(ctx, 150, 930, 1140, pu, { color: C.red, lw: 16, seed: 4 });
    const pa = clamp((t - 3.92) / .3); if (pa > 0) CL.arrow(ctx, 120, 1320, 250, 1060, pa, { color: C.ink, lw: 12, bend: -80 });
    const chk = clamp((t - 4.28) / .25);
    if (chk > 0) mk(ctx, lerpPts([[800, 430], [860, 520], [1010, 300]], 10), chk, C.green, 44);
    const pc = CL.pop(t, 4.0, .3); if (pc) { const j = CL.j(t, 95, 3); CL.chip(ctx, 'כאן!', 190 + j[0], 1370 + j[1], { size: 90, fill: C.red, ink: '#fff', rot: -.12 + j[2], scale: pc, seed: 9 }); }
  };

  // ---------- scene
  A.scene({ name: 's0_hook', start: 0, end: 5.0, draw: (ctx, s) => {
    const t = s.t;
    ctx.drawImage(desk(), 0, 0);
    const wb = CL.shake(t, TS, .5, 10); ctx.translate(wb[0], wb[1]);
    if (t < TS + .8) { suck(ctx, t); magnifier(ctx, t); }
    tv(ctx, t);
    chaosMarks(ctx, t);
    chips(ctx, t);
    bigPlace(ctx, t);   // CUE 1.98 slam, CUE 2.46 one
    logo(ctx, t);       // CUE 3.58 logo pop, CUE 4.28 check
  } });
})();

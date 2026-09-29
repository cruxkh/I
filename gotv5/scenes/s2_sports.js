// s2_sports: paper football pitch, crowd, Sport 1-5 ticket strip, Sport 5 hero, Charlton wordmark. Window 8.8 to 12.4
(() => {
  const { clamp, lerp, hash, rng, TAU } = A, C = CL.C, W = 1080, H = 1920;
  const T0 = 8.8, GREEN = '#2E9E4F', GREEN2 = '#38B05A', GREEN_DK = '#1F7A3A';
  const CARD_T = [9.02, 9.26, 9.47, 9.68, 9.9];       // sport1..5 land on the beat of "כל ערוצי הספורט"
  const HERO_T = 10.4, CHAR_T = 11.11, SCORE_T = 10.44;
  // CUE 9.02 card sport1 slap
  // CUE 9.26 card sport2 slap
  // CUE 9.47 card sport3 slap
  // CUE 9.68 card sport4 slap
  // CUE 9.90 card sport5 slap
  // CUE 10.40 sport5 hero burst
  // CUE 11.11 charlton slam

  const pitch = () => CL.layer('s2pitch', W, H, (g) => {
    g.fillStyle = GREEN; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { if (i % 2) continue; g.fillStyle = GREEN2; g.fillRect(0, 250 + i * 110, W, 110); }
    const r = rng(11);
    for (let i = 0; i < 3200; i++) { g.globalAlpha = .06 + r() * .1; g.fillStyle = r() > .5 ? '#0d4d22' : '#fff'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    g.globalAlpha = 1;
    // chalk marker lines (wobbly, doubled)
    const line = (pts) => { for (let pass = 0; pass < 2; pass++) { g.strokeStyle = pass ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)'; g.lineWidth = pass ? 11 : 20; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => { const x = p[0] + (r() - .5) * 5, y = p[1] + (r() - .5) * 5; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); } };
    const seg = (x0, y0, x1, y1) => { const n = 22, a = []; for (let i = 0; i <= n; i++) a.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); line(a); };
    const arc = (cx, cy, rr, a0, a1) => { const n = 60, a = []; for (let i = 0; i <= n; i++) { const t = lerp(a0, a1, i / n); a.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]); } line(a); };
    seg(40, 800, 1040, 800); arc(540, 800, 250, 0, TAU + .05);
    seg(60, 330, 60, 1560); seg(1020, 330, 1020, 1560);
    seg(60, 1560, 1020, 1560);
    seg(220, 1560, 220, 1250); seg(220, 1250, 860, 1250); seg(860, 1250, 860, 1560);
    arc(540, 1250, 150, .05, Math.PI - .05);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(540, 800, 16, 0, TAU); g.fill();
    // halftone shading in corners
    CL.halftone(g, 0, 0, W, H, 'rgba(8,60,24,.5)', 30, .5, { alpha: .55, fade: 'radial', k: .8 });
  });
  const pitchInv = () => CL.layer('s2pitchinv', W, H, (g) => { g.drawImage(pitch(), 0, 0); const cv = g.canvas; });

  // ---------- crowd
  const SKIN = ['#F2C9A0', '#D9A273', '#B87A4F', '#F7D9B9', '#8C5A3A'];
  function person(ctx, x, y, i, t, tone) {
    const q = CL.q(t, 12), k = Math.floor(t * 12 + 1e-6), h1 = hash(i * 3.3), up = Math.sin(k * (1.4 + h1) + i * 2) > -.2;
    const col = tone ? C.yellow : C.blue, alt = tone ? C.blue : C.yellow, jy = (hash(k * 1.3 + i) - .5) * 8, bob = Math.sin(k * 1.9 + i) * 5 + jy;
    ctx.save(); ctx.translate(x, y + bob);
    // shoulders (paper cut)
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(6, 76, 70, 58, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = col; ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 78, 66, 56, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = alt; ctx.fillRect(-10, 34, 20, 42);
    // head
    ctx.fillStyle = SKIN[i % 5]; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; const ex = 11; ctx.beginPath(); ctx.arc(-ex, -3, 4, 0, TAU); ctx.arc(ex, -3, 4, 0, TAU); ctx.fill();
    ctx.lineWidth = 5; ctx.beginPath(); if (up) ctx.arc(0, 8, 14, .15, Math.PI - .15); else ctx.arc(0, 16, 6, 0, TAU); ctx.stroke();
    // hair
    ctx.fillStyle = hash(i * 9) > .5 ? '#2a1a10' : '#5a3418'; ctx.beginPath(); ctx.arc(0, -8, 34, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
    // arm up with flag or scarf
    const ty = i % 3, wv = Math.sin(k * 2.3 + i * 1.7);
    if (up) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-50, 70); ctx.lineTo(-64, 0 - 34 - wv * 6); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-50, 70); ctx.lineTo(-64, -34 - wv * 6); ctx.stroke();
    }
    if (ty === 0) { // flag on stick
      const sx = 58, sy = 60; ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx, sy + 10); ctx.lineTo(sx + 4, -110); ctx.stroke();
      ctx.fillStyle = tone ? C.blue : C.yellow; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx + 4, -110); ctx.lineTo(sx + 78, -98 + wv * 12); ctx.lineTo(sx + 66, -70 + wv * 10); ctx.lineTo(sx + 4, -62); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = tone ? C.yellow : C.blue; ctx.beginPath(); ctx.arc(sx + 34, -84 + wv * 5, 10, 0, TAU); ctx.fill();
    } else if (ty === 1) { // scarf held up between hands
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; const y0 = -46, n = 6;
      for (let s = 0; s < n; s++) { const x0 = -70 + s * 23.3, x1 = x0 + 23.3, ya = y0 + Math.sin(k * 2 + s * .9 + i) * 9, yb = y0 + Math.sin(k * 2 + (s + 1) * .9 + i) * 9; ctx.fillStyle = s % 2 ? C.yellow : C.blue; ctx.beginPath(); ctx.moveTo(x0, ya - 16); ctx.lineTo(x1, yb - 16); ctx.lineTo(x1, yb + 16); ctx.lineTo(x0, ya + 16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
  }
  function crowd(ctx, t) {
    // stand: navy paper with torn lower edge
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; CL.tornPath(ctx, -40, -60 + 14, W + 80, 330, { seed: 4, rough: 9, step: 34 }); ctx.fill();
    ctx.fillStyle = C.navy; CL.tornPath(ctx, -40, -60, W + 80, 330, { seed: 4, rough: 9, step: 34 }); ctx.fill();
    ctx.clip(); CL.halftone(ctx, 0, 0, W, 300, C.blue, 26, .5, { alpha: .6, fade: 't', k: .9 });
    const rows = [[250, 5, 0], [160, -30, 1], [80, 40, 2]];
    // back rows first
    [[70, 1], [150, 0], [232, 1]].forEach(([yy, off], ri) => { const n = 7; for (let c = 0; c < n; c++) { const x = 85 + c * 152 + (ri % 2 ? 76 : 0) - 20; if (x > W + 60) continue; const i = ri * 9 + c; person(ctx, x, yy - 40, i, t, (i + ri) % 2 === 0); } });
    ctx.restore();
  }

  // ---------- scoreboard
  function scoreboard(ctx, t, x, y, rot) {
    const score = t >= SCORE_T ? 3 : 2, flash = t >= SCORE_T && t < SCORE_T + .5 && Math.floor(t * 12) % 2 === 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    CL.scrap(ctx, 0, 0, 400, 150, { fill: '#1b1b22', seed: 8, shadow: 12, rough: 4 });
    ctx.fillStyle = flash ? C.red : C.yellow; ctx.font = '900 96px Bangers'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.fillText(`${score} : 1`, 0, 4);
    ctx.font = '700 26px Rubik'; ctx.fillStyle = '#fff'; ctx.fillText('MTA', -135, -50); ctx.fillText('GOTV', 135, -50);
    ctx.fillStyle = Math.floor(t * 2) % 2 ? C.red : '#7a1a14'; ctx.beginPath(); ctx.arc(-168, 52, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 22px Rubik'; ctx.textAlign = 'left'; ctx.fillText('LIVE', -150, 53);
    CL.tape(ctx, -150, -84, -.4, 110, 38); CL.tape(ctx, 150, -84, .4, 110, 38);
    ctx.restore();
  }

  // ---------- balls
  function football(ctx, x, y, r, rot, sq) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq, 1 - sq); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(30,15,0,.3)'; ctx.beginPath(); ctx.arc(9, 13, r + 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFDF6'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = C.ink; const pent = (cx, cy, rr, a0) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * TAU; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
    pent(0, 0, r * .36, -Math.PI / 2);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .36, Math.sin(a) * r * .36); ctx.lineTo(Math.cos(a) * r * .68, Math.sin(a) * r * .68); ctx.lineWidth = 5; ctx.stroke(); pent(Math.cos(a + .0) * r * .9, Math.sin(a) * r * .9, r * .26, a + Math.PI / 2 * .0 + 2.2); }
    ctx.restore();
  }
  function basketball(ctx, x, y, r, rot, sq) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq, 1 - sq); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(30,15,0,.3)'; ctx.beginPath(); ctx.arc(9, 13, r + 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, TAU); ctx.fill();
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * .8, -.9, .9); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.25, 0, r * .8, Math.PI - .9, Math.PI + .9); ctx.stroke();
    ctx.restore();
  }
  // bounce in stop-motion: returns {y (up offset), sq}
  function bounce(t, t0, period, h) {
    const q = CL.q(t - t0, 12), ph = ((q % period) + period) % period / period, up = Math.abs(Math.sin(ph * Math.PI)) * h;
    const near = ph < .1 || ph > .9; return { up, sq: near ? .16 : 0, rot: q * 3.2 };
  }

  // ---------- Charlton wordmark (invented paper sticker)
  function charlton(ctx, t) {
    const R = '#D3161E';
    ctx.save();
    // red torn banner with halftone
    CL.scrap(ctx, 0, 0, 840, 250, { fill: R, seed: 21, rough: 7, shadow: 16, draw: (g, w, h) => { CL.halftone(g, -w / 2, -h / 2, w, h, '#a00d14', 22, .6, { alpha: .9, fade: 'r', k: .8 }); g.fillStyle = '#fff'; g.fillRect(-w / 2, -h / 2 + 18, w, 10); g.fillRect(-w / 2, h / 2 - 28, w, 10); } });
    // CHARLTON latin, cut-out letters, each slightly off (ransom lettering)
    const word = 'CHARLTON'; ctx.font = '400 168px Bangers'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
    const ws = word.split('').map(c => ctx.measureText(c).width + 6), tot = ws.reduce((a, b) => a + b, 0); let x = -tot / 2;
    word.split('').forEach((c, i) => { const cx = x + ws[i] / 2, rr = (hash(i * 5.1) - .5) * .16, dy = (hash(i * 2.2) - .5) * 14; ctx.save(); ctx.translate(cx, -6 + dy); ctx.rotate(rr); ctx.lineJoin = 'round'; ctx.lineWidth = 30; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeText(c, 6, 8); ctx.strokeStyle = '#fff'; ctx.strokeText(c, 0, 0); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.strokeText(c, 0, 0); ctx.fillStyle = i % 2 ? '#fff' : C.yellow; ctx.fillText(c, 0, 0); ctx.restore(); x += ws[i]; });
    // Hebrew chip below, overlapping bottom edge
    CL.chip(ctx, "צ'רלטון", 20, 158, { size: 118, fill: '#fff', rot: -.035, seed: 33, ink: C.ink, pad: 44 });
    // football badge on left corner
    football(ctx, -365, 140, 62, -.3, 0);
    // stars
    CL.star(ctx, 395, -128, 44, 8, { fill: C.yellow, lw: 6, rot: .3 });
    ctx.restore();
  }

  // ---------- pieces
  function ticketStrip(ctx, t, off) {
    ctx.save(); ctx.translate(0, off);
    const x0 = 130, x1 = 950, y0 = 335, y1 = 1320;
    ctx.fillStyle = 'rgba(30,15,0,.3)'; CL.tornPath(ctx, x0 + 12, y0 + 16, x1 - x0, y1 - y0, { seed: 5, rough: 3, step: 60 }); ctx.fill();
    ctx.fillStyle = C.cream; CL.tornPath(ctx, x0, y0, x1 - x0, y1 - y0, { seed: 5, rough: 3, step: 60 }); ctx.fill();
    // perforations
    ctx.fillStyle = '#2E9E4F'; for (let y = y0 + 40; y < y1 - 20; y += 52) { ctx.beginPath(); ctx.arc(x0 + 2, y, 13, 0, TAU); ctx.arc(x1 - 2, y, 13, 0, TAU); ctx.fill(); }
    // stub divider
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(300, y0 + 20); ctx.lineTo(300, y1 - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.blue; ctx.font = '900 34px Rubik'; ctx.textAlign = 'center'; ctx.direction = 'ltr'; ctx.fillText('CHANNEL', 215, y0 + 44);
    ctx.restore();
  }
  const CARDS = [[600, 425, 184, -.02], [590, 615, 184, .015], [604, 805, 184, -.012], [592, 995, 184, .02], [596, 1178, 250, -.018]];
  const NUMY = [425, 615, 805, 995, 1178];

  function starburst(ctx, t, cx, cy, R, ph) {
    const q = CL.q(t, 12), rot = q * .35;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(ph, ph);
    ctx.fillStyle = 'rgba(30,15,0,.3)'; ctx.save(); ctx.translate(14, 18); ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + rot, r = i % 2 ? R * .74 : R * 1.02; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
    CL.star(ctx, 0, 0, R * 1.02, 20, { rot: rot, fill: C.blue, lw: 8 });
    CL.star(ctx, 0, 0, R * .84, 20, { rot: -rot * 1.3 + .1, fill: C.yellow, lw: 8 });
    ctx.restore();
  }

  function scene(ctx, s) {
    const t = s.t, q = CL.q(t, 12), lt = t - T0;
    // wipe entry: green pitch torn edge climbs from the bottom
    const wu = clamp(lt / .4), wipe = wu < 1;
    if (wipe) {
      const fy = lerp(H + 80, -60, CL.q(wu, 15)), r = rng(77 + Math.floor(wu * 15)), pts = [];
      for (let x = -20; x <= W + 20; x += 40) pts.push([x, fy + (r() - .5) * 46 + (((x / 40) | 0) % 2 ? 14 : -14)]);
      // white torn edge + hard shadow over previous scene
      ctx.fillStyle = 'rgba(30,15,0,.35)'; ctx.beginPath(); ctx.moveTo(-20, H + 60); pts.forEach(p => ctx.lineTo(p[0], p[1] - 4)); ctx.lineTo(W + 20, H + 60); ctx.fill();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(-20, H + 60); pts.forEach(p => ctx.lineTo(p[0], p[1] - 22)); ctx.lineTo(W + 20, H + 60); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20, H + 60); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(W + 20, H + 60); ctx.closePath(); ctx.save(); ctx.clip();
    }
    ctx.drawImage(pitch(), 0, 0);
    // pitch line scraps: green paper strip flaps as depth
    crowd(ctx, t);
    // scoreboard
    const sbp = CL.pop(t, 9.0, .3); if (sbp > 0) { const j = CL.j(t, 3, 2); scoreboard(ctx, t, 262 + j[0], 322 + j[1], -.06 + j[2] ); }
    // balls
    const b1 = bounce(t, 8.9, 5, 260), b2 = bounce(t, 8.9 + .18, 6, 220), bp = CL.pop(t, 8.95, .3), bq = CL.pop(t, 9.05, .3);
    const bY = 1348;
    if (bp) { ctx.save(); ctx.translate(96, bY - b1.up); ctx.scale(bp, bp); football(ctx, 0, 0, 70, b1.rot, b1.sq); ctx.restore(); }
    if (bq) { ctx.save(); ctx.translate(984, bY - b2.up); ctx.scale(bq, bq); basketball(ctx, 0, 0, 66, -b2.rot * .9, b2.sq); ctx.restore(); }

    const hero = t >= HERO_T;
    // ---- ticket strip + five logo cards
    const stripP = CL.pop(t, 8.95, .3);
    let stripOff = 0; if (hero) { const u = (t - HERO_T) / .3; stripOff = u >= 1 ? 2000 : Math.floor(u * 4) / 4 * 1700 * u; }
    if (stripOff < 1900 && stripP) {
      ticketStrip(ctx, t, stripOff);
      const names = ['sport1', 'sport2', 'sport3', 'sport4', 'sport5'];
      names.forEach((n, i) => {
        const [cx, cy, h, rot] = CARDS[i], t0 = CARD_T[i], u = (t - t0) / .22; if (u <= 0) return;
        const k = Math.floor(clamp(u) * 4), dy = u >= 1 ? 0 : [-330, -150, 24, -6][k], sc = u >= 1 ? 1 : [1.1, 1.06, .96, 1.02][k];
        const j = CL.j(t, 10 + i, 2.2);
        let ox = 0, oy = 0, rr = rot;
        if (hero && i < 4) { const uu = (t - HERO_T - i * .03) / .32; if (uu >= 1) return; const kk = Math.floor(uu * 4) / 4; ox = (i % 2 ? 1 : -1) * kk * 1300; oy = kk * 300; rr += kk * (i % 2 ? .8 : -.8); }
        if (hero && i === 4) return;
        const jc = j;
        ctx.save(); ctx.translate(0, stripOff);
        CL.logoCard(ctx, n, cx + ox + jc[0], cy + dy + oy + jc[1], 580, h, { rot: rr + jc[2], scale: sc, seed: 3 + i, tape: i % 2 === 0 || i === 4, pad: i === 4 ? .08 : .07, fill: i === 4 ? C.navy : undefined });
        // numeral stub
        ctx.fillStyle = C.ink; ctx.font = '900 130px Bangers'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        const npop = CL.pop(t, t0, .25); ctx.save(); ctx.translate(215 + ox * .0, NUMY[i] + dy * 0 + 0); ctx.scale(npop, npop); ctx.rotate(rot * 3); ctx.fillStyle = [C.red, C.blue, C.green, C.orange, C.yellow][i]; ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.strokeText(String(i + 1), 0, 0); ctx.fillText(String(i + 1), 0, 0); ctx.restore();
        ctx.restore();
      });
      // marker "x5" counter arrow
    }

    // ---- hero: Sport 5 with starburst
    if (hero) {
      const hp = CL.pop(t, HERO_T, .3), hs = CL.shake(t, HERO_T, .5, 12);
      const cy = t >= CHAR_T ? 590 : 700, mv = t >= CHAR_T ? Math.min(1, Math.floor((t - CHAR_T) / (1 / 12) + 1e-6) / 3) : 0, cyy = lerp(680, 520, mv);
      const bs = hp;
      ctx.save(); ctx.translate(hs[0], hs[1]);
      const bj = CL.j(t, 40, 3);
      starburst(ctx, t, 540 + bj[0], cyy + bj[1], 560, bs);
      const img = CL.logoImg('sport5'), lj = CL.j(t, 41, 2.5);
      if (img) { ctx.save(); ctx.translate(540 + lj[0], cyy + lj[1]); ctx.rotate(-.05 + lj[2]); ctx.scale(hp * (t >= CHAR_T ? .9 : 1), hp * (t >= CHAR_T ? .9 : 1)); ctx.fillStyle='rgba(30,15,0,.35)'; ctx.beginPath(); ctx.arc(16,22,372,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,372,0,TAU); ctx.fill(); ctx.fillStyle=C.navy; ctx.beginPath(); ctx.arc(0,0,350,0,TAU); ctx.fill(); CL.halftone(ctx,-350,-350,700,700,C.blue,26,.5,{alpha:.8,fade:'radial'}); ctx.save(); ctx.beginPath(); ctx.arc(0,0,350,0,TAU); ctx.clip(); ctx.restore(); CL.sticker(ctx, img, 0, 6, 560, 540, { border: 10, shadow: 0, color: C.navy }); ctx.restore(); }
      // marker circle around the logo
      const cp = clamp((t - HERO_T - .18) / .3); if (cp > 0) { ctx.save(); ctx.translate(540, cyy); CL.circle(ctx, 0, 0, 420, 400, Math.floor(cp * 12) / 12, { color: C.red, lw: 16, seed: 2 }); ctx.restore(); }
      // sparks on pop
      if (t - HERO_T < .5) CL.sparks(ctx, 540, cyy, 470, 560, 18, t, { color: C.ink, lw: 10 });
      ctx.restore();
    }

    // ---- Charlton slam
    if (t >= CHAR_T - .01) {
      const u = (t - CHAR_T) / .25, k = Math.floor(clamp(u) * 4), sc = u >= 1 ? 1 : [2.6, 1.6, .9, 1.05][k], cs = CL.shake(t, CHAR_T + .06, .5, 20), j = CL.j(t, 55, 3);
      ctx.save(); ctx.translate(540 + cs[0] + j[0], 1030 + cs[1] + j[1]); ctx.rotate(-.06 + j[2]); ctx.scale(sc, sc); charlton(ctx, t); ctx.restore();
      // confetti scraps from the impact
      const ct = t - CHAR_T; if (ct > 0.05 && ct < 1.3) { for (let i = 0; i < 26; i++) { const a = hash(i * 3.1) * TAU, sp = 300 + hash(i * 7.7) * 700, tt = Math.floor(ct * 12) / 12; const x = 540 + Math.cos(a) * sp * tt * 1.2, y = 1120 + Math.sin(a) * sp * tt * .9 + 900 * tt * tt; ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i) * 6 + tt * 8 * (hash(i + 3) - .5)); ctx.fillStyle = [C.yellow, C.blue, C.red, '#fff', C.green][i % 5]; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; const w = 22 + hash(i * 2) * 26; ctx.fillRect(-w / 2, -8, w, 16); ctx.strokeRect(-w / 2, -8, w, 16); ctx.restore(); } }
    }
    // small doodles: marker arrows and stars around
    if (!hero) { const p = clamp((t - 9.95) / .3); if (p > 0) { ctx.save(); CL.arrow(ctx, 80, 1120, 120, 1245, Math.floor(p * 8) / 8, { color: C.yellow, lw: 12, bend: 40 }); ctx.restore(); } }
    if (wipe) ctx.restore();
  }
  A.scene({ name: 's2_sports', start: T0, end: 12.4, draw: scene });
})();

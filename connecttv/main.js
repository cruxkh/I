// ConnectTV compositor: scenes -> mascot overlay -> gel-chip captions -> hold overlays. Smooth 30 fps with 3-sample temporal motion blur.
(() => {
  const W = 1920, H = 1080, FPS = 30, DURV = TLF.TOTAL;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  A.tMap = TLF.vOf; A.post = null;
  // ---- captions: "candy sticker" kinetic type. Every spoken word is a glossy 3D candy word (white die-cut edge, navy outline, extruded depth, gradient + gloss + rim light) that drops in with squash/stretch ON the word start, with a liquid splash, ring and droplets. Small glass strip below with English words lighting up.
  const EMPH = { 'מנטפליקס': C.red, 'דיסני': C.blue, 'פלוס': C.cyan, 'הספורט': C.green, "צ'רלטון": C.orange, 'טורקיות': C.pink, 'הודיות': C.orange, 'חיים': C.red, 'השידורים': C.pink, 'מישראל': C.blue, 'אחד': C.purple, 'נגיש': C.green, 'השבוע': C.pink, 'מתעדכן': C.cyan, 'לחפש': C.red, 'שירותים': C.red, 'לצפות': C.green, 'לראות': C.green, 'המסך': C.cyan, 'נפתח': C.purple, 'הבידור': C.pink, 'פותחים': C.yellow, 'בפניכם': C.orange };
  const PAL = [C.yellow, C.pink, C.cyan, C.orange, C.lime, C.purple, C.green];
  const wcolor = (w, gi) => EMPH[w] || EMPH[w.replace(/^ו/, '')] || PAL[gi % PAL.length];
  const chunks = (() => {
    const out = []; let cur = []; const flush = () => { if (cur.length) out.push(cur); cur = []; };
    WORDS.forEach(w => { if (cur.length && (w.ph !== cur[0].ph || cur.length >= 3 || cur.reduce((s, q) => s + q.w.length, 0) + w.w.length > 16)) flush(); cur.push(w); });
    flush(); out.forEach(c => { c.t0 = c[0].t0; c.t1 = c[c.length - 1].t1; }); return out;
  })();
  CL.noCap = [[27.6, 99]];      // [t0,t1] windows (voice clock) with no captions (scenes may push more, lazily inside draw())
  CL.capY = 880;                // caption baseline (word centre); a scene may set CL.capYAt = t => y
  const mctx = mk(4, 4).getContext('2d');
  const SIZE = 138, INK = '#070B2E';
  function sprite(s, col) {   // cached candy word: returns {cv, w, h}
    mctx.font = `900 ${SIZE}px Rubik`; mctx.direction = 'rtl'; const tw = Math.ceil(mctx.measureText(s).width), w = tw + Math.ceil(SIZE * 1.0), h = Math.ceil(SIZE * 2.0), key = 'cap|' + s + '|' + col + '|' + SIZE;
    const cv = CL.layer(key, w, h, g => {
      const cx = w / 2, cy = h / 2 - SIZE * .04, dep = Math.round(SIZE * .13);
      g.font = `900 ${SIZE}px Rubik`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.lineJoin = 'round'; g.miterLimit = 2;
      g.strokeStyle = 'rgba(2,4,30,.5)'; g.lineWidth = SIZE * .3; g.strokeText(s, cx + 4, cy + dep + 12);              // drop shadow
      g.strokeStyle = '#ffffff'; g.lineWidth = SIZE * .33; for (const d of [0, dep * .5, dep]) g.strokeText(s, cx, cy + d);   // die-cut sticker edge
      const dark = A.mixc(col, INK, .7); g.strokeStyle = dark; g.fillStyle = dark; g.lineWidth = SIZE * .2;
      for (let d = dep; d >= 1; d -= 1) { g.strokeText(s, cx, cy + d); g.fillText(s, cx, cy + d); }                     // extruded depth
      g.strokeStyle = INK; g.lineWidth = SIZE * .2; g.strokeText(s, cx, cy);                                            // navy outline
      const t = mk(w, h), x = t.getContext('2d'); x.font = g.font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'rtl'; x.lineJoin = 'round';
      x.fillStyle = A.linear(x, 0, cy - SIZE * .52, 0, cy + SIZE * .52, [[0, A.mixc(col, '#ffffff', .62)], [.42, A.mixc(col, '#ffffff', .12)], [.5, col], [1, A.mixc(col, INK, .32)]]); x.fillText(s, cx, cy);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = A.linear(x, 0, cy - SIZE * .5, 0, cy + SIZE * .05, [[0, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,.0)']]); x.beginPath(); x.ellipse(cx, cy - SIZE * .27, tw * .56, SIZE * .26, 0, 0, A.TAU); x.fill();   // top gloss
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 5; x.strokeText(s, cx, cy);                                 // inner rim light
      x.globalCompositeOperation = 'source-over';
      g.drawImage(t, 0, 0);
    });
    return { cv, w, h };
  }
  function captions(c, t) {
    if (CL.noCap.some(([a, b]) => t >= a && t < b)) return;
    const ci = chunks.findIndex(k => t >= k.t0 - 0.02 && t < k.t1 + 0.16); if (ci < 0) return;
    const ch = chunks[ci], YB = CL.capYAt ? CL.capYAt(t) : CL.capY, gi0 = chunks.slice(0, ci).reduce((s, k) => s + k.length, 0);
    const outK = clamp((t - (ch.t1 + .02)) / .14);   // slide/fade out after the phrase
    // soft legibility scrim behind the caption band
    const sk = clamp((t - (ch.t0 - .1)) / .2) * (1 - outK); c.save(); c.globalAlpha = .55 * sk; c.fillStyle = c.createLinearGradient(0, H * .58, 0, H); c.fillStyle.addColorStop(0, 'rgba(4,6,32,0)'); c.fillStyle.addColorStop(1, 'rgba(4,6,32,1)'); c.fillRect(0, H * .58, W, H * .42); c.restore();
    const sp = ch.map((w, i) => sprite(w.w, wcolor(w.w, gi0 + i))), gap = -SIZE * .1, widths = sp.map(q => q.w - SIZE * .55), total = widths.reduce((a, b) => a + b, 0) + gap * (sp.length - 1), fit = Math.min(1, 1640 / total);
    c.save(); c.translate(W / 2, YB + outK * 40); c.scale(fit, fit); c.globalAlpha = 1 - outK; let x = total / 2;   // RTL: first word at the right
    ch.forEach((w, i) => {
      const q = sp[i], wp = widths[i], cx = x - wp / 2, u = (t - (w.t0 - .04)) / .34; x -= wp + gap; if (u <= 0) return;
      const col = wcolor(w.w, gi0 + i), e = ease.outBack(clamp(u)), k = clamp(u), sq = 1 + .28 * Math.sin(clamp(u * 1.6) * Math.PI) * (1 - k * .3), sc = (.05 + .95 * e) * (w.w.length <= 3 ? 1 : 1);
      const active = t >= w.t0 - .03 && t < w.t1 + .02, jt = CL.j(t, ci * 3 + i, 4), bob = active ? Math.sin((t - w.t0) * 9) * 3 : 0, drop = -110 * (1 - clamp(u * 1.5)) * (1 - clamp(u * 1.5)), rot = (hash((gi0 + i) * 1.7) - .5) * .09 * (1 - k * .5) + jt[2];
      // liquid splash + ring + droplets on the word start
      const su = (t - w.t0 + .04); if (su > 0 && su < .7) { c.save(); c.translate(cx, 8); c.globalAlpha *= 1 - ease.in(clamp(su / .7)); CL.splash(c, 0, 0, Math.max(140, wp * .5), ease.outBack(clamp(su / .28)) * .9, gi0 + i + 3, [col, '#ffffff', A.mixc(col, '#ffffff', .5)]); c.restore(); CL.ring(c, cx, 4, wp * .55 + 60, clamp(su / .5), col, 10);
        for (let d = 0; d < 7; d++) { const a = -Math.PI / 2 + (hash(d * 3.1 + gi0 + i) - .5) * 2.2, v = 380 + hash(d * 5.7 + i) * 380, px = cx + Math.cos(a) * v * su, py = -40 + Math.sin(a) * v * su + 1500 * su * su; c.fillStyle = d % 2 ? '#fff' : col; c.beginPath(); c.arc(px, py, 9 * (1 - su / .7) + 2, 0, A.TAU); c.fill(); } }
      c.save(); c.translate(cx + jt[0] * .3, drop + jt[1] * .4 + bob); c.rotate(rot); c.scale(sc * sq * (active ? 1.06 : 1), sc / sq * (active ? 1.06 : 1));
      if (active) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35; c.fillStyle = A.radial(c, 0, 0, 0, wp * .75, [[0, A.hex(col, .9)], [1, A.hex(col, 0)]]); c.fillRect(-wp, -SIZE, wp * 2, SIZE * 2); c.restore(); }
      c.drawImage(q.cv, -q.w / 2, -q.h / 2 + SIZE * .04);
      const fl = clamp(1 - (t - w.t0) / .22); if (fl > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 * fl; c.drawImage(q.cv, -q.w / 2, -q.h / 2 + SIZE * .04); }
      c.restore();
    });
    c.restore();
    // English gloss: dark glass strip, gradient rim, words light up as they are spoken
    const L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (L) {
      c.save(); c.direction = 'ltr'; c.font = '800 38px Rubik'; const tw = L.words.reduce((s, w) => s + c.measureText(w.w + ' ').width, 0), y = YB + SIZE * .98 + 8, gs = Math.min(1, 1640 / (tw + 90));
      c.globalAlpha = sk; c.translate(W / 2, y + outK * 20); c.scale(gs, gs);
      c.fillStyle = 'rgba(5,8,38,.82)'; c.beginPath(); c.roundRect(-tw / 2 - 36, -34, tw + 72, 68, 34); c.fill();
      const rg = c.createLinearGradient(-tw / 2, 0, tw / 2, 0); rg.addColorStop(0, C.cyan); rg.addColorStop(.5, C.purple); rg.addColorStop(1, C.pink); c.strokeStyle = rg; c.lineWidth = 3.5; c.stroke();
      let xx = -tw / 2; for (const w of L.words) { const lit = t >= w.t; A.text(c, w.w, xx, 2, { font: '800 38px Rubik', align: 'left', fill: lit ? C.yellow : 'rgba(255,255,255,.62)' }); const ww = c.measureText(w.w + ' ').width; if (lit && t - w.t < .25) CL.spark(c, xx + ww * .45, -30, 12 * (1 - (t - w.t) / .25), t * 6, '#fff'); xx += ww; }
      c.restore();
    }
  }

  // ---- HOLD overlays: the voice pauses on a genre moment; camera pushes in and the moment "performs" its own sound
  CL.HOLDFOC = { cin: [960, 500, 1.3], tur: [960, 500, 1.3], ind: [960, 500, 1.3] };   // scenes may overwrite lazily inside draw(): [focusX, focusY, zoom]
  const PRE = { cin: 8.32, tur: 9.27, ind: 10.39 };   // zoom starts ON the spoken word, complete when the hold begins
  function holdCam(hd, t) {
    let k = 0, key = null;
    if (hd) { key = hd.k; k = ease.inOut(clamp((hd.d - hd.age) / .3)); }
    else for (const h of TLF.HOLDS) { const p = PRE[h.k]; if (t >= p && t < h.v) { key = h.k; k = ease.inOut(clamp((t - p) / Math.max(.2, h.v - p))); } }
    if (!key || k <= 0) return null; const [fx, fy, zm] = CL.HOLDFOC[key]; return { fx, fy, z: lerp(1, zm, k), k };
  }
  function bubble(c, s, x, y, o = {}) {
    const size = o.size || 120; c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(o.sc ?? 1, o.sc ?? 1); c.font = `900 ${size}px ${o.font || 'Rubik'}`; c.direction = o.dir || 'ltr';
    const tw = c.measureText(s).width, w = tw + size * .8, h = size * 1.45;
    c.fillStyle = 'rgba(2,4,30,.45)'; c.beginPath(); c.ellipse(8, 14, w / 2 + 12, h / 2 + 10, 0, 0, A.TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, w / 2 + 12, h / 2 + 10, 0, 0, A.TAU); c.moveTo(-w * .18, h * .38); c.lineTo(o.tail ?? -w * .38, h * .95); c.lineTo(-w * .02, h * .45); c.fill();
    c.lineWidth = 8; c.strokeStyle = C.ink; c.beginPath(); c.ellipse(0, 0, w / 2 + 12, h / 2 + 10, 0, 0, A.TAU); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = o.ink || C.ink; c.fillText(s, 0, size * .05); c.restore();
  }
  // CINEMA moment on "צ'רלטון": letterbox bars, projector flicker, sepia, film scratches, vignette
  function cinema(c, t, T, hd) {
    let k = 0; if (hd && hd.k === 'cin') k = clamp((hd.d - hd.age) / .25); else if (t >= 8.3 && t < 8.86) k = clamp((t - 8.3) / .14);
    if (k <= 0) return; const q = CL.qs(T, 24), fl = .85 + .15 * hash(q * 7);
    c.save();
    c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(255,214,150,${.55 * k})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
    const sp = c.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .15, W / 2, H * .45, Math.max(W, H) * .7); sp.addColorStop(0, `rgba(255,240,200,${.10 * k * fl})`); sp.addColorStop(1, `rgba(0,0,0,${.7 * k})`); c.fillStyle = sp; c.fillRect(0, 0, W, H);
    c.globalAlpha = k * .5; c.strokeStyle = '#fff'; for (let i = 0; i < 3; i++) { const x = hash(q * 3 + i) * W; c.lineWidth = 1 + hash(q + i) * 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (hash(i + q) - .5) * 30, H); c.stroke(); }
    for (let i = 0; i < 18; i++) { c.fillStyle = hash(q * 5 + i) > .5 ? '#fff' : '#000'; c.globalAlpha = k * .5; const r = 1 + hash(q + i * 3) * 3; c.beginPath(); c.arc(hash(q * 1.3 + i) * W, hash(q * 2.9 + i) * H, r, 0, A.TAU); c.fill(); }
    c.globalAlpha = 1; const bar = (W > H ? H * .13 : H * .17) * ease.out(k); c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    if (hd && hd.k === 'cin' && hd.age > .15) { c.globalAlpha = clamp((hd.age - .15) / .3) * k; c.font = `700 ${W > H ? 44 : 40}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#E8C77A'; c.direction = 'ltr'; c.fillText('CONNECT TV  PRESENTS', W / 2, H - bar / 2); }
    c.restore();
  }
  function holdOverlay(c, hd, T) {
    if (!hd || hd.k === 'cin') return; const a = hd.age, inA = clamp(a / .08) * clamp((hd.d - a) / .2);
    c.save(); c.globalAlpha = inA;
    if (hd.k === 'tur') {   // Turkish drama: red vignette, falling tears, "Neden?!"
      const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(120,0,10,0)'); v.addColorStop(1, 'rgba(90,0,10,.62)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const x = (hash(i * 3.7) * .9 + .05) * W, sp = 380 + hash(i) * 420, y = ((a * sp + hash(i * 9) * H) % (H + 200)) - 100, s = 18 + hash(i * 5) * 22; c.fillStyle = '#9fe0ff'; c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - s * 1.6); c.quadraticCurveTo(x + s, y, x, y + s * .9); c.quadraticCurveTo(x - s, y, x, y - s * 1.6); c.fill(); c.stroke(); }
      const sc = CL.pop(T, hd.T0 + .04, .22); if (sc > 0) bubble(c, 'Neden?!', W * .5, H * .16, { size: W > H ? 110 : 120, rot: -.06 + CL.j(T, 3, 1)[2], sc, font: 'Bangers', ink: '#B3001B' });
    } else {   // Bollywood: marigold petals, sparkles, rays, "वाह!"
      c.save(); c.translate(W / 2, H * .45); c.rotate(T * .5); for (let i = 0; i < 16; i++) { c.rotate(A.TAU / 16); c.fillStyle = i % 2 ? 'rgba(255,138,31,.30)' : 'rgba(255,46,147,.22)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-100, -Math.max(W, H)); c.lineTo(100, -Math.max(W, H)); c.fill(); } c.restore();
      for (let i = 0; i < 26; i++) { const x = (hash(i * 2.3) * 1.1 - .05) * W, y = ((a * (260 + hash(i) * 240) + hash(i * 7) * H) % (H + 200)) - 100, s = 14 + hash(i * 4) * 16, r = a * 3 + i; c.save(); c.translate(x + Math.sin(a * 3 + i) * 30, y); c.rotate(r); c.fillStyle = ['#FFB300', '#FF6A00', '#FF2E93', '#FFD23F'][i % 4]; c.beginPath(); c.ellipse(0, 0, s * 1.4, s * .7, 0, 0, A.TAU); c.fill(); c.restore(); }
      for (let i = 0; i < 10; i++) { const an = i / 10 * A.TAU + T, r = Math.min(W, H) * (.34 + .08 * hash(i + Math.floor(T * 6))); CL.spark(c, W / 2 + Math.cos(an) * r, H * .45 + Math.sin(an) * r, 26 + 20 * hash(i * 3), T * 2, i % 2 ? '#fff' : C.yellow); }
      const sc = CL.pop(T, hd.T0 + .03, .22); if (sc > 0) bubble(c, 'वाह!', W * .5, H * .15, { size: W > H ? 110 : 130, rot: .05 + CL.j(T, 5, 1)[2], sc, font: 'Deva', ink: '#C2185B' });
    }
    c.restore();
  }
  const ACC = mk(W, H), acx = ACC.getContext('2d'), ACC2 = mk(W, H);
  const MB = mk(W, H), mbx = MB.getContext('2d');
  async function scenePass(ff) {   // one temporal sample of the picture (scenes + mascot + camera), into ACC
    const T = ff / FPS, t = TLF.vOf(T), hd = TLF.holdAt(T);
    cv.width = W;   // reset all canvas state
    if (window.HOST) await HOST.prepare(t);
    A.renderFrame(ff);
    const hc = holdCam(hd, t);   // after the scenes ran: they register CL.HOLDFOC lazily inside draw()
    if (window.HOST) HOST.overlay(ctx, t);
    let z = 1; chunks.forEach(k => { const u = t - k.t0; if (u >= 0 && u < .4) z += .02 * Math.pow(1 - u / .4, 2); });   // soft punch-in at each phrase
    ACC.width = W; acx.save(); acx.translate(W / 2, H / 2); acx.scale(z, z); acx.translate(-W / 2, -H / 2); acx.drawImage(cv, 0, 0); acx.restore();
    if (hc) { const tmp = ACC2; tmp.width = W; const tx = tmp.getContext('2d'); tx.drawImage(ACC, 0, 0); ACC.width = W; acx.save(); acx.translate(W / 2, H / 2); acx.scale(hc.z, hc.z); acx.translate(-lerp(W / 2, hc.fx, hc.k), -lerp(H / 2, hc.fy, hc.k)); acx.drawImage(tmp, 0, 0); acx.restore(); }
  }
  async function draw(f, opt = {}) {
    const T = f / FPS, t = TLF.vOf(T), hd = TLF.holdAt(T);
    const N = opt.fast ? 1 : (opt.n || 3), shutter = .5;   // temporal supersampling = natural motion blur
    MB.width = W;
    for (let k = 0; k < N; k++) { const ff = f + (N === 1 ? 0 : ((k + .5) / N - .5) * shutter); await scenePass(ff); mbx.globalAlpha = 1 / (k + 1); mbx.drawImage(ACC, 0, 0); }
    mbx.globalAlpha = 1;
    cv.width = W; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(MB, 0, 0);
    cinema(ctx, t, T, hd);
    if (!hd) captions(ctx, t); else holdOverlay(ctx, hd, T);
    if (window.G_OVERLAY) window.G_OVERLAY(ctx, t);
    const fb = Math.max(1 - inv(0, 0.15, T), inv(DURV - .3, DURV, T)); if (fb > 0) { ctx.fillStyle = `rgba(7,11,46,${fb})`; ctx.fillRect(0, 0, W, H); }
  }
  window.G = { draw, W, H, FPS, DURV, chunks };
  window.gReady = Promise.all([CL.logosReady, document.fonts.ready.then(() => Promise.all(['300 20px Rubik', '600 20px Rubik', '700 20px Rubik', '900 20px Rubik', '20px Bangers', '20px Secular', '700 20px Deva'].map(f => document.fonts.load(f, 'אבג abc वाह'))))]);
})();

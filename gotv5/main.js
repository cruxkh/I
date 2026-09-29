// GOTV v5 compositor: scenes -> host overlay -> ransom-note captions -> paper grain. Stop-motion look: no motion blur, 1 sample per frame.
(() => {
  const W = 1080, H = 1920, FPS = 30, DURV = TLF.TOTAL;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  A.tMap = TLF.vOf; A.post = null;
  // ---- captions: chips per phrase
  const EMPH = { 'מנטפליקס': C.red, 'מדיסני': C.blue, 'הספורט': C.green, 'ספורט': C.green, 'חיים': C.red, 'השידורים': C.red, 'שידורים': C.red, 'תקיעות': C.orange, 'נקודה': C.orange, 'אנימה': C.pink, 'טורקיות': C.orange, 'קוריאניות': C.blue, "וצ'רלטון": C.green };
  const chunks = (() => {
    const out = []; let cur = []; const flush = () => { if (cur.length) out.push(cur); cur = []; };
    WORDS.forEach(w => { if (cur.length && (w.ph !== cur[0].ph || cur.length >= 3 || cur.reduce((s, q) => s + q.w.length, 0) + w.w.length > 16)) flush(); cur.push(w); if (/[,?]$/.test(w.w)) flush(); });
    flush(); out.forEach(c => { c.t0 = c[0].t0; c.t1 = c[c.length - 1].t1; }); return out;
  })();
  CL.noCap = [[36.85, 99]];   // [t0,t1] windows with no captions (scenes may push more)
  CL.capY = 1400;              // caption baseline; scenes can override per time with CL.capYAt = t => y
  function captions(c, t) {
    if (CL.noCap.some(([a, b]) => t >= a && t < b)) return;
    const ci = chunks.findIndex(k => t >= k.t0 - 0.02 && t < k.t1 + 0.12); if (ci < 0) return;
    const ch = chunks[ci], big = ch.some(w => /^(תקיעות|נקודה)/.test(w.w)), size = big ? 132 : 92, YB = CL.capYAt ? CL.capYAt(t) : CL.capY;
    c.save(); c.direction = 'rtl'; c.font = `900 ${size}px Rubik`;
    const words = ch.map(w => w.w.replace(/[,?]/g, '')), gap = 18, pad = size * .3, widths = words.map(s => c.measureText(s).width + pad * 2);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1), fit = Math.min(1, 980 / total); let x = total / 2;    // RTL: first word at right
    c.translate(540, YB); c.scale(fit, fit);
    words.forEach((s, i) => {
      const w = ch[i], wp = widths[i], cx = x - wp / 2, age = t - w.t0, sc = CL.pop(t, w.t0 - .04, .22); x -= wp + gap; if (sc <= 0) return;
      const active = t >= w.t0 - .03 && t < w.t1 + .02, em = EMPH[s] || EMPH[s.replace(/^ו/, '')], sd = ci * 3 + i, jt = CL.j(t, sd, 2.2), rot = (hash(sd * 1.3) - .5) * .14 + jt[2];
      CL.chip(c, s, cx + jt[0], (hash(sd * 2.1) - .5) * 26 + jt[1], { size, fill: active ? C.yellow : (em ? '#fff' : C.white), ink: em && !active ? em : C.ink, rot, seed: sd + 2, scale: sc * (active ? 1.06 : 1), pad });
    });
    c.restore();
    const L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (L) {
      c.save(); c.direction = 'ltr'; c.font = '700 34px Rubik'; const tw = L.words.reduce((s, w) => s + c.measureText(w.w + ' ').width, 0), y = YB + size * .95 + 34, gs = Math.min(1, 980 / (tw + 60));
      c.translate(540, y); c.scale(gs, gs); c.fillStyle = 'rgba(255,253,246,.92)'; CL.tornPath(c, -tw / 2 - 24, -32, tw + 48, 64, { seed: 9, rough: 3 }); c.fill();
      let xx = -tw / 2; for (const w of L.words) { A.text(c, w.w, xx, 2, { font: '700 34px Rubik', align: 'left', fill: t >= w.t ? '#C2410C' : 'rgba(20,20,20,.72)' }); xx += c.measureText(w.w + ' ').width; }
      c.restore();
    }
  }

  // ---- HOLD overlays: the voice pauses on a genre poster; camera pushes in and the poster "performs" its own sound moment
  const HOLDFOC = {cin:[540,1030,1.35],tur:[330,490,1.38],kor:[755,770,1.38],ani:[345,1000,1.38]};
  const PRE = { cin: 11.11, tur: 12.39, kor: 13.095, ani: 13.99 };   // zoom starts ON the spoken word, is complete when the hold begins
  function holdCam(hd, t) {
    let k = 0, key = null;
    if (hd) { key = hd.k; k = ease.inOut(clamp((hd.d - hd.age) / .3)); }
    else for (const h of TLF.HOLDS) { const p = PRE[h.k]; if (t >= p && t < h.v) { key = h.k; k = ease.inOut(clamp((t - p) / Math.max(.2, h.v - p))); } }
    if (!key || k <= 0) return null; const [fx, fy, zm] = HOLDFOC[key]; return { fx, fy, z: lerp(1, zm, k), k };
  }
  function bubble(c, s, x, y, o = {}) {
    const size = o.size || 120; c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(o.sc ?? 1, o.sc ?? 1); c.font = `900 ${size}px ${o.font || 'Rubik'}`; c.direction = o.dir || 'ltr';
    const tw = c.measureText(s).width, w = tw + size * .8, h = size * 1.45;
    c.fillStyle = 'rgba(40,20,0,.3)'; c.beginPath(); c.ellipse(10, 14, w / 2 + 12, h / 2 + 10, 0, 0, A.TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, w / 2 + 12, h / 2 + 10, 0, 0, A.TAU); c.moveTo(-w * .18, h * .38); c.lineTo(o.tail ?? -w * .38, h * .95); c.lineTo(-w * .02, h * .45); c.fill();
    c.lineWidth = 9; c.strokeStyle = C.ink; c.beginPath(); c.ellipse(0, 0, w / 2 + 12, h / 2 + 10, 0, 0, A.TAU); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = o.ink || C.ink; c.fillText(s, 0, size * .05); c.restore();
  }

  // ---- CINEMA moment on "וצ'רלטון" (v 11.08-11.79 + hold 'cin'): letterbox bars, projector flicker, sepia, film scratches, spotlight
  function cinema(c, t, T, hd) {
    let k = 0; if (hd && hd.k === 'cin') k = clamp((hd.d - hd.age) / .25); else if (t >= 11.06 && t < 11.8) k = clamp((t - 11.06) / .12);
    if (k <= 0) return; const q = CL.qs(T, 24), fl = .85 + .15 * hash(q * 7);
    c.save();
    c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(255,214,150,${.55 * k})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
    const sp = c.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .15, W / 2, H * .45, Math.max(W, H) * .7); sp.addColorStop(0, `rgba(255,240,200,${.10 * k * fl})`); sp.addColorStop(1, `rgba(0,0,0,${.7 * k})`); c.fillStyle = sp; c.fillRect(0, 0, W, H);
    c.globalAlpha = k * .5; c.strokeStyle = '#fff'; for (let i = 0; i < 3; i++) { const x = hash(q * 3 + i) * W; c.lineWidth = 1 + hash(q + i) * 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (hash(i + q) - .5) * 30, H); c.stroke(); }
    for (let i = 0; i < 18; i++) { c.fillStyle = hash(q * 5 + i) > .5 ? '#fff' : '#000'; c.globalAlpha = k * .5; const r = 1 + hash(q + i * 3) * 3; c.beginPath(); c.arc(hash(q * 1.3 + i) * W, hash(q * 2.9 + i) * H, r, 0, A.TAU); c.fill(); }
    c.globalAlpha = 1; const bar = (W > H ? H * .13 : H * .17) * ease.out(k); c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    if (hd && hd.k === 'cin' && hd.age > .15) { c.globalAlpha = clamp((hd.age - .15) / .3) * k; c.font = `700 ${W > H ? 44 : 40}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#E8C77A'; c.direction = 'ltr'; c.fillText('GOTV  PRESENTS', W / 2, H - bar / 2); }
    c.restore();
  }
  function holdOverlay(c, hd, T) {
    if (!hd || hd.k === 'cin') return; const a = hd.age, q = CL.q(T, 12), inA = clamp(a / .08) * clamp((hd.d - a) / .2);
    c.save(); c.globalAlpha = inA;
    if (hd.k === 'tur') {
      const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(120,0,10,0)'); v.addColorStop(1, 'rgba(90,0,10,.62)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const x = (hash(i * 3.7) * .9 + .05) * W, sp = 380 + hash(i) * 420, y = ((a * sp + hash(i * 9) * H) % (H + 200)) - 100, s = 18 + hash(i * 5) * 22; c.fillStyle = '#7FC8FF'; c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - s * 1.6); c.quadraticCurveTo(x + s, y, x, y + s * .9); c.quadraticCurveTo(x - s, y, x, y - s * 1.6); c.fill(); c.stroke(); }
      const sc = CL.pop(T, hd.T0 + .04, .2); if (sc > 0) bubble(c, 'Neden?!', W * .5, H * .16, { size: W > H ? 110 : 120, rot: -.06 + CL.j(T, 3, 1)[2], sc, font: 'Bangers', ink: '#B3001B' });
    } else if (hd.k === 'kor') {
      c.fillStyle = 'rgba(255,170,210,.22)'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) { const x = (hash(i * 2.3) * .9 + .05) * W, y = H - ((a * (220 + hash(i) * 260) + hash(i * 7) * H) % (H + 160)) + 80, s = 26 + hash(i * 4) * 30, j = CL.j(T, i, 3); c.save(); c.translate(x + j[0], y + j[1]); c.fillStyle = i % 3 ? '#FF6FA8' : '#FF3B6B'; c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(0, s * .35); c.bezierCurveTo(-s, -s * .3, -s * .45, -s, 0, -s * .45); c.bezierCurveTo(s * .45, -s, s, -s * .3, 0, s * .35); c.fill(); c.stroke(); c.restore(); }
      const sc = CL.pop(T, hd.T0 + .03, .2); if (sc > 0) bubble(c, '사랑해요!', W * .5, H * .16, { size: W > H ? 100 : 110, rot: .05 + CL.j(T, 4, 1)[2], sc, font: "'WenQuanYi Zen Hei'", ink: '#D6246E' });
    } else {
      c.save(); c.translate(W / 2, H * .45); c.rotate(q * .6); for (let i = 0; i < 18; i++) { c.rotate(A.TAU / 18); c.fillStyle = i % 2 ? 'rgba(255,214,10,.28)' : 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-90, -Math.max(W, H)); c.lineTo(90, -Math.max(W, H)); c.fill(); } c.restore();
      for (let i = 0; i < 12; i++) { const an = i / 12 * A.TAU + q, r = Math.min(W, H) * (.32 + .1 * hash(i + q)), s = 30 + 26 * hash(i * 3 + q); CL.star(c, W / 2 + Math.cos(an) * r, H * .45 + Math.sin(an) * r, s, 4, { fill: i % 2 ? '#fff' : C.yellow, lw: 5, rot: q }); }
      const sc = CL.pop(T, hd.T0 + .03, .2); if (sc > 0) bubble(c, 'すごい！', W * .5, H * .15, { size: W > H ? 110 : 120, rot: -.05 + CL.j(T, 5, 1)[2], sc, font: 'IPAGothic', ink: '#1F4FFF' });
    }
    c.restore();
  }
  const grain = (() => { const g = mk(270, 480), gx = g.getContext('2d'), id = gx.createImageData(270, 480), r = rng(5); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); return g; })();
  const ACC = mk(W, H), acx = ACC.getContext('2d'), ACC2 = mk(W, H);
  const MB = mk(W, H), mbx = MB.getContext('2d');
  async function scenePass(ff) {   // one temporal sample of the picture (scenes + host + camera), into ACC
    const T = ff / FPS, t = TLF.vOf(T), hd = TLF.holdAt(T), hc = holdCam(hd, t);
    cv.width = W;   // reset all canvas state
    if (window.HOST) await HOST.prepare(t);
    A.renderFrame(ff);
    if (window.HOST) HOST.overlay(ctx, t);
    let z = 1; chunks.forEach(k => { const u = t - k.t0; if (u >= 0 && u < .4) z += .025 * Math.pow(1 - u / .4, 2); });   // soft punch-in at each phrase
    const j = CL.j(t, 77, 1.2);
    ACC.width = W; acx.save(); acx.translate(W / 2 + j[0], H / 2 + j[1]); acx.rotate(j[2]); acx.scale(z, z); acx.translate(-W / 2, -H / 2); acx.drawImage(cv, 0, 0); acx.restore();
    if (hc) { const tmp = ACC2; tmp.width = W; const tx = tmp.getContext('2d'); tx.drawImage(ACC, 0, 0); ACC.width = W; acx.save(); acx.translate(W / 2, H / 2); acx.scale(hc.z, hc.z); acx.translate(-lerp(W / 2, hc.fx, hc.k), -lerp(H / 2, hc.fy, hc.k)); acx.drawImage(tmp, 0, 0); acx.restore(); }
  }
  async function draw(f, opt = {}) {
    const T = f / FPS, t = TLF.vOf(T), hd = TLF.holdAt(T);
    const N = opt.fast ? 1 : (opt.n || 3), shutter = .5;   // temporal supersampling = natural motion blur, smooth 30 fps motion
    MB.width = W;
    for (let k = 0; k < N; k++) {
      const ff = f + (N === 1 ? 0 : ((k + .5) / N - .5) * shutter);
      await scenePass(ff);
      mbx.globalAlpha = 1 / (k + 1); mbx.drawImage(ACC, 0, 0);
    }
    mbx.globalAlpha = 1;
    cv.width = W; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(MB, 0, 0);
    cinema(ctx, t, T, hd);
    if (!hd) captions(ctx, t); else holdOverlay(ctx, hd, T);
    if (window.G_OVERLAY) window.G_OVERLAY(ctx, t);
    ctx.save(); ctx.globalAlpha = .06; ctx.globalCompositeOperation = 'multiply'; const gq = Math.floor(T * 30); ctx.drawImage(grain, (gq % 5) * 3, (gq % 7) * 2, grain.width - 20, grain.height - 20, 0, 0, W, H); ctx.restore();
    const fb = Math.max(1 - inv(0, 0.15, T), inv(DURV - .25, DURV, T)); if (fb > 0) { ctx.fillStyle = `rgba(20,14,6,${fb})`; ctx.fillRect(0, 0, W, H); }
  }
  window.G = { draw, W, H, FPS, DURV, chunks };
  window.gReady = Promise.all([CL.logosReady, document.fonts.ready.then(() => Promise.all(['300 20px Rubik', '600 20px Rubik', '700 20px Rubik', '900 20px Rubik', '20px Bangers', '20px Secular'].map(f => document.fonts.load(f, 'אבג abc'))))]);
})();

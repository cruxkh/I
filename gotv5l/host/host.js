// HOST v5: the creator as a die-cut PAPER STICKER (photo colour, thick white outline, hard offset shadow, 12 fps boil, stepped pop-in/out).
// Footage segments are matched to the voice (see match plan): each appearance = {t0,t1,src,rate,...}. Frames: host/src/fNNNN.jpg + host/mask_rgba/fNNNN.png (540x960 matte).
(() => {
  const W = 1920, H = 1080, HFPS = 23.976;
  const APPS = [{"id": "a1", "t0": 0.0, "t1": 0.7, "src": 1202, "rate": 0.92, "x": 60, "y": 560, "z": 1.1, "rot": 12, "flip": 0, "en": [-500, 60], "sp": null, "cv": null}, {"id": "a2", "t0": 2.0, "t1": 3.05, "src": 1142, "rate": 1.0, "x": 1590, "y": 360, "z": 1.3, "rot": -4, "flip": 1, "en": [500, 300], "sp": ["?!", -290, -130, -0.12, "#FFD60A"], "cv": null}, {"id": "a3", "t0": 3.6, "t1": 4.62, "src": 789, "rate": 1.0, "x": 330, "y": 360, "z": 1.3, "rot": 3, "flip": 1, "en": [-500, 300], "sp": ["כאן!", 300, -130, 0.1, "#FF7AB8"], "cv": null}, {"id": "a4", "t0": 6.7, "t1": 7.6, "src": 1104, "rate": 1.0, "x": 1750, "y": 170, "z": 0.55, "rot": -14, "flip": 1, "en": [300, -300], "sp": ["וואו!", -190, 70, -0.1, "#FF3B30"], "cv": "T"}, {"id": "a5", "t0": 8.2, "t1": 9.0, "src": 1178, "rate": 0.92, "x": 140, "y": 880, "z": 0.62, "rot": 10, "flip": 0, "en": [-300, 300], "sp": ["מגניב", 190, -90, 0.08, "#2BC48A"], "cv": "B"}, {"id": "a6", "t0": 10.1, "t1": 11.1, "src": 1191, "rate": 0.92, "x": 1780, "y": 880, "z": 0.66, "rot": -10, "flip": 1, "en": [300, 300], "sp": ["גול!", -190, -100, -0.1, "#FFD60A"], "cv": "B"}, {"id": "a7", "t0": 13.95, "t1": 14.85, "src": 291, "rate": 0.92, "x": 170, "y": 170, "z": 0.55, "rot": -12, "flip": 0, "en": [-300, -300], "sp": ["אנימה?!", 200, 80, 0.08, "#FF7AB8"], "cv": "T"}, {"id": "a8", "t0": 19.3, "t1": 20.3, "src": 271, "rate": 0.92, "x": 1780, "y": 880, "z": 0.62, "rot": 10, "flip": 1, "en": [300, 300], "sp": ["חדש!", -190, -100, -0.08, "#1F4FFF"], "cv": "B"}, {"id": "a9", "t0": 21.0, "t1": 21.8, "src": 271, "rate": 0.92, "x": 90, "y": 540, "z": 0.95, "rot": -14, "flip": 0, "en": [-500, 0], "sp": ["חלק!", 230, -80, 0.1, "#2BC48A"], "cv": null}, {"id": "a10", "t0": 24.0, "t1": 25.5, "src": 1131, "rate": 0.92, "x": 330, "y": 350, "z": 1.35, "rot": 0, "flip": 0, "en": [0, 700], "sp": null, "cv": null}, {"id": "a11", "t0": 25.64, "t1": 26.5, "src": 1147, "rate": 0.92, "x": 1790, "y": 880, "z": 0.66, "rot": -8, "flip": 1, "en": [300, 300], "sp": ["יש!", -190, -100, -0.1, "#FF3B30"], "cv": "B"}, {"id": "f1", "t0": 30.1, "t1": 31.2, "src": 787, "rate": 1.0, "x": 1590, "y": 340, "z": 1.3, "rot": 4, "flip": 0, "en": [600, 200], "sp": null, "cv": null}, {"id": "f2", "t0": 31.2, "t1": 32.6, "src": 1147, "rate": 0.92, "x": 330, "y": 340, "z": 1.35, "rot": -4, "flip": 1, "en": [-600, 200], "sp": null, "cv": null}, {"id": "f3", "t0": 32.6, "t1": 34.2, "src": 275, "rate": 0.92, "x": 1590, "y": 350, "z": 1.3, "rot": 5, "flip": 0, "en": [600, 0], "sp": null, "cv": null}, {"id": "f4", "t0": 34.2, "t1": 35.5, "src": 1140, "rate": 1.08, "x": 330, "y": 340, "z": 1.35, "rot": -5, "flip": 1, "en": [-500, 200], "sp": ["!", 280, -190, 0.1, "#FFD60A"], "cv": null}, {"id": "f5", "t0": 35.5, "t1": 36.9, "src": 1149, "rate": 1.0, "x": 1590, "y": 330, "z": 1.4, "rot": 0, "flip": 0, "en": [600, 200], "sp": null, "cv": null}];
  const RANGES = [[271, 314], [358, 367], [787, 812], [1102, 1219]];
  const PRES = []; RANGES.forEach(([a, b]) => { for (let i = a; i <= b; i++) PRES.push(i); });   // 308,794,807,1106,1199,1207 may be missing: nearest is used
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const EXIST = new Set([271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,309,310,311,312,313,314].concat(range(358, 367), range(787, 793), range(795, 806), range(808, 812), range(1102, 1105), range(1107, 1198), range(1200, 1206), range(1208, 1219)));
  function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
  const fixIdx = (i, hi) => { i = Math.min(i, hi); if (EXIST.has(i)) return i; for (let d = 1; d < 5; d++) { if (EXIST.has(i - d)) return i - d; if (EXIST.has(i + d)) return i + d; } return i; };
  const hiOf = s => (RANGES.find(([a, b]) => s >= a && s <= b) || [0, s])[1];
  const frameIdx = (a, t) => fixIdx(a.src + Math.floor(clamp(t - a.t0, 0, a.t1 - a.t0) * HFPS * a.rate + 1e-6), hiOf(a.src));

  // ---------- cache of processed stickers (LRU)
  const LRU = new Map(), LOADING = new Map(), MAXC = 28;
  const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const scratch = mk(540, 960), sx = scratch.getContext('2d', { willReadFrequently: true }), mscr = mk(540, 960), mx = mscr.getContext('2d', { willReadFrequently: true });
  function build(idx) {
    if (LRU.has(idx)) { const e = LRU.get(idx); LRU.delete(idx); LRU.set(idx, e); return Promise.resolve(e); }
    if (LOADING.has(idx)) return LOADING.get(idx);
    const nm = String(idx).padStart(4, '0');
    const p = Promise.all([loadImg(`host/src/f${nm}.jpg`), loadImg(`host/mask_rgba/f${nm}.png`)]).then(([im, mk2]) => {
      LOADING.delete(idx); if (!im || !mk2) return null;
      sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, 540, 960); sx.filter = 'contrast(1.1) saturate(1.28) brightness(1.03)'; sx.drawImage(im, 0, 0, 540, 960); sx.filter = 'none';
      mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, 540, 960); mx.drawImage(mk2, 0, 0, 540, 960);
      const a = sx.getImageData(0, 0, 540, 960), m = mx.getImageData(0, 0, 540, 960), d = a.data, md = m.data;
      for (let i = 0; i < d.length; i += 4) { const v = (md[i + 3] - 80) * 4.2; d[i + 3] = v < 0 ? 0 : v > 255 ? 255 : v; }    // hardened die-cut alpha
      const S = mk(540, 960); S.getContext('2d').putImageData(a, 0, 0);
      const e = { S, sil: {} }; LRU.set(idx, e); while (LRU.size > MAXC) LRU.delete(LRU.keys().next().value); return e;
    });
    LOADING.set(idx, p); return p;
  }
  const silOf = (e, col) => e.sil[col] || (e.sil[col] = (() => { const c = mk(540, 960), g = c.getContext('2d'); g.drawImage(e.S, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 540, 960); return c; })());

  const active = t => APPS.filter(a => t >= a.t0 && t < a.t1 + .3);
  async function prepare(t) {
    const need = new Set();
    for (const a of APPS) {
      if (t >= a.t0 - .6 && t < a.t1 + .3) { for (const dt of [0, 1 / 24, 2 / 24, 4 / 24, 7 / 24, 11 / 24]) need.add(frameIdx(a, Math.max(t + dt, a.t0))); }
    }
    const list = [...need]; const first = list.filter(i => APPS.some(a => t >= a.t0 - .05 && t < a.t1 + .3 && frameIdx(a, t) === i));
    await Promise.all(first.map(build)); list.forEach(i => { build(i); });
  }

  // ---------- stepped animation tables
  const ENT = [1, .62, .3, .1, -.05, .02, 0], ENS = [.5, .85, 1.14, .96, 1.04, 1, 1], EXT = [0, .12, .4, .9, 1.4];
  function anim(a, t) {
    const q = CL.q(t, 12), n = Math.round((q - a.t0) * 12), dur = a.t1 - a.t0, m = Math.round((a.t1 - q) * 12);
    let off = 0, sc = 1;
    if (n < ENT.length) { off = ENT[Math.max(0, n)]; sc = ENS[Math.max(0, n)]; }
    if (m <= 0) { const k = Math.min(EXT.length - 1, -m); off = EXT[k] + (k === 0 ? 0 : 0); sc = 1 - k * .04; }
    return { off, sc, vis: !(m < -4) && n >= 0 };
  }

  function speech(ctx, a, t, cx, cy, sc) {
    if (!a.sp) return; const [txt, ox, oy, rot, fill] = a.sp, p = CL.pop(t, a.t0 + .32, .3); if (p <= 0 || t > a.t1 - .05) return;
    const jt = CL.j(t, a.t0 * 3 + 5, 3), x = cx + ox + jt[0], y = cy + oy + jt[1];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot + jt[2]); ctx.scale(p, p);
    const size = 62; ctx.font = `900 ${size}px Rubik`; ctx.direction = 'rtl'; const w = ctx.measureText(txt).width + 70, h = size * 1.35;
    // tail toward the head
    const dx = -ox, dy = -oy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.moveTo(-20 + 8, 10 + 12); ctx.lineTo(ux * 110 + 8, uy * 110 + 12); ctx.lineTo(24 + 8, 10 + 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-24 - 4, 6); ctx.lineTo(ux * 118, uy * 118); ctx.lineTo(28 + 4, 6); ctx.fill();
    CL.scrap(ctx, 0, 0, w, h, { fill, seed: (a.t0 * 7 | 0) + 2, rough: 4, shadow: 9 });
    ctx.fillStyle = fill === '#1F4FFF' || fill === '#FF3B30' ? '#fff' : CL.C.ink; ctx.font = `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, size * .04);
    ctx.restore();
  }

  function drawOne(ctx, a, t) {
    const idx = frameIdx(a, t), e = LRU.get(idx); if (!e) return;
    const an = (window.HANCH && (HANCH[idx] || HANCH[fixIdx(idx, 9999)])) || [.5, .25, .5];
    const st = anim(a, t); if (!st.vis) return;
    const jt = CL.j(t, a.t0 * 5 + 1, 4), fx = a.flip ? -1 : 1, s = 2 * a.z * an[2] * st.sc;
    const cx = a.x + a.en[0] * st.off + jt[0], cy = a.y + a.en[1] * st.off + jt[1], rot = a.rot * Math.PI / 180 + a.en[0] * st.off * .0004 + jt[2] * 1.6;
    const B = 13, R = B / s;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s * fx, s); ctx.translate(-an[0] * 540, -an[1] * 960);
    // hard offset shadow of the outlined silhouette
    const dark = silOf(e, '#3a2200'), white = silOf(e, '#ffffff'), so = 16 / s;
    ctx.globalAlpha = .34; for (let i = 0; i < 16; i++) { const g = i / 16 * Math.PI * 2; ctx.drawImage(dark, Math.cos(g) * R + so * .75 * fx, Math.sin(g) * R + so * 1.2); } ctx.globalAlpha = 1;
    for (let i = 0; i < 16; i++) { const g = i / 16 * Math.PI * 2; ctx.drawImage(white, Math.cos(g) * R, Math.sin(g) * R); }
    ctx.drawImage(e.S, 0, 0);
    ctx.restore();
    // paper scrap he hides behind (bottom corners / top corners), tape on cameos
    if (a.cv && st.off < .7) {
      const p = CL.pop(t, a.t0 - .02, .22) || 1;
      if (a.cv === 'B') CL.scrap(ctx, a.x + (a.x < 960 ? -20 : 20) + jt[0] * .5, 1085, 420, 190, { fill: a.x < 960 ? CL.C.yellow : CL.C.blue, seed: (a.t0 * 3 | 0) + 1, rot: a.x < 960 ? -.05 : .05, scale: p });
      if (a.cv === 'T') { CL.scrap(ctx, a.x, a.y + 390 * a.z, 460 * a.z + 60, 340 * a.z, { fill: CL.C.pink, seed: 7, rot: a.rot * .01, scale: p }); CL.tape(ctx, a.x - 100, a.y + 260 * a.z, -.3, 110, 36); CL.tape(ctx, a.x + 110, a.y + 265 * a.z, .35, 110, 36); }

    }
    if (a.t1 - a.t0 < 1.2) { /* cameos get a tape piece on the top corner */ const tp = CL.pop(t, a.t0 + .15, .2); if (tp > 0 && st.off < .3 && !a.cv) CL.tape(ctx, cx - 20 * fx, cy - 230 * a.z, -.5, 140 * tp, 44); }
    speech(ctx, a, t, a.x, a.y, st.sc);
  }
  function overlay(ctx, t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (const a of active(t)) drawOne(ctx, a, t);
    ctx.restore();
  }
  window.HOST = { prepare, overlay, APPS };
})();

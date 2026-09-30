// HOST: the real host woman (client video, matted into a die-cut sticker by host/matte.py + host/sticker.py, frames host/sticker/fNNNN.png = original video seconds 3.0 to 9.9,
// where she is alone). She pops into the side margins / rises from the bottom edge on the words (APPS), jelly pop + idle bob, 30 fps forward playback of a clip segment.
//   window.HOST = { async prepare(t), overlay(ctx, t) }.  Everything is a pure function of the OUTPUT clock T (A.T) ; word times converted with TLF.TofV.
(() => {
  const { clamp, lerp, ease } = A, PI = Math.PI, W = 1920, H = 1080, sin = Math.sin, cos = Math.cos;
  const PADX = 44, PADT = 44, FW = 468, FH = 832, CW = 556, CH = 966, NF = 207, BASE = H + 30;   // sticker canvas geometry; anchor = bottom centre of the video frame
  const cache = new Map();
  const load = fi => { let e = cache.get(fi); if (!e) { const im = new Image(); e = { im, ok: false, use: 0 }; e.p = new Promise(r => { im.onload = () => { e.ok = true; r(); }; im.onerror = () => r(); }); im.src = 'host/sticker/f' + String(fi).padStart(4, '0') + '.png'; cache.set(fi, e); } return e; };
  let tick = 0;
  const q = d => d < 0 ? 0 : Math.exp(-d * 6.5) * cos(d * 22);
  const bounceH = (tt, t0, dur, h) => { const u = (tt - t0) / dur; return u > 0 && u < 1 ? h * 4 * u * (1 - u) : 0; };

  // ------------------------------------------------------------------ APPEARANCES (t0 = word start on the voice clock; other times in output seconds relative to it)
  // side 'L'|'R', x = anchor x of the frame's bottom centre, size = displayed height of the video frame, f0/lo/hi = clip frames (1..207, played forward at 30 fps, ping-pong inside lo..hi)
  // mode 'side' slides in from the screen edge, 'rise' comes up from the bottom edge. hops [[t,dur,h]], pops [t] = jelly pulses.
  const APPS = [
    { id: 'peek', t0: .12, mode: 'side', side: 'L', x: 110, size: 600, f0: 1, lo: 1, hi: 45, inDur: .35, stay: 1.5, out: .3, pops: [.62], hops: [[.6, .34, 50]] },                      // CUE 0.12 peek-in ; CUE 0.74 gasp
    { id: 'wow', t0: 2.36, mode: 'side', side: 'R', x: 1790, size: 680, f0: 19, lo: 19, hi: 60, inDur: .3, stay: .95, out: .28, hops: [[.18, .3, 50]] },                            // CUE 2.36 wow
    { id: 'netflix', t0: 4.36, mode: 'side', side: 'L', x: 190, size: 700, f0: 46, lo: 46, hi: 90, inDur: .34, stay: 1.05, out: .28, hops: [[.12, .38, 60], [.5, .38, 60]] },       // CUE 4.36 cheer
    { id: 'disney', t0: 6.06, mode: 'side', side: 'R', x: 1740, size: 660, f0: 91, lo: 91, hi: 135, inDur: .3, stay: .85, out: .26, pops: [.05] },                                  // CUE 6.06 point
    { id: 'charlton', t0: 8.36, mode: 'rise', side: 'L', x: 130, size: 470, f0: 136, lo: 136, hi: 207, inDur: .3, stay: 1.75, out: .28, pops: [.05] },                              // CUE 8.36 small corner peek (cin hold)
    { id: 'turk', t0: 9.215, mode: 'rise', side: 'R', x: 1745, size: 720, f0: 140, lo: 136, hi: 207, inDur: .3, stay: 1.6, out: .2, pops: [.05] },                                    // CUE 9.215 crying (tur hold)
    { id: 'bolly', t0: 10.345, mode: 'side', side: 'L', x: 130, size: 600, f0: 19, lo: 19, hi: 90, inDur: .3, stay: 1.72, out: .22, pops: [.05] },                                    // CUE 10.345 surprised in the corner (ind hold)
    { id: 'israel', t0: 12.17, mode: 'side', side: 'R', x: 1770, size: 640, f0: 100, lo: 100, hi: 140, inDur: .3, stay: .95, out: .26, pops: [.05] },                                // CUE 12.17 live
    { id: 'vortex', t0: 13.815, mode: 'side', side: 'L', x: 230, size: 620, f0: 28, lo: 28, hi: 70, pre: .42, inDur: .3, stay: .12, out: .55, spiral: true },                           // CUE 13.815 sucked into the vortex TV
    { id: 'thumb', t0: 14.89, mode: 'side', side: 'L', x: 170, size: 700, f0: 46, lo: 46, hi: 90, inDur: .3, stay: .42, out: .26, pops: [.05] },                                     // CUE 14.89 thumbs up beat
    { id: 'update', t0: 15.98, mode: 'side', side: 'L', x: 180, size: 620, f0: 100, lo: 100, hi: 135, inDur: .3, stay: 1.15, out: .26, hops: [[0, .3, 60], [.35, .28, 40], [.875, .28, 40]] }, // CUE 15.98 ; bounces on 16.33 16.855
    { id: 'goal', t0: 18.295, mode: 'side', side: 'R', x: 1750, size: 720, f0: 172, lo: 172, hi: 207, inDur: .3, stay: .8, out: .22, hops: [[.08, .36, 80], [.44, .36, 80]] },  // CUE 18.295 goal
    { id: 'waiting', t0: 19.58, mode: 'side', side: 'L', x: 110, size: 600, f0: 136, lo: 136, hi: 170, inDur: .25, stay: .95, out: .26 },                                              // CUE 19.58 waiting
    { id: 'discover', t0: 21.58, mode: 'side', side: 'R', x: 1770, size: 650, f0: 55, lo: 55, hi: 90, inDur: .3, stay: 1.1, out: .26, hops: [[.1, .3, 50], [.4, .3, 50]] },        // CUE 21.58 discover
    { id: 'nosearch', t0: 23.29, mode: 'side', side: 'L', x: 180, size: 680, f0: 154, lo: 136, hi: 207, inDur: .3, stay: 1.15, out: .26, pops: [.05] },                              // CUE 23.29 no
    { id: 'remote', t0: 26.055, mode: 'side', side: 'R', x: 1760, size: 680, f0: 19, lo: 19, hi: 60, inDur: .32, stay: 1.05, out: .26, pops: [.0] },                                   // CUE 26.055 remote press
    { id: 'finale', t0: 27.6, mode: 'rise', side: 'L', x: 140, size: 520, f0: 100, lo: 100, hi: 135, inDur: .3, stay: 99, out: .3, pops: [.0] },                                     // CUE 27.6 finale (end card, bottom-left corner)
  ];
  APPS.forEach(a => { a.T0 = TLF.TofV(a.t0); a.pre = a.pre || a.inDur; a.ts = a.T0 - a.pre; a.te = a.T0 + a.stay + a.out; });
  const frameAt = (a, T) => { const L = Math.max(1, a.hi - a.lo), pos = (a.f0 - a.lo) + Math.max(0, T - a.ts) * 30, m = ((pos % (2 * L)) + 2 * L) % (2 * L); return clamp(Math.round(a.lo + (m <= L ? m : 2 * L - m)), 1, NF); };

  function track(a, T) {   // base position of the frame's bottom centre
    const tt = T - a.T0, ei = clamp((tt + a.pre) / a.pre), eo = clamp((tt - a.stay) / a.out), ent = ease.outBack(ei), ex = a.spiral ? eo * eo * (3 - 2 * eo) : ease.inBack(eo), s = a.side === 'L' ? -1 : 1;
    const off = a.mode === 'rise' ? 0 : (a.side === 'L' ? -(a.size * .5 + 200) - a.x : W + a.size * .5 + 200 - a.x);
    let x = a.x + off * (1 - ent) + (a.mode === 'side' ? off * ex : 0), y = BASE + (a.mode === 'rise' ? (a.size + 160) * ((1 - ent) + ex) : 0);
    let lean = a.mode === 'side' ? s * .2 * ((1 - ent) + ex) : 0;
    if (a.spiral && eo > 0) { const r = 1 - ex, an = ex * 5; x = lerp(a.x, 960, ex) + sin(an) * 110 * r; y = lerp(BASE, 620, ex) - (1 - cos(an)) * 60 * r; lean = ex * 7; }
    return [x, y, ei, eo, lean];
  }
  // the compositor pushes the camera in during ALL holds (genre + beat holds); window.HOLDCAM(T) = {fx,fy,z,k} of the applied push-in. She is camera-locked: undo that zoom.
  function cam(T) { const c = window.HOLDCAM && window.HOLDCAM(T); if (!c || c.k <= 0) return null; return { z: c.z, fx: lerp(W / 2, c.fx, c.k), fy: lerp(H / 2, c.fy, c.k) }; }
  // possible output times for a voice time t (in a hold t is frozen and T runs)
  function tRange(t) { let acc = 0, lo = t, hi = t; for (const h of TLF.HOLDS) { if (h.v < t - 1e-6) acc += h.d; else if (Math.abs(h.v - t) < 1e-6) { lo = t + acc; hi = t + acc + h.d; return [lo - .08, hi + .08]; } } return [t + acc - .08, t + acc + .08]; }

  window.HOST = {
    APPS, track,
    async prepare(t) {
      const [a0, a1] = tRange(t), need = new Set(); tick++;
      for (const a of APPS) { if (a1 < a.ts || a0 > a.te) continue; for (let T = Math.max(a0, a.ts); T <= Math.min(a1, a.te) + .034; T += 1 / 60) need.add(frameAt(a, T)); }
      const ps = []; need.forEach(fi => { const e = load(fi); e.use = tick; ps.push(e.p); }); await Promise.all(ps);
      if (cache.size > 120) [...cache.entries()].sort((x, y) => x[1].use - y[1].use).slice(0, cache.size - 100).forEach(([k]) => cache.delete(k));
    },
    overlay(ctx, t) {
      const T = (typeof A.T === 'number') ? A.T : t, cm = cam(T);
      for (const a of APPS) {
        if (T < a.ts || T > a.te) continue;
        const tt = T - a.T0, [x, y, ei, eo, lean] = track(a, T), [xp, yp] = track(a, T - .04), vx = (x - xp) / .04;
        const e = cache.get(frameAt(a, T)); if (!e || !e.ok) continue;
        let dy = 0, sq = 0; (a.hops || []).forEach(([h0, d, h]) => { dy -= bounceH(tt, h0, d, h); sq += q(tt - (h0 + d)) * (tt > h0 + d ? 1 : 0) - .5 * sin(PI * clamp((tt - h0) / d)) * (tt > h0 && tt < h0 + d ? 1 : 0); });
        (a.pops || []).forEach(p0 => { sq += q(tt - p0) * .8; });
        const fl = (ei < 1 ? sin(PI * ei) : 0) + eo * .6, lq = q(tt) * (tt > 0 && tt < 1.2 ? 1 : 0), alpha = a.spiral ? 1 - clamp((tt - .45) / .2) : 1;
        const sx = (1 - .04 * fl + .06 * lq + .05 * sq) * (a.spiral ? 1 - .9 * ease.in(clamp((tt - .12) / .55)) : 1), sy = (1 + .05 * fl - .08 * lq - .07 * sq) * (a.spiral ? 1 - .9 * ease.in(clamp((tt - .12) / .55)) : 1);
        const bob = sin(T * 2.6 + a.T0) * 4, rot = lean + sin(T * 1.7 + a.T0) * .012 + clamp(vx / 12000, -.08, .08), sc = a.size / FH;
        ctx.save(); ctx.globalAlpha *= alpha; if (cm) { ctx.translate(cm.fx - W / 2 / cm.z, cm.fy - H / 2 / cm.z); ctx.scale(1 / cm.z, 1 / cm.z); }
        ctx.translate(x, y + dy + bob); ctx.rotate(rot); ctx.scale(sx, sy); ctx.drawImage(e.im, -(PADX + FW / 2) * sc, -(PADT + FH) * sc, CW * sc, CH * sc);
        ctx.restore();
      }
    },
  };
})();

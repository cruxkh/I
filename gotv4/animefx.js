// ============================================================================
// animefx.js : global ANIME dressing on top of the whole film + anime cel grade for the host photo.
//   window.ANIMEFX = { overlay(ctx, T, v), gradeHost(ctx, img, W, H), hostAnime, cfg }
//   overlay: called by main.js after every scene (T = output time, v = VO clock, frozen in holds).
//   gradeHost: draws `img` (portrait photo) into ctx at (0,0,W,H) with posterised cel tones, ink lines and shadow halftone.
//              ANIMEFX.hostAnime = false -> plain drawImage.  ANIMEFX.hostOpts = {levels, sat, ink, dots} to tweak.
//   cfg switches: cfg.interludeDon (kana DON + impact at anime interlude start), cfg.wipes, cfg.marks, cfg.holdFx, cfg.impacts, cfg.kana
// ============================================================================
(() => {
  const W = 1080, H = 1920;
  const { clamp, lerp, hash, ease } = A;
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const cfg = { interludeDon: true, wipes: true, marks: true, holdFx: true, impacts: true, kana: true, halftone: true };
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- schedule (built lazily: needs TLF)
  let S = null;
  function build() {
    const Tv = v => TLF.TofV(v), holds = TL.holds, an = holds.find(h => /ANIME/i.test(h.label)), logo = holds.find(h => /GOTV logo/i.test(h.label));
    const a = window.V.anime;
    S = { impacts: [], kana: [], wipes: [], marks: [] };
    // impact frames (3 frames each)
    [3.05, 14.0, 25.61, 29.28].forEach(v => S.impacts.push({ T: Tv(v), mode: 'invert', cx: 540, cy: 900 }));
    if (an) S.impacts.push({ T: an.T0, mode: 'lines', cx: 540, cy: 900, interlude: true });
    // katakana SFX (positions avoid the caption zone y 1230-1480 and the centre logo)
    S.kana.push({ T: Tv(25.61) + .03, text: 'ドン', x: 285, y: 340, size: 250, rot: -.16, color: a.SFX.gold, dur: 1.0 });
    S.kana.push({ T: Tv(29.28) + .03, text: 'パァァ', x: 770, y: 400, size: 190, rot: .12, color: a.SFX.pink, dur: 1.1 });
    if (logo) S.kana.push({ T: logo.T0 + .1, text: 'キラキラ', x: 330, y: 300, size: 118, rot: -.1, color: a.SFX.ice, dur: 1.1 });
    if (an) S.kana.push({ T: an.T0 + .02, text: 'ドン', x: 540, y: 400, size: 330, rot: -.06, color: a.SFX.hot, dur: 1.0, interlude: true });
    // manga panel-slam wipes at the main scene cuts (0.24 s, cut at the middle). 25.61 has its impact frames instead.
    [4.97, 9.02, 12.0, 15.81, 20.64, 30.12].forEach((v, i) => S.wipes.push({ T: Tv(v) - .12, dir: i % 2 ? -1 : 1 }));
    // reaction marks [v, kind, x, y, s, extra]
    S.marks = [[1.2, 'exclaim', 905, 330, 1.0, { kind: '!?' }], [9.5, 'sweat', 900, 300, .95], [19.15, 'exclaim', 895, 320, .95, { kind: '!' }], [24.35, 'sweat', 170, 340, 1.0], [24.9, 'exclaim', 905, 400, .9, { kind: '?' }], [12.6, 'anger', 170, 300, .8], [31.0, 'glint', 900, 280, 90]]
      .map(m => ({ T: Tv(m[0]), kind: m[1], x: m[2], y: m[3], s: m[4], o: m[5] || {} }));
    S.holds = holds;
  }

  // ---------------------------------------------------------------- overlay
  function overlay(ctx, T, v) {
    if (!window.V || !V.anime || !window.TLF) return;
    if (!S) build();
    const a = V.anime, hd = (A.H && typeof A.H === 'object') ? A.H : null, inter = hd && hd.kind === 'interlude';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';

    // (a) subtle screen-tone in the corners
    if (cfg.halftone) {
      a.halftone(ctx, 0, 0, W, H, { size: 20, gradient: 'radial', inset: .55, color: '#000a1e', alpha: inter ? .07 : .13 });
      a.halftone(ctx, 0, 0, W, 430, { size: 24, angle: .5, gradient: 'linear', dir: [0, -1], color: '#ffffff', alpha: .045, gmax: .8, key: 'top' });
    }

    // (b) holds: pulsing focus lines + slow sparkles + sakura, all faded to nothing at both ends of the hold (frozen picture stays alive)
    if (cfg.holdFx && hd && hd.kind === 'hold') {
      const e = Math.pow(Math.sin(Math.PI * clamp(hd.u / hd.dur)), .8), pulse = .75 + .25 * Math.sin(hd.u * 11);
      a.speedLines(ctx, 540, 820, hd.u, { n: 56, inner: 430, outer: 1500, thickness: 11, alpha: .3 * e * pulse, seed: hd.i + 1, fps: 10 });
      ctx.save(); ctx.globalAlpha = e; a.sakura(ctx, hd.u + 1.5, { n: 9, wind: 1, alpha: .8, seed: hd.i + 3, size: .9, area: [0, 0, W, 1250] }); ctx.restore();
      for (let k = 0; k < 4; k++) { const ph = (hd.u * .8 + k * .27 + hash(hd.i * 5 + k)) % 1, seed = hd.i * 7 + k + Math.floor(hd.u * .8 + k * .27 + hash(hd.i * 5 + k)); const gx = 120 + hash(seed * 1.3) * 840, gy = 260 + hash(seed * 2.9) * 880; a.glint(ctx, gx, gy, 46 + 30 * hash(seed + 4), ph, { rot: hash(seed) * .5 }); }
    }

    // (f) reaction marks
    if (cfg.marks) for (const m of S.marks) { const u = (T - m.T) / .9; if (u < 0 || u > 1) continue; if (m.kind === 'exclaim') a.exclaim(ctx, m.x, m.y, m.s, u, m.o); else if (m.kind === 'sweat') a.sweat(ctx, m.x, m.y, m.s, u); else if (m.kind === 'anger') a.anger(ctx, m.x, m.y, m.s, u); else if (m.kind === 'glint') a.glint(ctx, m.x, m.y, m.s, u, { rot: .2 }); }

    // (c) impact frames (invert everything drawn so far), then (d) SFX on top
    let imp = false;
    if (cfg.impacts) for (const im of S.impacts) { if (im.interlude && !cfg.interludeDon) continue; if (a.impact(ctx, T, im.T, im)) imp = true; }
    if (cfg.kana) {
      for (const k of S.kana) { if (k.interlude && !cfg.interludeDon) continue; a.kana(ctx, k.text, k.x, k.y, k.size, { t: T, t0: k.T, rot: k.rot, color: k.color, dur: k.dur }); }
      // GOD INTRO rumble ゴゴゴ (T 0-6), trembling at the top, faded in/out
      if (T < 6.4) { const al = sm(.3, 1, T) * (1 - sm(5.3, 6.2, T)) * .5; if (al > .01) { ctx.save(); a.kana(ctx, 'ゴゴゴ', 540 + Math.sin(T * 47) * 4, 150 + Math.cos(T * 39) * 3 - T * 3, 130, { alpha: al, rot: Math.sin(T * 31) * .012, color: ['#FFF3C4', '#E4A02A'] }); ctx.restore(); } }
    }

    // (e) panel-slam wipes
    if (cfg.wipes) for (const w of S.wipes) if (T >= w.T && T < w.T + .26) a.panel(ctx, T, w.T, w.dir, { dur: .24, width: 240 });
    ctx.restore();
  }

  // ---------------------------------------------------------------- host cel grade
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const GW = 540, GH = 960, SC = mk(GW, GH), sx = SC.getContext('2d', { willReadFrequently: true }), LUM = new Float32Array(GW * GH), OUT = mk(GW, GH), ox = OUT.getContext('2d');
  const cache = new Map();
  function gradeHost(ctx, img, Wd = W, Hd = H) {
    if (!ANIMEFX.hostAnime) { ctx.drawImage(img, 0, 0, Wd, Hd); return; }
    const key = img.currentSrc || img.src || img; let hit = cache.get(key);
    if (!hit) {
      const o = Object.assign({ levels: 5, sat: 1.7, ink: 1, dots: 1, blur: 1.4, inkLo: .2, inkHi: .55 }, ANIMEFX.hostOpts || {});
      sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, GW, GH);
      sx.filter = `blur(${o.blur}px) contrast(1.1) saturate(1.15)`; sx.drawImage(img, 0, 0, GW, GH); sx.filter = 'none';
      const id = sx.getImageData(0, 0, GW, GH), d = id.data, N = GW * GH;
      for (let i = 0, p = 0; i < N; i++, p += 4) LUM[i] = (d[p] * .299 + d[p + 1] * .587 + d[p + 2] * .114) / 255;
      const hist = new Uint32Array(256); for (let i = 0; i < N; i += 3) hist[(LUM[i] * 255) | 0]++;
      let acc = 0, lo = 0, hi = 255; const tot = N / 3; for (let k = 0; k < 256; k++) { acc += hist[k]; if (acc > tot * .02) { lo = k; break; } } acc = 0; for (let k = 255; k >= 0; k--) { acc += hist[k]; if (acc > tot * .03) { hi = k; break; } }
      const l0 = lo / 255, l1 = Math.max(l0 + .1, hi / 255), NL = o.levels, INK = [26, 19, 52];
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const i = y * GW + x, p = i * 4, L0 = LUM[i], L = Math.pow(clamp((L0 - l0) / (l1 - l0)), .85);
        // edge (sobel on luma)
        let ink = 0;
        if (o.ink && x > 0 && y > 0 && x < GW - 1 && y < GH - 1) {
          const a0 = LUM[i - GW - 1], a1 = LUM[i - GW], a2 = LUM[i - GW + 1], b0 = LUM[i - 1], b2 = LUM[i + 1], c0 = LUM[i + GW - 1], c1 = LUM[i + GW], c2 = LUM[i + GW + 1];
          const gx = (a2 + 2 * b2 + c2) - (a0 + 2 * b0 + c0), gy = (c0 + 2 * c1 + c2) - (a0 + 2 * a1 + a2), m = Math.sqrt(gx * gx + gy * gy);
          ink = m <= o.inkLo ? 0 : m >= o.inkHi ? 1 : (m - o.inkLo) / (o.inkHi - o.inkLo);
          ink = ink * ink * (3 - 2 * ink) * o.ink;
        }
        // posterise luma (soft steps)
        const t = L * NL, f = Math.min(NL - 1, Math.floor(t)), fr = t - f, s1 = fr < .4 ? 0 : fr > .6 ? 1 : (fr - .4) / .2, band = f + s1 * s1 * (3 - 2 * s1);
        const q = clamp(band / (NL - 1) * .96 + .02), ratio = (q + .05) / (L0 + .05);
        let r = d[p] * ratio, g = d[p + 1] * ratio, b = d[p + 2] * ratio;
        const gr = q * 255; r = gr + (r - gr) * o.sat; g = gr + (g - gr) * o.sat; b = gr + (b - gr) * o.sat;
        if (band < 1.2) { r *= .86; g *= .9; b *= 1.18; } else if (band < 2.2) { r *= .95; g *= .97; b *= 1.07; } else if (band > NL - 1.7) { r *= 1.05; g *= 1.02; b *= .96; }
        // shadow screen-tone dots
        if (o.dots && L < .38) {
          const uu = (x + y) * .7071, vv = (x - y) * .7071, S6 = 5, fu = ((uu % S6) + S6) % S6 / S6 - .5, fv = ((vv % S6) + S6) % S6 / S6 - .5, rr = .5 * Math.sqrt((.36 - L) / .36);
          if (fu * fu + fv * fv < rr * rr * .72) { r *= .7; g *= .72; b *= .82; }
        }
        if (ink > 0) { r += (INK[0] - r) * ink * .92; g += (INK[1] - g) * ink * .92; b += (INK[2] - b) * ink * .92; }
        d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
      }
      ox.putImageData(id, 0, 0);
      hit = mk(GW, GH); hit.getContext('2d').drawImage(OUT, 0, 0); cache.set(key, hit); if (cache.size > 6) cache.delete(cache.keys().next().value);
    }
    ctx.save(); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(hit, 0, 0, Wd, Hd); ctx.restore();
  }

  window.ANIMEFX = { overlay, gradeHost, hostAnime: true, hostOpts: null, cfg };
})();

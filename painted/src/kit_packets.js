// =====================================================================================================================
// kit_packets.js · the packet cast (painted edition): Bit, commuter packets, the rival brands, the cat-video packet, the
// shark and the queue sign. Picture-book watercolour: flat wash + boiling ink, big readable shapes.
//
// CONVENTIONS (every function)
//   (x, y)   ground point between the feet (bottom centre), except shark (body centre) and queueSign (box centre).
//   s        scale. Internally u = 12·s px. Natural sizes at s = 1:
//              bit ≈ 125 px wide × 115 px tall (legs incl.)      packet ≈ 100 × 90       brandPacket ≈ 115 × 105 (+ prop)
//              catPacket ≈ 160 × 150 (+ ears)                     shark ≈ 660 px long     queueSign ≈ 560 × 180 (+ counter)
//            Medium shot: bit s ≈ 2–3; close-up s ≈ 5–8. Crowd packets s ≈ .5–1.3.
//   o.t      time (default: global T). Idle motion, blinks, swings and boil all come from it (pure function of t).
//   o.mood   see each character. Mood CHANGES must act: build them with packMoods() (below) and spread the result in.
//   o.sq     squash (+) / stretch (−), volume-preserving; pivots at the feet.   o.dy  lift in u (− = up).
//   o.dx     shift in u.   o.rot  lean in radians (world, pivots at the feet; + = clockwise).   o.flip  face left.
//   o.lookX, o.lookY  (−1..1) pupils + a little face shift.   o.squint 0..1 (eyes close; packMoods sets it).
//   o.emote  override the mood's emote (any clawd.js emote name, or null for none); o.emoteK 0..1 pop; o.emoteAge (s).
//   o.mouth  number 0..1 = talking openness (default mouthOf(<speaker>, t) where there is a speaker), or a mouth shape
//            name ('smile' 'flat' 'side' 'smirk' 'frown' 'wobble' 'o' 'O' 'grit' 'big' 'wail' 'laugh' 'pant' 'tongue' 'cat').
//   o.haze   0..1 mixes the colours toward o.hazeCol (default a tunnel indigo) for depth in crowds (farther = hazier).
//   o.boilKey stable id for boil seeds (default: call order). Set it when characters come and go mid-shot.
//   o.noShadow  skip the ground shadow.
//   o.flush  (default true) tags/labels use letter(); the kit flushes letters right after each tag so things painted
//            later (a packet in front) cover it. Pass false in big crowds of tagged characters if you draw no occluders.
//   NOTE: tag text is placed in world space; draw these characters with x, y, s (and the camera), not inside your own
//   push()/translate()/scale(), or the tag lettering will land in the wrong place.
//
// packMoods(t, keys, o) → { mood, squint, sq, dy, emoteK, emoteAge, moodAge, ...keyOverrides }
//   keys = [[t0, 'bored'], [t1, 'panic', { lookX: .8 }], ...] (times in the same clock as t). Like clawd's emotions():
//   the eyes squeeze and the body squashes just before each change (anticipation), the face swaps under the squint,
//   then a take (squash-stretch sized to the new mood) fires and the new mood's emote pops. o.take scales every take.
//   Spread it and ADD your own sq/dy:  const m = packMoods(t, keys); bit(x, y, 2, { ...m, sq: m.sq + hop.sq, dy: m.dy + hop.dy })
//
// bit(x, y, s, o) · the hero: chubby glowing golden GOTV envelope, big eyes + brows, stubby limbs, blue sneakers,
//   football stamp (front, lower right), luggage tag "#5401 / GOAL" swinging from the top-left corner.
//   o.mood   determined (default) | panic | cheeky | joy | bored (eye roll) | laugh | exhausted | tongue (nyah!)
//   o.limbs  stand (default) | run | fly | flop | armsUp | crouch.  o.phase = run/walk cycle phase (default t·2.4).
//   o.back   seen from behind (chase cam): flap V + red wax seal, tag on the other corner, soles kick up when running.
//   o.vel    [vx, vy] px/s in world: stretch along the motion + a comet light-trail behind (sparkles, speed dashes).
//   o.boost  0..1: flame aura + big light (the BOOST).   o.glow 0..2 halo strength (default .75; shows on dark grounds).
//   o.wink   0..1 closes his near (right) eye.   o.tag false hides the tag.   o.tagSwing adds to the tag's swing (rad).
//   o.mouth  default mouthOf('BIT', t).
//
// packet(x, y, s, o) · generic commuter packet (cheap: ~8–12 paint calls; fine in crowds of 20–40).
//   o.kind   mail | video | meme | update | shop | photo | music (colour + little painted icon on its forehead badge)
//   o.seed   varies colour/shape/timing (default: derived from kind + x).
//   o.mood   bored (default) | annoyed | sleep | shock (+ neutral).   o.honk 0..1: shouting mouth + burst (front) /
//            flashing tail lights (back).   o.walk leg phase (shuffle forward), o.back (flap + red tail lights).
//   o.icon false hides the badge. o.lights false skips the tail-light glow. o.emote as above (sleep→zzz, shock→'!').
//
// brandPacket(x, y, s, o) · the rival providers (dull, funny, not mean). o.brand:
//   ILVIP (mauve, bent crown) | EMBY (sage, striped nightcap + buffering spinner) | LAGTV (slate, taped rabbit ears) |
//   LOADING+ (beige, hourglass perched on the head with running sand). Brand name on a hanging kraft-paper tag.
//   o.mood   grumpy | sleepy | shock | panting (default per brand).  o.spinner (EMBY default true).  o.back.
//   o.mouth  default mouthOf(brand) (ILVIP / EMBY speak).  o.walk leg phase.  o.tag false hides the name tag.
//
// catPacket(x, y, s, o) · big lilac-grey cat-eared packet, sunglasses pushed up, tabby forehead, swishing tail,
//   label "cat_video_FINAL(3).mp4". o.mood bored (default) | grumpy | shock (glasses pop, ears up, tail puffs).
//   o.back (flap + paw-print seal, tail in front). o.mouth default mouthOf('CATPACKET', t).
//
// shark(x, y, s, o) · goofy cartoon shark, (x, y) = body centre, faces right (o.flip faces left).
//   o.bite 0..1 jaw open. o.mood hungry (default: eager eye, drool) | dazed (spiral eyes, stars, tongue out, bump).
//   o.swim swim phase (default t·1.2): tail + body wiggle.  o.zap 0..1 electrocuted (bolts, glow, flicker).
//   o.lookX/lookY pupil.  (No ground shadow.)
//
// queueSign(x, y, s, o) · hanging lightbox "ממתין בתור" / "WAITING IN LINE" + a ticket counter.
//   o.num ticket number (default 17, shown as 017).  o.on 0..1 light (default 1).  o.flicker 0..1 (buzzing tube).
//   o.swing sway (rad, default gentle).  o.cable length of the hanging cables in px at s = 1 (default 260).
//   o.counter false hides the counter.
//
// LOOPS.kit_packets (len 30) is the model sheet over time: 0 Bit moods I · 3 moods II · 6 limbs · 9 back/vel/boost/wink ·
//   12 acted mood changes · 15 commuters · 18 brands · 21 cat · 24 shark · 27 queue crowd (perf test).
// =====================================================================================================================
(() => {
  const INK = PAL.ink, CREAM = PAL.cream, MOUTH = '#4A1F2A', TONGUE = '#EE7F96', HAZE = '#3A3F78';
  const U = (pts, u) => pts.map(p => [p[0] * u, p[1] * u]);
  const hz = (c, o) => o.haze ? mixCol(c, o.hazeCol || HAZE, clamp(o.haze) * .75) : c;

  // p5 transforms, mirrored in JS so letters (world space) can follow a swinging tag
  function Xf() {
    let m = [1, 0, 0, 1, 0, 0]; const st = [];
    return {
      push() { push(); st.push(m.slice()); },
      pop() { pop(); m = st.pop(); },
      T(x, y) { translate(x, y); m = [m[0], m[1], m[2], m[3], m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; },
      R(a) { if (!a) return; rotate(a); const c = Math.cos(a), s = Math.sin(a); m = [m[0] * c + m[2] * s, m[1] * c + m[3] * s, -m[0] * s + m[2] * c, -m[1] * s + m[3] * c, m[4], m[5]]; },
      S(x, y = x) { scale(x, y); m = [m[0] * x, m[1] * x, m[2] * y, m[3] * y, m[4], m[5]]; },
      P(x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; },
      rot() { return m[0] * m[3] - m[1] * m[2] < 0 ? Math.atan2(-m[1], -m[0]) : Math.atan2(m[1], m[0]); },
      scl() { return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])); },
    };
  }
  // chubby rounded box (superellipse), a little wider at the bottom so it sits heavy
  function pillow(cx, cy, a, b, n = 3.4, N = 30, j = 0, bulge = .05) {
    const p = [];
    for (let i = 0; i < N; i++) {
      const th = i / N * TAU, c = Math.cos(th), s = Math.sin(th);
      const px = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), py = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      p.push([cx + a * px * (1 + bulge * py) + jit(j), cy + b * py + jit(j)]);
    }
    return p;
  }
  // the part of an ellipse outline above y = f(x) (a lid), or below it (what the lid leaves showing)
  const ellTop = (cx, cy, rx, ry) => x => cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
  const ellBot = (cx, cy, rx, ry) => x => cy + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
  const capAbove = (P, f, top) => P.map(([x, y]) => [x, Math.max(Math.min(y, f(x)), top ? top(x) : -1e9)]);
  const capBelow = (P, f, bot) => P.map(([x, y]) => [x, Math.min(Math.max(y, f(x)), bot ? bot(x) : 1e9)]);
  const idOf = (o, pre) => o.boilKey ?? pre + (++CLAWD_N);

  // ---------------------------------------------------------------- acted mood changes
  const TAKES = { determined: .7, panic: 1.2, cheeky: .5, joy: .9, bored: .25, laugh: .8, exhausted: .4, tongue: .6, neutral: .3,
    annoyed: .5, sleep: .2, shock: 1.3, grumpy: .6, sleepy: .2, panting: .5, hungry: .6, dazed: 1 };
  function packMoods(t, keys, o = {}) {
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const [tc, mood, over] = keys[i], age = t - tc, tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, k = o.take ?? 1;
    let squint = 0;
    if (tn - t < .1) squint = 1 - (tn - t) / .1;
    if (i > 0 && age < .14) squint = Math.max(squint, 1 - age / .14);
    const a = i > 0 ? take(t, tc, (TAKES[mood] ?? .6) * k) : { sq: 0, dy: 0 };
    const b = i + 1 < keys.length ? take(t, tn, (TAKES[keys[i + 1][1]] ?? .6) * k) : { sq: 0, dy: 0 };
    return { mood, squint, sq: a.sq + b.sq, dy: a.dy + b.dy, emoteK: i > 0 ? seg(age, .06, .32) : 1, emoteAge: age, moodAge: i > 0 ? age : 99, ...(over || {}) };
  }

  // ---------------------------------------------------------------- shared face parts
  // A big cartoon eye. e: { kind: open|happy|closed|squeeze|spiral, lid 0..1, tilt (+ inner side low = cross, − = droopy),
  // lx, ly, pupil (size), iris (colour: coloured iris), slit, squint, spin }. side −1 = left eye, 1 = right eye.
  function bigEye(cx, cy, rx, ry, side, e, skin, sw, u) {
    const kind = e.kind || 'open', sq = clamp(e.squint || 0), j = u * .025;
    const line = (P, w = 1.4, c = .4) => inkLine(P, sw * w, INK, 'ink', c);
    if (kind === 'happy') return line([[cx - rx * .95, cy + ry * .35], [cx, cy - ry * .5], [cx + rx * .95, cy + ry * .35]], 1.7, .6);
    if (kind === 'closed') return line([[cx - rx * .95, cy], [cx, cy + ry * .42], [cx + rx * .95, cy]], 1.6, .6);
    if (kind === 'squeeze') { const d = -side; return line([[cx - d * rx * .75, cy - ry * .62], [cx + d * rx * .8, cy + ry * .02], [cx - d * rx * .75, cy + ry * .62]], 1.7, 0); }
    if (kind === 'spiral') {
      paint(ellPts(cx, cy, rx, ry, 16, j), { wash: CREAM, ink: INK, sw: sw * .9 });
      const sp = []; for (let k = 0; k < 20; k++) { const a = k * .72 + (e.spin || 0) * side, r = (k / 19) * .92; sp.push([cx + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry]); }
      return inkLine(sp, sw * 1.1, INK, 'inkfine', .6);
    }
    if (sq > .8 || (e.lid ?? 0) >= .95) return line([[cx - rx * .9, cy + ry * .15], [cx, cy + ry * .32], [cx + rx * .9, cy + ry * .15]], 1.5, .5);
    const ry2 = ry * (1 - sq * .75), E = ellPts(cx, cy, rx, ry2, 20, j);
    paint(E, { wash: e.white || CREAM, ink: null });
    const pr = Math.min(rx, ry2) * .56 * (e.pupil ?? 1), lx = clamp(e.lx || 0, -1, 1), ly = clamp(e.ly || 0, -1, 1);
    const px = cx + lx * Math.max(0, rx - pr * (e.iris ? 1.4 : 1)) * .85, py = cy + ly * Math.max(0, ry2 - pr * (e.iris ? 1.4 : 1)) * .85;
    if (e.iris) {
      paint(ellPts(px, py, pr * 1.42, pr * 1.5, 14), { wash: e.iris, ink: INK, sw: sw * .4 });
      paint(ellPts(px, py, pr * (e.slit ? .32 : .85), pr * (e.slit ? 1.25 : .95), 12), { wash: INK, ink: null });
    } else paint(ellPts(px, py, pr, pr * 1.12, 12), { wash: INK, ink: null });
    if (pr > 2.2) paint(ellPts(px - pr * .38, py - pr * .45, pr * .34, pr * .38, 8), { wash: CREAM, ink: null });
    const lid = clamp(e.lid || 0);
    if (lid > .02) {
      const tl = e.tilt || 0, f = x => cy - ry2 + lid * 2 * ry2 + tl * (-side) * ((x - cx) / rx) * ry2 * .6;
      paint(capAbove(E, f, ellTop(cx, cy, rx, ry2)), { wash: e.lidCol || skin, ink: null });
      let xa = Infinity, xb = -Infinity;
      for (const [x, y] of E) if (y > f(x)) { xa = Math.min(xa, x); xb = Math.max(xb, x); }
      if (xb > xa) { const xm = (xa + xb) / 2; line([[xa - rx * .1, f(xa)], [xm, f(xm) + ry * .05], [xb + rx * .1, f(xb)]], 1.35, .5); }
    }
    paint(E, { ink: INK, sw: sw * .9 });
  }
  // eyebrow over an eye: v = [inner, outer] height in eye radii (− = higher)
  function brow(cx, cy, rx, ry, side, v, sw, u, w = 2.3) {
    const base = cy - ry - .45 * u, xi = cx - side * rx * .75, xo = cx + side * rx * 1.05;
    const yi = base + v[0] * ry, yo = base + v[1] * ry;
    inkLine([[xo, yo], [(xi + xo) / 2, (yi + yo) / 2 - .22 * u], [xi, yi]], sw * w, INK, 'ink', .5);
  }
  const perSide = (v, side) => Array.isArray(v[0]) ? v[side < 0 ? 0 : 1] : v;

  // open mouth outline: corners at (mx ± w, my − curl), bottom h below
  function mouthPts(mx, my, w, h, curl, wob = 0, t = 0) {
    const top = [], bot = [], n = 8;
    for (let i = 0; i <= n; i++) {
      const k = i / n * 2 - 1, x = mx + k * w, c = -curl * k * k;
      top.push([x, my + c - h * .1 * (1 - k * k) + (wob && i > 0 && i < n ? Math.sin(i * 2.1 + t * 30) * wob : 0)]);
      bot.push([x, my + c + h * Math.pow(Math.max(0, 1 - k * k), .6)]);
    }
    return top.concat(bot.reverse().slice(1, -1));
  }
  const OPEN = { big: 1, wail: 1, laugh: 1, pant: 1, O: 1, talk: 1 };
  // mouths: see the header. open = talking openness 0..1 (turns closed shapes into a talking mouth)
  function drawMouth(mx, my, w, shape, open, sw, u, t, curlU = .3) {
    const line = (P, wgt = 1.15, c = .6) => inkLine(P, sw * wgt, INK, 'ink', c);
    if (open > .06 && !OPEN[shape] && shape !== 'tongue') shape = 'talk';
    const curl = curlU * u;
    switch (shape) {
      case 'smile': return line([[mx - w, my - .32 * u], [mx, my + .28 * u], [mx + w, my - .32 * u]]);
      case 'flat': return line([[mx - w * .6, my + .05 * u], [mx + w * .6, my]], 1.15, 0);
      case 'side': return line([[mx - w * .15, my + .02 * u], [mx + w * .45, my + .08 * u], [mx + w * .8, my - .05 * u]], 1.15, .5);
      case 'smirk': return line([[mx - w * .65, my + .1 * u], [mx + w * .2, my + .14 * u], [mx + w * .9, my - .4 * u]]);
      case 'frown': return line([[mx - w * .75, my + .32 * u], [mx, my - .16 * u], [mx + w * .75, my + .32 * u]]);
      case 'wobble': return line([[mx - w * .8, my], [mx - w * .4, my - .2 * u], [mx, my], [mx + w * .4, my - .2 * u], [mx + w * .8, my]], 1, .3);
      case 'cat': return line([[mx - w * .75, my - .1 * u], [mx - w * .38, my + .22 * u], [mx, my], [mx + w * .38, my + .22 * u], [mx + w * .75, my - .1 * u]], 1, .5);
      case 'o': return paint(ellPts(mx, my + .1 * u, .32 * u, .4 * u, 10), { wash: MOUTH, ink: INK, sw: sw * .6 });
      case 'grit': {
        paint(rrPts(mx - w * .8, my - .42 * u, w * 1.6, .88 * u, .3 * u), { wash: CREAM, ink: INK, sw: sw * .85 });
        line([[mx - w * .74, my + .02 * u], [mx + w * .74, my]], .55, 0);
        return line([[mx + w * .05, my - .38 * u], [mx + w * .05, my + .4 * u]], .5, 0);
      }
      case 'tongue': {
        const tx = mx + w * .2 + .08 * u * Math.sin(t * 7), th = (1.05 + .12 * Math.sin(t * 9)) * u, ty = my - .02 * u;
        paint(capBelow(ellPts(tx, ty, .62 * u, th, 18), () => ty), { wash: TONGUE, ink: INK, sw: sw * .8 });
        line([[tx + .02 * u, ty + .15 * u], [tx, ty + th * .55]], .5, 0);
        return line([[mx - w, my - .38 * u], [mx - w * .2, my + .02 * u], [mx + w * .9, my - .3 * u]], 1.2, .6);
      }
    }
    // open shapes
    const hh = ({ talk: .3 + 1.6 * open, big: 1.35 + .4 * open, wail: 1.55 + .5 * open, laugh: 1.45 + .3 * Math.abs(Math.sin(t * TAU * 5)),
      pant: .75 + .35 * Math.abs(Math.sin(t * TAU * 2.2)), O: .95 + .6 * open })[shape] * u;
    const ww = shape === 'laugh' ? w * 1.2 : shape === 'O' ? w * .55 : shape === 'talk' ? w * (.95 - .15 * open) : shape === 'pant' ? w * .75 : w;
    const P = shape === 'O' ? ellPts(mx, my + hh * .45, ww, hh * .55, 16) : mouthPts(mx, my, ww, hh, shape === 'wail' ? -.35 * u : shape === 'laugh' ? .55 * u : curl, shape === 'wail' ? .07 * u : 0, t);
    paint(P, { wash: MOUTH, ink: null });
    if (hh > .55 * u) {   // tongue, kept inside the mouth
      const bot = shape === 'O' ? ellBot(mx, my + hh * .45, ww, hh * .55) : x => { const k = clamp((x - mx) / ww, -1, 1); return my - (shape === 'laugh' ? .55 * u : shape === 'wail' ? -.35 * u : curl) * k * k + hh * Math.pow(Math.max(0, 1 - k * k), .6); };
      paint(capBelow(ellPts(mx + ww * .12, my + hh * .85, ww * .55, hh * .42, 14), () => -1e9, x => bot(x) - sw * .4).map(([x, y]) => [x, Math.min(y, bot(x) - sw * .4)]), { wash: TONGUE, ink: null });
    }
    if ((shape === 'big' || shape === 'laugh' || (shape === 'talk' && open > .3)) && hh > .7 * u) {   // top teeth
      const th = Math.min(.34 * u, hh * .22), T2 = [], c0 = shape === 'laugh' ? .55 * u : curl;
      for (let i = 0; i <= 6; i++) { const k = (i / 6 * 2 - 1) * .82; T2.push([mx + k * ww, my - c0 * k * k - hh * .1 * (1 - k * k) + sw * .3]); }
      for (let i = 6; i >= 0; i--) { const k = (i / 6 * 2 - 1) * .82; T2.push([mx + k * ww, my - c0 * k * k - hh * .1 * (1 - k * k) + th]); }
      paint(T2, { wash: CREAM, ink: null });
    }
    paint(P, { ink: INK, sw: sw * .85 });
    if (shape === 'pant') {   // tongue lolling out over the lip
      const cy0 = my + hh * .6, tx = mx + ww * .35;
      paint(capBelow(ellPts(tx, cy0, .5 * u, (.95 + .12 * Math.sin(t * TAU * 2.2)) * u, 16), () => cy0), { wash: TONGUE, ink: INK, sw: sw * .75 });
      line([[tx, cy0 + .15 * u], [tx - .02 * u, cy0 + .6 * u]], .45, 0);
    }
  }
  function blushes(xs, y, u, b) {
    if (b <= .02) return;
    for (const bx of xs) paint(ellPts(bx, y, .95 * u, .45 * u, 12), { fill: PAL.rose, fillOp: 160 * clamp(b), bleed: .2, tex: .4, ink: null });
  }
  // a limb: tapered ribbon from root through a bend to the end (points in u)
  function limb(root, end, bend, w0, w1, col, sw, u) {
    const mid = [(root[0] + end[0]) / 2 + bend[0], (root[1] + end[1]) / 2 + bend[1]];
    paint(ribbon(U([root, mid, end], u), w0 * u, w1 * u), { wash: col, ink: INK, sw: sw * .8 });
  }
  // a hanging tag: pivot at the current origin, swings by th (+ = toward −x). Lettering in world space via xf.
  function hangTag(xf, u, sw, th, o, lines, tw, thh, paper, rs) {
    xf.push(); xf.R(th);
    const sl = .9 * u;
    inkLine([[0, 0], [.1 * u, sl * .5], [0, sl]], sw * .6, INK, 'inkfine', .5);
    const y0 = sl, P = [[-tw / 2, y0 + .45 * u], [-tw / 2 + .45 * u, y0], [tw / 2 - .45 * u, y0], [tw / 2, y0 + .45 * u], [tw / 2, y0 + thh], [-tw / 2, y0 + thh]];
    paint(P, { wash: paper, ink: INK, sw: sw * .7 });
    paint(ellPts(0, y0 + .38 * u, .16 * u, .16 * u, 8), { wash: INK, ink: null });
    let queued = false;
    lines.forEach(([txt, dy, size, col, font]) => {
      const [wx, wy] = xf.P(0, y0 + dy * u), px = size * u * xf.scl();
      if (px < 6) { inkLine([[-tw * .3, y0 + dy * u], [tw * .3, y0 + dy * u]], sw * .5, col, 'inkfine', 0); return; }
      letter(txt, wx, wy, px, col, { rot: xf.rot(), ink: false, font: font ? font.replace('#', px.toFixed(1)) : undefined });
      queued = true;
    });
    xf.pop();
    if (queued && o.flush !== false) flushLetters();
    rs && rs('after-tag');
  }

  // =================================================================================================== BIT
  const BIT = { col: '#FFC93C', dk: '#E39A2D', lt: '#FFF3C4', limb: '#F6B53A', shoe: '#2F5DA8', shoeDk: '#223F78', sole: '#F3EBDC', seal: '#C8403A' };
  const bp = t => Math.abs(Math.sin(bpOf(t) * Math.PI));
  const BIT_M = {
    determined: { lid: .3, tilt: .95, lx: .55, br: [-.02, -.72], mouth: 'grit', curl: .1, body: t => ({ dy: -.22 * bp(t), sq: .05 * pulse(t), rot: .04 }) },
    panic: { scale: 1.16, pupil: .48, shake: 1, br: [-1.25, -.5], mouth: 'wail', curl: -.35, emote: 'sweat', body: t => ({ dx: .09 * Math.sin(t * TAU * 13), sq: -.05 }) },
    cheeky: { lid: .44, tilt: -.1, lx: .8, ly: .15, br: [[-1.25, -1.0], [-.15, -.05]], mouth: 'smirk', body: t => ({ rot: .05 * Math.sin(t * TAU * .5), dy: -.15 * bp(t) }) },
    joy: { eye: 'happy', br: [-1.05, -.85], mouth: 'big', curl: .6, blush: .75, emote: 'spark', body: t => ({ dy: -1 * bp(t), sq: .1 * pulse(t) - .05 * bp(t) }) },
    bored: { lid: .56, tilt: -.15, lx: .3, ly: -.95, br: [-.08, -.18], mouth: 'side', body: t => { const f = frac(bpOf(t) / 4), sg = f < .3 ? ease(f / .3) : 1 - ease((f - .3) / .7); return { sq: .06 - .1 * sg, rot: -.03 }; } },
    laugh: { eye: 'squeeze', br: [-1, -.7], mouth: 'laugh', curl: .5, blush: .85, tears: 1, body: t => { const c = Math.abs(Math.sin(t * TAU * 5)); return { dy: -.45 * c, sq: .07 * c - .03, rot: .05 * Math.sin(t * TAU * 2.5) }; } },
    exhausted: { lid: .56, tilt: -.75, ly: .75, pupil: .85, br: [-.8, -.12], mouth: 'pant', curl: -.1, emote: 'sweat', body: t => ({ sq: .12 + .05 * Math.sin(t * TAU * 1.1) }) },
    tongue: { eye: ['squeeze', 'open'], lid: .08, lx: .2, br: [[-.95, -.55], [-1.2, -.95]], mouth: 'tongue', blush: .5, body: t => ({ rot: .08 * Math.sin(t * TAU * 1.5), dy: -.3 * Math.abs(Math.sin(t * TAU * 1.5)) }) },
  };
  function bitLimbs(kind, t, o, back) {
    const ph = (o.phase ?? t * 2.4) * TAU, L = { dy: 0, sq: 0, rot: 0, soles: [0, 0], bendL: [.55, 0], bendA: [0, .5] };
    const w1 = Math.sin(t * 2.1), w2 = Math.sin(t * 2.1 + 1.3);
    switch (kind) {
      case 'run':
        if (!back) {
          const a0 = Math.sin(ph), a1 = -a0, l0 = Math.max(0, Math.cos(ph)), l1 = Math.max(0, -Math.cos(ph));
          L.F = [[-1.9 + 2.3 * a0, -1.7 * l0], [1.9 + 2.3 * a1, -1.7 * l1]];
          L.H = [[-5.9 + 1.7 * a1, -4.3 - 1.1 * Math.max(0, a1)], [6.1 + 1.7 * a0, -4.3 - 1.1 * Math.max(0, a0)]];
          L.dy = -.75 * Math.abs(Math.cos(ph)); L.rot = .13; L.bendL = [.8, -.2];
        } else {
          const s0 = Math.sin(ph), l0 = Math.max(0, s0), l1 = Math.max(0, -s0);
          L.F = [[-2.0, -2.3 * l0], [2.0, -2.3 * l1]]; L.soles = [l0 > .3, l1 > .3];
          L.H = [[-6.1, -4.3 - 1.4 * s0], [6.1, -4.3 + 1.4 * s0]];
          L.dy = -.6 * Math.abs(s0); L.rot = .05 * s0; L.bendL = [0, .3];
        }
        break;
      case 'fly':
        if (!back) {
          L.F = [[-4.4, -1.9 + .35 * Math.sin(t * 9)], [-3.1, -.9 + .35 * Math.sin(t * 9 + 1.2)]];
          L.H = [[5.4, -8.9 + .2 * w1], [7.3, -7.3 + .2 * w2]]; L.rot = .22; L.dy = -1.2 + .3 * Math.sin(t * 3); L.bendL = [-.4, .3];
        } else {
          L.F = [[-1.5, .9 + .25 * Math.sin(t * 9)], [1.6, 1.2 + .25 * Math.sin(t * 9 + 1.2)]]; L.soles = [1, 1];
          L.H = [[-4.3, -11.2 + .2 * w1], [4.5, -11.4 + .2 * w2]]; L.dy = -1.5 + .3 * Math.sin(t * 3); L.bendL = [0, 0];
        }
        break;
      case 'flop':
        L.F = [[-5.9, .2], [6.0, .1]]; L.soles = [1, 1]; L.H = [[-7.7, -.6 + .1 * w1], [7.8, -.8]]; L.sq = .2; L.bendL = [0, .3]; L.bendA = [0, .6];
        break;
      case 'armsUp':
        L.F = [[-2.1, 0], [2.1, 0]]; L.H = [[-5.5 + .5 * Math.sin(t * 11), -11.7 - .4 * w1], [5.7 - .5 * Math.sin(t * 11 + 1), -12.1 + .4 * w2]];
        L.dy = -.3 * bp(t); L.bendA = [0, 0]; L.bendL = [0, 0];
        break;
      case 'crouch':
        L.F = [[-3.4, 0], [3.4, 0]]; L.H = [[-5.9, -2.7], [6.1, -2.9]]; L.sq = .2; L.bendL = [0, -.5];
        break;
      default:
        L.F = [[-2.1, 0], [2.1, 0]]; L.H = [[-6.4, -3.5 + .15 * w1], [6.5, -3.7 + .15 * w2]]; L.bendL = [0, 0];
    }
    return L;
  }
  function bitTrail(C, vx, vy, u, sw, t, id) {
    boilSeed(`kp ${id} trail`);
    const sp = Math.hypot(vx, vy), dx = -vx / sp, dy = -vy / sp, nx = -dy, ny = dx, len = Math.min(sp * .32, 30 * u);
    if (len < u) return;
    const P = []; for (let i = 0; i <= 5; i++) { const k = i / 5, wv = Math.sin(k * 5 - t * 14) * u * .5 * k; P.push([C[0] + dx * len * k + nx * wv, C[1] + dy * len * k + ny * wv]); }
    glow(lerp(C[0], P[5][0], .3), lerp(C[1], P[5][1], .3), 7 * u, '#FFC766', .7);
    glow(lerp(C[0], P[5][0], .7), lerp(C[1], P[5][1], .7), 4.5 * u, '#FFB347', .5);
    paint(ribbon(P, 6 * u, .3 * u), { wash: '#FFD45E', ink: INK, sw: sw * .5 });
    paint(ribbon(P.slice(0, 5), 3 * u, .2 * u), { wash: '#FFF4CE', ink: null });
    for (let i = 0; i < 4; i++) {   // speed dashes + sparkles drifting off the trail
      const k = frac(hash(i * 3.1) + t * 1.8), off = (hash(i + 9) - .5) * 7 * u, a = .35 + k * .9;
      const bx = C[0] + dx * len * a + nx * off, by = C[1] + dy * len * a + ny * off;
      if (i < 2) inkLine([[bx, by], [bx + dx * 3 * u, by + dy * 3 * u]], sw * .7, CREAM, 'inkfine', 0);
      else paint(starPts(bx, by, u * (.9 - .5 * k), .35, 4, t * 3), { wash: '#FFF4CE', ink: INK, sw: sw * .35 });
    }
  }
  function bitBoost(C, u, sw, t, k, id) {
    boilSeed(`kp ${id} boost`);
    glow(C[0], C[1], 16 * u * k, '#FFC04A', 1);
    glow(C[0], C[1], 9 * u * k, '#FFF1C0', .8);
    const fl = f => { const P = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU + t * 1.3, r = (i % 2 ? .72 : 1) * f * (1 + .1 * Math.sin(t * 23 + i * 1.7)); P.push([C[0] + Math.cos(a) * r * 1.1, C[1] + Math.sin(a) * r - (Math.sin(a) < 0 ? -Math.sin(a) * f * .25 : 0)]); } return P; };
    paint(fl(9.5 * u * k), { wash: '#FFB53A', ink: INK, sw: sw * .6 });
    paint(fl(7.6 * u * k), { wash: '#FFE58A', ink: null });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + hash(i) * .5, r0 = 11 * u * k, r1 = r0 + (2.5 + 2 * frac(t * 3 + hash(i + 4))) * u;
      inkLine([[C[0] + Math.cos(a) * r0, C[1] + Math.sin(a) * r0], [C[0] + Math.cos(a) * r1, C[1] + Math.sin(a) * r1]], sw * .9, '#FFF1C0', 'ink', 0);
    }
  }

  function bit(x, y, s = 1, o = {}) {
    const t = o.t ?? T, u = 12 * s, sw = clamp(u / 15, .45, 2.4) * (o.swMul || 1), id = idOf(o, 'bit'), rs = k => boilSeed(`kp ${id} ${k}`);
    const back = !!o.back, M = BIT_M[o.mood] || BIT_M.determined, idle = M.body ? M.body(t) : {};
    const L = bitLimbs(o.limbs || 'stand', t, o, back), fl = o.flip ? -1 : 1;
    const col = hz(BIT.col, o), dk = hz(BIT.dk, o), lt = hz(BIT.lt, o), lcol = hz(BIT.limb, o);
    const sq = (o.sq || 0) + (idle.sq || 0) + L.sq, dy = (o.dy || 0) + (idle.dy || 0) + L.dy;
    const rot = (o.rot || 0) + ((idle.rot || 0) + L.rot) * fl, x0 = x + ((o.dx || 0) + (idle.dx || 0)) * u;
    const [vx, vy] = o.vel || [0, 0], sp = Math.hypot(vx, vy), vk = clamp(sp / 1500);
    const C = [x0 + Math.sin(rot) * 5.4 * u, y + dy * u - 5.4 * u * (1 - sq) * Math.cos(rot)];
    const talk = typeof o.mouth === 'number' ? o.mouth : typeof o.mouth === 'string' ? 0 : mouthOf('BIT', t);

    if (vk > .04) bitTrail(C, vx, vy, u, sw, t, id);
    if (o.boost > .02) bitBoost(C, u, sw, t, clamp(o.boost), id);
    rs('glow'); glow(C[0], C[1], 9 * u * (1 + .3 * (o.boost || 0)), '#FFC766', o.glow ?? .75);
    rs('shadow');
    if (!o.noShadow && L.dy + (o.dy || 0) > -6) {
      const f = 1 - Math.min(.6, Math.abs(dy) * .07);
      paint(ellPts(x0, y + .15 * u, 5.8 * u * f, .95 * u * f, 20), { fill: INK, fillOp: 85, bleed: .25, tex: .3, border: .1, ink: null });
    }

    const xf = Xf(); xf.push(); xf.T(x0, y + dy * u); xf.R(rot);
    if (vk > .04) { const a = Math.atan2(vy, vx) - rot; xf.T(0, -5.4 * u); xf.R(a); xf.S(1 + .32 * vk, 1 / (1 + .22 * vk)); xf.R(-a); xf.T(0, 5.4 * u); }
    xf.S(fl * (1 + sq * .6), 1 - sq);
    const sh = M.shake ? .06 * u * Math.sin(t * 71) : 0;

    // limbs behind the body
    const hip = [[-2.0, -2.8], [2.0, -2.8]], sho = [[-4.6, -5.4], [4.6, -5.4]];
    const drawLeg = i => {
      rs('leg' + i);
      const F = L.F[i], bend = [L.bendL[0] * (o.limbs === 'crouch' ? (i ? 1 : -1) * 1.4 : 1), L.bendL[1]];
      limb(hip[i], F, bend, 1.35, 1.05, lcol, sw, u);
    };
    const drawShoe = i => {
      rs('shoe' + i); const F = L.F[i];
      if (back ? L.soles[i] : L.soles[i] && o.limbs === 'flop') {
        paint(ellPts(F[0] * u, (F[1] - .2) * u, .85 * u, 1.05 * u, 14, u * .03), { wash: hz(BIT.shoe, o), ink: INK, sw: sw * .8 });
        paint(ellPts(F[0] * u, (F[1] - .15) * u, .6 * u, .8 * u, 12), { wash: BIT.sole, ink: INK, sw: sw * .45 });
      } else {
        const fx = (F[0] + (back ? 0 : .4)) * u, fy = (F[1] - .5) * u;
        paint(ellPts(fx, fy, (back ? .95 : 1.25) * u, .72 * u, 14, u * .03), { wash: hz(BIT.shoe, o), ink: INK, sw: sw * .8 });
        inkLine([[fx - (back ? .8 : 1.1) * u, fy + .35 * u], [fx + (back ? .8 : 1.1) * u, fy + .35 * u]], sw * .9, BIT.sole, 'ink', 0);
      }
    };
    const drawArm = i => {
      rs('arm' + i); const H = L.H[i];
      limb(sho[i], H, [L.bendA[0] * (i ? 1 : -1), L.bendA[1]], 1.2, 1.0, lcol, sw, u);
      paint(ellPts(H[0] * u, H[1] * u, .78 * u, .78 * u, 12, u * .03), { wash: lcol, ink: INK, sw: sw * .8 });
    };
    [0, 1].forEach(i => { drawLeg(i); if (!(back && L.soles[i])) drawShoe(i); });
    [0, 1].forEach(drawArm);

    // body
    rs('body');
    const B = pillow(sh, -5.6 * u, 5.25 * u, 3.65 * u, 3.3, 34, u * .05, .06);
    paint(B, { wash: col, ink: null });
    paint(ellPts(0, -2.95 * u, 4.8 * u, 1.15 * u, 18, u * .08), { fill: dk, fillOp: 120, bleed: .05, tex: .7, border: .5, ink: null });
    paint(ellPts(-1.3 * u, -7.7 * u, 3.1 * u, 1.05 * u, 16, u * .1, -.08), { fill: lt, fillOp: 170, bleed: .2, tex: .85, border: .8, ink: null });
    if (back) {
      const V = [[-5.05, -8.7], [0, -4.75], [5.05, -8.7]];
      paint(U([[-5.1, -8.9], [-4.3, -9.2], [0, -9.27], [4.3, -9.2], [5.1, -8.9], [0, -4.75]], u), { wash: mixCol(col, dk, .3), ink: null });
      inkLine(U(V, u), sw * 1.1, INK, 'ink', .15);
      inkLine(U([[-4.9, -2.3], [-1.3, -4.4]], u), sw * .6, dk, 'inkfine', 0);
      inkLine(U([[4.9, -2.3], [1.3, -4.4]], u), sw * .6, dk, 'inkfine', 0);
    }
    paint(B, { ink: INK, sw });
    if (back) {   // wax seal
      rs('seal');
      paint(ellPts(0, -4.95 * u, 1.2 * u, 1.08 * u, 14, u * .09), { wash: BIT.seal, ink: INK, sw: sw * .8 });
      paint(ellPts(0, -4.95 * u, .68 * u, .62 * u, 12), { ink: mixCol(BIT.seal, INK, .45), sw: sw * .55 });
      paint(starPts(0, -4.95 * u, .42 * u, .45, 5), { wash: mixCol(BIT.seal, '#FFFFFF', .25), ink: null });
    } else {
      // football stamp, lower right
      rs('stamp');
      xf.push(); xf.T(3.55 * u, -3.35 * u); xf.R(.14);
      const st = []; for (let i = 0; i < 28; i++) { const k = i / 28 * 4, side = Math.floor(k), f = k - side, r = 1.05 * u * (i % 2 ? .9 : 1);
        const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]], a = c[side], b = c[(side + 1) % 4]; st.push([lerp(a[0], b[0], f) * r, lerp(a[1], b[1], f) * r]); }
      paint(st, { wash: '#FBF4E2', ink: INK, sw: sw * .5 });
      paint(ellPts(0, 0, .72 * u, .72 * u, 14), { wash: '#FFFDF6', ink: INK, sw: sw * .6 });
      paint(starPts(0, 0, .34 * u, .8, 5, -Math.PI / 2), { wash: INK, ink: null });
      xf.pop();

      // face
      const fx = ((M.lx || 0) + (o.lookX || 0)) * .35 * u, eS = M.scale || 1, ex = 2.1 * u, ey = -6.05 * u, rx = 1.22 * u * eS, ry = 1.5 * u * eS;
      rs('eyes');
      [-1, 1].forEach(side => {
        const kind0 = Array.isArray(M.eye) ? M.eye[side < 0 ? 0 : 1] : M.eye || 'open';
        const wink = side > 0 ? clamp(o.wink || 0) : 0, kind = wink > .85 ? 'happy' : kind0;
        const jl = M.shake ? .25 * Math.sin(t * 57 + side) : 0;
        bigEye(fx + sh + side * ex, ey, rx, ry, side, {
          kind, lid: Math.max(M.lid || 0, wink * 1.05), tilt: M.tilt || 0, pupil: M.pupil, squint: o.squint,
          lx: (M.lx || 0) + (o.lookX || 0) + jl, ly: (M.ly || 0) + (o.lookY || 0),
        }, col, sw, u);
      });
      rs('brows');
      [-1, 1].forEach(side => { const v = perSide(M.br, side); brow(fx + sh + side * ex, ey, rx, ry, side, [v[0] - talk * .3, v[1] - talk * .25], sw, u); });
      rs('mouth');
      drawMouth(fx * 1.25 + sh, -3.75 * u, 1.55 * u, typeof o.mouth === 'string' ? o.mouth : M.mouth, talk, sw, u, t, M.curl ?? .3);
      rs('cheeks'); blushes([fx - 3.3 * u, fx + 3.3 * u], -4.5 * u, u, M.blush || 0);
      if (M.tears) for (const side of [-1, 1]) {
        const ph = frac(t * 2.2 + (side > 0 ? .5 : 0)), p = arcPt([side * 3.2 * u, -6.2 * u], [side * 6.2 * u, -4.2 * u], 1.6 * u, ph);
        paint(ellPts(p[0], p[1], .3 * u * (1 - ph * .4), .4 * u * (1 - ph * .4), 8), { wash: PAL.sky, ink: INK, sw: sw * .4 });
      }
    }
    // soles kicking up toward the camera (back view), in front of the body
    if (back) [0, 1].forEach(i => { if (L.soles[i]) drawShoe(i); });
    // luggage tag
    if (o.tag !== false) {
      rs('tag');
      xf.push(); xf.T((back ? 4.55 : -4.55) * u, -8.75 * u);
      const fwd = back ? 0 : clamp(vx * fl / 1400, -1, 1), sw0 = back ? -1 : 1;
      const th = sw0 * (.35 + .2 * Math.sin(t * 3.3) + .12 * Math.sin(t * 7.1) * vk + .75 * fwd + (o.limbs === 'run' ? .15 * Math.sin((o.phase ?? t * 2.4) * TAU * 2) : 0)) + (o.tagSwing || 0);
      if (back) xf.S(-1, 1);
      hangTag(xf, u, sw, back ? -th : th, o, [['#5401', 2.75, .62, INK], ['GOAL', 3.75, .66, '#C0392F']], 2.35 * u, 4.4 * u, '#F7E8C6', rs);
      xf.pop();
    }
    // emote
    const em = o.emote !== undefined ? o.emote : M.emote;
    const ep = xf.P(4.6 * u, -9.9 * u);
    xf.pop();
    if (em) { rs('emote'); emote(em, ep[0], ep[1], u * .95, o.emoteK ?? 1, o.emoteAge ?? t); }
    rs('after');
  }

  // =================================================================================================== commuter packets
  const KINDS = {
    mail: { col: '#8FA3C4', icon: 'mail' }, video: { col: '#CC9098', icon: 'play' }, meme: { col: '#D6C07C', icon: 'smile' },
    update: { col: '#97AF9C', icon: 'sync' }, shop: { col: '#B29CC7', icon: 'cart' }, photo: { col: '#8BB3B2', icon: 'photo' },
    music: { col: '#C8A07E', icon: 'note' },
  };
  const KIND_LIST = Object.keys(KINDS);
  function icon(kind, cx, cy, r, sw, col) {
    const P = pts => pts.map(([a, b]) => [cx + a * r, cy + b * r]), o = { wash: col, ink: INK, sw: sw * .5 };
    switch (kind) {
      case 'mail': paint(P([[-.62, -.42], [.62, -.42], [.62, .42], [-.62, .42]]), o); inkLine(P([[-.6, -.4], [0, .08], [.6, -.4]]), sw * .5, INK, 'inkfine', 0); break;
      case 'play': paint(P([[-.38, -.52], [.55, 0], [-.38, .52]]), { ...o, wash: '#E0485A' }); break;
      case 'smile': inkLine(P([[-.45, .05], [0, .5], [.45, .05]]), sw * .6, INK, 'ink', .6); paint(P([[-.35, -.45], [-.15, -.45], [-.15, -.1], [-.35, -.1]]), { wash: INK, ink: null }); break;
      case 'sync': { const A = []; for (let i = 0; i <= 8; i++) { const a = -.3 + i / 8 * 4.7; A.push([Math.cos(a) * .5, Math.sin(a) * .5]); }
        inkLine(P(A), sw * .7, '#3E6B55', 'ink', .5); paint(P([[.35, -.72], [.72, -.28], [.2, -.2]]), { wash: '#3E6B55', ink: null }); break; }
      case 'cart': paint(P([[-.6, -.4], [.6, -.4], [.42, .2], [-.42, .2]]), { ...o, wash: '#F2C94C' }); inkLine(P([[-.4, .48], [.4, .48]]), sw * 1.2, INK, 'ink', 0); break;
      case 'photo': paint(P([[-.62, .42], [-.15, -.28], [.2, .1], [.38, -.08], [.62, .42]]), { ...o, wash: '#5E9F6A' }); paint(ellPts(cx + .38 * r, cy - .38 * r, .16 * r, .16 * r, 8), { wash: '#F2C94C', ink: null }); break;
      case 'note': paint(ellPts(cx - .2 * r, cy + .35 * r, .25 * r, .2 * r, 8, 0, -.3), { wash: INK, ink: null }); inkLine(P([[.03, .3], [.03, -.55], [.45, -.35]]), sw * .6, INK, 'ink', 0); break;
    }
  }
  // cheap dot eyes for crowds: mood bored | annoyed | sleep | shock | neutral
  function dotEye(cx, cy, r, side, mood, lx, ly, sw, u) {
    const E = () => ellPts(cx + lx * r * .25, cy + ly * r * .2, r * .72, r * .9, 10);
    switch (mood) {
      case 'sleep': case 'blink': return inkLine([[cx - r, cy], [cx, cy + r * .5], [cx + r, cy]], sw * 1.1, INK, 'ink', .6);
      case 'shock':
        paint(ellPts(cx, cy, r * 1.05, r * 1.25, 12), { wash: CREAM, ink: INK, sw: sw * .65 });
        return paint(ellPts(cx + lx * r * .4, cy + ly * r * .5, r * .34, r * .4, 8), { wash: INK, ink: null });
      case 'annoyed': case 'bored': {
        const ecx = cx + lx * r * .25, ecy = cy + ly * r * .2, tl = mood === 'annoyed' ? .55 : 0;
        const f = x => ecy - r * (mood === 'annoyed' ? .12 : .02) + tl * (-side) * (x - ecx) * .9;
        paint(capBelow(E(), f, ellBot(ecx, ecy, r * .72, r * .9)), { wash: INK, ink: null });
        return inkLine([[ecx - r * 1.05, f(ecx - r * 1.05)], [ecx + r * 1.05, f(ecx + r * 1.05)]], sw * 1.05, INK, 'ink', 0);
      }
      default: return paint(E(), { wash: INK, ink: null });
    }
  }
  function honkBurst(x, y, r, k, sw) {
    const P = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + .2, q = (i % 2 ? .55 : 1) * r * backOut(k); P.push([x + Math.cos(a) * q, y + Math.sin(a) * q * .85]); }
    paint(P, { wash: '#FFE08A', ink: INK, sw: sw * .7 });
    paint(ellPts(x, y, r * .22 * k, r * .22 * k, 8), { wash: '#E0485A', ink: null });
  }

  function packet(x, y, s = 1, o = {}) {
    const t = o.t ?? T, u = 12 * s, sw = clamp(u / 15, .45, 2.2), id = idOf(o, 'pk'), rs = k => boilSeed(`kp ${id} ${k}`);
    const kind = KINDS[o.kind] ? o.kind : KIND_LIST[Math.floor(hash(o.seed ?? x * .37) * KIND_LIST.length)], K = KINDS[kind];
    const seed = o.seed ?? (x * .173 + KIND_LIST.indexOf(kind) * 3.1), h1 = hash(seed), h2 = hash(seed + 7.3);
    const mood = o.mood || 'bored', back = !!o.back, honk = clamp(o.honk || 0), fl = o.flip ? -1 : 1;
    const col = hz(mixCol(K.col, '#A29FB0', h1 * .3), o), dk = mixCol(col, INK, .28);
    const aw = 4.1 * (1 + (h2 - .5) * .12), bh = 2.9 * (1 + (h1 - .5) * .14);
    // idle: slow breathing / fidget, per-packet phase; shock stretches; honk kicks
    const ph = h1 * 10, br = Math.sin(t * TAU * (.35 + .15 * h2) + ph);
    let sq = (o.sq || 0) + .035 * br + (mood === 'sleep' ? .05 : 0) + (mood === 'shock' ? -.08 : 0) - .12 * honk;
    let dy = (o.dy || 0) - (mood === 'annoyed' ? .25 * Math.abs(Math.sin(t * 5 + ph)) * (hash(Math.floor(t * 1.3 + ph)) > .6 ? 1 : 0) : 0) - .6 * honk;
    const rot = (o.rot || 0) + (mood === 'sleep' ? .05 * Math.sin(t * .7 + ph) : .015 * br) * fl, x0 = x + (o.dx || 0) * u;

    rs('shadow');
    if (!o.noShadow) paint(ellPts(x0, y + .1 * u, (aw + .3) * u, .7 * u, 14), { wash: INK, washOp: 60, ink: null });
    push(); translate(x0, y + dy * u); rotate(rot); scale(fl * (1 + sq * .6), 1 - sq);
    // legs
    rs('legs');
    for (const side of [-1, 1]) {
      const wk = o.walk != null ? Math.max(0, Math.sin((o.walk + (side > 0 ? .5 : 0)) * TAU)) : 0;
      paint(rrPts((side * 1.7 - .45) * u, -1.9 * u, .9 * u, (1.9 - .7 * wk) * u, .4 * u), { wash: dk, ink: INK, sw: sw * .7 });
    }
    rs('body');
    const cy = -1.6 - bh;
    paint(pillow(0, cy * u, aw * u, bh * u, 3.2, 24, u * .05, .06), { wash: col, ink: INK, sw });
    if (back) {
      rs('back');
      inkLine(U([[-aw + .15, cy - bh + .35], [0, cy + .5], [aw - .15, cy - bh + .35]], u), sw * .9, INK, 'ink', .1);
      if (o.lights !== false) glow(0, -2.6 * u, (3.4 + 2 * honk) * u, '#FF5A3C', .55 + .45 * honk);
      for (const side of [-1, 1]) paint(ellPts(side * (aw - 1.1) * u, -2.55 * u, .6 * u, .38 * u, 10), { wash: honk > .3 ? '#FF8A5C' : '#D8413A', ink: INK, sw: sw * .5 });
    } else {
      if (o.icon !== false) {
        rs('icon');
        paint(ellPts(0, (cy - bh + .95) * u, .88 * u, .82 * u, 12), { wash: CREAM, ink: INK, sw: sw * .5 });
        icon(K.icon, 0, (cy - bh + .95) * u, .78 * u, sw, mixCol(col, '#FFFFFF', .35));
      }
      rs('face');
      const lx = o.lookX || 0, ly = o.lookY || 0, fx = lx * .4 * u, eyM = o.squint > .8 || ((t * .8 + h2 * 3.1) % 3.9) < .1 && mood !== 'shock' ? 'blink' : mood;
      for (const side of [-1, 1]) dotEye(fx + side * 1.55 * u, (cy + .55 + ly * .15) * u, .52 * u, side, eyM, lx, ly, sw, u);
      const mo = honk > .15 ? 'O' : typeof o.mouth === 'string' ? o.mouth : { bored: h2 > .5 ? 'flat' : 'side', annoyed: h2 > .5 ? 'frown' : 'wobble', sleep: 'o', shock: 'O', neutral: 'smile' }[mood] || 'flat';
      drawMouth(fx * 1.2, (cy + 1.75) * u, 1.0 * u, mo, (typeof o.mouth === 'number' ? o.mouth : 0) + honk * .8, sw, u, t, 0);
    }
    pop();
    const em = o.emote !== undefined ? o.emote : { sleep: 'zzz', shock: '!' }[mood];
    if (em && !back) { rs('emote'); emote(em, x0 + fl * aw * .9 * u, y + (dy + cy - bh - 1) * u, u * .7, o.emoteK ?? 1, o.emoteAge ?? t + ph); }
    if (honk > .05) { rs('honk'); honkBurst(x0 + fl * (aw + .6) * u, y + (dy + cy - bh - .4) * u, 1.6 * u, honk, sw); }
    rs('after');
  }

  // =================================================================================================== rival brands
  const BRANDS = {
    ILVIP: { col: '#AE8CA6', mood: 'grumpy', prop: 'crown', speaker: 'ILVIP' },
    EMBY: { col: '#A0B595', mood: 'sleepy', prop: 'cap', speaker: 'EMBY' },
    LAGTV: { col: '#8794A8', mood: 'grumpy', prop: 'ears' },
    'LOADING+': { col: '#D8C7A2', mood: 'sleepy', prop: 'hourglass' },
  };
  const BRAND_M = {
    grumpy: { lid: .42, tilt: .9, ly: .15, br: [.12, -.45], mouth: 'frown', emote: 'anger', body: t => ({ sq: .05 + .02 * Math.sin(t * 2.3), dx: .03 * Math.sin(t * 17) * (Math.sin(t * 1.3) > .7 ? 1 : 0) }) },
    sleepy: { lid: .7, tilt: -.35, ly: .4, br: [-.35, -.1], mouth: 'o', emote: 'zzz', body: t => ({ rot: .05 * Math.sin(t * .8), sq: .06 + .05 * Math.sin(t * TAU * .3) }) },
    shock: { lid: 0, pupil: .42, scale: 1.12, br: [-1.35, -1.1], mouth: 'O', emote: '!', body: t => ({ sq: -.08 + .02 * Math.sin(t * 40) }) },
    panting: { lid: .5, tilt: -.55, ly: .55, br: [-.75, -.2], mouth: 'pant', emote: 'sweat', body: t => ({ sq: .1 + .06 * Math.sin(t * TAU * 2.2), rot: .03 * Math.sin(t * 2) }) },
  };
  function brandProp(prop, u, sw, t, top, o, dk) {
    const P = pts => U(pts, u);
    if (prop === 'crown') {
      push(); translate(.4 * u, top * u); rotate(.12);
      paint(P([[-2.4, .35], [-2.6, -2.1], [-1.3, -1.0], [-.1, -2.7], [1.2, -1.0], [2.0, -1.5], [3.3, -1.25], [3.7, -.5], [2.6, -.55], [2.5, .3]]), { wash: '#D1AD4E', fill: '#A8832E', fillOp: 70, tex: .5, ink: INK, sw: sw * .8, curv: .15 });
      paint(ellPts(3.65 * u, -.45 * u, .32 * u, .32 * u, 8), { wash: '#D1AD4E', ink: INK, sw: sw * .5 });
      paint(ellPts(-.1 * u, -.35 * u, .38 * u, .34 * u, 8), { wash: '#B84A6A', ink: INK, sw: sw * .4 });
      pop();
    } else if (prop === 'cap') {
      const droop = .15 * Math.sin(t * 1.4);
      const path = U([[0, top + .6], [-.3, top - 1.6], [1.6, top - 3.2], [4.0, top - 2.9 + droop], [5.4, top - 1.1 + droop * 2]], u), C = through(path, 5);
      paint(ribbon(C, 8.6 * u, .6 * u), { wash: '#EEE5CD', ink: INK, sw: sw * .8 });
      const wAt = i => lerp(8.6, .6, i / (C.length - 1)) * u;
      for (const [a, b] of [[4, 7], [10, 13], [16, 18]]) paint(ribbon(C.slice(a, b + 1), wAt(a) * .96, wAt(b) * .96), { wash: dk, ink: null });
      paint(rrPts(-4.5 * u, (top - .15) * u, 9 * u, 1.35 * u, .6 * u, u * .05), { wash: '#F4EEDC', ink: INK, sw: sw * .7 });
      const tip = C[C.length - 1];
      paint(ellPts(tip[0], tip[1] + .3 * u, .95 * u, .95 * u, 12, u * .08), { wash: CREAM, ink: INK, sw: sw * .6 });
    } else if (prop === 'ears') {
      const bx = .4 * u, by = top * u, wv = .06 * Math.sin(t * 2);
      inkLine([[bx - .2 * u, by], [bx - 3.4 * u + wv * u, by - 4.8 * u]], sw * 1.6, '#3E4250', 'ink', 0);
      inkLine([[bx + .2 * u, by], [bx + 2.0 * u, by - 3.2 * u], [bx + 4.3 * u, by - 3.6 * u - wv * u]], sw * 1.6, '#3E4250', 'ink', 0);
      paint(ellPts(bx - 3.4 * u + wv * u, by - 4.8 * u, .35 * u, .35 * u, 8), { wash: '#C8CCD8', ink: INK, sw: sw * .5 });
      paint(ellPts(bx + 4.3 * u, by - 3.6 * u - wv * u, .35 * u, .35 * u, 8), { wash: '#C8CCD8', ink: INK, sw: sw * .5 });
      paint(ellPts(bx, by + .1 * u, 1.3 * u, .75 * u, 12), { wash: '#4B4F60', ink: INK, sw: sw * .6 });
      const tape = (cx, cy, a) => { push(); translate(cx, cy); rotate(a); paint(rectPts(-.75 * u, -.28 * u, 1.5 * u, .56 * u, u * .04), { wash: '#EFE4C2', ink: INK, sw: sw * .4 }); pop(); };
      tape(bx + 2.0 * u, by - 3.2 * u, .7); tape(bx + 2.0 * u, by - 3.2 * u, -.6); tape(bx - 1.9 * u, by - 2.7 * u, .35);
      if (o.static) for (let i = 0; i < 2; i++) inkLine([[bx - 3.4 * u, by - 5.3 * u], [bx - 2.3 * u + jit(u), by - 6.2 * u], [bx - 1.2 * u, by - 5.6 * u + jit(u)], [bx, by - 6.4 * u]], sw * .6, '#DCE3F2', 'inkfine', 0);
    } else if (prop === 'hourglass') {
      push(); translate(1.4 * u, (top - .1) * u); rotate(.14 + .03 * Math.sin(t * 1.7));
      const k = frac(t / 5), gl = P([[-1.1, -.4], [1.1, -.4], [.15, -2.0], [1.1, -3.6], [-1.1, -3.6], [-.15, -2.0]]);
      paint(gl, { wash: '#F2EEDF', ink: null });
      const tf = 1 - k;   // sand left on top
      if (tf > .03) paint(P([[-.9 * tf, -2.0 - 1.4 * tf], [.9 * tf, -2.0 - 1.4 * tf], [0, -2.1]]), { wash: '#E0AE52', ink: null });
      paint(P([[-1.0, -.5], [1.0, -.5], [.9 * Math.sqrt(k) * .6, -.5 - 1.2 * k], [-.9 * Math.sqrt(k) * .6, -.5 - 1.2 * k]]), { wash: '#E0AE52', ink: null });
      if (tf > .03) inkLine(P([[0, -2.0], [0, -.55]]), sw * .6, '#C8903A', 'inkfine', 0);
      paint(gl, { ink: INK, sw: sw * .7 });
      paint(rrPts(-1.5 * u, -.5 * u, 3 * u, .55 * u, .2 * u), { wash: '#9A6A3E', ink: INK, sw: sw * .6 });
      paint(rrPts(-1.5 * u, -4.05 * u, 3 * u, .55 * u, .2 * u), { wash: '#9A6A3E', ink: INK, sw: sw * .6 });
      pop();
    }
  }
  function brandPacket(x, y, s = 1, o = {}) {
    const t = o.t ?? T, u = 12 * s, sw = clamp(u / 15, .45, 2.4), id = idOf(o, 'br'), rs = k => boilSeed(`kp ${id} ${k}`);
    const name = BRANDS[o.brand] ? o.brand : 'ILVIP', Bd = BRANDS[name], M = BRAND_M[o.mood || Bd.mood] || BRAND_M.grumpy, idle = M.body(t);
    const back = !!o.back, fl = o.flip ? -1 : 1, col = hz(Bd.col, o), dk = mixCol(col, INK, .25), lt = mixCol(col, '#FFFFFF', .35);
    const sq = (o.sq || 0) + (idle.sq || 0), dy = (o.dy || 0) + (idle.dy || 0), rot = (o.rot || 0) + (idle.rot || 0) * fl, x0 = x + ((o.dx || 0) + (idle.dx || 0)) * u;
    const talk = typeof o.mouth === 'number' ? o.mouth : typeof o.mouth === 'string' ? 0 : Bd.speaker ? mouthOf(Bd.speaker, t) : 0;
    const cy = -5.15, a = 4.85, b = 3.3, top = cy - b;

    rs('shadow');
    if (!o.noShadow) paint(ellPts(x0, y + .12 * u, 5.2 * u, .8 * u, 16), { fill: INK, fillOp: 75, bleed: .2, tex: .3, border: .1, ink: null });
    const xf = Xf(); xf.push(); xf.T(x0, y + dy * u); xf.R(rot); xf.S(fl * (1 + sq * .6), 1 - sq);
    rs('legs');
    for (const side of [-1, 1]) {
      const wk = o.walk != null ? Math.max(0, Math.sin((o.walk + (side > 0 ? .5 : 0)) * TAU)) : 0;
      paint(rrPts((side * 1.9 - .55) * u, -2.2 * u, 1.1 * u, (2.2 - .8 * wk) * u, .5 * u), { wash: dk, ink: INK, sw: sw * .75 });
    }
    rs('body');
    const Bp = pillow(0, cy * u, a * u, b * u, 3.2, 30, u * .05, .06);
    paint(Bp, { wash: col, ink: null });
    paint(ellPts(-1.2 * u, (top + 1.3) * u, 2.8 * u, .9 * u, 14, u * .1), { fill: lt, fillOp: 130, bleed: .2, tex: .8, border: .7, ink: null });
    if (back) {
      paint(U([[-a + .1, top + .3], [0, cy + .7], [a - .1, top + .3], [0, top - .02]], u), { wash: mixCol(col, dk, .35), ink: null });
      inkLine(U([[-a + .1, top + .3], [0, cy + .7], [a - .1, top + .3]], u), sw, INK, 'ink', .1);
    }
    paint(Bp, { ink: INK, sw });
    if (!back) {
      rs('eyes');
      const eS = M.scale || 1, ex = 1.75 * u, ey = (cy - .25) * u, rx = .98 * u * eS, ry = 1.18 * u * eS, fx = (o.lookX || 0) * .35 * u;
      [-1, 1].forEach(side => bigEye(fx + side * ex, ey, rx, ry, side, { lid: M.lid, tilt: M.tilt, pupil: M.pupil, squint: o.squint || (((t * .85 + x * .01) % 4.1) < .1 && M.lid < .5 ? 1 : 0), lx: (M.lx || 0) + (o.lookX || 0), ly: (M.ly || 0) + (o.lookY || 0) }, dk, sw, u));
      [-1, 1].forEach(side => brow(fx + side * ex, ey, rx, ry, side, [M.br[0] - talk * .3, M.br[1] - talk * .2], sw, u, 2));
      rs('mouth');
      drawMouth(fx * 1.2, (cy + 1.75) * u, 1.15 * u, typeof o.mouth === 'string' ? o.mouth : M.mouth, talk, sw, u, t, -.05);
    }
    rs('prop'); brandProp(Bd.prop, u, sw, t, top, o, dk);
    if (name === 'EMBY' && o.spinner !== false) {   // buffering spinner, floating by the cap
      rs('spinner');
      const sx = -5.6 * u, sy = (top - 2.4) * u, r = 1.05 * u, A = []; for (let i = 0; i <= 18; i++) { const q = i / 18 * TAU; A.push([sx + Math.cos(q) * r, sy + Math.sin(q) * r]); }
      inkLine(A, sw * 2.2, '#DCD6C2', 'ink', .5);
      const a0 = t * 5, B2 = []; for (let i = 0; i <= 7; i++) { const q = a0 + i / 7 * 1.9; B2.push([sx + Math.cos(q) * r, sy + Math.sin(q) * r]); }
      inkLine(B2, sw * 2.4, '#4E6150', 'ink', .5);
    }
    if (o.tag !== false) {
      rs('tag');
      xf.push(); xf.T((back ? 4.4 : -4.4) * u, (top + .9) * u); if (back) xf.S(-1, 1);
      const th = .3 + .12 * Math.sin(t * 2.6 + x * .01), tw = (name.length * .52 + .9) * u;
      hangTag(xf, u, sw, th, o, [[name, 1.35, .75, '#3B3350', '700 #px Rubik']], tw, 2.2 * u, '#E6D3A8', rs);
      xf.pop();
    }
    const em = o.emote !== undefined ? o.emote : M.emote, ep = xf.P(4.6 * u, (top - .6) * u);
    xf.pop();
    if (em && !back) { rs('emote'); emote(em, ep[0], ep[1], u * .8, o.emoteK ?? 1, o.emoteAge ?? t); }
    rs('after');
  }

  // =================================================================================================== cat video packet
  const CAT = { col: '#AAA4BE', dk: '#827C9A', lt: '#DCD8E8', ear: '#E6A9B6', iris: '#CFD86E', glass: '#2C2A40' };
  const CAT_M = {
    bored: { lid: .56, tilt: -.1, lx: -.55, ly: .15, mouth: 'cat', ears: 0, emote: null, body: t => { const f = frac(t / 4), sg = f < .25 ? ease(f / .25) : 1 - ease((f - .25) / .75); return { sq: .05 - .07 * sg }; } },
    grumpy: { lid: .45, tilt: 1.0, ly: .1, mouth: 'frown', ears: -.4, emote: 'anger', body: t => ({ sq: .06 + .02 * Math.sin(t * 2), dx: .04 * Math.sin(t * 19) * (Math.sin(t * 1.1) > .75 ? 1 : 0) }) },
    shock: { lid: 0, round: 1, scale: 1.14, mouth: 'O', ears: .35, puff: 1, emote: '!!', body: t => ({ sq: -.1 + .02 * Math.sin(t * 45) }) },
  };
  function catPacket(x, y, s = 1, o = {}) {
    const t = o.t ?? T, u = 12 * s, sw = clamp(u / 15, .45, 2.4), id = idOf(o, 'cat'), rs = k => boilSeed(`kp ${id} ${k}`);
    const M = CAT_M[o.mood] || CAT_M.bored, idle = M.body(t), back = !!o.back, fl = o.flip ? -1 : 1;
    const col = hz(CAT.col, o), dk = hz(CAT.dk, o), lt = hz(CAT.lt, o);
    const sq = (o.sq || 0) + idle.sq, dy = o.dy || 0, rot = o.rot || 0, x0 = x + ((o.dx || 0) + (idle.dx || 0)) * u;
    const talk = typeof o.mouth === 'number' ? o.mouth : typeof o.mouth === 'string' ? 0 : mouthOf('CATPACKET', t);
    const cy = -6.4, a = 6.7, b = 4.4, top = cy - b, puff = M.puff ? 1 : 0;
    const pop0 = o.moodAge != null && o.mood === 'shock' ? spring(o.moodAge, 0, 5, 14) : 0;

    rs('shadow');
    if (!o.noShadow) paint(ellPts(x0, y + .15 * u, 7.2 * u, 1 * u, 18), { fill: INK, fillOp: 80, bleed: .2, tex: .3, border: .1, ink: null });
    const xf = Xf(); xf.push(); xf.T(x0, y + dy * u); xf.R(rot); xf.S(fl * (1 + sq * .6), 1 - sq);
    const tail = () => {   // swishing tail (behind in front view, in front from the back)
      rs('tail');
      const sws = Math.sin(t * (o.mood === 'grumpy' ? 3.2 : 1.3)) * (o.mood === 'grumpy' ? 1.4 : .8), bs = back ? 1 : -1;
      const P = U([[bs * 5.2, -3.6], [bs * 8.2, -4.4], [bs * (9.3 + .3 * sws), -7.4], [bs * (8.4 + sws), -10.2], [bs * (7.0 + sws * 1.3), -10.8]], u);
      paint(ribbon(P, (1.6 + puff * .9) * u, (1.0 + puff * .9) * u), { wash: col, ink: INK, sw: sw * .85 });
      paint(ribbon(P.slice(3), (1.1 + puff * .8) * u, (.9 + puff * .8) * u), { wash: dk, ink: null });
    };
    if (!back) tail();
    rs('ears');
    for (const side of [-1, 1]) {
      const er = (M.ears || 0) * -side * .5, ex = side * 4.4, ey = top + .6;
      push(); translate(ex * u, ey * u); rotate(side * .12 + er);
      paint(U([[-1.9, .8], [side * .5, -3.4 - (M.ears > 0 ? .5 : 0)], [1.9, .8]], u), { wash: col, ink: INK, sw: sw * .85 });
      if (!back) paint(U([[-1.1, .4], [side * .45, -2.3], [1.1, .4]], u), { wash: CAT.ear, ink: null });
      pop();
    }
    rs('body');
    const Bp = pillow(0, cy * u, a * u, b * u, 3.0, 36, u * (.05 + puff * .12), .07);
    paint(Bp, { wash: col, ink: null });
    paint(ellPts(0, -3.3 * u, 6.2 * u, 1.3 * u, 18, u * .08), { fill: dk, fillOp: 110, bleed: .05, tex: .7, border: .5, ink: null });
    paint(ellPts(-1.8 * u, (top + 1.4) * u, 3.8 * u, 1.2 * u, 16, u * .1), { fill: lt, fillOp: 150, bleed: .2, tex: .85, border: .8, ink: null });
    if (back) {
      paint(U([[-a + .2, top + .5], [0, cy + 1.2], [a - .2, top + .5], [0, top - .02]], u), { wash: mixCol(col, dk, .35), ink: null });
      inkLine(U([[-a + .2, top + .5], [0, cy + 1.2], [a - .2, top + .5]], u), sw, INK, 'ink', .1);
    }
    paint(Bp, { ink: INK, sw: sw * 1.05 });
    if (back) {
      rs('seal');   // paw-print seal
      paint(ellPts(0, (cy + 1.4) * u, 1.3 * u, 1.15 * u, 14, u * .08), { wash: '#B94F6E', ink: INK, sw: sw * .7 });
      paint(ellPts(0, (cy + 1.65) * u, .5 * u, .42 * u, 10), { wash: '#E7A3B6', ink: null });
      for (const k of [-1, 0, 1]) paint(ellPts(k * .5 * u, (cy + .95 - (k ? 0 : .2)) * u, .2 * u, .24 * u, 8), { wash: '#E7A3B6', ink: null });
      tail();
    } else {
      // tabby forehead
      rs('tabby');
      for (const k of [-1, 0, 1]) inkLine(U([[k * .9, top + .25], [k * .75, top + 1.25 - (k ? .2 : 0)]], u), sw * 1.2, dk, 'ink', 0);
      // eyes
      rs('eyes');
      const eS = M.scale || 1, ex = 2.25 * u, ey = (cy - 1.2) * u, rx = 1.3 * u * eS, ry = 1.35 * u * eS, fx = ((M.lx || 0) + (o.lookX || 0)) * .3 * u;
      [-1, 1].forEach(side => bigEye(fx + side * ex, ey, rx, ry, side, { lid: M.lid, tilt: M.tilt, iris: CAT.iris, slit: !M.round, pupil: M.round ? .7 : .75,
        squint: o.squint || ((t * .7 % 4.7) < .12 && M.lid < .5 ? 1 : 0), lx: (M.lx || 0) + (o.lookX || 0), ly: (M.ly || 0) + (o.lookY || 0) }, mixCol(col, dk, .4), sw, u));
      // sunglasses pushed up on the forehead
      rs('glasses');
      xf.push(); xf.T(fx * .6, (top + .35 - (M.puff ? .6 : 0) - pop0 * 1.6) * u); xf.R(-.06 + pop0 * .25);
      for (const side of [-1, 1]) {
        paint(rrPts((side * 2.2 - 1.35) * u, -.85 * u, 2.7 * u, 1.55 * u, .6 * u, u * .03), { wash: CAT.glass, ink: INK, sw: sw * .7 });
        inkLine([[(side * 2.2 - .75) * u, -.45 * u], [(side * 2.2 - .2) * u, -.7 * u]], sw * .7, '#8E8AB0', 'inkfine', 0);
      }
      inkLine(U([[-.85, -.3], [0, -.55], [.85, -.3]], u), sw * .9, INK, 'ink', .5);
      xf.pop();
      // nose, mouth, whiskers
      rs('mouth');
      const nx = fx * 1.2, ny = (cy + .35) * u;
      paint([[nx - .5 * u, ny - .35 * u], [nx + .5 * u, ny - .35 * u], [nx, ny + .2 * u]], { wash: CAT.ear, ink: INK, sw: sw * .6 });
      const mo = typeof o.mouth === 'string' ? o.mouth : M.mouth;
      if (talk > .06 || mo === 'O') drawMouth(nx, ny + .55 * u, 1.05 * u, mo === 'O' ? 'O' : 'talk', talk, sw, u, t, -.05);
      if (!(mo === 'O') ) drawMouth(nx, ny + .45 * u, .95 * u, talk > .06 ? 'cat' : mo, 0, sw, u, t);
      for (const side of [-1, 1]) for (const k of [-1, 1]) inkLine([[nx + side * 2.6 * u, ny + (.25 + k * .3) * u], [nx + side * 5.4 * u, ny + (.1 + k * .75) * u]], sw * .5, INK, 'inkfine', .3);
      rs('label');
      xf.push(); xf.T(.2 * u, -3.35 * u); xf.R(-.05);
      paint(rrPts(-4.4 * u, -.72 * u, 8.8 * u, 1.44 * u, .35 * u, u * .03), { wash: '#F4F0E6', ink: INK, sw: sw * .6 });
      paint(U([[-4.2, -.55], [-3.3, -.55], [-3.3, .55], [-4.2, .55]], u), { wash: '#E0485A', ink: null });
      const [lx0, ly0] = xf.P(.45 * u, 0), px = .6 * u * xf.scl();
      if (px >= 6) letter('cat_video_FINAL(3).mp4', lx0, ly0, px, '#3B3350', { rot: xf.rot(), ink: false, font: `600 ${px.toFixed(1)}px Rubik` });
      else inkLine([[-2.8 * u, 0], [3.8 * u, 0]], sw * .5, '#3B3350', 'inkfine', 0);
      xf.pop();
      if (px >= 6 && o.flush !== false) flushLetters();
    }
    // paws
    rs('paws');
    for (const side of [-1, 1]) {
      const wk = o.walk != null ? Math.max(0, Math.sin((o.walk + (side > 0 ? .5 : 0)) * TAU)) : 0;
      paint(ellPts(side * 2.9 * u, (-.6 - .6 * wk) * u, 1.35 * u, .8 * u, 14, u * .03), { wash: col, ink: INK, sw: sw * .8 });
      if (!back) inkLine([[side * 2.9 * u - .3 * u, (-.45 - .6 * wk) * u], [side * 2.9 * u - .3 * u, (-.05 - .6 * wk) * u]], sw * .45, INK, 'inkfine', 0);
    }
    const em = o.emote !== undefined ? o.emote : M.emote, ep = xf.P(6.2 * u, (top - .5) * u);
    xf.pop();
    if (em && !back) { rs('emote'); emote(em, ep[0], ep[1], u * .95, o.emoteK ?? 1, o.emoteAge ?? t); }
    rs('after');
  }

  // =================================================================================================== shark
  const SH = { col: '#7F98B3', dk: '#5E7593', belly: '#EDE5D4', gum: '#D9667E' };
  function shark(x, y, s = 1, o = {}) {
    const t = o.t ?? T, u = 12 * s, sw = clamp(u / 13, .6, 2.6), id = idOf(o, 'shark'), rs = k => boilSeed(`kp ${id} ${k}`);
    const dazed = o.mood === 'dazed', bite = clamp(o.bite || 0), zap = clamp(o.zap || 0), fl = o.flip ? -1 : 1;
    const zf = zap > 0 && Math.floor(t * 24) % 2 === 0 ? zap : zap * .4;
    const col = hz(mixCol(SH.col, '#FFF3A0', zf * .7), o), dk = hz(mixCol(SH.dk, '#E8C84A', zf * .5), o), belly = hz(SH.belly, o);
    const sp = (o.swim ?? t * 1.2) * TAU, wig = x0 => Math.sin(sp + x0 * .12) * .5 * clamp(-x0 / 20, 0, 1);
    const B = pts => pts.map(([a, b2]) => [a * u, (b2 + wig(a)) * u]);
    const rot = (o.rot || 0) + (dazed ? .08 * Math.sin(t * 2.1) : .03 * Math.sin(sp)) * fl;

    if (zap > .05) { rs('zapglow'); glow(x, y, 30 * u * zap, '#FFE45C', .8 * zap); }
    push(); translate(x, y); rotate(rot); scale(fl, 1);
    // tail fin + dorsal (behind the body)
    rs('fins');
    push(); translate(-22.5 * u, wig(-22.5) * u); rotate(.28 * Math.sin(sp - .6));
    paint(U([[1, -1.8], [-3.5, -5.5], [-8.6, -10], [-6.6, -3.6], [-5.2, 0], [-7.6, 6.2], [-3.2, 3.8], [1, 1.9]], u), { wash: col, ink: INK, sw, curv: .25 });
    pop();
    paint(B([[2, -8.4], [-1.8, -15.4], [-3.4, -15.2], [-8.4, -7.2]]), { wash: col, ink: INK, sw, curv: .3 });
    paint(B([[-4, 5.5], [-9.5, 10.5], [-8.6, 6]]), { wash: dk, ink: INK, sw: sw * .8, curv: .3 });   // far pectoral
    // mouth interior + lower jaw (rotates open about the hinge)
    rs('jaw');
    const hinge = [8.2, 3.2], ja = bite * .62, rotP = ([px, py]) => { const dx = px - hinge[0], dy2 = py - hinge[1], c = Math.cos(ja), s2 = Math.sin(ja); return [hinge[0] + dx * c - dy2 * s2, hinge[1] + dx * s2 + dy2 * c]; };
    const upper = [[8.2, 3.2], [12, 2.6], [16, 2.2], [20, 1.6], [23.2, .6]];
    const jawTop = [[8.2, 3.2], [12, 3.0], [16, 2.7], [20, 2.2], [22.6, 1.6]].map(rotP);
    const jaw = [...jawTop, ...[[21.8, 3.8], [18, 5.6], [13, 6.8], [8, 7.0], [5.5, 5.4]].map(rotP)];
    if (bite > .04) {
      paint(B([...upper, ...jawTop.slice().reverse()]), { wash: MOUTH, ink: null });
      paint(B([rotP([12, 3.1]), rotP([18, 2.5]), [19, 2.4], [13, 2.8]]).map(([a, b2]) => [a, b2 - .2 * u]), { wash: SH.gum, ink: null });
    }
    paint(B(jaw), { wash: belly, ink: INK, sw, curv: .2 });
    const teeth = (line, dir, n, big) => {   // one zigzag strip per row
      const P = [];
      for (let i = 0; i <= n * 2; i++) {
        const k = i / (n * 2), seg0 = Math.min(line.length - 2, Math.floor(k * (line.length - 1))), f = k * (line.length - 1) - seg0;
        const a = line[seg0], b2 = line[seg0 + 1], px = lerp(a[0], b2[0], f), py = lerp(a[1], b2[1], f);
        const h = i % 2 ? (big * (dazed && i === 5 ? .5 : 1) + (dazed ? .25 * hash(i + 3) : 0)) * dir : 0;
        P.push([px, py + h]);
      }
      return P;
    };
    // lower teeth
    const lt2 = jawTop.slice(1);
    paint(B(teeth(lt2, -1, 5, .9)), { wash: CREAM, ink: INK, sw: sw * .6 });
    // upper body
    rs('body');
    const body = B([[23.4, .5], [22.6, -3.4], [18.5, -6.8], [11, -8.9], [2, -9.4], [-7, -7.8], [-15, -4.6], [-22, -1.6], [-23, 0], [-22, 1.9], [-15, 4.3], [-6, 6.4], [2, 6.9], [5.5, 5.4], [8.2, 3.2], [12, 2.6], [16, 2.2], [20, 1.6]]);
    paint(body, { wash: col, ink: null, curv: .35 });
    paint(B([[-20, 1.6], [-12, 2.2], [-3, 2.8], [5, 2.6], [8.2, 3.2], [5.5, 5.4], [2, 6.9], [-6, 6.4], [-15, 4.3]]), { wash: belly, ink: null, curv: .3 });
    paint(B([[-4, -7.9], [6, -8.7], [14, -7.6], [9, -6.6], [0, -6.8], [-8, -6.4]]), { fill: mixCol(col, '#FFFFFF', .3), fillOp: 120, bleed: .15, tex: .7, ink: null, curv: .3 });
    paint(body, { ink: INK, sw, curv: .35 });
    // upper teeth (goofy overbite)
    paint(B(teeth(upper.slice(1), 1, 5, 1.05)), { wash: CREAM, ink: INK, sw: sw * .6 });
    // gills
    rs('gills');
    for (let i = 0; i < 3; i++) inkLine(B([[4.2 - i * 1.4, -2.6], [4.8 - i * 1.4, -.4], [4.3 - i * 1.4, 1.8]]), sw * .7, dk, 'ink', .6);
    // eye + brow
    rs('eye');
    const ex = 14.2 * u, ey = -4.1 * u + wig(14) * u;
    if (dazed) bigEye(ex, ey, 2.15 * u, 2.4 * u, 1, { kind: 'spiral', spin: t * 7 }, col, sw, u);
    else {
      bigEye(ex, ey, 2.1 * u, 2.4 * u, 1, { lid: .18, tilt: .5, lx: o.lookX ?? .7, ly: o.lookY ?? .1, pupil: .8, squint: ((t * .6) % 5) < .1 ? 1 : 0 }, col, sw, u);
      inkLine([[ex - 2.2 * u, ey - 3.1 * u], [ex, ey - 3.1 * u + .1 * u], [ex + 2.2 * u, ey - 2.1 * u]], sw * 2.4, INK, 'ink', .5);
    }
    // near pectoral fin
    rs('fin');
    paint(B([[3, 4.2], [-3.2, 10.6 + .4 * Math.sin(sp)], [-5.2, 10.2], [-2.2, 5.2]]), { wash: dk, ink: INK, sw, curv: .3 });
    if (dazed) {
      rs('dazed');
      const tp = rotP([19.5, 2.6]);   // tongue lolling out of the jaw
      paint(ribbon(B([tp, [tp[0] + 1.2, tp[1] + 2.2], [tp[0] + .6 + .3 * Math.sin(t * 3), tp[1] + 4.2]]), 1.6 * u, 1.3 * u), { wash: TONGUE, ink: INK, sw: sw * .7 });
      paint(ellPts(9.5 * u, -9.2 * u, 2.4 * u, 1.4 * u, 14, u * .05), { wash: mixCol(col, PAL.rose, .25), ink: INK, sw: sw * .8 });   // bump
    } else if (!bite || bite < .3) {
      const dp = frac(t * .7);   // drool
      paint(ellPts(22.2 * u, (2.4 + dp * 2.2) * u, .38 * u, (.5 + dp * .3) * u, 8), { wash: '#BFE3F2', ink: INK, sw: sw * .45 });
    }
    pop();
    if (dazed) { rs('stars'); emote('stars', x + fl * 12 * u, y - 13 * u, u * 1.6, 1, t); }
    if (zap > .05) {
      rs('zap');
      for (let i = 0; i < 5; i++) {
        const a = hash(i * 7.7 + Math.floor(t * 12)) * TAU, r0 = 12 * u, P = [];
        for (let k = 0; k < 5; k++) P.push([x + Math.cos(a) * (r0 + k * 3 * u) * 1.6 + jit(2 * u), y + Math.sin(a) * (r0 + k * 3 * u) * .7 + jit(2 * u)]);
        inkLine(P, sw * 2 * zap, '#FFE45C', 'ink', 0);
      }
    }
    rs('after');
  }

  // =================================================================================================== queue sign
  function queueSign(x, y, s = 1, o = {}) {
    const t = o.t ?? T, id = idOf(o, 'sign'), rs = k => boilSeed(`kp ${id} ${k}`), sw = clamp(1.4 * s, .6, 2.6);
    const on = clamp(o.on ?? 1) * (o.flicker && hash(Math.floor(t * 12) + 3) < clamp(o.flicker) * .5 ? .35 : 1);
    const sway = o.swing ?? .025 * Math.sin(t * 1.1), cl = (o.cable ?? 260) * s;
    const xf = Xf(); xf.push(); xf.T(x, y - 90 * s - cl); xf.R(sway); xf.T(0, cl + 90 * s);
    rs('cables');
    for (const side of [-1, 1]) inkLine([[side * 220 * s, -90 * s], [side * 222 * s, -90 * s - cl * .5], [side * 220 * s, -90 * s - cl]], sw * 1.2, '#1E2040', 'ink', 0);
    rs('box');
    paint(rrPts(-290 * s, -95 * s, 580 * s, 190 * s, 30 * s, 2 * s), { wash: '#2E3152', ink: INK, sw: sw * 1.2 });
    const face = rrPts(-270 * s, -76 * s, 540 * s, 152 * s, 20 * s, 1.5 * s);
    paint(face, { wash: mixCol('#6E6A78', '#FFF1CC', on), ink: INK, sw: sw * .6 });
    paint(ellPts(-60 * s, -40 * s, 200 * s, 26 * s, 16, 2 * s), { fill: '#FFFFFF', fillOp: 90 * on, bleed: .2, tex: .6, ink: null });
    const [gx, gy] = xf.P(0, 0);
    if (on > .1) { flushBrush(); glow(gx, gy, 420 * s, '#FFE2A0', .55 * on); }
    let queued = false;
    const txt = (s0, px, py, size, col, font) => { const [wx, wy] = xf.P(px * s, py * s); letter(s0, wx, wy, size * s, col, { rot: xf.rot(), ink: false, font: font.replace('#', (size * s).toFixed(1)) }); queued = true; };
    txt('ממתין בתור', 0, -22, 70, '#2B2440', '900 #px Rubik');
    txt('WAITING IN LINE', 0, 42, 32, '#5A5474', '700 #px Rubik');
    if (o.counter !== false) {   // ticket counter hanging off the right end
      rs('counter');
      inkLine([[250 * s, 95 * s], [252 * s, 118 * s]], sw, '#1E2040', 'ink', 0);
      inkLine([[380 * s, 95 * s], [378 * s, 118 * s]], sw, '#1E2040', 'ink', 0);
      paint(rrPts(215 * s, 115 * s, 200 * s, 92 * s, 18 * s, 1.5 * s), { wash: '#2E3152', ink: INK, sw });
      paint(rrPts(230 * s, 128 * s, 170 * s, 66 * s, 10 * s, 1 * s), { wash: '#1B1A2C', ink: null });
      const [cx, cy] = xf.P(315 * s, 161 * s);
      glow(cx, cy, 110 * s, '#FF6B4A', .6 * on);
      const n = String(o.num ?? 17).padStart(3, '0');
      const [wx, wy] = xf.P(315 * s, 163 * s);
      letter(n, wx, wy, 50 * s, mixCol('#5A2A2A', '#FF7A55', on), { rot: xf.rot(), ink: false, font: `900 ${(50 * s).toFixed(1)}px Rubik` }); queued = true;
    }
    xf.pop();
    if (queued && o.flush !== false) flushLetters();
    rs('after');
  }

  // =================================================================================================== model sheet
  function sheetBg(t) {
    boilSeed('sheet bg');
    paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#262A58', ink: null });
    paint(ellPts(960, 470, 1100, 380, 30, 12), { fill: '#3E4486', fillOp: 120, bleed: .25, tex: .5, ink: null });
    paint(rectPts(-40, 900, W + 80, 220), { fill: '#1B1E42', fillOp: 150, bleed: .1, tex: .5, ink: null });
  }
  const lab = (txt, x, y, sz = 26) => letter(txt, x, y, sz, '#F3E6C4', { ink: false, font: `700 ${sz}px Rubik` });
  const PAGES = [
    [0, (t, lt) => {   // Bit moods I
      ['determined', 'panic', 'cheeky', 'joy'].forEach((m, i) => { const bx = 260 + i * 470; bit(bx, 800, 3.1, { t, mood: m, mouth: 0 }); lab(m, bx, 900); });
      lab('BIT · moods I', 960, 70, 34);
    }],
    [3, (t) => {
      ['bored', 'laugh', 'exhausted', 'tongue'].forEach((m, i) => { const bx = 260 + i * 470; bit(bx, 800, 3.1, { t, mood: m, mouth: 0 }); lab(m, bx, 900); });
      lab('BIT · moods II', 960, 70, 34);
    }],
    [6, (t) => {
      [['run', 'determined'], ['fly', 'joy'], ['flop', 'exhausted'], ['armsUp', 'joy'], ['crouch', 'determined']].forEach(([l, m], i) => {
        const bx = 200 + i * 380; bit(bx, 780, 2.6, { t, mood: m, limbs: l, mouth: 0 }); lab(l, bx, 900);
      });
      lab('BIT · limbs', 960, 70, 34);
    }],
    [9, (t, lt) => {
      bit(330, 800, 3, { t, back: true, limbs: 'run', mood: 'determined', vel: [0, -700] }); lab('back · run', 330, 920);
      bit(820, 800, 3, { t, back: true, limbs: 'fly', vel: [0, -900] }); lab('back · fly', 820, 920);
      bit(1480, 620, 2.4, { t, limbs: 'fly', mood: 'joy', vel: [1700, -150], boost: .9, mouth: 0 }); lab('vel + boost', 1480, 920);
      bit(1790, 830, 1.5, { t, mood: 'cheeky', wink: 1, mouth: .4 + .4 * Math.sin(t * 17) }); lab('wink + talk', 1790, 960, 22);
      lab('BIT · back / trail / boost / wink', 960, 70, 34);
    }],
    [12, (t, lt) => {
      const keys = [[12, 'bored'], [12.7, 'panic'], [13.5, 'determined'], [14.3, 'joy']], m = packMoods(t, keys);
      bit(960, 900, 5.2, { t, ...m, mouth: 0 });
      lab('acted mood change: ' + m.mood, 960, 70, 34);
    }],
    [15, (t) => {
      const kinds = ['mail', 'video', 'meme', 'update', 'shop', 'photo'], moods = ['bored', 'annoyed', 'sleep', 'shock', 'bored', 'annoyed'];
      kinds.forEach((k, i) => { const px = 200 + i * 305; packet(px, 470, 2.1, { t, kind: k, mood: moods[i], honk: i === 4 ? .5 + .5 * Math.sin(t * 9) : 0 }); lab(k + ' · ' + (i === 4 ? 'honk' : moods[i]), px, 530, 22); });
      kinds.forEach((k, i) => { const px = 200 + i * 305; packet(px, 860, 2.1, { t, kind: k, back: true, walk: t * 1.5 + i * .3, honk: i === 2 ? .5 + .5 * Math.sin(t * 9) : 0 }); });
      lab('back views (tail lights, one honking)', 960, 930, 22);
      lab('commuter packets', 960, 70, 34);
    }],
    [18, (t) => {
      [['ILVIP', 'grumpy'], ['EMBY', 'sleepy'], ['LAGTV', 'shock'], ['LOADING+', 'panting']].forEach(([b, m], i) => {
        const px = 250 + i * 470; brandPacket(px, 560, 2.5, { t, brand: b, mood: m, mouth: i === 0 ? .3 + .3 * Math.sin(t * 15) : undefined }); lab(b + ' · ' + m, px, 610, 24);
        brandPacket(px, 900, 1.5, { t, brand: b, back: true });
      });
      lab('rival brands', 960, 60, 34);
    }],
    [21, (t) => {
      catPacket(560, 860, 3.4, { t, mood: 'bored', mouth: .25 + .25 * Math.sin(t * 13) }); lab('CATPACKET · bored (talking)', 560, 950, 24);
      catPacket(1250, 560, 1.7, { t, mood: 'grumpy' }); lab('grumpy', 1250, 610, 22);
      catPacket(1650, 560, 1.7, { t, mood: 'shock', moodAge: (t - 21) % 1.5 }); lab('shock', 1650, 610, 22);
      catPacket(1250, 930, 1.3, { t, back: true }); lab('back', 1250, 975, 22);
      bit(1650, 930, 1.3, { t, mood: 'cheeky' }); lab('Bit for scale', 1650, 975, 22);
      lab('cat video packet', 960, 60, 34);
    }],
    [24, (t) => {
      const bite = Math.max(0, Math.sin((t - 24) * 3));
      shark(820, 380, 1.15, { t, bite }); lab('hungry · bite ' + bite.toFixed(2), 820, 610, 24);
      shark(1180, 800, .8, { t, mood: 'dazed', bite: .25, zap: (t % 1.5) < .4 ? 1 : 0 }); lab('dazed (+zap)', 1180, 960, 24);
      bit(260, 860, 1.4, { t, mood: 'bored', noShadow: true });
      lab('shark', 960, 60, 34);
    }],
    [27, (t, lt) => {
      queueSign(1140, 250, .75, { t, num: 17, flicker: .3 });
      const rows = [[560, .55, 11, .55], [680, .75, 9, .35], [820, 1.0, 7, .15]];
      rows.forEach(([ry, sc, n, hzv], r) => {
        for (let i = 0; i < n; i++) {
          const px = 560 + (i + .5 * (r % 2)) * (1300 / n) + (hash(i + r * 9) - .5) * 40, ph = hash(i * 3 + r);
          if (r === 2 && i === 3) { brandPacket(px, ry, sc * 1.1, { t, brand: 'ILVIP', back: true, haze: hzv }); continue; }
          if (r === 1 && i === 5) { catPacket(px, ry, sc * .95, { t, back: true, haze: hzv }); continue; }
          packet(px, ry + ph * 20, sc * (.9 + .2 * ph), { t, back: true, seed: i + r * 11, walk: t * 1.2 + ph, haze: hzv, honk: r === 2 && i === 5 ? .5 + .5 * Math.sin(t * 8) : 0 });
        }
      });
      bit(300, 1000, 2.6, { t, back: true, limbs: 'run', vel: [700, -500], mood: 'determined' });
      lab('queue crowd · ~27 packets (perf)', 360, 60, 30);
    }],
  ];
  LOOPS.kit_packets = t => {
    sheetBg(t);
    let i = 0; while (i + 1 < PAGES.length && t >= PAGES[i + 1][0]) i++;
    PAGES[i][1](t, t - PAGES[i][0]);
  };
  LOOPS.kit_packets.len = 30;

  Object.assign(window, { bit, packet, brandPacket, catPacket, shark, queueSign, packMoods, PACKET_KINDS: KIND_LIST, PACKET_BRANDS: Object.keys(BRANDS) });
})();

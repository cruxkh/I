// c3_queue.js · CHAPTER 3 · inside the internet: the queue · global 39.2–58.4 (audio is final, sync is law)
//
// Shots (global t) · transitions · reads
//   A  39.20–41.30  [in: gold-white flash fades off C2]  CHASE CAM behind Bit (back view, running, light trail) down the
//                   jammed fibre tunnel toward the tail of a long queue; "Excuse me! Live goal..." starts 40.6; 41.0 he
//                   BUMPS the last packet (it honks, he squashes).
//   B  41.30–43.60  [cut on the bump]  SIDE TRACKING: Bit squeezes along the queue left→right, face visible for
//                   "...coming through! Live goal!", shoulders packets aside (each one jolts + turns), 42.7 gets STUCK
//                   between two fat packets (squashed, wriggles), 43.25 pops out forward.
//   C  43.60–45.30  [cut on the pop]  LOW FRONT ANGLE looking back down the queue (packets face us, bored): Bit runs at
//                   camera, 44.25 VAULTS off a packet's head and sails over the lens (packets look up, shock).
//   D  45.30–47.00  [cut on action, he lands]  CHASE CAM banking left/right: Bit WEAVES between lanes; the lit queue
//                   sign ahead grows; he skids to a stop.
//   E  47.00–50.05  [cut on the skid]  FRONT OF THE QUEUE: sign `ממתין בתור` drops in and swings; ILVIP (crown, grumpy,
//                   front of the line) and EMBY block Bit; ILVIP "Hey! We've been waiting in line since the first half!"
//   F  50.05–51.60  [cut]  EMBY medium, nightcap + spinner, slow push: "Still... buffering..."
//   G  51.60–54.55  [cut]  OVER-BIT'S-SHOULDER two-shot: the CAT (normal size) inside the queue, packets either side:
//                   "Get in line, kid. Cat videos first."
//   H  54.55–56.45  [cut]  BIT CLOSE-UP: cheeky "Sorry! GOTV doesn't wait in line!", 55.95 turns determined, crouches.
//   I  56.45–57.70  [cut on the launch]  BOOST: wide side view of the whole queue, Bit rockets up and over in a flaming
//                   arc; everyone looks up in shock (staggered), camera tilts up after him.
//   J  57.70–58.40  [burst: gold flash]  OPEN FIBRE: chase cam, tunnel at boost speed, Bit streaks to the vanishing
//                   point. Hard cut 58.4.
(() => {
  const GW = '#FFF4D8';
  // batched light: glow() flushes p5.brush on every call (slow on soft-gl); queue and flush once, same transform
  const GQ = [];
  const gq = (x, y, r, col, a = 1) => { if (a > 0 && r >= 1) GQ.push([x, y, r, col, a]); };
  function gflush() {
    if (!GQ.length) return;
    flushBrush(); push(); blendMode(ADD);
    for (const [x, y, r, col, a] of GQ) { const c = color(col); tint(red(c), green(c), blue(c), 150 * clamp(a)); image(glowTex, x - r, y - r, 2 * r, 2 * r); }
    noTint(); blendMode(BLEND); pop(); GQ.length = 0;
  }
  const KINDS = ['mail', 'video', 'meme', 'update', 'shop', 'photo', 'music'];
  const kindOf = i => KINDS[Math.floor(hash(i * 3.7 + 1) * KINDS.length)];

  // ------------------------------------------------------------------ chase-cam world (tunnel perspective)
  // Queue in the middle lane, facing away from the camera (toward the front / the sign). Z = world depth along the tunnel.
  const TAILZ = 1.0, SPACING = .8, NQ = 18;                  // queue members i = 0 (tail) .. NQ-1
  const qZ = i => TAILZ + i * SPACING;
  const qX = i => (hash(i * 5.1) - .5) * 70 + (i % 3 === 1 ? -40 : i % 3 === 2 ? 40 : 0);
  const S0 = 3.4;                                            // packet scale at depth 1
  // side-lane stragglers (sparse, far): [X, Z]
  const SIDE = [[-290, 3.3], [300, 4.6], [-300, 6.4], [290, 7.9], [-280, 9.5], [300, 11.0]];

  // Draw the queue from camera at depth zc, lateral camX. hit(i) -> {honk, dx, rot, mood, lookY} per member.
  function chaseQueue(t, zc, camX, bitD, drawBit, hit = () => ({}), o = {}) {
    const items = [];
    for (let i = 0; i < NQ; i++) items.push({ i, X: qX(i), Z: qZ(i) });
    SIDE.forEach(([X, Z], k) => items.push({ i: 100 + k, X, Z }));
    items.push({ bit: true, Z: zc + bitD });
    items.sort((a, b) => b.Z - a.Z);
    for (const it of items) {
      const d = it.Z - zc;
      if (it.bit) { drawBit(); continue; }
      if (d < .42 || d > 11) continue;
      const [x, y, s] = tunnelAt(it.X - camX, d, o), h = hit(it.i) || {};
      const haze = clamp((d - 1.5) / 7), sc = S0 * s;
      if (sc < .5) {   // far: a simple painted blob
        boilSeed('far' + it.i);
        paint(ellPts(x, y - 45 * sc, 55 * sc, 45 * sc, 10), { wash: mixCol('#8A86A8', '#3A3F78', haze), ink: null });
        continue;
      }
      packet(x, y, sc, { t, back: true, kind: kindOf(it.i), seed: it.i, walk: t * .6 + hash(it.i), haze, boilKey: 'q' + it.i,
        mood: h.mood || 'bored', honk: h.honk || 0, dx: h.dx || 0, rot: h.rot || 0, emote: null });
    }
  }

  // ------------------------------------------------------------------ side-view world (shots B and I)
  // World floor at y = FLOOR. Packets face right (toward the front of the queue).
  const FLOOR = 830;
  function sideBg(t, camX, camY = 540, o = {}) {
    const jam = o.jam ?? .55, boost = o.boost || 0;
    boilSeed('sbg');
    paint(rectPts(-80, -80, W + 160, H + 160), { wash: mixCol('#171C4C', '#261634', jam * .5), ink: null });
    const oy = 540 - camY;
    // ceiling glow band + far wall
    paint(rectPts(-80, 60 + oy * .5, W + 160, 300), { wash: mixCol('#2A2F78', '#452240', jam * .6), washOp: 150, ink: null });
    paint(rectPts(-80, 420 + oy * .7, W + 160, 300), { wash: mixCol('#24407A', '#3E2234', jam * .6), washOp: 140, ink: null });
    // floor
    boilSeed('sfloor');
    paint(rectPts(-80, FLOOR - 10 + oy, W + 160, 520), { wash: mixCol('#1B2358', '#2A1A38', jam * .5), ink: null });
    inkLine([[-80, FLOOR - 10 + oy], [W + 80, FLOOR - 10 + oy]], 1.6, mixCol('#8FE6F0', '#FF8A5C', jam), 'ink', 0);
    // far fibre streaks (parallax .35)
    for (let i = 0; i < 7; i++) {
      boilSeed('sfs' + i);
      const y = 150 + i * 70 + oy * .5, L = 300 + 200 * hash(i), sp = (1 + boost * 4) * (300 + 200 * hash(i + 3));
      const x = ((hash(i * 7) * 3000 - camX * .35 - t * sp) % 2600 + 2600) % 2600 - 350;
      inkLine([[x, y], [x + L, y]], 1.2, i % 2 ? '#7FD6E6' : '#E48AC8', 'inkfine', 0);
    }
    // light ribs (the tunnel rings, seen side on), parallax 1
    const RB = 520;
    for (let k = Math.floor((camX - 1100) / RB); k <= Math.ceil((camX + 1100) / RB); k++) {
      const x = k * RB - camX + 960;
      boilSeed('rib' + k);
      const col = k & 1 ? mixCol('#5FD8E8', '#F0674E', jam) : mixCol('#E46AC0', '#F2A03A', jam);
      inkLine([[x - 20, -60 + oy], [x, 300 + oy], [x - 10, FLOOR - 10 + oy]], 3, col, 'dry', .6);
      gq(x, 40 + oy, 140, col, .7);
      gq(x - 10, FLOOR - 14 + oy, 90, col, .55 + (jam > .3 ? .3 * Math.sin(t * 6 + k) : 0));
    }
    if (boost > .02) gq(960, 300, 700, '#FFE9A8', .5 * boost);
    gflush();
  }

  // ------------------------------------------------------------------ shot A · chase into the tail
  function bitRunZ(t) { return kf(t, [[39.2, -3.2], [40.95, TAILZ - 1.25], [41.3, TAILZ - 1.35]], x => x); }
  function shotA(t, lt) {
    const zb = bitRunZ(t), zc = zb - 1.35, bump = t >= 40.95;
    const [shx, shy] = bump ? shakeXY(t, 10 * Math.exp(-(t - 40.95) * 8)) : [0, 0];
    camBegin(960 + shx, 540 + shy, 1.02 + .02 * wob(t, .7), .012 * wob(t, .9));
    fibreTunnel(t, { z: zc / .9, jam: .55, speed: 1 });
    chaseQueue(t, zc, 0, 1.35, () => {
      const [x, y, s] = tunnelAt(0, 1.35), sp = bump ? spring(t, 40.95, 7, 22) : 0;
      bit(x, y, 3.3 * s, { t, back: true, limbs: 'run', phase: t * 3.2, vel: bump ? [0, -150] : [0, -900], sq: .25 * sp + (bump ? .08 : 0), dy: bump ? -.6 * Math.max(0, sp) : 0, rot: .04 * wob(t, 1.6), boilKey: 'bitA' });
    }, i => i === 0 && bump ? { honk: Math.exp(-(t - 40.95) * 2.5), dx: .3 * spring(t, 40.95, 5, 18), mood: 'annoyed' } : {});
    camEnd();
    flash(1 - ease(seg(t, 39.2, 39.55)), GW);
  }

  // ------------------------------------------------------------------ shot B · side tracking squeeze
  const B_PK = 9, B_SP = 250, B_X0 = 700;                   // packets at world x B_X0 + i*B_SP, facing right
  const bitXB = t => kf(t, [[41.3, 420], [42.1, 1050], [42.7, 1480], [43.25, 1560], [43.6, 2050]], x => x);
  function shotB(t, lt) {
    const bx = bitXB(t), cx = lerp(bx, 1200, .35) + 120, stuck = t > 42.7 && t < 43.25;
    const [shx, shy] = t > 42.7 ? shakeXY(t, stuck ? 4 : 0) : [0, 0];
    sideBg(t, cx);
    camBegin(cx + shx, 540 + shy, 1.0);
    // back row: queue packets (behind Bit)
    for (let i = 0; i < B_PK; i++) {
      const px = B_X0 + i * B_SP, tp = kf(px, [[420, 41.3], [1050, 42.1], [1480, 42.7], [1560, 43.25], [2050, 43.6]], x => x);
      const hitA = t - tp, hit = hitA > 0 ? Math.exp(-hitA * 3) : 0;
      const around = i === 3 || i === 4;                    // the two fat ones that trap him
      packet(px, FLOOR + (i % 2) * 14, (around ? 2.6 : 2.15) + .15 * hash(i), { t, kind: kindOf(i + 20), seed: i + 20, boilKey: 'b' + i,
        lookX: hitA > 0 ? -.9 : .6, mood: hitA > 0 && hitA < 1.2 ? (around ? 'annoyed' : 'shock') : i % 4 === 2 ? 'sleep' : 'bored',
        dx: -.5 * spring(t, tp, 4, 16), rot: -.12 * spring(t, tp, 5, 14), honk: i === 4 && stuck ? .6 + .4 * wob(t, 3) : 0, emote: null });
    }
    // Bit (front, slightly lower = nearer the camera), squeezing past
    const pop = spring(t, 43.25, 5, 16), wr = stuck ? wob(t, 5) : 0;
    const vel = stuck ? [0, 0] : [t > 43.25 ? 1400 : 900, 0];
    bit(bx, FLOOR + 40, 2.5, { t, limbs: stuck ? 'crouch' : 'run', phase: t * 3.4, vel, lookX: .8, boilKey: 'bitB',
      mood: stuck ? 'panic' : 'determined', sq: stuck ? .28 + .05 * wr : -.3 * pop, rot: stuck ? .08 * wr : .12, dy: bx < 1000 ? -.35 * Math.abs(Math.sin(t * 9)) : 0 });
    // front row: two packets nearer the camera, overlapping (depth)
    for (let i = 0; i < 3; i++) {
      const px = B_X0 + 120 + i * 560;
      packet(px, FLOOR + 175, 2.9, { t, kind: kindOf(i + 40), seed: i + 40, lookX: .7, boilKey: 'bf' + i, haze: .15, mood: 'bored', emote: null });
    }
    camEnd();
  }

  // ------------------------------------------------------------------ shot C · low front angle, the vault
  const VPC = [960, 600];
  function shotC(t, lt) {
    const lookUp = seg(t, 44.1, 44.5);
    camBegin(960, 540, 1.04 + .03 * seg(t, 43.6, 45.3), -.03 * wob(t, .5));
    fibreTunnel(t, { vp: VPC, jam: .5, speed: .3 });
    // Bit: runs toward the camera from depth 4 (over rows), vault off the packet at depth 1.9 at 44.25
    const zb = kf(t, [[43.6, 5.2], [44.25, 1.95], [45.0, .55]], x => x);
    const air = t > 44.25 ? seg(t, 44.25, 45.0) : 0;
    const rows = [[1.3, -60], [1.95, 30], [2.7, -40], [3.5, 60], [4.4, -30], [5.4, 40], [6.6, -50], [8.0, 20]];
    const drawBit = () => {
      const [x, y, s] = tunnelAt(kf(t, [[43.6, 60], [43.95, -70], [44.25, 30], [45, 0]]), zb, { vp: VPC });
      const lift = 330 * 4 * air * (1 - air) + 500 * air * air;       // arcs up and over the lens
      bit(x, y - lift * s * 1.4, 3.2 * s, { t, limbs: air > 0 ? 'fly' : 'run', phase: t * 3.4, mood: air > 0 ? 'joy' : 'determined', boilKey: 'bitC',
        vel: air > 0 ? [0, -900] : [0, 250], sq: t < 44.25 ? .25 * seg(t, 44.1, 44.25) : -.25 * Math.exp(-air * 6), lookY: air > 0 ? -.5 : 0, mouth: 0 });
    };
    let drawn = false;
    for (let r = rows.length - 1; r >= 0; r--) {
      const [d, X] = rows[r];
      if (!drawn && zb > d) { drawBit(); drawn = true; }
      const [x, y, s] = tunnelAt(X, d, { vp: VPC }), sc = S0 * s * .95;
      const vaulted = r === 1 && t > 44.25, near = r < 3;
      packet(x, y, sc, { t, kind: kindOf(r + 60), seed: r + 60, boilKey: 'c' + r, haze: clamp((d - 1.5) / 7),
        mood: near && lookUp > 0 ? 'shock' : r % 3 === 2 ? 'sleep' : 'bored', lookY: -lookUp * (near ? 1 : .5), emote: null,
        sq: vaulted ? .35 * Math.exp(-(t - 44.25) * 6) : 0, dy: 0 });
    }
    if (!drawn) drawBit();
    camEnd();
  }

  // ------------------------------------------------------------------ shot D · banking weave chase
  function shotD(t, lt) {
    const zb = kf(t, [[45.3, 3.2], [46.6, 12.6], [47.0, 13.3]], x => (x < .8 ? x : x));
    const zc = zb - 1.5, bX = kf(t, [[45.3, 0], [45.6, 190], [45.95, -200], [46.3, 190], [46.65, -60], [47, 0]]);
    const camX = bX * .55, bank = -.05 * (bX / 200);
    camBegin(960, 540, 1.04, bank);
    fibreTunnel(t, { z: zc / .9, jam: .5, speed: 1 });
    // the sign ahead, hanging over the front of the queue
    const signZ = qZ(NQ - 1) + .6, sd = signZ - zc;
    if (sd > .6) {
      const [sx, sy, ss] = tunnelAt(-camX, sd);
      queueSign(sx, sy - 700 * ss, .9 * ss, { t, num: 17, boilKey: 'signD' });
    }
    chaseQueue(t, zc, camX, 1.5, () => {
      const [x, y, s] = tunnelAt(bX - camX, 1.5), vxs = (kf(t + .05, [[45.3, 0], [45.6, 190], [45.95, -200], [46.3, 190], [46.65, -60], [47, 0]]) - bX) * 20;
      bit(x, y, 3.2 * s, { t, back: true, limbs: 'run', phase: t * 3.6, vel: [vxs * 2, -800], rot: vxs * .0005, boilKey: 'bitD', sq: t > 46.7 ? .15 : 0 });
    }, i => {
      const dz = qZ(i) - zb;
      return Math.abs(dz) < .8 ? { mood: 'shock', dx: (i % 2 ? .4 : -.4) * Math.max(0, 1 - Math.abs(dz) / .8) } : {};
    });
    camEnd();
  }

  // ------------------------------------------------------------------ shot E · front of the queue: ILVIP
  function queueBack(t, n, y0, key) {     // a few hazy packets behind the leaders (front view, looking at Bit)
    for (let i = 0; i < n; i++) {
      const x = 180 + i * (1500 / n) + hash(i + 3) * 60, d = 1.8 + (i % 2) * .5;
      packet(x, y0 - 60 * (i % 2), 1.3 + .3 * hash(i), { t, kind: kindOf(i + 80), seed: i + 80, haze: .55 + .15 * (i % 2), boilKey: key + i,
        lookX: .6, mood: i % 3 === 0 ? 'sleep' : 'bored', emote: null, noShadow: true });
    }
  }
  function shotE(t, lt) {
    const push = ease(seg(t, 47.3, 50.05));
    camBegin(lerp(960, 900, push), lerp(540, 560, push), lerp(1.0, 1.12, push));
    fibreTunnel(t, { jam: .6, speed: .15 });
    queueBack(t, 6, 640, 'eb');
    const drop = t - 47.0, sy = lerp(-260, 200, backOut(seg(drop, 0, .45)));
    queueSign(930, sy, .78, { t, num: 17, swing: .09 * spring(t, 47.4, 2.5, 7) + .02 * wob(t, .4), on: seg(drop, .2, .5), flicker: drop < .8 ? .6 : .1, boilKey: 'signE' });
    const eM = packMoods(t, [[47.0, 'sleepy']]);
    brandPacket(470, 860, 2.8, { t, brand: 'EMBY', ...eM, lookX: .6, boilKey: 'embyE' });
    const iM = packMoods(t, [[47.0, 'shock'], [47.45, 'grumpy', { lookX: .8 }]]);
    brandPacket(830, 900, 3.3, { t, brand: 'ILVIP', ...iM, lookX: iM.lookX ?? .6, boilKey: 'ilvipE' });
    // Bit skids in from the right, faces them
    const bx = kf(t, [[47.0, 1900], [47.35, 1400]], easeOut), skid = spring(t, 47.35, 6, 16);
    const bM = packMoods(t, [[47.0, 'determined'], [47.55, 'panic', { lookX: -.8 }], [48.9, 'determined', { lookX: -.7 }]]);
    bit(bx, 915, 2.6, { t, ...bM, sq: bM.sq + .3 * skid, rot: -.25 * Math.exp(-(t - 47.35) * 5) * (t > 47.35 ? 1 : 0) + (t < 47.35 ? -.15 : 0), limbs: t < 47.35 ? 'run' : 'stand', vel: t < 47.35 ? [-1500, 0] : [0, 0], lookX: bM.lookX ?? -.8, mouth: 0, boilKey: 'bitE' });
    camEnd();
  }

  // ------------------------------------------------------------------ shot F · EMBY
  function shotF(t, lt) {
    const push = ease(seg(t, 50.05, 51.6));
    camBegin(lerp(760, 740, push), lerp(520, 500, push), lerp(1.0, 1.08, push));
    fibreTunnel(t, { jam: .6, speed: .15, vp: [1060, 430] });
    queueBack(t, 5, 620, 'fb');
    brandPacket(1400, 1000, 3.6, { t, brand: 'ILVIP', mood: 'grumpy', lookX: -.4, mouth: 0, boilKey: 'ilvipF', haze: .1 });
    brandPacket(700, 960, 4.4, { t, brand: 'EMBY', mood: 'sleepy', lookX: .3, boilKey: 'embyF', dy: -.15 * wob(t, .5) });
    camEnd();
  }

  // ------------------------------------------------------------------ shot G · over-Bit's-shoulder: the cat
  function shotG(t, lt) {
    const drift = seg(t, 51.6, 54.55);
    camBegin(lerp(930, 960, drift), 540, lerp(1.0, 1.06, ease(drift)));
    fibreTunnel(t, { jam: .6, speed: .15, vp: [820, 420] });
    queueBack(t, 5, 610, 'gb');
    // the queue row the cat sits in (normal sizes), cat in the middle
    const row = [[260, 'video'], [520, 'mail'], [1120, 'meme'], [1360, 'shop']];
    row.forEach(([x, k], i) => packet(x, 830 + (i % 2) * 20, 2.3, { t, kind: k, seed: 90 + i, lookX: x < 800 ? .5 : -.5, mood: i === 1 ? 'sleep' : 'bored', emote: null, boilKey: 'gr' + i, haze: .1 }));
    const cM = packMoods(t, [[51.6, 'bored'], [53.5, 'grumpy']]);
    catPacket(820, 860, 2.35, { t, ...cM, lookX: .55, boilKey: 'catG' });
    // Bit's back, big in the right foreground
    const tn = spring(t, 54.2, 5, 12);
    bit(1540, 1230, 5.4, { t, back: true, limbs: 'stand', boilKey: 'bitG', sq: .05 * wob(t, .6) + .1 * tn, rot: -.05, glow: .5 });
    camEnd();
  }

  // ------------------------------------------------------------------ shot H · Bit close-up
  function shotH(t, lt) {
    const push = ease(seg(t, 54.55, 56.45));
    camBegin(960, lerp(560, 540, push), lerp(1.0, 1.1, push));
    fibreTunnel(t, { jam: .45, speed: .2, vp: [760, 380] });
    // hazy rivals behind him (they will look up later)
    brandPacket(360, 760, 2.2, { t, brand: 'ILVIP', mood: 'grumpy', haze: .5, lookX: .6, mouth: 0, boilKey: 'ilvipH', noShadow: true });
    catPacket(1580, 780, 2.2, { t, mood: 'bored', haze: .5, lookX: -.6, mouth: 0, boilKey: 'catH', noShadow: true });
    const m = packMoods(t, [[54.55, 'cheeky', { lookX: -.2 }], [55.95, 'determined', { lookX: 0, lookY: -.3 }]]);
    const cr = seg(t, 56.1, 56.4);
    bit(960, 1200, 7.2, { t, ...m, sq: m.sq + .18 * ease(cr), limbs: cr > 0 ? 'crouch' : 'stand', boilKey: 'bitH', glow: 1 });
    camEnd();
  }

  // ------------------------------------------------------------------ shot I · BOOST over the whole queue
  function shotI(t, lt) {
    const k = seg(t, 56.5, 57.7), camY = lerp(560, 330, ease(seg(t, 56.6, 57.6))), camX = lerp(1000, 1250, ease(k));
    sideBg(t, camX, camY, { jam: lerp(.5, .1, k), boost: ease(seg(t, 56.5, 57.0)) });
    camBegin(camX, camY, .98);
    // Bit: launch at 56.5 from the left, flaming arc up and over
    const bx = lerp(260, 2300, easeIn(k) * .6 + k * .4), by = FLOOR + 20 - 780 * Math.sin(Math.min(1, k * 1.25) * Math.PI / 2) - 160 * k;
    const lookFor = x => { const dx = bx - x; return clamp(dx / 400, -1, 1); };
    const cast = [];
    for (let i = 0; i < 11; i++) cast.push({ x: 380 + i * 175, kind: 'pk', i });
    cast[3].kind = 'ILVIP'; cast[4].kind = 'EMBY'; cast[7].kind = 'CAT';
    for (const c of cast) {
      const tl = 56.55 + Math.abs(c.x - 380) / 1900 * .5, up = seg(t, tl, tl + .15);
      const lk = { lookX: lookFor(c.x) * up, lookY: -up, boilKey: 'ci' + c.i };
      const y = FLOOR + (c.i % 2) * 18;
      if (c.kind === 'ILVIP') brandPacket(c.x, y, 1.9, { t, brand: 'ILVIP', mood: up > .2 ? 'shock' : 'grumpy', mouth: 0, ...lk, emote: up > .2 ? '!' : null });
      else if (c.kind === 'EMBY') brandPacket(c.x, y, 1.8, { t, brand: 'EMBY', mood: up > .2 ? 'shock' : 'sleepy', mouth: 0, ...lk, emote: null });
      else if (c.kind === 'CAT') catPacket(c.x, y, 1.6, { t, mood: up > .2 ? 'shock' : 'bored', moodAge: t - tl, mouth: 0, ...lk });
      else packet(c.x, y, 1.75, { t, kind: kindOf(c.i + 110), seed: c.i + 110, mood: up > .2 ? 'shock' : 'bored', emote: c.i % 4 === 1 && up > .2 ? '!' : null, ...lk,
        dy: -.5 * take(t, tl, .7).dy });
    }
    const pre = t < 56.5 ? 1 : 0;
    bit(bx, by, 2.2, { t, limbs: 'fly', mood: 'joy', boost: ease(seg(t, 56.45, 56.7)), vel: [1900, -1200 * (1 - k)], rot: .5 - .4 * k, mouth: 0, boilKey: 'bitI', sq: pre * .2 });
    camEnd();
    if (lt < .12) flash(.4 * (1 - lt / .12), '#FFE9A8');
  }

  // ------------------------------------------------------------------ shot J · open fibre
  function shotJ(t, lt) {
    const k = seg(t, 57.7, 58.4);
    camBegin(960, 540, 1.0 + .06 * k, .02 * wob(t, 2));
    fibreTunnel(t, { speed: 3.2, boost: 1, jam: 0, z: 60 + (t - 57.7) * 9 });
    const d = lerp(1.1, 9, easeIn(k)), [x, y, s] = tunnelAt(0, d);
    bit(x, lerp(y, 470, k * .6) - 60 * s, 3.4 * s, { t, back: true, limbs: 'fly', vel: [0, -1600], boost: 1 - .5 * k, boilKey: 'bitJ' });
    camEnd();
    flash(1 - easeOut(seg(t, 57.7, 58.0)), GW);
  }

  shots([[39.2, shotA], [41.3, shotB], [43.6, shotC], [45.3, shotD], [47.0, shotE], [50.05, shotF], [51.6, shotG],
         [54.55, shotH], [56.45, shotI], [57.7, shotJ]]);
})();

// c1_drone.js · CHAPTER 1 · Tel Aviv night drone · global 0–10.2 (audio is final, sync is law)
//
// One continuous drone move, no cuts in the drone part (the two joins are hidden in motion: flare smoke, a whip).
//   A  0.00–4.65  high over the coast (sea, Azrieli, rooftops), slow eased descent + slow yaw + gentle float toward the
//                 floodlit stadium (announcer 1.2–4.9 over it); from ~3.9 the drone dives at the RIGHT (home) stand.
//   ~  4.25–5.10  gimbal swing through yellow flare smoke: the smoke covers, the view underneath swings from top-down to
//                 the low oblique (roll settles, push-out), smoke clears over the ultras.
//   B  4.65–8.55  MACCABI home stand: slow lateral glide along the stand (ultras pan), swell 5.2 → roar 5.5–8.3 (jumping,
//                 flags, tifo `מכבי תל אביב`, flares), float + drum-beat micro shake.
//   C  8.45–8.75  whip UP (content streaks down, speed lines), lands on the broadcast mast with a small overshoot.
//   D  8.70–10.2  mast `שידור חי` / `IPTV · ISRAEL`, broadcast rings 8.7, packets launch 9.0 toward the sea, Bit's gold
//                 glint 9.6, camera eases after the stream; 10.0–10.2 gold-white flash out (C2 opens from it).
(() => {
  const GW = '#FFF4D8';
  const HOME = [2830, 2150];                  // world centre of the home (right) stand in tlvCity
  const SWAP = 4.65, WHIP = 8.6;

  // ---------------------------------------------------------------- A: descent over the city
  function droneCity(t) {
    const k = ease(seg(t, 0, 4.1)) * .88;     // tlvDroneCam path, stopping short of the end key
    const c = tlvDroneCam(k);
    const dive = easeIn(seg(t, 3.7, 4.7));    // final dive onto the home stand
    const cx = lerp(c.cx, HOME[0], dive) + 26 * wob(t, .11), cy = lerp(c.cy, HOME[1], dive) + 14 * wob(t, .09, .3);
    const zoom = c.zoom * Math.exp(dive * 1.1) * (1 + .01 * wob(t, .23));
    const rot = lerp(-.07, .05, ease(seg(t, 0, 4.6))) + dive * .12;
    tlvCity(t, { cx, cy, zoom, rot, tilt: .7 }, { stadiumO: { attack: .35 + .1 * seg(t, 2, 4.6), roar: .4 + .4 * seg(t, 3.5, 4.6) } });
  }

  // ---------------------------------------------------------------- flare smoke that hides the gimbal swing
  function smoke(t, a) {
    if (a <= .01) return;
    for (let i = 0; i < 9; i++) {
      boilSeed('c1smoke' + i);
      const x = W * (hash(i * 2.7) * 1.2 - .1) + 90 * wob(t, .5, i * .3) - (t - 4.2) * (140 + 60 * hash(i)),
        y = H * (hash(i * 5.3) * 1.1 - .05) - (t - 4.2) * 60, r = 380 + 260 * hash(i * 9.1);
      paint(ellPts(x, y, r * 1.25, r, 16, 18), { wash: i % 3 ? '#F7DC8A' : '#EFC96A', washOp: 255 * clamp(a * 1.25 - hash(i) * .25), ink: null });
    }
    glow(W / 2, H / 2, 900, '#FFD27A', .6 * a);
  }

  // ---------------------------------------------------------------- B: ultras, low oblique, whip up at the end
  function stand(t) {
    const sw = ease(seg(t, SWAP, 5.25));                         // gimbal swing settle
    const wk = easeIn(seg(t, 8.42, WHIP));                       // whip-up
    const roar = kf(t, [[SWAP, .3], [5.15, .35], [5.3, .6], [5.55, 1], [8.3, .95], [8.5, .7]]);
    const beat = t > 5.5 && t < 8.3 ? pulse(t, 9) : 0;
    const dy = lerp(-160, 0, sw) + 10 * wob(t, .31) - wk * 1400 - beat * 5;
    push(); translate(W / 2, H / 2); rotate(lerp(.09, 0, sw) + .006 * wob(t, .17)); translate(-W / 2, -H / 2);
    ultras(t, { pan: ease(seg(t, SWAP - .3, 8.6)) * .9, roar, zoom: lerp(1.22, 1.03, sw) + .02 * seg(t, 5.3, 8.4), dy });
    pop();
    smoke(t, 1 - ease(seg(t, SWAP, 5.1)));
    if (wk > 0) whipLines(t, wk);
  }
  function whipLines(t, k) {
    boilSeed('c1whip' + Math.floor(t * 24));
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#1C2050', washOp: 200 * k, ink: null });
    for (let i = 0; i < 16; i++) {
      const x = hash(i * 3.1 + Math.floor(t * 24)) * W, y = hash(i * 7.7) * H, l = 300 + 500 * k;
      inkLine([[x, y - l / 2], [x + 8, y + l / 2]], 2 + 3 * hash(i), i % 3 ? '#8FA3D8' : '#F4C63F', 'dry', 0);
    }
  }

  // ---------------------------------------------------------------- C/D: mast, launch, flash out
  function tower(t) {
    const lt = t - WHIP;
    const land = kf(lt, [[0, 700], [.18, -40], [.4, 12], [.7, 0]], easeOut);   // arrive from below, overshoot, settle
    const push_ = ease(seg(t, 9.0, 10.2));
    const cx = 960 + 120 * push_ + 8 * wob(t, .2), cy = 560 + land - 60 * push_ + 6 * wob(t, .27, .4);
    camBegin(cx, cy, 1.02 + .12 * push_, .01 * wob(t, .15));
    const m = mast(t, { broadcast: seg(t, 8.7, 9.1) });
    packetStream([m.top, [1180, 120], [1520, 330], [1900, 640], [2400, 860]], t, { t0: 9.0, n: 12, gap: .1, speed: 950, size: 18, gold: 4, glint: 9.6 });
    camEnd();
    const wk = 1 - easeOut(seg(lt, 0, .2));
    if (wk > 0) whipLines(t, wk * .8);
    flash(ease(seg(t, 9.98, 10.2)), GW);
  }

  shots([
    [0, t => { droneCity(t); smoke(t, ease(seg(t, 4.25, SWAP))); }],
    [SWAP, stand],
    [WHIP, tower],
  ]);
})();

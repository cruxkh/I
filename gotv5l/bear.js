// BEAR presenter inside the end-card TV: says "GO TV!" with lips synced to the audio.
// Viseme keys are measured on the actual "GO TV" clip (energy + zero-crossing analysis) and placed at v = 37.25
// (the clip starts at T 43.45 in master_v7 = T 41.85 in master_v7t = voice clock 37.25).
(() => {
  const { clamp, lerp, ease, hash } = A, C = CL.C, TAU = Math.PI * 2;
  const V0 = 37.25;
  // [t, open, width, teeth, fv(lower lip under teeth), round]
  const K = [
    [-9, .0, .62, 0, 0, 0], [0.00, .0, .62, 0, 0, 0],
    [0.05, .30, .55, 0, 0, .2],   // G
    [0.14, .78, .50, 0, 0, .7],   // O (open round)
    [0.34, .62, .44, 0, 0, .85],  // o
    [0.44, .34, .34, 0, 0, 1],    // u (rounding)
    [0.50, .06, .55, 0, 0, .2],   // pause
    [0.54, .14, .80, 1, 0, 0],    // T (teeth, wide)
    [0.62, .40, .96, 1, 0, 0],    // ii
    [0.82, .32, .92, 1, 0, 0],
    [0.86, .10, .78, 1, 1, 0],    // V (lower lip under upper teeth)
    [0.92, .46, 1.0, 1, 0, 0],    // ii!
    [1.12, .30, .94, 1, 0, 0],
    [1.26, .05, .80, 0, 0, 0],    // smile, closed
    [99, .05, .80, 0, 0, 0]];
  function vis(t) {
    const u = t - V0; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= u) i++;
    const a = K[i], b = K[i + 1], k = ease.inOut(clamp((u - a[0]) / Math.max(.001, b[0] - a[0])));
    return a.map((x, j) => j === 0 ? u : lerp(x, b[j], k));
  }
  const BR = '#9A5B2E', BRD = '#6E3C1A', MZ = '#E7C49A', INK = C.ink;
  // draw the bear centred at (0,0), head radius R
  CL.bear = (g, t, R) => {
    const [u, op, wd, th, fv, rd] = vis(t);
    const talk = u > -0.05 && u < 1.3, breath = Math.sin(t * 3.1) * .012, nod = talk ? Math.sin(clamp(u / 1.3) * Math.PI * 2) * .035 : Math.sin(t * 1.7) * .02;
    g.save(); g.rotate(nod); g.scale(1 + breath, 1 - breath);
    g.lineJoin = 'round'; g.lineWidth = R * .05; g.strokeStyle = INK;
    // ears
    for (const s of [-1, 1]) { g.fillStyle = BR; g.beginPath(); g.arc(s * R * .74, -R * .72, R * .32, 0, TAU); g.fill(); g.stroke(); g.fillStyle = BRD; g.beginPath(); g.arc(s * R * .74, -R * .72, R * .17, 0, TAU); g.fill(); }
    // head
    g.fillStyle = BR; g.beginPath(); g.ellipse(0, 0, R, R * .92, 0, 0, TAU); g.fill(); g.stroke();
    // muzzle
    g.fillStyle = MZ; g.beginPath(); g.ellipse(0, R * .36, R * .52, R * .42 + op * R * .12, 0, 0, TAU); g.fill(); g.stroke();
    // eyes (blink every ~3 s, eyebrows up while talking)
    const bl = (() => { const p = (t + 0.7) % 3.1; return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; })();
    for (const s of [-1, 1]) {
      g.save(); g.translate(s * R * .36, -R * .12);
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, R * .15, R * .17 * (1 - .92 * bl), 0, 0, TAU); g.fill(); g.stroke();
      if (bl < .6) { g.fillStyle = INK; g.beginPath(); g.arc(R * .02, R * .02, R * .085, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(R * .05, -R * .02, R * .03, 0, TAU); g.fill(); }
      g.restore();
      g.save(); g.strokeStyle = BRD; g.lineWidth = R * .06; g.lineCap = 'round'; const up = talk ? R * .06 * Math.min(1, op * 2) : 0;
      g.beginPath(); g.moveTo(s * R * .22, -R * .36 - up); g.quadraticCurveTo(s * R * .36, -R * .45 - up, s * R * .5, -R * .38 - up); g.stroke(); g.restore();
    }
    // nose
    g.fillStyle = INK; g.beginPath(); g.ellipse(0, R * .14, R * .15, R * .1, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-R * .05, R * .11, R * .05, R * .025, 0, 0, TAU); g.fill();
    // mouth
    const mx = 0, my = R * .44, mw = R * .40 * wd, mh = R * .50 * op, rr = rd;
    g.save(); g.translate(mx, my);
    if (op < .08 && !fv) {                                   // closed smile
      g.strokeStyle = INK; g.lineWidth = R * .045; g.lineCap = 'round'; g.beginPath(); g.moveTo(-mw, -R * .02); g.quadraticCurveTo(0, R * .09, mw, -R * .02); g.stroke();
    } else {
      const w = mw * (1 - .35 * rr), h = Math.max(mh, R * .05);
      g.beginPath(); g.ellipse(0, h * .35, w, h * .75 + R * .02, 0, 0, TAU);
      g.fillStyle = '#5A1414'; g.fill(); g.save(); g.clip();
      g.fillStyle = '#E0607A'; g.beginPath(); g.ellipse(0, h * 1.05, w * .7, h * .45, 0, 0, TAU); g.fill();      // tongue
      if (th > .5) { g.fillStyle = '#fff'; g.fillRect(-w * .8, -h * .45 - R * .02, w * 1.6, R * .09 + h * .08); }  // upper teeth
      g.restore();
      g.lineWidth = R * .045; g.strokeStyle = INK; g.beginPath(); g.ellipse(0, h * .35, w, h * .75 + R * .02, 0, 0, TAU); g.stroke();
      if (fv > .5) { g.fillStyle = MZ; g.beginPath(); g.ellipse(0, h * .9, w * .9, R * .07, 0, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = R * .035; g.stroke(); }   // lower lip tucked under the teeth
    }
    g.restore();
    // cheeks
    g.fillStyle = 'rgba(255,110,140,.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * R * .55, R * .22, R * .12, R * .07, 0, 0, TAU); g.fill(); }
    g.restore();
  };
})();

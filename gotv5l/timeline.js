// Master clock with HOLDS: the voice-over pauses and the picture holds on a genre poster while its own sound plays.
// T = output time (video/audio seconds), v = voice clock (all scene/word times are in v).
(() => {
  const HOLDS = [
    { v: 11.79, d: 1.4, k: 'cin' },    // after "וצ'רלטון": the narrator turns into a cinema trailer voice, letterbox + projector, echo
    { v: 13.065, d: 1.0, k: 'tur' },   // after "טורקיות": Turkish drama sting + sob
    { v: 13.94, d: 1.0, k: 'kor' },    // after "קוריאניות": a short spoken Korean line
    { v: 14.53, d: 1.2, k: 'ani' },    // after "אנימה": anime voice + sting
  ];
  const VDUR = 43.7, TOTAL = VDUR + HOLDS.reduce((s, h) => s + h.d, 0);
  const vOf = T => { let acc = 0; for (const h of HOLDS) { const hs = h.v + acc; if (T < hs) return T - acc; if (T < hs + h.d) return h.v; acc += h.d; } return T - acc; };
  const holdAt = T => { let acc = 0; for (const h of HOLDS) { const hs = h.v + acc; if (T >= hs && T < hs + h.d) return { ...h, T0: hs, u: (T - hs) / h.d, age: T - hs }; acc += h.d; } return null; };
  const TofV = v => v + HOLDS.filter(h => h.v < v).reduce((s, h) => s + h.d, 0);
  window.TLF = { HOLDS, VDUR, TOTAL, vOf, holdAt, TofV };
  A.DUR = TOTAL;
})();

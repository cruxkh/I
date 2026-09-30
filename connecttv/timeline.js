// Master clock with HOLDS: the voice-over pauses and the picture holds on a genre moment while its own sound plays.
// T = output time (video/audio seconds), v = voice clock (all scene/word times are in v).
(() => {
  const HOLDS = [
    { v: 8.85, d: 1.4, k: 'cin' },     // after "צ'רלטון": the narrator turns into a cinema trailer voice, letterbox + projector, echo
    { v: 9.98, d: 1.0, k: 'tur' },     // after "טורקיות": Turkish drama sting + sob
    { v: 11.03, d: 1.1, k: 'ind' },    // after "הודיות": Bollywood sting, sitar + tabla + a spoken Hindi line
  ];
  const VDUR = 30.6, TOTAL = VDUR + HOLDS.reduce((s, h) => s + h.d, 0);
  const vOf = T => { let acc = 0; for (const h of HOLDS) { const hs = h.v + acc; if (T < hs) return T - acc; if (T < hs + h.d) return h.v; acc += h.d; } return T - acc; };
  const holdAt = T => { let acc = 0; for (const h of HOLDS) { const hs = h.v + acc; if (T >= hs && T < hs + h.d) return { ...h, T0: hs, u: (T - hs) / h.d, age: T - hs }; acc += h.d; } return null; };
  const TofV = v => v + HOLDS.filter(h => h.v < v).reduce((s, h) => s + h.d, 0);
  window.TLF = { HOLDS, VDUR, TOTAL, vOf, holdAt, TofV };
  A.DUR = TOTAL;
})();

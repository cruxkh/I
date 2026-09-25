(() => {
LOOPS.kit_family = t => {
  const mode = Math.floor(t);
  boilSeed('bg');
  const P = i => [100 + (i % 10) * 170, 100 + Math.floor(i / 10) * 90];
  if (mode === 0) clawd(960, 800, 40, feel('happy', t));
  if (mode === 1) for (let i = 0; i < 30; i++) paint(ellPts(...P(i), 60, 35, 20, 2), { fill: PAL.clay, fillOp: 150, bleed: .15, tex: .5, ink: null });
  if (mode === 2) for (let i = 0; i < 3; i++) paint(ellPts(...P(i), 60, 35, 20, 2), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 60, bleed: .05, tex: .5, ink: null });
  if (mode === 3) { for (let i = 0; i < 10; i++) paint(ellPts(...P(i), 60, 35, 20, 2), { wash: PAL.clay, ink: null }); for (let i = 0; i < 10; i++) paint(ellPts(...P(i), 40, 25, 20, 2), { fill: PAL.clayDk, fillOp: 100, ink: null }); }
  if (mode === 4) for (let i = 0; i < 5; i++) { paint(ellPts(...P(i), 60, 35, 20, 2), { wash: PAL.clay, ink: null }); paint(ellPts(...P(i), 40, 25, 20, 2), { fill: PAL.clayDk, fillOp: 100, ink: null }); }
  if (mode === 5) for (let i = 0; i < 5; i++) { paint(ellPts(...P(i), 60, 35, 20, 2), { wash: PAL.clay, ink: PAL.ink }); }
};
LOOPS.kit_family.len = 7;
})();

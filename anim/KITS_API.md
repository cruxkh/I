# Kit notes from the kit builders (read with BIBLE.md). Authoritative docs are the comment blocks atop each kit file.

## home.js
- A.LR: chair{700,760} (Saba seat contact), sofa{1100,790} (Noa on a leather pouf — no sofa), tv{x:1255,y:350,w:440,h:248} = SCREEN rect (bezel/stand drawn around; stand meets cabinet top y≈650), router{x:1475,y:824,s:0.42} bottom-centre on cabinet's lower shelf + scale for master, window{90,95,390,500}, lamp{600,292} (key light), floorY 880, wallBase 735, cabinet{1190,648,570,200}, sideTable{932,700}, bamba{902,700}, teapot{952,700}, photo{880,165,210,150}, hamsa{1168,238}, pennant{1330,160}, noaCrouch{1395,900} (suggested Noa spot at router).
- drawLivingRoom(ctx,t,o): o.tvGlow (number|colour|{color,intensity}), o.flash, o.lamp, o.snow, o.steam. Not TV/armchair/router.
- drawArmchair(ctx,x,y,s,'back'|'front'): teal velvet wing-back, 3/4 facing right; front layer = near arm covering Saba's hip.
- drawTVScreen(ctx,x,y,w,h,t,o): o.state live|freeze|goal; o.matchT defaults live=t-13, freeze=1.5, goal=1.5+(t-46) (ball in net at matchT 1.9 = global 46.4); o.freezeGlitch (samples ctx.canvas pixels — draw TV directly on main canvas), o.spinner, o.bufferPct, o.freezeT. Score flips to 2–1 at matchT 2.6; big "גול!/GOAL!" slam at ≈2.2, shrinks to top ≈4.4.
- drawTV(ctx,x,y,w,h,t,o): bezel+stand+screen+glare; o.stand, o.glare, o.off.
- drawRouter(ctx,x,y,s,o): PASS o.t. o.activity, o.ledGlow 0..3, o.shake, o.ledColor. A.routerLED(x,y,s) -> [x-66s, y-40s] (.x/.y too).
- drawTorontoStreet(ctx,t,o): o.cam{x,y,zoom} parallax (set layer matches A.camera(ctx,cam) so A.STREET points can be drawn under that camera), o.snow, o.wind, o.windowGlow.
- A.STREET: poleBase[492,1080], poleTop[492,150], wireStart[612,214], wireEnd ≈(1786,348), window{cx≈1740,cy≈400,...}, entry, path (polyline from bottom up pole, along wire, into window), at(p)->[x,y,angle] by arc-length fraction, pathLength, lamps, cnTower[1185,70].
- drawSnow(ctx,t,o): rect,density,count,wind,depth(num|[d0,d1]),size,speed,alpha,seed.
- Zoom: static layers auto-cached at 2x when zoom>1.15; TV/router/armchair are live vectors (sharp at any zoom).

## datafolk.js
- drawBit (~122px tall at 1; scales 0.5–1 wide, 1.4–2.2 medium, 3–5 close-up). A.bitCore(x,y,scale) = core point (trail head).
  o.mood determined|panic|cheeky|joy(o.joyEyes:'open')|exhausted|squeeze|neutral; o.limbs run|fly|flop|arms-up|stand|crouch|push (auto from mood/vel/boost);
  o.vel [vx,vy] (squash, trail, lean, tag drag); o.boost 0..1; o.wink 0..1 (o.winkEye 'L'|'R'); o.glow 0..2; overrides o.rot,o.squash,o.stretch,o.hop,
  o.armL/armR/legL/legR [x,y], o.browRaise,o.browL/R,o.lid,o.pupil,o.blink,o.phase,o.runRate,o.trail(0=off),o.trailColor,o.tagAng,o.tagSwing,o.light,o.rim,o.shadow,o.sweat,o.sparkle.
- drawPacket (~90px; 0.4–2.5): o.kind mail|video|meme|update|shop|photo, o.seed, o.mood bored|annoyed|sleep(o.noZ)|shock, o.honk 0..1 (animate 0→1→0), o.mouth,o.look,o.rot,o.squash,o.glow. Cheap (40 = 1.5ms).
- drawCatPacket (~265 tall, 290 wide; 1–2.2): o.mood bored|grumpy|shock, o.arms crossed|down|point, o.shades 0..1 (slide sunglasses onto eyes), o.lid,o.browRaise,o.rot,o.squash,o.glow,o.tail.
- drawShark (~720 long at 1, (x,y)=body centre, faces right; 0.5–1.2): o.bite 0..1, o.mood hungry|dazed (o.stars), o.swim, o.look,o.flip,o.rot,o.bandaid. A.sharkNose(x,y,scale,o), A.sharkJaw(...).
- drawBinaryTrail(ctx,pts tail→head,t,o): color '#ffc93c', width 30, size 20, alpha, speed, spacing, rows, seed, core, digits:false.

## family.js
- drawSaba (~560 standing at 1). pose sit|rise(o.rise)|stand|jump; mood neutral|eager|tense|horror|joy; gesture none|fists|point|headHands|armsUp|grip; lean, scarfWave, look, mouth, t, flip.
- drawNoa (~400 to top of hair). pose sit|stand|crouch; mood neutral|amused|focused|joy|proud; gesture none|mug|reach|shrug|cheer; hug 0..1.
- Facing: screen-right light 3/4; flip faces left. Anchors: Saba sit/rise = seat contact, floor o.floor (150) below; at rise 1 feet at y+150. Saba jump = floor under him (o.air = jump height). Noa sit = seat, feet o.floor (100) below; sitStyle:'floor' cross-legged anchor=floor.
- Blends: moodFrom+moodK, gestureFrom+gestureK. Arms: armL/armR [shoulderDeg,elbowDeg], handL/handR IK targets (anchor-local), handShapeL/R relax|open|fist|point|grip, wristL/R, armRBehind. Face: headTilt, turn(0.25), browRaise, browAngle, browL/R, lid, happy, smile, jaw. Body: squash, shoulders, breath, idle, tremble. Light: light, rimColor, rimA, lw, shadow, vel (scarf/curls trail). Saba: air, floor, armrestX/Y, glint. Noa: reachTo, sitStyle, floor, bounce, mugTilt, steam.
- Master scales: Saba 0.95 in chair at A.LR.chair (700,760) -> head top ~395, feet ~903. Noa 0.95 at x≈1100, feet y≈905, usually flip:true to face Saba. A.LR.sofa is a pouf at (1100,790): sit pose there.

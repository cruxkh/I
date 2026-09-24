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

## journey.js
- drawTelAviv(ctx,t,o): world 3840x2160, o.cam {x,y,zoom} same maths as A.camera (default {1920,1080,0.5} = whole panorama). Main plane == A.camera(ctx,o.cam) so overlays use world coords. o.roar, o.broadcast (mast pulse rings). Crisp to zoom 2.5.
- A.TLV: stadium{545,1695,rx456,ry176}, mast{1238,1518}, mastTop{1238,836}, building{1167,1915,top1545}, sign{1112,1452} (שידור חי), iptvSign{1167,1578}, seaHorizon{y1150,x0 2600,x1 3840}, moon{3230,330}, azrieli{1570,470}, jaffa{2690,1110}, coast[...], launchPath (mast top over Azrieli out to sea (4200,1330)).
  A.TLV.cams: wide{1920,1080,.5}, stadium{550,1665,2.0}, mast{1230,1215,1.35}, mastTop{1300,1000,2.2}, azrieli{1600,900,1.2}, sea{2900,1250,1.0}, seaWide{2700,1150,.7}. Suggested: stadium->mast whip at 4.6; from 5.0 pull toward {1700,1000,0.9} while packet stream head 0->1.
- drawStadiumClose(ctx,t,o): o.roar 0..1; centre kept clear.
- drawDataTunnel(ctx,t,o): o.speed(1), o.z (default t*4*speed), o.hue, o.jam 0..1. Vanishing point (960,470); a character ~1 unit deep has feet at y≈854; middle band dimmed.
- drawOceanFloor(ctx,t,o): o.scroll (layers 0.2/0.5/1/1.35), o.cableY (760), o.cableW (56), o.depthTint. A.oceanCablePath(x,o) with same o.
- drawRouteMap(ctx,x,y,w,h,t,o): o.p 0..1, o.km (default p*11000), o.alpha. Inset ~500x280, also good full-frame.
- drawPacketStream(ctx,pts,t,o): count 40, speed .35, size 14, spread 26, head 0..1 (animate for launch), colors, alpha, seed, trail.

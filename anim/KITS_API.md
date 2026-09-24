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

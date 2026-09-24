# Shot lists (global seconds). Directors: these are the minimum beats — plus your own inventive staging.

## S1 · `scenes/s1_telaviv.js` · 0.0–6.2 · "The broadcast"
1. 0.0–2.6 Wide establishing crane shot of the Tel Aviv panorama at night; slow push/drift toward the stadium; stars twinkle,
   sea glints, a plane's blinking light crosses the sky. Title-like small caption top-left fades in/out: `תל אביב · 22:47`.
2. 2.6–4.5 Closer on the stadium (drawStadiumClose or zoomed panorama): crowd rising "ooh", floodlights, flags; the announcer
   line plays (1.2–4.9). Cut or seamless zoom.
3. 4.5–5.0 Whip-pan UP to the broadcast mast / IPTV building with the `שידור חי` sign — motion-blur smear.
4. 5.0–6.2 Packets burst from the mast (A.drawPacketStream + a few recognisable packets; one gold one = Bit, tiny, catching the
   light for a frame — foreshadowing), camera follows them out over the sea toward the horizon/west. 6.0–6.2 streak / flash
   transition.

## S2 · `scenes/s2_livingroom.js` · 6.2–21.0 · "Buffering"
1. 6.2–7.4 Exterior: snowy Toronto apartment window (use drawTorontoStreet zoomed toward the lit window, or a custom window
   shot) → push in through the frosted glass (dissolve) to the living room. Caption `טורונטו · 15:47` (it's afternoon in
   Toronto? no — 7h behind: 22:47 TLV = 15:47 Toronto; it's winter, already getting dark).
2. 7.4–12.5 Master shot living room: Saba in armchair (sit, eager, lean forward, grip), scarf; Noa on sofa with mug (amused),
   TV live. Saba line 6.9–10.2 (start line over push-in end is fine), Noa 10.5–12.4 — cut to a two-shot or play in master with a
   subtle camera drift; eyes: Saba looks at TV, glances to Noa on "Noa!"; Noa looks at Saba then sips.
3. 12.5–14.5 Tension: faster cutting — TV close-up (striker breaking away, matchT from ~12.6), Saba close-up rising out of the
   chair (o.rise), fists, "Go go go go!", camera pushes in.
4. 14.5 FREEZE: TV close-up frozen with macroblock glitch and spinner — smash-cut in to the frozen screen, then hold. Everything
   feels "paused": a dramatic zoom on Saba's horrified face (15.2–17.3 "No no no! Not now!", headHands). Comic beat: the spinner
   reflected in his glasses.
5. 17.3–19.8 Noa hops off the sofa, crouches at the TV cabinet, reaches for the router (reach), focused. "Hold on, Saba. I'll find
   where it's stuck." Router LEDs: main LED blinking lazily orange.
6. 19.8–21.0 Push in on the router LED (camera zoom 1→6+ on A.routerLED), bloom grows, whoosh; final 0.3 s: white-cyan flash.

## S4 · `scenes/s4_jam.js` · 21.0–30.5 · "The jam"
1. 21.0–21.6 Out of the flash: inside the fibre tunnel (drawDataTunnel with o.jam high) — a bumper-to-bumper jam of packets
   in lanes, honks, brake-light red glow.
2. 21.6–25.0 Find BIT, gold and glowing among the dull commuters, label `#5401 ⚽ GOAL` visible. He squeezes between packets
   (mood 'squeeze'/'determined'), "Excuse me! Live goal coming through! Live goal!" — packets honk/grumble; a tiny timer UI
   element in a corner: `LIVE DELAY: 4.2s…5.1s…` ticking up (tension device).
3. 25.0–27.8 Bit bumps into CATPACKET — reveal from below, huge, slowly turning, sunglasses, bored: "Get in line, kid. Cat videos
   first." Low angle hero-shot of the big guy; Bit tiny in the frame.
4. 27.9–28.6 Bit's face close-up, determined, eyebrows down: "Not today!"
5. 28.6–29.8 Anticipation crouch → BOOST: bright aura, rocket flame, energy trail (A.drawBinaryTrail), camera shake, arcs up and
   over the jam; packets look up in shock; Catpacket's sunglasses fall down onto his eyes.
6. 29.8–30.5 Bursts out the front of the jam into open fibre, the tunnel speed goes huge (o.speed), speed lines, he streaks
   toward the vanishing point → hard cut.

## S5 · `scenes/s5_ocean.js` · 30.5–41.5 · "11,000 km"
1. 30.5–32.2 Deep ocean wide: dark, beautiful; the cable on the floor; a blazing gold pulse (Bit visible inside the transparent
   cable as a tiny glowing figure) streaks along it lighting the seabed as it passes. Map inset (drawRouteMap) slides in top
   right: route progress p from TLV, km counter rolling.
2. 32.2–33.9 Tracking shot alongside Bit inside the cable (closer: see Bit flying, limbs 'fly', joy) as map pins ding past
   Marseille (32.8), Gibraltar (33.6). "Marseille… the Atlantic… whoa, shark!" — on "shark!" his eyes pop.
3. 34.0–35.6 Reveal the shark ahead, hungry, eyeing the glowing cable (real sharks do bite undersea cables).
4. 35.6–36.0 Shark lunges; 36.0 CHOMP on the cable — sparks, impact frame; 36.2 Bit, inside, bounces off the inside of the cable
   right at the shark's nose → electric zap; shark dazed with spiral eyes and stars, drifts off.
5. 37.6–38.6 Bit looks back, cheeky wink: "Nice try, fishy!"; keeps racing.
6. 38.6–41.5 Map shows Atlantic crossing → Halifax → Toronto, km counter to ~11,000; the cable rises toward the surface/shore,
   light increases, lake/snowy shore silhouette, Toronto lights far above; at 41.3–41.5 bright streak transition.

## S6 · `scenes/s6_lastmile.js` · 41.5–46.0 · "Last mile"
1. 41.5–43.4 Snowy Toronto street at night (drawTorontoStreet): Bit (glowing gold) zips up the utility pole, along the wire
   (A.STREET path) with a light trail and snow puffing off the wire; "Last mile… last meter…" — camera follows, parallax.
2. 43.4–44.6 Into the apartment window → interior: the wall socket / cable behind the TV cabinet, Bit racing along the cable
   toward the router (close-up, macro scale — dust bunnies, the underside of the cabinet, a lost Bamba).
3. 44.6–45.3 "Delivered!" — Bit dives into the router port; 44.9 impact: router jolts, all LEDs flare, white flash.
4. 45.3–46.0 Flash settles on a close-up of the TV screen (spinner at 99%… snapping to 100%) to hand over to S7.

## S7 · `scenes/s7_goal.js` · 46.0–60.0 · "Goal!" + tag + title
1. 46.0–46.4 TV close-up: spinner vanishes, picture unfreezes, the strike continues (drawTVScreen state 'goal', matchT from
   ~1.5 at 46.0 so the ball is in the net at 46.4). Net ripples, `גול!` graphic.
2. 46.4–47.6 Cut to master living room: Saba's face frozen in disbelief… announcer "Goooal! Maccabi!" through the TV.
3. 47.6–50.5 Saba LEAPS (jump, armsUp, joy), popcorn/Bamba puffs and yellow/blue confetti explode, scarf whirling, lamp
   swinging, camera shake; "Gooool! Noa, you are a genius!" — he scoops Noa up / hugs her (o.hug).
4. 50.5–53.5 Noa, pleased: "Thank the little packet, Saba." (looks toward the router; Saba looks puzzled at the router).
5. 54.5–57.0 Close-up on the router on the shelf (macro): tiny Bit flops out of the LED port (exhausted, limbs 'flop'),
   "Next time… send the goal earlier." 56.9 wink, sparkle, he conks out with a happy smile, LED goes soft green.
6. 57.3–60.0 **GOTV END CARD (client branding — most important frame of the film).** Bit's glow bursts into a light
   streak that draws/forms the **GOTV** logo: bold wordmark `GOTV` centred and large (the "O" can be a glowing play-button /
   football ring that Bit dives into), deep navy background with soft yellow/blue light, subtle snow/confetti drift.
   Under it the tagline in Hebrew `הטלוויזיה מהבית. בכל מקום.` and smaller English `Live TV from Israel — anywhere.`
   Small film title above or below: `PACKET FROM HOME · חבילה מהבית`. Logo resolves on the 57.3 hit, text follows at ~57.8,
   tiny Bit peeks out from behind the logo and winks ~58.4. Subtitles off (`A.noSubs = t => t > 57.2`). Hold; engine fades 59.2–60.
   If a client logo image exists at `assets/gotv_logo.png`, draw THAT image instead of the synthesized wordmark (load it via
   an <img> preloaded in your file; keep the same animation around it).

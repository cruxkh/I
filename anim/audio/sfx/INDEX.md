# SFX library -- PACKET FROM HOME

All sounds are synthesised procedurally by `audio/tools/sfx.py` (seeded, reproducible: `python3 audio/tools/sfx.py`). 48 kHz, 24-bit WAV.

**Hit offset** = seconds from file start to the sync transient/peak. Place a cue at `t = sync_time - hit`.

**Levels:** one-shots are peak-normalised to -1 dBFS; beds (kind = bed) are RMS-normalised (value in the table) and meant to be pulled down with `gain_db` in the cue sheet. Mono files should be panned with an equal-power pan; stereo files with a balance pan.

| name | ch | dur (s) | hit (s) | kind / level | description |
|---|---|---|---|---|---|
| `stadium_crowd_bed` | st | 9.60 | 0.000 | bed, RMS -20 dBFS | Packed floodlit Maccabi stadium (the v1 crowd, extended for the v7 drone opening): dense murmur/walla of thousands, ultras drum, open-air slap echoes. Energy builds as the drone approaches and ROARS 5.5-8.3 s (over the home stand), then eases as the camera whips away; fade-out 8.7-9.6 s. 9.6 s stereo bed. |
| `crowd_swell_ooh` | st | 4.20 | 2.200 | one-shot, peak -1 dBFS | Crowd "ooOOH" rising-excitement swell: thousands of voices gliding u->o->a and up in pitch, roar underneath. Peak at 2.2 s, then settles. |
| `stadium_goal_eruption` | st | 11.00 | 0.050 | one-shot, peak -1 dBFS | HUGE goal eruption: instant roar of the whole stadium (screaming voices + roar walla), fans' two-finger whistles, air horns, then from ~3.4 s the rhythmic "Ma-cca-BI! (clap clap clap)" chant. Hit at 0.05 s. 11 s, fades out over the last 1.5 s. |
| `city_night_telaviv` | st | 7.00 | 0.000 | bed, RMS -26 dBFS | Tel Aviv night ambience: slow Mediterranean waves washing the promenade, distant traffic hum + a passing car and a far-off moped, crickets in stereo. 7 s bed. |
| `whip_pan` | st | 0.90 | 0.320 | one-shot, peak -1 dBFS | Fast camera whip swish: bright air-rip with L->R motion, tiny low body. Peak at 0.32 s. |
| `data_whoosh` | st | 1.80 | 0.700 | one-shot, peak -1 dBFS | Digital data whoosh: filtered air sweep with a glassy tonal rise and bit-crushed sparkle. Peak at 0.7 s; 1.8 s. |
| `broadcast_launch` | st | 2.60 | 0.020 | one-shot, peak -1 dBFS | Packets launch from the IPTV mast: electric zap + a volley of 7 staggered "pew" packet launches spraying L->R, sub thump, data whoosh tail over the sea. Hit at 0.02 s. |
| `snow_wind_window` | st | 2.60 | 0.000 | bed, RMS -24 dBFS | Snowy Toronto wind heard through a frosted window: soft gusts and a low howl, muffled. Fades out over 2 s as we push inside (6.2 cut). 2.6 s. |
| `room_tone_cozy` | st | 29.40 | 0.000 | bed, RMS -30 dBFS | Cosy apartment room tone: warm air + faint fridge/electric hum, radiator hiss with an occasional metallic tick, wall clock tick-tock (left), faint muffled wind outside. 29.4 s (S2 v7 10.2-39.2 + tail), 0.8 s fade-in/out. |
| `room_tone_tag` | st | 19.20 | 0.000 | bed, RMS -30 dBFS | Same cosy room tone, 19.2 s version for S7 v2 (58.9 -> fades out by 78.1 under the end card). |
| `tv_crowd_live` | mono | 9.10 | 0.000 | bed, RMS -22 dBFS | Live match crowd from the living-room TV (small band-limited speaker, mono): excited murmur building to a rising "ooOOH" as the striker breaks away; ends HARD at 9.1 s (= the 15.3 freeze). Cue at 6.2. |
| `tv_crowd_goal` | mono | 10.00 | 0.050 | one-shot, peak -1 dBFS | The goal eruption heard through the TV speaker (band-limited, mono, slight breakup). Hit at 0.05 s. 10 s. |
| `freeze_glitch` | mono | 1.60 | 0.000 | one-shot, peak -1 dBFS | THE FREEZE: the TV sound stutters in shrinking buffer-repeats, bit-crushes into digital garbage and blips, then tape-stops down to a dead thud. Hit (first stutter) at 0.0 s. 1.6 s. Mono-ish, TV side. |
| `record_scratch` | mono | 0.90 | 0.010 | one-shot, peak -1 dBFS | Vinyl record scratch sting ("wikka-wiiip") -- the comic brake. Hit at 0.01 s. 0.9 s. |
| `buffering_tick_loop` | mono | 5.00 | 0.000 | bed, RMS -26 dBFS | Buffering spinner: soft, patient digital "tk" ticks (8 per second, subtle pitch alternation) -- the sound of waiting. Loopable 5.0 s (period-exact). |
| `sad_trombone` | st | 2.80 | 0.030 | one-shot, peak -1 dBFS | Subtle muted "wah-wah-wah-waaah" sad trombone (plunger-muted, soft, comic despair). First note at 0.03 s. 2.8 s. |
| `router_beeps` | st | 0.90 | 0.000 | one-shot, peak -1 dBFS | Router status beeps: three short square-ish blips + a lower confirm blip, cute and small. First beep at 0.0 s. 0.9 s. |
| `dive_whoosh` | st | 2.40 | 1.000 | one-shot, peak -1 dBFS | Deep dive INTO the router LED: sub rising from 30 Hz, reversed-air suck and a huge sweeping whoosh that peaks at 1.0 s (= the 39.2 flash in v7), then roars away into a tunnel tail. 2.4 s. |
| `light_shimmer` | st | 2.80 | 0.700 | one-shot, peak -1 dBFS | Into-the-light shimmer: a swelling major chord of glassy partials and twinkling sparkles, blooming at 0.7 s (use hit 0.7 on a flash), long airy tail. 2.8 s. |
| `dataworld_ambience` | st | 19.60 | 0.000 | bed, RMS -24 dBFS | Inside the fibre: electric hum with slow beating, flowing data streams (fluttering filtered noise), tiny random digital pips flicking past in stereo, low tunnel air. 19.6 s bed (v7 jam 39.2-58.4 + tail). |
| `traffic_jam_grumble` | st | 17.60 | 0.000 | bed, RMS -24 dBFS | Traffic jam of idling packets: low chugging engine rumble (many slow-pulsing sub motors), impatient grumbling murmurs. 17.6 s bed (v7 39.2 -> the 56.5 boost), fades out over the last 1 s. |
| `packet_honk_hi` | st | 0.26 | 0.010 | one-shot, peak -1 dBFS | Little cartoon bulb-horn honk, high (packet annoyance). Hit 0.01 s. |
| `packet_honk_mid` | st | 0.26 | 0.010 | one-shot, peak -1 dBFS | Cartoon bulb-horn honk, mid pitch. Hit 0.01 s. |
| `packet_honk_lo` | st | 0.26 | 0.010 | one-shot, peak -1 dBFS | Cartoon honk, low and grumpy. Hit 0.01 s. |
| `packet_honk_double` | st | 0.62 | 0.010 | one-shot, peak -1 dBFS | Impatient double honk ("honk-HONK"). Hits at 0.01 and 0.31 s. |
| `squeeze_squeak` | st | 0.35 | 0.020 | one-shot, peak -1 dBFS | Rubbery squeak of Bit squeezing between packets (balloon-rub wobble). Hit 0.02 s. 0.35 s. |
| `bit_charge` | st | 0.66 | 0.600 | one-shot, peak -1 dBFS | Bit crouches and CHARGES: accelerating electric whine 150->2400 Hz with tremolo and crackle, building to the launch. Hit (end/peak) at 0.6 s -- cue so 0.6 s lands on the boost. |
| `bit_rocket_launch` | st | 2.40 | 0.010 | one-shot, peak -1 dBFS | BOOST: explosive rocket ignition (punchy thump + burst), roaring flame that fades over 2 s, rising whistle as Bit climbs over the jam. Hit 0.01 s. |
| `sonic_whoosh` | st | 1.80 | 0.350 | one-shot, peak -1 dBFS | Sonic pass-by: Bit bursts out of the jam -- a hard doppler whoosh with a sonic-boom N-wave thump at the peak (0.35 s), stereo sweep R->L... tail into open fibre. 1.8 s. |
| `zip_streak` | st | 0.55 | 0.100 | one-shot, peak -1 dBFS | Short zippy light-streak "fwip" -- fast pass, bright, for speed lines / cut streaks. Peak 0.1 s. 0.55 s. |
| `underwater_ambience` | st | 11.20 | 0.000 | bed, RMS -23 dBFS | Deep ocean bed: heavy low rumble and pressure, muffled currents, bubble trickles, distant whale-ish groans in a huge dark reverb. 11.2 s. |
| `underwater_plunge` | st | 1.80 | 0.000 | one-shot, peak -1 dBFS | Hard-cut entry into the deep: muffled plunge boom + bubble burst swirling up. Hit 0.0 s. |
| `sonar_ping` | st | 3.00 | 0.000 | one-shot, peak -1 dBFS | Distant sonar ping: pure 1.5 kHz ping with a long, dark underwater echo tail. Hit 0.0 s. 3 s. |
| `cable_hum` | st | 11.00 | 0.000 | bed, RMS -26 dBFS | The glowing undersea cable: glassy singing hum (beating partials) over a mains-like electric drone, faint crackle, with regular pulse "whum"s of data racing through. 11 s bed. |
| `shark_lunge` | st | 1.20 | 0.400 | one-shot, peak -1 dBFS | Shark lunge: surging water rush and low body swoosh with gulping bubbles, building to the bite. Peak at 0.4 s (lands on the CHOMP). 1.2 s. |
| `chomp` | st | 1.10 | 0.005 | one-shot, peak -1 dBFS | Cartoon shark CHOMP on the cable: double teeth clack, crunchy bite, low jaw thump. Hit 0.005 s. 1.1 s. |
| `spark_zap` | st | 1.30 | 0.000 | one-shot, peak -1 dBFS | Electric spark zap from the bitten cable: sharp arc crack, crackling sparks and a buzzing 120 Hz discharge that sputters out. Hit 0.0 s. 1.3 s. |
| `boing` | st | 1.00 | 0.000 | one-shot, peak -1 dBFS | Cartoon BOING: Bit bounces off the shark's nose -- sproingy jaw-harp spring with decaying vibrato and a rubbery thud. Hit 0.0 s. 1.0 s. |
| `dazed_stars` | st | 2.60 | 0.050 | one-shot, peak -1 dBFS | Dazed "tweety" stars: little bird chirps and twinkly glockenspiel dings circling the shark's head (stereo orbit). 2.6 s. |
| `map_ding` | st | 2.00 | 0.000 | one-shot, peak -1 dBFS | Map pin "ding": warm glassy bell with sparkle -- one per city pin. Hit 0.0 s. 2.0 s. |
| `map_ding_arrive` | st | 1.80 | 0.000 | one-shot, peak -1 dBFS | Arrival pin: two-note rising chime (Toronto reached). Hits at 0.0 and 0.14 s. 1.8 s. |
| `km_counter_ticks` | st | 10.40 | 0.000 | bed, RMS -30 dBFS | Mechanical/digital km counter rolling 0 -> 11,000: fast soft ticks that accelerate then slow, ending with a "clunk" at 9.9 s (= arrival). 10.4 s. |
| `shore_arrival_swell` | st | 3.20 | 1.600 | one-shot, peak -1 dBFS | Cable rising to the shore: a big rolling water swell + magical upward shimmer that crests at 1.6 s (= 68.4 in v7), then washes out. 3.2 s. |
| `snowy_street_wind` | st | 5.00 | 0.000 | bed, RMS -24 dBFS | Snowy Toronto street at night: gusting wind with howl, snow hiss, far-off city hum and a distant streetcar bell. 5.0 s bed. |
| `pole_buzz` | st | 5.00 | 0.000 | bed, RMS -28 dBFS | Utility-pole transformer buzz: 120 Hz mains buzz with gritty harmonics and faint arcing sizzle (Toronto = 60 Hz grid). 5 s bed. |
| `wire_zip` | st | 2.20 | 0.000 | one-shot, peak -1 dBFS | Zip along the power line: metallic zipline whirr rising in pitch, wire-singing tone, spark ticks, doppler pan L->R. Starts 0.0 s, peak ~1.2 s. 2.2 s. |
| `delivered_impact` | st | 3.40 | 0.250 | one-shot, peak -1 dBFS | DELIVERED: Bit slams into the router -- reverse-air suck-in, then a huge punchy boom (sub drop + distorted punch), glass & pixel shatter spraying across stereo, digital square-wave debris, long cinematic tail. Hit at 0.25 s. 3.4 s. |
| `pixel_shatter` | st | 2.00 | 0.000 | one-shot, peak -1 dBFS | Glass/pixel shatter layer on its own (tinkly shards + digital square debris). Hit 0.0 s. 2 s. |
| `tv_unfreeze_pop` | st | 0.60 | 0.004 | one-shot, peak -1 dBFS | TV unfreezes: cheerful "bloop" pop (pitch drop) + digital snap-back sparkle. Hit 0.004 s. |
| `ball_net_swish` | st | 1.00 | 0.010 | one-shot, peak -1 dBFS | Ball smashes into the net: strike thud + rushing net swish/rustle with rope creak. Hit 0.01 s. 1.0 s. |
| `popcorn_burst` | st | 1.80 | 0.000 | one-shot, peak -1 dBFS | Popcorn bowl explodes: dozens of kernels popping (dense then sparse) + a whump of the bowl. Hit 0.0 s. 1.8 s. |
| `confetti_popper` | st | 2.60 | 0.000 | one-shot, peak -1 dBFS | Party popper: sharp pop + shower of paper confetti fluttering down (fine stereo crackle). Hit 0.0 s. 2.6 s. |
| `cheer_whoop` | st | 1.70 | 0.030 | one-shot, peak -1 dBFS | Cheer sweetener: a single "whoooo!" + a "woo-HOO!" from different people, small-room close. Hit 0.03 s. 1.7 s. |
| `cheer_group` | st | 2.20 | 0.040 | one-shot, peak -1 dBFS | Small group "yaaay!" cheer sweetener (6 voices + claps), room acoustic. Hit 0.04 s. 2.2 s. |
| `bit_flop` | st | 0.70 | 0.020 | one-shot, peak -1 dBFS | Tiny exhausted flop: Bit plops out of the LED port -- soft squishy thud + tiny deflating squeak. Hit 0.02 s. 0.7 s. |
| `wink_ding` | st | 1.60 | 0.000 | one-shot, peak -1 dBFS | Sparkly wink "ting!": bright high bell + glitter swirl. Hit 0.0 s. 1.6 s. |
| `title_slam` | st | 3.00 | 0.350 | one-shot, peak -1 dBFS | TITLE CARD SLAM: 0.35 s reverse-cymbal suck, then a cinematic hit (sub boom, punchy mid thump, snare-crack, metallic ring) with a bright major-chord shimmer tail that fades by 2.95 s. Hit at 0.35 s. |
| `buffering_ticks_long` | mono | 9.80 | 0.000 | bed, RMS -26 dBFS | Buffering spinner ticks, 9.8 s non-looping version (v7 19.55 -> 29.35, stops as the old box is yanked out); same sound as buffering_tick_loop, 0.4 s fade-out. |
| `tv_crowd_calm` | mono | 5.20 | 0.000 | bed, RMS -22 dBFS | Calm live match crowd on the TV speaker (mono), smooth and relaxed -- the background TV during the backgammon payoff. 5.2 s: 1.5 s fade-in, 0.6 s fade-out. |
| `dice_roll` | st | 1.30 | 0.000 | one-shot, peak -1 dBFS | Backgammon dice thrown onto the wooden board: two dice bounce with shrinking gaps, tumble-rattle, clack against each other, settle. First landing = hit 0.0 s; settled by ~0.8 s. 1.3 s. |
| `checker_clack` | st | 0.50 | 0.000 | one-shot, peak -1 dBFS | Backgammon checker slapped down on a point: hard wood-on-wood clack + board knock, tiny settle click. Hit 0.0 s. 0.5 s. |
| `case_open` | st | 1.80 | 0.020 | one-shot, peak -1 dBFS | Wooden backgammon case opened: two metal latches (click ... click, hit 0.02 / 0.20 s), a short hinge creak, lid lands open with a wooden thunk (0.95 s) and checkers rattle inside. 1.8 s. |
| `gotv_switch` | st | 2.40 | 0.000 | one-shot, peak -1 dBFS | GOTV "switch activated" success: button click (hit 0.0 s), soft power-up sweep, rising D-major bell arpeggio, confirming chord at 0.34 s with warm low swell and a swirl of gold sparkle. 2.4 s. |
| `error_bonk` | mono | 0.80 | 0.005 | one-shot, peak -1 dBFS | Old-provider error: dull cheap two-tone "bonk-bonk" (descending buzzy square through the TV speaker) + a dead thunk. Mono. Hit 0.005 s; second bonk at 0.21 s. 0.8 s. |
| `sleepy_tuba_wah` | st | 2.20 | 0.050 | one-shot, peak -1 dBFS | Comic deflating tuba "wuaaah..." for the sleepy buffering packet: one long low note sagging F2 -> C2 with a lazy widening wobble, closing wah and a deflating hiss/pfft. Hit 0.05 s. 2.2 s. |
| `packet_pant` | st | 3.60 | 0.000 | one-shot, peak -1 dBFS | Two little exhausted packets panting "hh-hh-hh" (tiny breathy voices, slightly out of step, L/R), arriving late. 3.6 s with fade-in 0.3 / fade-out 0.8. |
| `cable_yank` | st | 1.30 | 0.150 | one-shot, peak -1 dBFS | Noa yanks the old set-top box out: plastic scrape on the shelf, two plugs popping out (main pop = hit 0.15 s, second 0.24 s), cable spaghetti whipping through the air, rattle. 1.3 s. |
| `trash_crash` | st | 1.50 | 0.000 | one-shot, peak -1 dBFS | Old box tossed into a metal trash bin: plastic-box thud + ringing bin clang, cables slapping, debris rattle settling. Hit 0.0 s. 1.5 s. |
| `phone_whoosh` | st | 0.90 | 0.180 | one-shot, peak -1 dBFS | Phone pulled out + unlocked: quick soft swoosh (peak = hit 0.18 s), glassy unlock tick and a gentle UI shimmer blip. 0.9 s. |
| `wa_send` | st | 0.45 | 0.000 | one-shot, peak -1 dBFS | Chat message sent: soft rounded upward "whoop" bubble (original, not a brand sound). Hit 0.0 s. 0.45 s. |
| `wa_typing` | st | 0.80 | 0.000 | one-shot, peak -1 dBFS | Someone is typing: 7 soft irregular phone-keyboard taps (tiny glassy ticks). First tap 0.0 s. 0.8 s. |
| `wa_receive` | st | 0.90 | 0.000 | one-shot, peak -1 dBFS | Chat reply received: bright two-note marimba-bell "ba-ding" (up a fifth), friendly. Hits 0.0 / 0.09 s. 0.9 s. |
| `bit_laugh` | st | 1.30 | 0.020 | one-shot, peak -1 dBFS | Bit giggles at the shark: short high cartoon "hee-hee-hee-hah!" (voiced h-bursts, pitch around Bit's voice, tumbling down), underwater-tinted. Hit 0.02 s. 1.3 s. |
| `stadium_chant` | st | 10.40 | 0.000 | one-shot, peak -1 dBFS | Maccabi home stand, ultras in full voice (S1 v7 drone approach): thousands singing a rhythmic "oh-OH, Ma-cca-BI!" style chant on vowels (no real lyrics, 120 bpm), bass drums + snare on the chant rhythm, claps, flare hiss and sputter (right), whistles, crowd roar. Distance-shaped: dark and reverberant at 0 s, close, bright and loudest 5.5-8.3 s, whips away/darker after 8.5 s. 10.4 s, fade-out from 9.9. |
| `bit_run_steps` | st | 2.00 | 0.000 | bed, RMS -24 dBFS | Bit running (chase cam): quick light cartoon footsteps -- rubbery-plastic little taps with a soft tunnel ring, ~9 steps/s, slight L/R alternation. 2.0 s, even and loopable-ish; place back to back. |
| `packet_bump` | st | 0.50 | 0.005 | one-shot, peak -1 dBFS | Bit bumps/shoves between packets: squishy rubbery body bump -- soft low "bwomp" + tiny squeak. Hit 0.005 s. 0.5 s. |
| `stadium_drums` | st | 9.60 | 0.000 | bed, RMS -20 dBFS | Big ultras drums in the stand: three bass drums + floor tom on a driving 132-bpm pattern with accents, open-air stadium slap echo. Builds to full power 5.5-8.3 s, eases after; fade-out 8.8-9.6 s. 9.6 s. |
| `fan_whistles` | st | 2.60 | 0.020 | one-shot, peak -1 dBFS | Cluster of fans' two-finger whistles and a trilled pea-whistle across the stand, open-air echo. First whistle 0.02 s. 2.6 s. |
| `flag_flutter` | st | 3.00 | 0.000 | bed, RMS -20 dBFS | Huge tifo flags and scarves flapping in the wind close to the drone: heavy cloth flaps and whips with fabric rustle, stereo. 3.0 s, fades in/out. |
| `ball_kick` | st | 0.60 | 0.003 | one-shot, peak -1 dBFS | Football kick: leather "thwack" + boot thud, close and punchy, small outdoor echo. Hit 0.003 s. 0.6 s. |
| `ball_kick_far` | st | 0.90 | 0.003 | one-shot, peak -1 dBFS | Football kick heard from the stands/drone: softer, darker thud with big stadium echo. Hit 0.003 s. 0.9 s. |
| `ref_whistle` | st | 1.40 | 0.010 | one-shot, peak -1 dBFS | Referee pea-whistle: short-short-LONG blast ("pip-pip-peeeep") with trill, on the pitch. Hit 0.01 s. 1.4 s. |
| `crowd_ooh_aah` | st | 2.20 | 0.800 | one-shot, peak -1 dBFS | Crowd near-miss reaction: quick rising "ooOOH" (peak = hit 0.8 s) snapping into a falling "aaahh". 2.2 s stereo. |
| `tv_ball_kick` | mono | 0.70 | 0.003 | one-shot, peak -1 dBFS | Ball kick heard through the TV speaker (mono, band-limited). Hit 0.003 s. |
| `tv_ref_whistle` | mono | 1.40 | 0.010 | one-shot, peak -1 dBFS | Referee whistle through the TV speaker (mono). Hit 0.01 s. |
| `tv_crowd_ooh_aah` | mono | 2.20 | 0.800 | one-shot, peak -1 dBFS | Crowd "ooh-aah" near-miss through the TV speaker (mono). Peak/hit 0.8 s. 2.2 s. |

See `audio/cues/base.json` for how these are placed on the 60 s timeline; mixing notes are in the header of `audio/tools/preview_mix.py`.

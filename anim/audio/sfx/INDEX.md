# SFX library -- PACKET FROM HOME

All sounds are synthesised procedurally by `audio/tools/sfx.py` (seeded, reproducible: `python3 audio/tools/sfx.py`). 48 kHz, 24-bit WAV.

**Hit offset** = seconds from file start to the sync transient/peak. Place a cue at `t = sync_time - hit`.

**Levels:** one-shots are peak-normalised to -1 dBFS; beds (kind = bed) are RMS-normalised (value in the table) and meant to be pulled down with `gain_db` in the cue sheet. Mono files should be panned with an equal-power pan; stereo files with a balance pan.

| name | ch | dur (s) | hit (s) | kind / level | description |
|---|---|---|---|---|---|
| `stadium_crowd_bed` | st | 7.20 | 0.000 | bed, RMS -22 dBFS | Packed floodlit stadium heard from the wide Tel Aviv shot: dense murmur/walla, distant ultras drum, open-air slap echoes. Energy lifts over the 7 s. Stereo bed. |
| `crowd_swell_ooh` | st | 4.20 | 2.200 | one-shot, peak -1 dBFS | Crowd "ooOOH" rising-excitement swell: thousands of voices gliding u->o->a and up in pitch, roar underneath. Peak at 2.2 s, then settles. |
| `stadium_goal_eruption` | st | 11.00 | 0.050 | one-shot, peak -1 dBFS | HUGE goal eruption: instant roar of the whole stadium (screaming voices + roar walla), fans' two-finger whistles, air horns, then from ~3.4 s the rhythmic "Ma-cca-BI! (clap clap clap)" chant. Hit at 0.05 s. 11 s, fades out over the last 1.5 s. |
| `city_night_telaviv` | st | 7.00 | 0.000 | bed, RMS -26 dBFS | Tel Aviv night ambience: slow Mediterranean waves washing the promenade, distant traffic hum + a passing car and a far-off moped, crickets in stereo. 7 s bed. |
| `whip_pan` | st | 0.90 | 0.320 | one-shot, peak -1 dBFS | Fast camera whip swish: bright air-rip with L->R motion, tiny low body. Peak at 0.32 s. |
| `data_whoosh` | st | 1.80 | 0.700 | one-shot, peak -1 dBFS | Digital data whoosh: filtered air sweep with a glassy tonal rise and bit-crushed sparkle. Peak at 0.7 s; 1.8 s. |
| `broadcast_launch` | st | 2.60 | 0.020 | one-shot, peak -1 dBFS | Packets launch from the IPTV mast: electric zap + a volley of 7 staggered "pew" packet launches spraying L->R, sub thump, data whoosh tail over the sea. Hit at 0.02 s. |
| `snow_wind_window` | st | 2.60 | 0.000 | bed, RMS -24 dBFS | Snowy Toronto wind heard through a frosted window: soft gusts and a low howl, muffled. Fades out over 2 s as we push inside (6.2 cut). 2.6 s. |
| `room_tone_cozy` | st | 15.50 | 0.000 | bed, RMS -30 dBFS | Cosy apartment room tone: warm air + faint fridge/electric hum, radiator hiss with an occasional metallic tick, wall clock tick-tock (left), faint muffled wind outside. 15.5 s, 0.8 s fade-in. |
| `tv_crowd_live` | mono | 8.30 | 0.000 | bed, RMS -22 dBFS | Live match crowd from the living-room TV (small band-limited speaker, mono): excited murmur building to a rising "ooOOH" as the striker breaks away; ends HARD at 8.3 s (= the 14.5 freeze). Cue at 6.2. |
| `tv_crowd_goal` | mono | 10.00 | 0.050 | one-shot, peak -1 dBFS | The goal eruption heard through the TV speaker (band-limited, mono, slight breakup). Hit at 0.05 s. 10 s. |
| `freeze_glitch` | mono | 1.60 | 0.000 | one-shot, peak -1 dBFS | THE FREEZE: the TV sound stutters in shrinking buffer-repeats, bit-crushes into digital garbage and blips, then tape-stops down to a dead thud. Hit (first stutter) at 0.0 s. 1.6 s. Mono-ish, TV side. |
| `record_scratch` | mono | 0.90 | 0.010 | one-shot, peak -1 dBFS | Vinyl record scratch sting ("wikka-wiiip") -- the comic brake. Hit at 0.01 s. 0.9 s. |
| `buffering_tick_loop` | mono | 5.00 | 0.000 | bed, RMS -26 dBFS | Buffering spinner: soft, patient digital "tk" ticks (8 per second, subtle pitch alternation) -- the sound of waiting. Loopable 5.0 s (period-exact). |
| `sad_trombone` | st | 2.80 | 0.030 | one-shot, peak -1 dBFS | Subtle muted "wah-wah-wah-waaah" sad trombone (plunger-muted, soft, comic despair). First note at 0.03 s. 2.8 s. |
| `router_beeps` | st | 0.90 | 0.000 | one-shot, peak -1 dBFS | Router status beeps: three short square-ish blips + a lower confirm blip, cute and small. First beep at 0.0 s. 0.9 s. |
| `dive_whoosh` | st | 2.40 | 1.000 | one-shot, peak -1 dBFS | Deep dive INTO the router LED: sub rising from 30 Hz, reversed-air suck and a huge sweeping whoosh that peaks at 1.0 s (= 20.3), then roars away into a tunnel tail. 2.4 s. |
| `light_shimmer` | st | 2.80 | 0.700 | one-shot, peak -1 dBFS | Into-the-light shimmer: a swelling major chord of glassy partials and twinkling sparkles, blooming at 0.7 s (the white-cyan flash at 21.0), long airy tail. 2.8 s. |
| `dataworld_ambience` | st | 10.00 | 0.000 | bed, RMS -24 dBFS | Inside the fibre: electric hum with slow beating, flowing data streams (fluttering filtered noise), tiny random digital pips flicking past in stereo, low tunnel air. 10 s bed. |
| `traffic_jam_grumble` | st | 8.00 | 0.000 | bed, RMS -24 dBFS | Traffic jam of idling packets: low chugging engine rumble (many slow-pulsing sub motors), impatient grumbling murmurs. 8 s bed, fades out over the last 1 s. |
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
| `shore_arrival_swell` | st | 3.20 | 1.600 | one-shot, peak -1 dBFS | Cable rising to the shore: a big rolling water swell + magical upward shimmer that crests at 1.6 s (= 40.5), then washes out. 3.2 s. |
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

See `audio/cues/base.json` for how these are placed on the 60 s timeline; mixing notes are in the header of `audio/tools/preview_mix.py`.

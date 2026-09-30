# ConnectTV score notes (audio/ctv)

Files: `score_ctv.py` (renders everything, ~100 s), `score_ctv.wav` (48 kHz stereo 24-bit, exactly 34.100 s = 1 636 800 samples, peak -2.1 dBFS, -1.3 dBTP, -14.5 LUFS),
`score_ctv_nodays.wav` (same minus the 7 day-pop notes, in case the SFX agent plays them), `stems/*.wav` (drums, perc, strings, brass, choir, synth, fx, days; they sum exactly to score_ctv.wav),
`score_ctv_spectrogram.png`. Needs `../v7/samples` (VSCO-2-CE core + Virtuosity Drums), `samples_extra/` (VSCO-2-CE flute, oboe, glock, solo violin, pizzicati, ethnic drums), `sf/GeneralUser-GS.sf2` (choir/celesta via the fluidsynth CLI).

## Music
- Original epic-pop trailer anthem, **E minor lifting to G major** (relative-major "radiant drop"). Brand motif ("Con-nect-T-V") = **B E F# G** in minor, **D G A B** in major.
- Hook (E minor, horns + trumpets, violins double): B4 | E5 F#5 | G5 (Netflix slam) F#5 | E5 D5 E5 | F#5 A5 -> B pedal; harmony Em | C | D | B, cadence B -> Em on the Charlton slam.
- Chorus (G major): D5 G5 A5 B5 (peak lands on the "נגיש" tap) then D6 B5 C6 (goal). Finale: D5 G5 A5 -> B5 on the logo slam, cadence D -> G.
- Real samples: violin/viola/cello/bass spiccato + sustain + tremolo + pizzicato, horns/trumpets/trombones/tuba, 5 timpani, concert bass drum, snare, cymbals, gong, harp, upright piano, glock, flute, oboe (shehnai/duduk), Virtuosity kit. Synth only for sub, taiko/trailer bodies, braaam, zap, sitar (Karplus-Strong + jawari buzz), tabla, harmonium, formant "aa" vocalise, kanun, darbuka, risers. All pitched percussion/drum bodies are tuned to the chord root.
- Duck-friendly: -3 dB carve at 250-3000 Hz under the voice (measured mid-band under VO 4.6 dB lower than elsewhere); stems given for the mixer.

## Tempo map (T = output clock, v = voice clock; T = v + holds before v; holds cin 8.85/1.4, tur 9.98/1.0, ind 11.03/1.1)
| T | region | tempo |
|---|---|---|
| 0 - 0.74 | dark drone, riser, heartbeat | free |
| 0.74 - 3.40 | bolt crack, flood, 2.33 hit, B pedal | 113 BPM, hook enters at 3.40 |
| 3.40 - 8.32 | E minor hook, sports build | 128.0 BPM (42 sixteenths, slam = 10.5 beats) |
| 8.85 - 10.25 | cin braaam hold | free, accelerating run 16ths -> 32nds |
| 10.26 - 11.38 | "series" drive | 134 BPM (10 sixteenths) |
| 11.38 - 12.38 | tur hold | 120 BPM feel (dum 0, dum .25, DUM .5) |
| 12.39 - 13.43 | 3-3-3 riff | 130 BPM (9 sixteenths) |
| 13.43 - 14.54 | ind hold | 122 BPM (9 sixteenths, 3+3+3 bounce) |
| 14.54 - 17.32 | live, theme returns | 129.5 BPM (6 beats) |
| 17.32 - 20.25 | G major drop | 114 -> 121 BPM, day-pops = 7 notes 0.1483 s apart |
| 20.90 - 22.28 | goal | 130 BPM |
| 22.28 - 24.79 | premiere countdown | event-driven (cue hits) |
| 24.79 - 25.86 | discover burst, 6 reveals every 0.1 s | 150 BPM 16ths |
| 25.86 - 28.30 | NO slams, dizzy pulse | 125 BPM feel |
| 28.58 - 31.10 | finale build | 124 BPM, hits on the scene cues |
| 31.10 - 34.10 | resolved tail, cos^1.5 fade over the last 1.05 s | - |

## Hit list (T output time / v voice time). Every impact is programmed on the cue time (checked in the render report: offset 0 ms; Disney harp gliss starts 11 ms early on purpose)
0.74 (v0.74) bolt crack: zap + timpani + low brass + boom | 1.26 shard burst | 1.70 / 1.85 sparkle pings | 2.33 (v2.33) "נפתח" C major tutti + choir + harp/celesta sweep |
3.40 hook starts (rimshot 3.41) | 4.34 (v4.34) Netflix tutti stab on Em | 5.99 (v5.99) Disney harp/glock/celesta sparkle (C lydian) | 6.43 plus-pop ping | 6.78 lights flash swell | 7.47 hero slam (B stab) |
8.03-8.31 snare roll (matches the scene's hits) | **8.32 (v8.32) Charlton slam** (power-chord E tutti, trailer drum, gong), 8.585 stab |
**cin hold 8.85-10.25**: braaam (trombones+tuba+horns+synth), timpani roll, choir swell, second braaam on F (9.55), accelerating spiccato run + snare roll + cymbal swell -> **landing tutti 10.26 (voice 10.28)** |
10.67 (v9.27) F-natural stab (Turkish colour) | **tur hold 11.38-12.38** E Hijaz: dum 11.38 / dum 11.63 / DUM 11.88, tremolo strings, oboe lament, solo-violin sob, kanun run, darbuka; pickup roll -> **landing 12.39 (voice 12.40)** |
12.79 (v10.39) bollywood-burst accent | **ind hold 13.43-14.53** (see below); pickup -> **landing 14.54 (voice 14.55)** |
15.28 / 15.53 drums lay out for the heartbeat lub-dub, 15.66 israel hit, 16.58 all-burst, 16.90 orbit riser, 17.235-17.316 micro suck-in gap (fx only) |
**17.32 (v13.82) vortex "אחד": G major drop** | 17.93 thumb ping | **18.37 (v14.87) "נגיש" tap** stab, brand-hook peak B5 | 18.86 calendar-in harp run |
**day-pops (SFX stem `days`, also mixed in): 19.360, 19.508, 19.657, 19.805, 19.953, 20.102, 20.250** = G A B C D E F# (harp + violin pizz; F# = leading tone; piano chord + harp sparkle on Saturday), sparse pad underneath |
**20.90 (v17.40) goal landing: G major tutti**, 21.30 bounce accent, **21.84 (v18.34) GOAL burst C major** |
22.28 (v18.78) countdown 3, 22.71 (2), 23.02 (1) timpani + tick, brand motif in flute B E F# -> G6, **23.59 (v20.09) curtains open C major lift**, 23.92 chest slam (A), 24.42 bow pop | **24.79 (v21.29) box opens G major burst**, six reveals 25.05-25.55 = rising G major pentatonic (glock + celesta + harp) | micro gap 25.79-25.86 |
**25.86 (v22.36) NO 1**, 26.68 X slam, **27.05 (v23.55) NO 2** (E minor low stabs, second braaam on F), dizzy pulse 27.19-27.93, 27.93 bolts cross-out, riser + reverse cymbal -> **28.30 (v24.80) relief G major** |
28.58 (v25.08) pick (harp/pizz D G A B), 29.55 (v26.05) tap (C), 29.80 (v26.30) burst, 30.44 (v26.94) playback (D + motif D5), 30.70 (v27.20) goal burst run, 30.92 iris-suck, 31.015-31.096 micro gap (fx only) |
**31.10 (v27.60) LOGO SLAM: tutti G major, motif top B5, gong, trailer drum, braaam, choir, sparkle; final cadence D -> G**, 31.60 tagline sparkle, resolved G ring + harp arpeggios + motif echo (flute/celesta/harp) to the end, never a hush.

## ind hold (rebuilt after client feedback): "famous Bollywood/filmi" idiom, original
Downbeat accent at 13.43 (dhol ff + stick + tabla dha + sitar strum + harmonium chord + violin stab + crash + sub); 3+3+3 bhangra bounce: dhol bass on slots 0,3,6, sticks on off-slots, tabla fills (na tin ge dha), jingle 16ths; **bright jawari sitar riff** with meend slides (E F G# A B, augmented 2nd), harmonium drone (E B, bellows tremolo), **shehnai** (oboe pair, detuned, ornaments) long line, **female "aa-aa" vocalise with gamak trill** (formant synth, no words), **bansuri** descending answer with a b2 touch (F), playful staccato filmi violins + pizzicato; pickup: tirakita + dhol-stick roll + accelerating E major violin run landing on the theme at 14.54. It replaces the spoken Hindi line as the main sound of the hold.

## Verification (by measurement only, no listening)
Length 34.100 s / 48 kHz / 24-bit; -14.5 LUFS, TP -1.3 dBTP, 0 clipped samples; no 100 ms window more than 8 dB under its neighbours before the final fade; chroma per section matches the intended chords (E minor, C, D, B, G, C, D); every rendered pitch checked with pyworld; spectrogram `score_ctv_spectrogram.png`.

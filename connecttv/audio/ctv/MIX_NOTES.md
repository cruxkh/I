# ConnectTV mix notes (audio/ctv)

**Verified by MEASUREMENT ONLY.  Nobody listened to this mix or to the foreign-language voices.**
Everything below (LUFS, true peak, clip count, VO-to-bed ratio per word, click check, spectrogram, Whisper ASR) is a number or a picture, not an ear.

## Build
    python3 voices_ctv.py     # voices/  narrator_48k.wav, cinema_fx.wav, genre_voices.wav, voices.json
    python3 sfx_ctv.py        # sfx/     new SFX (+ hits.json); v6/v7 sounds are reused through sfx_v6.build
    python3 mix_ctv.py        # ../master_ctv.wav (+ copy here), master_ctv_spectrogram.png, mix_report.txt/json, this file
Timeline: T = v + sum(hold.d for holds with hold.v < v) (timeline.js: cin 8.85 +1.4, tur 9.98 +1.0, ind 11.03 +1.1; total 34.1 s).

## Voices
- Narrator = the ORIGINAL TTS (audio/vo_original_tts.wav), Kaiser polyphase 44.1k -> 48k (160/147, beta 14) + 2nd-order 70 Hz high-pass, nothing else
  (no EQ, no loudnorm, no compressor); split at the hold points on zero crossings with 5 ms fades; hold silences inserted.
  The mix contains it unchanged (checked against an independent resample + high-pass pipeline).
- `cin` hold: the narrator's word "צ'רלטון" (v 8.32-8.85) is re-spoken from the same audio as a deep trailer voice (WORLD pitch -5.5 st, formant warp 0.94,
  chest EQ, saturation, 3.6 s hall) starting at hold + 0.03 s (T 8.88), two darker echoes at +0.60 and +1.02 s, a small hall send under the original word.
  Whisper-he hears "...טון" for the processed word (the original word: "צ'לטון").  Level -3 dB vs. the first draft so it sits 3-5 dB over the bed.
- `tur` hold (client request, revised twice): a young crying GIRL saying "Neden?!" and then a clearly audible child sob sequence, all inside the 1.0 s hold
  (T 11.41-12.38).  Speech: Kokoro has no Turkish, so the Italian voice if_sara driven by Turkish IPA (nɛdˈɛn), then WORLD: f0 x1.55 (about 420 Hz),
  formants x1.13 (child), a growing 8.5 Hz pitch tremble, a voice crack, breathier aperiodicity, amplitude breaks + in-breaths at the syllable joints
  (seed/gate depth picked by Whisper-tr agreement: it reads "Ne deniz?" / "Nedenz!" / "Ne densin?", i.e. Neden-like but not a clean "Neden").
  Sobs (synthesised, not Kokoro): a sharp gasping in-breath, three shuddering broken-voice sobs (glottal source + child formants, pitch falling from ~560 Hz with a
  26-30 Hz shudder, aspirated, saturated) and a wet sniffle (noise band with a 55-90 Hz rattle); they start T 11.95 as the last syllable dies.  The score is ducked
  a further 5 dB from the sob start to the hold end, and the measured voice-minus-bed at each burst is in the report below (100 ms K-weighted window).
- `ind` hold (client change): NO spoken Hindi line.  The hold is the composer's Bollywood / filmi piece (sitar, dhol + tabla, shehnai, bansuri, vocalise); the mix
  keeps the music energy at +6 dB there, with no genre-voice duck and no Indian SFX on top (only the forward pickup whoosh at the hold end).  The earlier Kokoro Hindi
  "वाह!" (hm_omega, WORLD-lifted, 0.9 s) is kept only in voices/unused_vaah_hindi.wav and is not in the mix.
- Whisper model: sherpa-onnx whisper-small int8 (GitHub release asr-models); Kokoro v1.0 from the kokoro-onnx GitHub release.

## Score handling
- Uses `score_ctv_nodays.wav` (the composer's stem split without its 7 day notes) and plays the day phrase from SFX (real VSCO harp + violin spiccato,
  the composer's own notes G A B C D E F#, one octave up, on the scene CUEs 15.86 ... 16.75; F# = leading tone with a piano fifth + harp gliss).
  `USE_SCORE_DAYS=1 python3 mix_ctv.py` uses the full score instead.
- The score already plays its own dum-dum-DUM (tur), tabla + sitar groove (ind), braaam/gong/timpani roll (cin), so no SFX tur_dum / bolly_sting is cued
  (they would flam); the hold SFX are the THX swell + projector (cin), a tear drop (tur) and forward pickup whooshes into each hold end.
- The score has no exact digital zero (its 'suck-in' gaps before T 17.32 and T 31.10 keep the risers), so the master has none either; mix_ctv.py would mask
  any zero run >= 50 ms it finds in the score on every bus.
- Music: -8 dB under speech (150 ms look-ahead attack, 400 ms release), +6 dB in the holds and held until 0.35 s before the next word, -6 dB under the genre
  voices (-11 dB under the sobs); a static gain so the median phrase-worst VO-music is 10 dB, then a look-ahead rider (never deeper than 12 dB, off inside the holds)
  keeps VO - music >= 7.5 dB at words and 4.5 dB under genre voices.  Phrase-final words are judged up to 150 ms before their end.
- SFX: every cue gets static gains from a VO-protection solver (>= 6.5 dB under words full band, >= 8 dB in the speech band, big hits 5.5 / 7.5), then a
  smooth look-ahead rider on the SFX bus keeps VO - (music + SFX) >= 5.4 dB at every word (4.0 dB under genre voices).  Master: static gain -> true-peak
  look-ahead limiter (4x oversampling, 5 ms) -> -14 LUFS.  No compressor or EQ on the VO anywhere.

## SFX list (all synthesised with the numpy toolkit, seeded, or real VSCO samples)
bolt_crack, gloss_pop x3, zap, liquid_whoosh a/b/c, rise_whoosh, liquid_flood, splash_slam / splash_small, shockwave, glass_shatter, cross_out (two bolt slashes + slam),
vortex_suck(_s), snare_hit (build-up roll), heart_lub, glitter, logo_suck + logo_slam, harp_sparkle, day_note x6 + week_finale, plus v6/v7 sounds for
remote_click, curtain_swoosh, thx_swell, projector, tear_drop, boom_med, and the anim library (stadium_goal_eruption, stadium_crowd_bed, popcorn_burst, ball_kick).
No marker / paper / hiss sounds (the confetti popper was dropped for that reason), no metallic UI dings, nothing on the caption chips.  Cue list: `cue_sheet()` in mix_ctv.py (scene `// CUE` comments, v-clock).
Not done / limits: cue names in the scenes are matched by hand (re-run after a scene change); the cross-out, glass and liquid sounds are physically plausible
designs that nobody has listened to; the trailer voice may sound saturated; heavy sub layers from the SFX and the score add up (limiter GR is in the report).

## Measured report (mix_report.txt)

```
==============================================================================
score_ctv.wav: YES | gaps (exact digital zero) in the score: none
music static gain -2.94 dB re the score file (median phrase-worst VO-music 7.1 dB before, target 10.0); music rider min -12.0 dB (active >1 dB 9.5 % of film); SFX rider min -5.6 dB (active 14.9 %)
master: /home/user/I/connecttv/audio/master_ctv.wav  1636800 samples = 34.100 s, 2 ch, 48000 Hz, PCM_24
integrated -13.99 LUFS | true peak -1.25 dBTP | sample peak -1.26 dBFS | clipped samples 0
master gain -1.11 dB | limiter GR max 2.40 dB at 7.49 s, >1 dB for 0.71 s, >3 dB for 0.000 s
total exact-zero time in master: 0.001 s (score gaps total 0.000 s)
  cue splash_slam @4.34 protection gain hit/tail: -6.3 / -6.3 dB
  cue logo_suck @31.10 protection gain hit/tail: 0.0 / 0.0 dB
  cue logo_slam @31.10 protection gain hit/tail: 0.0 / 0.0 dB
cues 146; hit tucked under the voice: 91; tail tucked: 91
phrase window | VO LUFS | integrated over phrase (LU): VO-bed VO-SFX VO-music | worst word (momentary 400 ms): bed SFX SFX>200Hz music
  0   0.12-  1.07 |  -13.9 |   11.3   11.6   16.5 |   6.0   7.2   7.5  10.2  פותחים את המסך
  1   1.26-  3.17 |  -14.3 |    9.7   12.2   13.4 |   5.2   8.8   7.5   7.6  והעולם של הבידור נפתח בפ
  2   3.41-  5.23 |  -14.2 |    9.5   10.3   17.3 |   7.2   7.8   7.4  14.9  סרטים וסדרות מנטפליקס
  3   5.35-  6.66 |  -13.5 |    9.2   10.0   16.6 |   5.6   7.0   7.1   9.9  תכנים מדיסני פלוס
  4   6.78-  8.85 |  -13.2 |    7.9    9.0   14.6 |   6.2   7.1   6.5  12.4  כל ערוצי הספורט כולל צ'ר
  5  10.28- 11.38 |  -13.8 |    8.9   10.4   14.2 |   5.8   7.8   7.6  10.1  סדרות טורקיות
  6  12.40- 13.43 |  -14.1 |    7.6    8.3   15.4 |   7.5   8.0   7.2  15.6  סדרות הודיות
  7  14.55- 16.16 |  -14.5 |   11.0   11.1   24.9 |   5.3   7.7   7.6   9.3  וכל השידורים החיים מישרא
  8  16.58- 17.59 |  -14.8 |   10.0   13.2   13.0 |   5.3   8.5   7.8   8.4  הכול במקום אחד
  9  17.93- 18.73 |  -15.7 |    8.3   11.0   11.4 |   5.6   7.6   7.9   9.4  הכול נגיש
 10  18.86- 20.47 |  -13.4 |    7.2    7.6   17.6 |   7.0   7.2   7.2  14.4  והכול מתעדכן לאורך השבוע
 11  20.90- 22.16 |  -13.6 |    7.7    9.7   11.8 |   6.1   7.4   7.2   9.0  משחקים בשידור חי
 12  22.28- 23.86 |  -13.7 |    7.9    8.6   16.0 |   5.8   7.5   7.2   8.4  הסדרות שאתם מחכים להן
 13  23.92- 25.45 |  -13.8 |    9.5   12.4   12.5 |   5.5   9.5   9.5   7.6  והתוכן שתמיד כיף לגלות
 14  25.86- 27.03 |  -17.2 |    7.1    7.8   16.1 |   7.2   7.8   6.4  11.9  לא צריך לחפש
 15  27.05- 28.30 |  -12.0 |   11.7   12.8   18.1 |   7.3   8.0   6.8  15.0  לא צריך לעבור בין שירותי
 16  28.58- 29.78 |  -13.8 |   13.4   14.4   20.2 |   5.3   7.9   7.7   8.9  פשוט בוחרים מה לראות
 17  29.80- 30.93 |  -15.3 |    7.4    8.9   10.6 |   5.9   7.6   7.8  10.2  ומתחילים לצפות
genre voice cinema Charlton  8.88-10.15: voice max M -9.6 LUFS, music max -16.8, SFX max -19.7, voice-bed 5.8 dB
genre voice Neden?!          11.41-12.35: voice max M -12.0 LUFS, music max -18.5, SFX max -22.4, voice-bed 6.5 dB
sob burst gasp     T 11.95-12.02: voice -11.6 LUFS-100ms, bed -19.1, voice-bed 7.5 dB
sob burst sob1     T 12.02-12.12: voice -11.6 LUFS-100ms, bed -19.3, voice-bed 7.7 dB
sob burst sob2     T 12.12-12.22: voice -13.9 LUFS-100ms, bed -21.3, voice-bed 7.4 dB
sob burst sob3     T 12.22-12.32: voice -14.0 LUFS-100ms, bed -19.6, voice-bed 5.5 dB
sob burst sniffle  T 12.31-12.37: voice -16.1 LUFS-100ms, bed -19.6, voice-bed 3.4 dB
hold cin  8.85-10.25: mix -10.6 LUFS (music -17.5, SFX -23.4)
hold tur  11.38-12.38: mix -12.8 LUFS (music -20.0, SFX -28.6)
hold ind  13.43-14.53: mix -13.9 LUFS (music -13.9, SFX -32.4)
words under 5 dB VO-bed: none
5 worst words (VO-bed): בפניכם@2.57 5.2, לראות@29.55 5.3, אחד@17.32 5.3, וכל@14.55 5.3, לגלות@25.05 5.5
worst word over the whole ad: VO-bed 5.2 | VO-SFX 7.0 | VO-SFX speech band 6.4 | VO-music 7.6 dB
spectral balance (share of energy dB re total): 20-60 Hz -9.3, 60-250 Hz -5.6, 250-2000 Hz -2.7, 2000-6000 Hz -13.1, 6000-16000 Hz -17.6
click check: 3 spikes (2nd difference > 60x local median and > 0.02 FS)
VO integrity: narrator stem vs independent (resample + 70 Hz HP) pipeline over T 0.2-8.6: max |diff| = 5.8e-08 (float32 storage)
```

Spectrogram: master_ctv_spectrogram.png (cyan lines = big hits, white bands = holds); voices_spectrogram.png = the three genre moments.

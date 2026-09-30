---
name: creator-ad-studio
description: Produce a "big-league" creator-style promo video (vertical 1080x1920 + landscape 1920x1080, 30 fps MP4) from the user's own voice-over (TTS WAV) and a talking-head clip of the user, with a hand-made paper-collage look with smooth 30 fps motion and motion blur, real brand logos, word-exact sync, genre "hold" moments where the voice pauses, an original sample-based score and premium SFX, built by ~10-15 parallel agents. Use when the user sends a VO + a video of themselves and asks for a video / סרטון / פרסומת / "כמו הסרטון של GOTV" / "לפי הטמפלט" / "ליגות גבוהות".
---
# Creator Ad Studio (the GOTV v7 template)

Full write-up of the reference production: `/home/user/I/STUDIO_PLAYBOOK.md` (read it FIRST, end to end).
Reference project: `/home/user/I/gotv5` (vertical) and `/home/user/I/gotv5l` (landscape).
Copy it to a new folder (e.g. `/home/user/I/<brand>_v1`) and adapt; never edit the reference.

Order of work (details and exact commands in the playbook):
1. Intake: VO wav + text, user video, brand name/colours, logos list, end-card text. Confirm understanding in 3-4 lines (Hebrew).
2. Word alignment of the VO (Whisper + espeak DTW) -> `words.js` + `lines.js`.
3. Host cut-out: extract frames, rembg matte, anchors, match footage to VO energy -> host plan.
4. Kit + compositor + brief (`cl.js`, `main.js`, `timeline.js`, `BRIEF.md`), scene map from the VO phrases.
5. Launch agents in parallel: 7-8 scene agents, 1 host agent, 1 composer, 1 SFX/voices/mix agent.
6. Review a contact sheet of the whole film, fix, render, encode, send (web < 25 MB), commit + push.
7. Landscape: copy, switch shared files to 1920x1080, re-send the SAME agents to re-compose their own scenes.
Music: the genre may change with a new design, but the quality bar in playbook section 7.1 is fixed for every film (original composed score, real samples, tempo map, no cheap synth-only or childish tracks).
Always: send progress images, give time estimates, report honestly what was not heard/seen.

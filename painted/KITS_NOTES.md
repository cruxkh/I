# Kit notes (read with PAINTED_BIBLE.md; authoritative docs are each kit file's top comment block)

## kit_family.js (done)
- saba(x,y,s,o) ~540 px tall at s=1; noa(x,y,s,o) ~420 px; (x,y)=floor point between feet; face right by default.
- moods: Saba neutral eager dismiss tense horror angry joy laugh love surprised sad sly; Noa neutral hopeful sad amused focused determined joy proud laugh surprised cheeky.
- pose stand|sit|rise|jump|crouch (or numbers rise/crouch/air/lean); gesture idle grip point armsUp cheer headHands fists reach waveOff shrug hug throw clap case phone box mug remote present (+gestureFrom/gestureK blend; gk drives throw/lift); hold case|phone|box|mug|remote|bamba; talk defaults mouthOf; look, turn, flip, scarfWave, emote/emoteK, sq/dy/rot, boilKey, swMul; layer 'body'|'arms' for hugs (Saba body, Noa, Saba arms).
- famAct(who, t, keys): keys [[t0, mood, {pose, gesture, gk, look, turn, hold, emote}], ...] fields persist; acted mood changes, arms follow eyes, sit-to-stand, jump anticipation/land. Use: saba(x,y,s,{...famAct('saba',t,keys)}).
- livingRoom(t,o): whole frame. o.tv (options|false), chair, shelfEmpty, box, lamp, snow, tvLight, gold, bin, table. FAM_ROOM = positions (chair/Saba, Noa, pouf, table, tv, box, bin, window, cabinet).
- armchair(x,y,s,'back'|'front') shares x,y,s with seated Saba.
- tvSet(x,y,w,h,t,o): screen live|freeze|error|app|goal|smooth|off; bug 'old'|'gotv'; pct, p, play, freezeAt, gold (light pours out), glow, noStand. Scoreboard [מכבי][n] [n][הפועל][clock], 2:1 on goal/smooth.
- backgammon(x,y,s,o): mode case|table(open 0..1)|board; dice 0..1 → diceVals (default 6,6); hop/hop2 checker arcs.
- phoneChat(x,y,s,t,o): RTL WhatsApp; default script matches the timeline (31.4 typing, 32.4 sent, 33.1 blue ticks, 33.4 typing dots, 34.2 reply); override msgs/typing/readAt/draft/hand.
- oldBox(x,y,s,o): rot, cables, to, yank, loose, dust, shake, led.
- NOTE: props with text (TV, phone, box) must be positioned with their own x,y,s args or the camera (camBegin), not inside your own push/translate (text doesn't follow). They call flushLetters().
- Model sheet: --loop=kit_family at loop times >= 100 (4 s per page).

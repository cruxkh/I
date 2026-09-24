#!/usr/bin/env python3
"""VERSION 7 (96.0 s). The SYNC table below is the v2 list; it is remapped to v5 and then v7 at the bottom. Writes audio/cues/base.json from SYNC-point cues below.
Each entry: (sync_time, sfx, gain_db, pan). Cue t = sync_time - hit offset (audio/sfx/hits.json)."""
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
HITS = json.load(open(os.path.join(ROOT, 'sfx', 'hits.json')))
TV = 0.35  # TV screen sits right of centre in the living-room master

SYNC = [
    # ===== VERSION 2 (81.0 s) -- all times NEW global. S5/S6 = v1 time + 12.9 =====
    # --- S1 Tel Aviv 0.0-6.2 (unchanged)
    (0.0, 'city_night_telaviv', -14, 0.0),
    (0.0, 'stadium_crowd_bed', -12, 0.2),
    (2.5, 'crowd_swell_ooh', -15, 0.1),       # swell starts ~0.3-0.5, crest 2.5 under announcer
    (4.7, 'whip_pan', -8, 0.0),                # camera whips up to the mast (4.6)
    (5.0, 'broadcast_launch', -6, 0.0),        # packets launch
    (5.7, 'data_whoosh', -12, 0.3),            # camera follows them over the water
    (6.15, 'whip_pan', -9, 0.0),               # 6.2 whip-blur cut to Toronto
    # --- S2 v2 living room 6.2-29.2
    (6.2, 'snow_wind_window', -12, 0.0),
    (6.2, 'room_tone_cozy', -8, 0.0),          # 29.4 s bed -> fades under the 35.2 flash (v5)
    (6.2, 'tv_crowd_live', -14, TV),           # 9.1 s, ends hard at 15.3
    (15.3, 'freeze_glitch', -6, TV),           # THE FREEZE (old provider)
    (15.3, 'record_scratch', -14, 0.0),
    (15.55, 'buffering_ticks_long', -13, TV),  # 15.55 -> 25.35 (v5)
    (15.6, 'sad_trombone', -21, -0.1),         # subtle, before "No! Not now!" (16.0)
    (18.0, 'error_bonk', -10, TV),             # old provider error ("Again?!")
    (25.3, 'router_beeps', -14, 0.1),          # Noa crouches at the router
    (27.7, 'gotv_switch', -6, 0.0),            # "...now!" -> GOTV active (chord at 28.04)
    (29.2, 'dive_whoosh', -4, 0.0),            # starts 28.2, peaks on the 29.2 flash
    (29.2, 'light_shimmer', -9, 0.0),          # white-gold flash
    # --- S4 v2 jam 29.2-43.4
    (29.2, 'dataworld_ambience', -12, 0.0),    # 14.4 s bed
    (29.2, 'traffic_jam_grumble', -12, 0.0),   # 12.6 s, fades after the boost
    (29.6, 'packet_honk_mid', -12, 0.5),
    (30.5, 'squeeze_squeak', -14, -0.2),
    (31.5, 'squeeze_squeak', -14, 0.2),
    (32.15, 'packet_honk_double', -12, -0.4),  # ILVIP's grumpy honk into his line
    (35.3, 'sleepy_tuba_wah', -18, 0.3),       # under EMBY "Still... buffering..."
    (36.65, 'packet_honk_lo', -13, 0.6),
    (39.5, 'packet_honk_hi', -13, 0.3),
    (41.5, 'bit_charge', -11, 0.0),            # charge peaks on the boost
    (41.5, 'bit_rocket_launch', -4, 0.0),      # BOOST over the queue
    (42.7, 'sonic_whoosh', -5, 0.0),           # bursts into open fibre
    (43.1, 'zip_streak', -12, 0.3),
    # --- S5 ocean 43.4-54.4 (v1 + 12.9; Gibraltar ding removed)
    (43.4, 'underwater_plunge', -6, 0.0),
    (43.4, 'underwater_ambience', -10, 0.0),
    (43.4, 'cable_hum', -12, 0.0),
    (43.5, 'km_counter_ticks', -18, 0.5),      # clunk lands 53.4
    (43.7, 'map_ding', -14, 0.5),              # TLV pin
    (43.9, 'sonar_ping', -16, -0.5),
    (45.2, 'map_ding', -14, 0.5),              # Marseille
    (48.9, 'shark_lunge', -8, -0.3),           # lunge 48.5, peak on the bite
    (48.9, 'chomp', -5, -0.1),
    (48.9, 'spark_zap', -10, 0.0),
    (49.1, 'boing', -7, 0.0),
    (49.5, 'dazed_stars', -12, -0.2),
    (52.2, 'map_ding', -14, 0.5),              # Halifax
    (53.4, 'map_ding_arrive', -12, 0.5),       # Toronto
    (53.4, 'shore_arrival_swell', -8, 0.0),
    # --- S6 last mile 54.4-58.9 (v1 + 12.9)
    (54.4, 'zip_streak', -8, 0.0),             # hard cut w/ light streak
    (54.4, 'snowy_street_wind', -10, 0.0),
    (54.4, 'pole_buzz', -14, 0.25),
    (54.7, 'zip_streak', -10, -0.3),           # up the pole
    (55.3, 'wire_zip', -8, 0.0),               # along the wire (sync = start)
    (57.8, 'delivered_impact', -3, 0.0),       # DELIVERED slam
    # --- S7 v2 58.9-81.0
    (58.9, 'room_tone_tag', -9, 0.0),          # 19.2 s -> fades out by 78.1
    (58.9, 'tv_unfreeze_pop', -6, TV),
    (59.3, 'ball_net_swish', -8, TV),
    (59.3, 'tv_crowd_goal', -11, TV),
    (60.5, 'stadium_goal_eruption', -15, 0.0), # the room "becomes the stadium" as Saba leaps (fades by 71.5)
    (60.5, 'popcorn_burst', -8, -0.1),         # Bamba/popcorn
    (60.5, 'confetti_popper', -8, 0.2),
    (60.6, 'cheer_group', -14, 0.0),
    (67.5, 'tv_crowd_calm', -17, TV),          # smooth live TV behind the backgammon (67.5-72.7)
    (69.0, 'case_open', -8, -0.2),             # latches 69.0/69.2, lid 69.95
    (70.0, 'dice_roll', -4, -0.1),
    (70.8, 'checker_clack', -5, -0.15),
    (71.4, 'checker_clack', -6, 0.0),
    (72.5, 'bit_flop', -12, 0.3),              # Bit flopped on the router shelf
    (72.8, 'packet_pant', -13, -0.2),          # late ILVIP/EMBY stagger in panting
    (77.4, 'wink_ding', -8, 0.3),
    (77.8, 'title_slam', -3, 0.0),             # GOTV end card
]

# ===== VERSION 5 (87.0 s): router/switch beat replaced; everything at v2 t >= 29.2 moves +6.0 =====
V5_DROP = {(25.3, 'router_beeps'), (27.7, 'gotv_switch')}
V5_NEW = [
    (25.3, 'cable_yank', -6, 0.2),             # "Bye-bye, old box!" -- box ripped out with its cables
    (26.4, 'trash_crash', -5, 0.3),            # into the bin
    (27.3, 'phone_whoosh', -12, -0.2),         # phone out (under "One message to GOTV...")
    (28.4, 'wa_send', -12, -0.1),              # her message appears
    (29.4, 'wa_typing', -16, -0.1),            # rep typing... (29.4-30.1)
    (30.2, 'wa_receive', -10, -0.1),           # rep: subscription activated
    (31.2, 'gotv_switch', -8, TV),             # GOTV app splash on the smart TV (chord 31.54)
    (33.7, 'light_shimmer', -11, TV),          # light pours OUT of the TV (swell starts 33.0)
    (55.25, 'bit_laugh', -8, 0.0),             # Bit laughs at the shark after the zap
]
SYNC = [(ts + 6.0 if ts >= 29.2 else ts, nm, g, p) for (ts, nm, g, p) in SYNC if (ts, nm) not in V5_DROP] + V5_NEW

# ===== VERSION 7 (96.0 s) =====
# v5 t < 6.2: opening rebuilt (V7_OPEN); v5 6.2..35.2 -> +4.0; v5 jam (35.2..49.4) rebuilt (V7_JAM);
# v5 >= 49.4 -> +9.0.
V5 = SYNC
JAM_KEEP_AT_FLASH = {'dive_whoosh', 'light_shimmer'}   # the 35.2 flash belongs to S2's end -> 39.2
V7_OPEN = [
    (0.0, 'city_night_telaviv', -18, 0.0),     # city under the drone, masked as the stand takes over
    (0.0, 'stadium_chant', -6, 0.0),           # ultras: builds, loudest 5.5-8.3, whips away after 8.5
    (8.5, 'whip_pan', -8, 0.0),                # tilt/whip up to the IPTV mast
    (9.0, 'broadcast_launch', -6, 0.0),        # packets launch (Bit glint)
    (9.6, 'data_whoosh', -13, 0.3),
    (10.15, 'whip_pan', -9, 0.0),              # flash out 10.0-10.2 -> Toronto
]
V7_JAM = [
    (39.2, 'dataworld_ambience', -12, 0.0),    # 19.6 s bed
    (39.2, 'traffic_jam_grumble', -12, 0.0),   # 17.6 s, fades after the boost
    # chase cam 39.2-47.0: Bit running, pushing, getting stuck
    (39.3, 'bit_run_steps', -12, 0.0),
    (41.3, 'bit_run_steps', -13, 0.0),
    (43.3, 'bit_run_steps', -12, 0.0),
    (45.3, 'bit_run_steps', -12, 0.0),
    (39.8, 'packet_honk_mid', -13, 0.5),
    (40.25, 'packet_bump', -11, -0.3),
    (41.1, 'packet_bump', -12, 0.35),
    (41.9, 'squeeze_squeak', -15, -0.2),
    (42.8, 'packet_bump', -10, 0.2),
    (42.95, 'packet_honk_double', -12, -0.5),
    (43.7, 'zip_streak', -15, 0.2),            # hop over a packet
    (44.5, 'packet_bump', -11, -0.35),
    (44.9, 'packet_honk_hi', -13, 0.6),
    (45.4, 'squeeze_squeak', -14, 0.2),
    (45.9, 'packet_bump', -10, 0.1),
    (46.4, 'packet_honk_lo', -12, -0.4),
    (46.7, 'packet_bump', -11, -0.1),          # reaches the front ~47.0
    (47.1, 'packet_honk_mid', -13, 0.4),
    # dialogue section 47.4-56.4
    (50.3, 'sleepy_tuba_wah', -18, 0.3),       # under EMBY "Still... buffering..."
    (51.65, 'packet_honk_lo', -13, 0.6),
    (54.5, 'packet_honk_hi', -13, 0.3),
    (56.5, 'bit_charge', -11, 0.0),            # charge peaks on the boost
    (56.5, 'bit_rocket_launch', -4, 0.0),      # BOOST
    (57.7, 'sonic_whoosh', -5, 0.0),           # burst into open fibre
    (58.1, 'zip_streak', -12, 0.3),
]
SYNC = []
for (ts, nm, g, p) in V5:
    if ts < 6.2:
        continue
    if ts < 35.2 or (ts == 35.2 and nm in JAM_KEEP_AT_FLASH):
        SYNC.append((ts + 4.0, nm, g, p))
    elif ts < 49.4:
        continue
    else:
        SYNC.append((ts + 9.0, nm, g, p))
SYNC += V7_OPEN + V7_JAM

cues = []
for (ts, name, g, p) in SYNC:
    assert name in HITS, name
    cues.append({"sfx": name, "t": round(max(0.0, ts - HITS[name]), 3), "gain_db": g, "pan": p})
cues.sort(key=lambda c: c['t'])
os.makedirs(os.path.join(ROOT, 'cues'), exist_ok=True)
with open(os.path.join(ROOT, 'cues', 'base.json'), 'w') as f:
    f.write('[\n' + ',\n'.join(' ' + json.dumps(c) for c in cues) + '\n]\n')
print(len(cues), 'cues')

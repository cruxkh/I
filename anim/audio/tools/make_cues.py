#!/usr/bin/env python3
"""Writes audio/cues/base.json from SYNC-point cues below.
Each entry: (sync_time, sfx, gain_db, pan). Cue t = sync_time - hit offset (audio/sfx/hits.json)."""
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
HITS = json.load(open(os.path.join(ROOT, 'sfx', 'hits.json')))
TV = 0.35  # TV screen sits right of centre in the living-room master

SYNC = [
    # --- S1 Tel Aviv 0.0-6.2
    (0.0, 'city_night_telaviv', -14, 0.0),
    (0.0, 'stadium_crowd_bed', -12, 0.2),
    (2.5, 'crowd_swell_ooh', -15, 0.1),       # swell starts ~0.3-0.5, crest 2.5 under announcer
    (4.7, 'whip_pan', -8, 0.0),                # camera whips up to the mast (4.6)
    (5.0, 'broadcast_launch', -6, 0.0),        # packets launch
    (5.7, 'data_whoosh', -12, 0.3),            # camera follows them over the water
    (6.15, 'whip_pan', -9, 0.0),               # 6.2 whip-blur cut to Toronto
    # --- S2 living room 6.2-21.0
    (6.2, 'snow_wind_window', -12, 0.0),
    (6.2, 'room_tone_cozy', -8, 0.0),
    (6.2, 'tv_crowd_live', -14, TV),           # ends hard at 14.5
    (14.5, 'freeze_glitch', -6, TV),           # THE FREEZE
    (14.5, 'record_scratch', -14, 0.0),
    (14.75, 'buffering_tick_loop', -12, TV),
    (14.98, 'sad_trombone', -20, -0.1),        # subtle, under "No, no, no"
    (19.72, 'router_beeps', -12, 0.1),
    (20.3, 'dive_whoosh', -4, 0.0),            # into the LED
    (21.0, 'light_shimmer', -8, 0.0),          # white-cyan flash
    # --- S4 data jam 21.0-30.5
    (21.0, 'dataworld_ambience', -12, 0.0),
    (21.0, 'traffic_jam_grumble', -12, 0.0),
    (21.4, 'packet_honk_mid', -12, 0.5),
    (22.2, 'squeeze_squeak', -14, -0.2),
    (23.3, 'squeeze_squeak', -14, 0.2),
    (24.2, 'packet_honk_double', -11, -0.4),
    (24.75, 'packet_honk_lo', -12, 0.6),
    (27.85, 'packet_honk_hi', -13, 0.3),
    (28.6, 'bit_charge', -11, 0.0),             # charge peaks on the boost
    (28.6, 'bit_rocket_launch', -4, 0.0),      # BOOST
    (29.8, 'sonic_whoosh', -5, 0.0),           # bursts out the front of the jam
    (30.2, 'zip_streak', -12, 0.3),
    # --- S5 ocean 30.5-41.5
    (30.5, 'underwater_plunge', -6, 0.0),
    (30.5, 'underwater_ambience', -10, 0.0),
    (30.5, 'cable_hum', -12, 0.0),
    (30.6, 'km_counter_ticks', -18, 0.5),      # clunk lands 40.5
    (30.8, 'map_ding', -14, 0.5),              # TLV pin
    (31.0, 'sonar_ping', -16, -0.5),
    (32.3, 'map_ding', -14, 0.5),              # Marseille
    (33.5, 'map_ding', -14, 0.5),              # Gibraltar
    (36.0, 'shark_lunge', -8, -0.3),           # lunge 35.6, peak on the bite
    (36.0, 'chomp', -5, -0.1),
    (36.0, 'spark_zap', -10, 0.0),
    (36.2, 'boing', -7, 0.0),
    (36.6, 'dazed_stars', -12, -0.2),
    (39.3, 'map_ding', -14, 0.5),              # Halifax
    (40.5, 'map_ding_arrive', -12, 0.5),       # Toronto
    (40.5, 'shore_arrival_swell', -8, 0.0),
    # --- S6 last mile 41.5-46.0
    (41.5, 'zip_streak', -8, 0.0),             # hard cut w/ light streak
    (41.5, 'snowy_street_wind', -10, 0.0),
    (41.5, 'pole_buzz', -14, 0.25),
    (41.8, 'zip_streak', -10, -0.3),           # up the pole
    (42.4, 'wire_zip', -8, 0.0),               # along the wire (sync = start)
    (44.9, 'delivered_impact', -3, 0.0),       # DELIVERED slam
    # --- S7 goal 46.0-60.0
    (46.0, 'room_tone_cozy', -9, 0.0),
    (46.0, 'tv_unfreeze_pop', -6, TV),
    (46.4, 'ball_net_swish', -8, TV),
    (46.4, 'tv_crowd_goal', -11, TV),
    (47.6, 'stadium_goal_eruption', -14, 0.0), # the room "becomes the stadium" as Saba leaps
    (47.6, 'popcorn_burst', -8, -0.1),
    (47.6, 'confetti_popper', -8, 0.2),
    (47.7, 'cheer_group', -14, 0.0),
    (54.5, 'bit_flop', -8, 0.3),
    (56.9, 'wink_ding', -8, 0.3),
    (57.3, 'title_slam', -3, 0.0),
]

cues = []
for (ts, name, g, p) in SYNC:
    assert name in HITS, name
    cues.append({"sfx": name, "t": round(max(0.0, ts - HITS[name]), 3), "gain_db": g, "pan": p})
cues.sort(key=lambda c: c['t'])
os.makedirs(os.path.join(ROOT, 'cues'), exist_ok=True)
with open(os.path.join(ROOT, 'cues', 'base.json'), 'w') as f:
    f.write('[\n' + ',\n'.join(' ' + json.dumps(c) for c in cues) + '\n]\n')
print(len(cues), 'cues')

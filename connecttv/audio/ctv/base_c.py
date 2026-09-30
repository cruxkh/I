# ----------------------------------------------------------------------------------------------
# Instruments
# ----------------------------------------------------------------------------------------------
E = SmpEngine
vln_sp = part('vln_sp', 'strings', E(lambda: vs('Strings/Violin Section/Spic', release=0.12)), pan=-0.35, width=1.2, hall=0.3)
vla_sp = part('vla_sp', 'strings', E(lambda: vs('Strings/Viola Section/spic', release=0.12)), pan=0.1, hall=0.28)
vc_sp = part('vc_sp', 'strings', E(lambda: vs('Strings/Cello Section/spic', release=0.12)), pan=0.3, hall=0.25)
cb_sp = part('cb_sp', 'strings', E(lambda: vs('Strings/Solo Contrabass/Spic', release=0.15)), pan=0.35, hall=0.22)
vln_su = part('vln_su', 'strings', E(lambda: vs('Strings/Violin Section/susVib', release=0.45)), pan=-0.3, width=1.3, hall=0.4)
vla_su = part('vla_su', 'strings', E(lambda: vs('Strings/Viola Section/susvib', release=0.45)), pan=0.1, hall=0.38)
vc_su = part('vc_su', 'strings', E(lambda: vs('Strings/Cello Section/susvib', release=0.45)), pan=0.28, hall=0.35)
cb_su = part('cb_su', 'strings', E(lambda: vs('Strings/Solo Contrabass/SusVib', release=0.4)), pan=0.35, hall=0.3)
vln_tr = part('vln_tr', 'strings', E(lambda: vs('Strings/Violin Section/Trem', release=0.35)), pan=-0.25, width=1.3, hall=0.4)
vc_tr = part('vc_tr', 'strings', E(lambda: vs('Strings/Cello Section/trem', release=0.35)), pan=0.28, hall=0.35)
harp = part('harp', 'choir', E(lambda: vs('Strings/Harp', offset=0, release=0.8, parse=lambda nm: (
    re.search(r'_([A-G]#?\d)_', nm).group(1), 1, 1))), pan=-0.3, width=1.2, hall=0.45)
hn_su = part('hn_su', 'brass', E(lambda: vs('Brass/F Horn/sus', release=0.3)), pan=-0.28, width=1.2, hall=0.42)
hn_st = part('hn_st', 'brass', E(lambda: vs('Brass/F Horn/stac', release=0.15)), pan=-0.28, width=1.2, hall=0.42)
tp_su = part('tp_su', 'brass', E(lambda: vs('Brass/Trumpet/sus', release=0.25)), pan=0.25, hall=0.35)
tp_st = part('tp_st', 'brass', E(lambda: vs('Brass/Trumpet/stac', release=0.12)), pan=0.25, hall=0.35)
tb_su = part('tb_su', 'brass', E(lambda: vs('Brass/Tenor Trombone/sus', release=0.3)), pan=0.12, hall=0.33)
tb_st = part('tb_st', 'brass', E(lambda: vs('Brass/Tenor Trombone/stac', release=0.15)), pan=0.12, hall=0.33)
tu_su = part('tu_su', 'brass', E(lambda: vs('Brass/Tuba/sus', release=0.3, filt='_rr1_')), pan=0.05, hall=0.28)
tu_st = part('tu_st', 'brass', E(lambda: vs('Brass/Tuba/stac', release=0.15)), pan=0.05, hall=0.28)
timp = part('timp', 'perc', E(tim), hall=0.33, room=0.1)
bd = part('bd', 'perc', E(lambda: perc1('BDrumNewhit_*', release=0.5, maxlen=4.0)), hall=0.35)
osn = part('osn', 'perc', E(lambda: perc1('Snare2-HitSN_*', release=0.2, maxlen=1.5)), pan=-0.1, hall=0.3, room=0.15)
oroll = part('oroll', 'perc', E(lambda: perc1('Snare2-rollSN_v5*', release=0.08, maxlen=9.0)), pan=-0.1, hall=0.3)
ocym = part('ocym', 'perc', E(lambda: perc1('cymbal-crash1_*', release=1.5, maxlen=6.0)), width=1.4, hall=0.35)
gong = part('gong', 'perc', E(lambda: perc1('gongHit_*', release=2.0, maxlen=8.0)), width=1.3, hall=0.3)
tamb = part('tamb', 'perc', E(lambda: perc1('Tamb1-Hit_*', release=0.1, maxlen=1.0)), pan=0.35, hall=0.2)
piano = part('piano', 'choir', E(lambda: Sampler(sorted(glob.glob(os.path.join(VS, 'Keys/Upright Nr1/UR1_*.wav'))), dyn_parse,
                                                   offset=0, release=0.6, maxlen=6.0, velcurve=1.4)), width=0.9, hall=0.45)
kick = part('kick', 'drums', E(lambda: vd_piece('kick', 'kick_snoff', {'kickmic': 1.0, 'mid': 0.45, 'room': 0.3}), oneshot=1.2), room=0.08)
snare = part('snare', 'drums', E(lambda: vd_piece('snare', 'snare_rimshot', {'mid': 1.0, 'room': 0.5, 'kickmic': 0.15}), oneshot=1.2), room=0.2, hall=0.12)
snc = part('snc', 'drums', E(lambda: vd_piece('snare', 'snare_center', {'mid': 1.0, 'room': 0.45}), oneshot=1.2), room=0.2, hall=0.1)
hh = part('hh', 'drums', E(lambda: vd_piece('hh', 'hh_closed', {'mid': 1.0, 'room': 0.25}), oneshot=0.3), pan=0.25, room=0.1)
hho = part('hho', 'drums', E(lambda: vd_piece('hh', 'hh_open', {'mid': 1.0, 'room': 0.25}), oneshot=0.5), pan=0.25, room=0.1)
crash = part('crash', 'drums', E(lambda: vd_piece('crash', 'crash_crash', {'mid': 1.0, 'room': 0.4})), pan=-0.2, width=1.3, hall=0.15)
tomh = part('tomh', 'drums', E(lambda: vd_piece('htom', 'htom_center', {'mid': 1.0, 'room': 0.4, 'kickmic': 0.2}), oneshot=1.2), pan=0.15, room=0.2, hall=0.1)
toml = part('toml', 'drums', E(lambda: vd_piece('ltom', 'ltom_center', {'mid': 1.0, 'room': 0.4, 'kickmic': 0.3}), oneshot=1.2), pan=-0.15, room=0.2, hall=0.1)
taiko = part('taiko', 'perc', TaikoEngine(62, 0.45, 0.6), width=1.3, room=0.15, hall=0.3)
trailer = part('trailer', 'perc', TaikoEngine(48, 0.9, 1.0, sub=0.6), width=1.2, hall=0.45)
boom = part('boom', 'fx', BoomEngine(), hall=0.2)
braaam = part('braaam', 'fx', BraaamEngine(), width=1.2, hall=0.35)
riser = part('riser', 'fx', RiserEngine(), width=1.4, hall=0.3)
gtr = part('gtr', 'synth', GuitarEngine(), room=0.1, hall=0.08)
lead = part('lead', 'synth', LeadEngine(), hall=0.3)
sub = part('sub', 'synth', SubEngine(), hall=0.0)
darb = part('darb', 'perc', DarbEngine(), room=0.2, hall=0.2)
kanun = part('kanun', 'choir', KanunEngine(), pan=0.3, hall=0.35)
choir = part('choir', 'choir', GMEngine(52), width=1.4, hall=0.5)
oohs = part('oohs', 'choir', GMEngine(53), width=1.4, hall=0.5)
ney = part('ney', 'choir', GMEngine(77), pan=-0.2, hall=0.5)
glock = part('glock', 'choir', GMEngine(9), pan=0.3, hall=0.4)
celesta = part('celesta', 'choir', GMEngine(8), pan=0.3, width=1.2, hall=0.45)

# balance trims (dB) from per-part analysis (see report)
TRIM = dict(taiko=-14, trailer=-7, sub=-13, gtr=-15, kick=-2, snare=4, hh=9, hho=6, crash=2, tomh=4, toml=4, snc=2,
            vc_sp=7, vla_sp=10, vln_sp=9, cb_sp=12, vln_su=15, vla_su=3, vc_su=6, cb_su=7, vln_tr=3, vc_tr=3,
            hn_su=8, hn_st=9, tp_su=4, tp_st=10, tb_su=9, tb_st=9, tu_su=10, tu_st=13, choir=17, oohs=15,
            timp=10, ocym=5, gong=3, riser=-3, boom=-10, braaam=-4, harp=14, celesta=10, glock=16, piano=2,
            ney=12, kanun=2, darb=-4, tamb=10, oroll=3, bd=2)
for _k, _db in TRIM.items():
    PARTS[_k].gain *= 10 ** (_db / 20)


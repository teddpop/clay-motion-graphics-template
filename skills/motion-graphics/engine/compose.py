#!/usr/bin/env python3
"""Opus-composed music bed → MIDI → FluidSynth (LGPL) + GeneralUser GS soundfont (free, commercial OK).

usage: compose.py <project-dir> --duration 33.5 --hit 25.0 [--drop 12.5] [--key G] [--bpm-near 96]
(--drop may land on any beat; --hit is bar-aligned by solving the tempo)

Writes <project>/audio/music.mid and renders <project>/audio/music.wav.
The tempo is solved so a bar downbeat lands exactly on --hit (the logo / end-card moment), and the
arrangement builds in sections: intro (keys + shaker) → groove (bass, soft kit) → drop at --drop (full
groove, pizz strings, marimba lead) → final hit (crash + big chord) → soft outro → last chord rings out.
Style: warm, bright, "kitchen / lifestyle ad". No samples beyond the GM soundfont; no AI audio.
"""
import argparse, json, math, os, struct, subprocess

ap = argparse.ArgumentParser()
ap.add_argument('dir'); ap.add_argument('--duration', type=float, required=True); ap.add_argument('--hit', type=float, required=True)
ap.add_argument('--drop', type=float, default=None); ap.add_argument('--key', default='G'); ap.add_argument('--bpm-near', type=float, default=96)
ap.add_argument('--week', type=float, default=None, help='time to add glockenspiel sparkle')
a = ap.parse_args()

here = os.path.dirname(os.path.abspath(__file__))
SF2 = os.path.join(here, 'models', 'GeneralUser-GS.sf2')
out = os.path.join(a.dir, 'audio'); os.makedirs(out, exist_ok=True)

# ---- tempo so that a downbeat hits exactly at --hit ----
bar_near = 240 / a.bpm_near
hit_bar = max(1, round(a.hit / bar_near))
BAR = a.hit / hit_bar; BPM = 240 / BAR
n_bars = math.ceil(a.duration / BAR) + 1
BEAT = BAR / 4
drop_beat = round(a.drop / BEAT) if a.drop else max(4, (hit_bar // 2) * 4)   # drop may land mid-bar (any beat)
drop_bar = drop_beat // 4
week_bar = round(a.week / BAR) if a.week else drop_bar + 2
TPQ = 480; TBAR = TPQ * 4; T16 = TPQ // 4
DROP_T = None  # set below

KEYS = {'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 55, 'A': 57, 'Bb': 58}
R = KEYS.get(a.key, 55)   # tonic in a comfortable mid register
# I maj7 – vi7 – IV maj7 – V6sus, voiced close
PROG = [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 16]]
BASS = [0, -3, 5, 7]
PENT = [0, 2, 4, 7, 9, 12, 14, 16]

seed = [12345]
def rnd():
    seed[0] = (seed[0] * 1103515245 + 12345) & 0x7fffffff
    return seed[0] / 0x7fffffff
def vel(v, spread=10): return max(1, min(127, int(v + (rnd() - 0.5) * spread)))

# events: (tick, type, ch, a, b)
ev = []
def note(ch, t, pitch, dur, v):
    ev.append((int(t), 0x90, ch, int(pitch), vel(v))); ev.append((int(t + dur), 0x80, ch, int(pitch), 0))
def prog(ch, p): ev.append((0, 0xC0, ch, p, None))
def cc(ch, t, c, v): ev.append((int(t), 0xB0, ch, c, v))

# channels / GM programs
EP, MAR, BAS, PZ, GLK, PNO, STR, DR = 0, 1, 2, 3, 4, 5, 6, 9
for ch, p in [(EP, 4), (MAR, 12), (BAS, 33), (PZ, 45), (GLK, 9), (PNO, 0), (STR, 48)]: prog(ch, p)
for ch, vol, pan, rev in [(EP, 88, 54, 50), (MAR, 92, 78, 40), (BAS, 100, 64, 10), (PZ, 70, 40, 55), (GLK, 60, 90, 70), (PNO, 90, 64, 60), (STR, 70, 64, 80), (DR, 92, 64, 25)]:
    cc(ch, 0, 7, vol); cc(ch, 0, 10, pan); cc(ch, 0, 91, rev)

KICK, SIDE, CLAP, HAT, SHAKER, TAMB, CRASH, SNARE = 36, 37, 39, 42, 82, 54, 49, 38

DROP_T = drop_beat * TPQ
def level(b, tick=None):
    tick = b * TBAR if tick is None else tick
    if b >= hit_bar + 1: return 1          # outro
    if b == hit_bar: return 4              # final hit bar
    if tick >= DROP_T: return 3
    if b >= 2: return 2
    return 1

# marimba motif (16th grid positions → chord-tone index)
MOTIF = [(0, 0), (3, 2), (6, 1), (8, 3), (10, 2), (13, 1), (14, 2)]
# lead melody for the drop (per 4-bar cycle): (16th pos, pentatonic idx, len16)
LEAD = [[(0, 4, 3), (4, 3, 2), (6, 2, 2), (8, 4, 4), (14, 5, 2)],
        [(0, 3, 3), (4, 2, 2), (6, 1, 2), (8, 2, 6)],
        [(0, 5, 3), (4, 4, 2), (6, 3, 2), (8, 4, 3), (12, 6, 4)],
        [(0, 5, 4), (4, 4, 2), (8, 3, 2), (10, 2, 2), (12, 1, 4)]]

last_bar = n_bars - 1
for b in range(n_bars):
    t0 = b * TBAR; L = level(b); c = PROG[b % 4]; lastb = b == last_bar
    Lat = lambda tick: level(b, tick)
    fade = 1.0 if b <= hit_bar else max(0.45, 1 - (b - hit_bar) * 0.14)
    # keys: rhodes chords (half notes, gentle syncopation)
    if lastb:
        for iv in c[:3] + [c[3] + 12]: note(EP, t0, R + iv, TBAR * 1.5, 60)
    else:
        for iv in c: note(EP, t0, R + iv, TPQ * 1.9, 58 * fade)
        for iv in c: note(EP, t0 + TPQ * 2.5, R + iv, TPQ * 1.4, 50 * fade)
    # marimba motif, always (it's the hook); busier from level 2
    if not lastb:
        for pos, idx in MOTIF if L >= 2 else MOTIF[::2]:
            note(MAR, t0 + pos * T16, R + 12 + c[idx], T16 * 2, (78 if L >= 2 else 70) * fade)
    # bass from level 2
    if level(b, t0 + TBAR - 1) >= 2 and not lastb and L != 4:
        r = R - 12 + BASS[b % 4]
        for pos, iv, ln in [(0, 0, 5), (6, 0, 2), (8, 7, 4), (14, 12, 2)]:
            if Lat(t0 + pos * T16) >= 3 or (pos in (0, 8) and Lat(t0 + pos * T16) == 2):
                note(BAS, t0 + pos * T16, r + iv, (ln if Lat(t0 + pos * T16) >= 3 else 7) * T16, 96 * fade)
    # pizz strings offbeat stabs in the drop
    for beat in range(4):
        if Lat(t0 + beat * TPQ) == 3:
            for iv in c[1:]: note(PZ, t0 + beat * TPQ + TPQ // 2, R + 12 + iv, T16 * 1.5, 64)
    # lead melody in the drop (marimba doubles an octave up via piano softly)
    for pos, pi, ln in LEAD[(b - drop_bar) % 4]:
        if Lat(t0 + pos * T16) == 3: note(PNO, t0 + pos * T16, R + 12 + PENT[pi], ln * T16, 74)
    # glockenspiel sparkle from the "week" section
    if Lat(t0 + TBAR - 1) == 3 and b >= week_bar:
        for pos in (2, 7, 11):
            note(GLK, t0 + pos * T16, R + 24 + c[int(rnd() * 4)], T16 * 3, 58)
    # final hit: crash + big voiced chord + strings swell
    if L == 4:
        note(DR, t0, CRASH, TPQ * 4, 96); note(DR, t0, KICK, TPQ, 110)
        for iv in [-12, 0, 4, 7, 11, 14]: note(PNO, t0, R + iv, TBAR * 1.2, 92)
        for iv in [0, 7, 12, 16]: note(STR, t0, R + iv, TBAR * 2.2, 78)
        for iv in [12, 16, 19, 23]: note(GLK, t0 + T16 * 2, R + 12 + iv, TPQ * 2, 70)
    # drums
    if lastb: continue
    for s in range(16):
        tt = t0 + s * T16; Ls = Lat(tt)
        if Ls == 4: continue
        if Ls >= 1: note(DR, tt, SHAKER, T16, (46 if s % 2 else 58) * fade)
        if Ls >= 2 and s in (0, 8): note(DR, tt, KICK, T16, 84 if Ls == 2 else 100)
        if Ls >= 3 and s == 10: note(DR, tt, KICK, T16, 86)
        if Ls == 2 and s in (4, 12): note(DR, tt, SIDE, T16, 70)
        if Ls >= 3 and s in (4, 12): note(DR, tt, CLAP, T16, 92)
        if Ls >= 3 and s % 2 == 0: note(DR, tt, HAT, T16, 62 if s % 4 else 74)
        if Ls >= 3 and s in (6, 14): note(DR, tt, TAMB, T16, 50)
    if t0 <= DROP_T < t0 + TBAR:   # soft crash + kick right on the drop beat
        note(DR, DROP_T, CRASH, TPQ * 2, 70); note(DR, DROP_T, KICK, T16, 104)
    # build into the drop and into the hit: snare roll crescendo on beat 4
    for target in (DROP_T, hit_bar * TBAR):   # snare roll crescendo in the beat before the drop and the hit
        if t0 <= target - TPQ < t0 + TBAR:
            for k in range(4): note(DR, target - TPQ + k * T16, SNARE, T16, 60 + k * 14)

# ---- write MIDI (format 0) ----
def vlq(n):
    b = [n & 0x7F]; n >>= 7
    while n: b.insert(0, (n & 0x7F) | 0x80); n >>= 7
    return bytes(b)
ev.sort(key=lambda e: (e[0], 0 if e[1] in (0xC0, 0xB0) else (1 if e[1] == 0x80 else 2)))
trk = bytearray()
us = int(60_000_000 / BPM)
trk += vlq(0) + b'\xFF\x51\x03' + us.to_bytes(3, 'big')
last = 0
for t, typ, ch, x, y in ev:
    trk += vlq(t - last); last = t
    trk += bytes([typ | ch, x]) if typ == 0xC0 else bytes([typ | ch, x, y])
trk += vlq(TBAR) + b'\xFF\x2F\x00'
mid = b'MThd' + struct.pack('>IHHH', 6, 0, 1, TPQ) + b'MTrk' + struct.pack('>I', len(trk)) + bytes(trk)
mpath = os.path.join(out, 'music.mid'); open(mpath, 'wb').write(mid)

wav = os.path.join(out, 'music.wav')
subprocess.run(['fluidsynth', '-ni', '-g', '0.55', '-r', '48000', '-R', '1', '-C', '1', '-F', wav, SF2, mpath],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# tell the composition where the downbeats actually landed (the drop snaps to the nearest beat)
open(os.path.join(a.dir, 'music.js'), 'w').write('// generated by compose.py\nwindow.MUSIC = ' + json.dumps({'bpm': round(BPM, 3), 'bar': round(BAR, 4), 'drop': round(drop_beat * BEAT, 3), 'hit': round(a.hit, 3)}) + ';\n')
print(f'music: {BPM:.1f} bpm, bar {BAR:.3f}s, drop@beat {drop_beat} ({drop_beat*BEAT:.2f}s), hit@bar {hit_bar} ({a.hit:.2f}s) → {wav}')

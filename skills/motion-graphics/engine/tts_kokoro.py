#!/usr/bin/env python3
"""Kokoro neural TTS (Apache-2.0 weights, runs locally, free).

usage: tts_kokoro.py <voice> <speed> <out.wav> "<text>"
Voices (best first): af_heart, af_bella, af_nicole, am_michael, am_fenrir, am_puck, bf_emma, bm_george.
Blend voices with 'af_heart:0.7,af_bella:0.3'.
"""
import os
import shutil
import sys

import espeakng_loader
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.config import EspeakConfig

here = os.path.dirname(os.path.abspath(__file__))

# espeak-ng can't use a data dir whose path contains spaces or symlinks: keep a real copy in ~/.cache
data = os.path.expanduser('~/.cache/mg-espeak-ng-data')
if not os.path.isdir(data):
    shutil.copytree(espeakng_loader.get_data_path(), data)

k = Kokoro(os.path.join(here, 'models/kokoro-v1.0.onnx'), os.path.join(here, 'models/voices-v1.0.bin'),
           espeak_config=EspeakConfig(data_path=data, lib_path=espeakng_loader.get_library_path()))

voice, speed, out, text = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
if ':' in voice:
    style = sum(k.get_voice_style(n) * float(w) for n, w in (p.split(':') for p in voice.split(',')))
else:
    style = voice
samples, sr = k.create(text, voice=style, speed=speed, lang='en-us')
sf.write(out, samples, sr)

# Third-party components

| Component | Use | Licence | Shipped in this repo? |
|---|---|---|---|
| Three.js r170 (`engine/vendor/three/`) | 3D rendering | MIT (`engine/vendor/three/LICENSE`) | yes |
| Inter, JetBrains Mono (`engine/fonts/`) | Typography | SIL Open Font License 1.1 (`engine/fonts/LICENSE-*.txt`) | yes |
| playwright-core | Drives headless Chrome | Apache-2.0 | no (npm, via setup.sh) |
| Kokoro-82M weights + voices (kokoro-onnx model files) | Text-to-speech | Apache-2.0 | no (downloaded by setup.sh) |
| kokoro-onnx, onnxruntime, soundfile, espeakng-loader | TTS runtime (Python venv) | MIT / MIT / BSD-3 / MIT (espeak-ng data GPL-3.0, used as a separate program library) | no (pip via setup.sh) |
| whisper.cpp + ggml `small.en` model | Word timings | MIT | no (Homebrew + download) |
| FluidSynth | MIDI → audio | LGPL-2.1 | no (Homebrew) |
| GeneralUser GS soundfont (S. Christian Collins) | Instrument samples | GeneralUser GS licence (free use incl. commercial; see `engine/models/GeneralUser-GS-LICENSE.txt` after setup) | no (downloaded) |
| ffmpeg | Encoding / audio processing | LGPL/GPL (system install) | no (Homebrew) |
| Google Chrome | Frame capture | Google Chrome ToS | no (user installs) |

`engine/test/voices/*.wav` are short samples generated with Kokoro (Apache-2.0).
Check the licences yourself before redistributing rendered videos commercially.

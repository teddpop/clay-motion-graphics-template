#!/usr/bin/env bash
# One-time setup for the free toolchain. Safe to re-run (skips what already exists) and prints a status table.
#   system:  ffmpeg, whisper-cpp (whisper-cli), fluid-synth, Google Chrome   (Homebrew on macOS, apt hints elsewhere)
#   vendored: Three.js r170 (MIT) for the clay host + props
#   python:  Kokoro-82M neural TTS (Apache-2.0) in an isolated Python 3.12 venv (via uv; system Python untouched)
#   models:  Kokoro onnx + voices, whisper ggml-small.en, GeneralUser GS soundfont (free, commercial use OK)
#   node:    playwright-core (npm; falls back to the public registry, or copy an existing install into node_modules/)
# Large binaries are downloaded here, never committed.
set -uo pipefail
cd "$(dirname "$0")"
OS=$(uname -s)
have() { command -v "$1" >/dev/null 2>&1; }
brew_get() { # brew_get <cmd> <formula>
  have "$1" && return 0
  if [ "$OS" = Darwin ] && have brew; then brew install "$2" >/dev/null 2>&1; else echo "  ! install $2 (e.g. apt install $2)"; fi
}

echo "== system tools"
brew_get ffmpeg ffmpeg
brew_get whisper-cli whisper-cpp
brew_get fluidsynth fluid-synth

echo "== Three.js"
if [ ! -f vendor/three/three.module.js ]; then
  B=https://cdn.jsdelivr.net/npm/three@0.170.0
  mkdir -p vendor/three/addons/{geometries,environments,utils}
  curl -sL -o vendor/three/three.module.js $B/build/three.module.js
  curl -sL -o vendor/three/LICENSE $B/LICENSE
  for f in geometries/RoundedBoxGeometry.js environments/RoomEnvironment.js utils/BufferGeometryUtils.js; do
    curl -sL -o vendor/three/addons/$f $B/examples/jsm/$f
  done
fi

echo "== Kokoro venv"
if [ ! -x .venv/bin/python ]; then
  have python3 || { echo "  ! python3 is required"; exit 1; }
  python3 -m venv .bootstrap
  .bootstrap/bin/pip install -q --index-url https://pypi.org/simple uv
  .bootstrap/bin/uv venv -q -p 3.12 .venv
  .bootstrap/bin/uv pip install -q --python .venv/bin/python --index-url https://pypi.org/simple kokoro-onnx==0.6.1 soundfile
fi

echo "== models"
mkdir -p models
R=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/kokoro-v1.0.onnx ] || curl -sL -o models/kokoro-v1.0.onnx $R/kokoro-v1.0.onnx
[ -f models/voices-v1.0.bin ] || curl -sL -o models/voices-v1.0.bin $R/voices-v1.0.bin
[ -f models/ggml-small.en.bin ] || [ -n "${WHISPER_MODEL:-}" ] || \
  curl -sL -o models/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
if [ ! -f models/GeneralUser-GS.sf2 ]; then
  G=https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main
  curl -sL -o models/GeneralUser-GS.sf2 "$G/GeneralUser-GS.sf2"
  curl -sL -o models/GeneralUser-GS-LICENSE.txt "$G/documentation/LICENSE.txt"
fi

echo "== playwright-core"
if [ ! -d node_modules/playwright-core ]; then
  npm install --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund --registry https://registry.npmjs.org >/dev/null 2>&1 || \
    echo "  ! npm failed: copy an existing node_modules/playwright-core into $(pwd)/node_modules/"
fi

# ---------- status ----------
ok() { printf "  %-26s %s\n" "$1" "$2"; }
chk() { if eval "$2" >/dev/null 2>&1; then ok "$1" "ok"; else ok "$1" "MISSING"; FAIL=1; fi; }
FAIL=0
echo; echo "status"
chk ffmpeg "have ffmpeg"
chk whisper-cli "have whisper-cli"
chk fluidsynth "have fluidsynth"
if [ "$OS" = Darwin ]; then chk "Google Chrome" "[ -d '/Applications/Google Chrome.app' ]"; else chk "Google Chrome" "have google-chrome || have google-chrome-stable"; fi
chk "three.js" "[ -s vendor/three/three.module.js ]"
chk "kokoro venv" "[ -x .venv/bin/python ]"
chk "kokoro model" "[ -s models/kokoro-v1.0.onnx ] && [ -s models/voices-v1.0.bin ]"
chk "whisper model" "[ -s models/ggml-small.en.bin ] || [ -s \"\${WHISPER_MODEL:-/nonexistent}\" ]"
chk "soundfont" "[ -s models/GeneralUser-GS.sf2 ]"
chk "playwright-core" "[ -d node_modules/playwright-core ]"
[ $FAIL = 0 ] && echo "setup ok" || { echo "setup incomplete (see MISSING above)"; exit 1; }

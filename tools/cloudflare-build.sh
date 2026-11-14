#!/usr/bin/env bash
set -euo pipefail
hmap_project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$hmap_project_root"
hmap_tools="$hmap_project_root/build/cloudflare-tools"
mkdir -p "$hmap_tools"
python3 -m venv "$hmap_tools/venv"
"$hmap_tools/venv/bin/python" -m pip install cmake==4.2.1 ninja==1.13.0
export PATH="$hmap_tools/venv/bin:$PATH"
if [[ ! -d "$hmap_tools/emsdk/.git" ]]; then
  git clone --depth 1 --branch 6.0.9 https://github.com/emscripten-core/emsdk.git "$hmap_tools/emsdk"
fi
if [[ "$(git -C "$hmap_tools/emsdk" rev-parse HEAD)" != '5eb0bde7585670252e8ba05e9d361627bffd08b5' ]]; then
  echo 'Unexpected emsdk source revision' >&2
  exit 1
fi
"$hmap_tools/emsdk/emsdk" install 6.0.9
"$hmap_tools/emsdk/emsdk" activate 6.0.9
source "$hmap_tools/emsdk/emsdk_env.sh"
python3 tools/prepare-dependencies.py
npm ci
npm run typecheck
npm run test:storage
cmake --preset wasm-release
cmake --build --preset wasm-release --parallel 2
ctest --preset wasm-release --output-on-failure
npm run build
python3 tools/check-distribution.py

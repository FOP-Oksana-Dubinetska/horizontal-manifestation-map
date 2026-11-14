from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PRESETS_PATH = ROOT / "CMakePresets.json"

FORBIDDEN = [
    ROOT / "packages" / "roadmap-core" / "src" / "roadmap" / "domain" / "roadmap-project.hpp",
    ROOT / "packages" / "roadmap-core" / "src" / "roadmap" / "domain" / "roadmap-project.cpp",
    ROOT / "apps" / "roadmap-cli" / "main.cpp",
    ROOT / "tools" / "diagnose-local-env.sh",
]
REQUIRED = [
    ROOT / "roadmap-editor.plan.md",
    ROOT / "CMakeLists.txt",
    PRESETS_PATH,
    ROOT / "apps" / "workspace-smoke" / "main.cpp",
    ROOT / "tests" / "workspace-foundation.test.cpp",
    ROOT / "tools" / "diagnose-local-env.ps1",
    ROOT / "docs" / "decisions" / "0001-primary-native-toolchain.md",
    ROOT / "TRACE.md",
]

problems: list[str] = []
for path in REQUIRED:
    if not path.is_file():
        problems.append(f"missing required stage-00 file: {path.relative_to(ROOT)}")

for path in FORBIDDEN:
    if path.exists():
        problems.append(f"stage boundary/platform scaffold violated by file: {path.relative_to(ROOT)}")

if PRESETS_PATH.is_file():
    try:
        presets = json.loads(PRESETS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        problems.append(f"cannot parse CMakePresets.json: {exc}")
    else:
        configure = {item["name"]: item for item in presets.get("configurePresets", [])}
        native = configure.get("native-debug")
        if native is None:
            problems.append("native-debug configure preset is missing")
        else:
            compiler = native.get("cacheVariables", {}).get("CMAKE_CXX_COMPILER")
            if compiler != "g++.exe":
                problems.append(f"native-debug must select MinGW-w64 g++.exe, found: {compiler!r}")

            condition = native.get("condition", {})
            if condition.get("type") != "equals" or condition.get("rhs") != "Windows":
                problems.append("native-debug must be conditioned on Windows host")

        binary_dirs = [item.get("binaryDir") for item in configure.values()]
        if len(binary_dirs) != len(set(binary_dirs)):
            problems.append("configure presets must use distinct binaryDir values")

if problems:
    for problem in problems:
        print(problem, file=sys.stderr)
    raise SystemExit(1)

print("stage 00 Windows/MinGW-w64 filesystem and preset boundary: ok")

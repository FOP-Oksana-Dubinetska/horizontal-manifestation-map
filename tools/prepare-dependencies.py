#!/usr/bin/env python3
"""Prepare pinned sources; this is the explicit network-enabled setup step."""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'manifest' / 'prepared-dependencies.json'

def main():
    for item in json.loads(MANIFEST.read_text())['files']:
        target = ROOT / 'build' / 'dependencies' / item['path']
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == item['sha256']:
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        data = urllib.request.urlopen(item['url'], timeout=120).read()
        if hashlib.sha256(data).hexdigest() != item['sha256']:
            raise SystemExit('Integrity failure: ' + item['path'])
        target.write_bytes(data)
        print('Prepared ' + item['path'])

if __name__ == '__main__':
    main()

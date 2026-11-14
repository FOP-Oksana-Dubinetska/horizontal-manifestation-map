#!/usr/bin/env python3
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'dist/site'
def main():
    assert (SITE/'index.html').is_file(), 'Missing index'
    version=json.loads((SITE/'version.json').read_text())
    base=SITE/version['engineBaseUrl']
    for name in ['roadmap-engine.mjs','roadmap-engine.wasm']:
        assert (base/name).is_file(), name
    for name in ['embed/hmap-editor.js','embed/hmap-editor.css','embedding-example.html','_headers','licenses/NOTICE.txt','licenses/third-party/nlohmann-json.txt']:
        assert (SITE/name).is_file(),name
    forbidden=['.licensing-policy','.code-constitution','.git','node_modules','_worker.js']
    for path in SITE.rglob('*'):
        assert not any(part in forbidden for part in path.relative_to(SITE).parts),str(path)
    manifest={str(p.relative_to(SITE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(SITE.rglob('*')) if p.is_file()}
    (ROOT/'build/check-reports').mkdir(parents=True,exist_ok=True)
    (ROOT/'build/check-reports/distribution.json').write_text(json.dumps({'version':version,'sha256':manifest},indent=2)+'\n')
    print(f'Distribution: PASS ({len(manifest)} files)')
if __name__=='__main__':main()

#!/usr/bin/env python3
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    copied=json.loads((ROOT/'manifest/plw-upstream-tree.json').read_text())
    for item in copied['files']:
        if item['type']=='commit':continue
        data=(ROOT/copied['prefix']/item['path']).read_bytes()
        assert hashlib.sha256(data).hexdigest()==item['sha256'],'Changed upstream copy: '+item['path']
    sources=json.loads((ROOT/'manifest/upstream-sources.json').read_text())
    for name,directory in [('codeConstitution','.code-constitution'),('repositoryLicensingPolicy','.licensing-policy')]:
        path=ROOT/directory
        actual=subprocess.check_output(['git','-C',str(path),'rev-parse','HEAD'],text=True).strip()
        assert actual==sources[name]['commit'],'Unexpected reference revision: '+directory
        assert not subprocess.check_output(['git','-C',str(path),'status','--porcelain'],text=True).strip(),'Modified reference: '+directory
    plan=json.loads((ROOT/'examples/hmap-development.roadmap.json').read_text())
    contracts=(ROOT/'CONTRACTS.md').read_text()
    for chunk in plan['chunks']:assert '<<'+chunk['name']+'>>' in contracts,'Unmapped self-hosting chunk: '+chunk['name']
    # Domain boundaries and retained author source are checked without needing the preparer's local Git history.
    domain=ROOT/'packages/roadmap-core/src/roadmap/domain'
    for path in domain.glob('*.hpp'):
        text=path.read_text();assert all(token not in text for token in ['#include <nlohmann','#include <filesystem>','#include <emscripten'])
    expected=json.loads((ROOT/'manifest/retained-author-files.json').read_text())
    for item in expected['files']:assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sha256'],'Changed author artifact: '+item['path']
    print('Governance references, copied method, self-hosting and domain boundaries: PASS')
if __name__=='__main__':main()

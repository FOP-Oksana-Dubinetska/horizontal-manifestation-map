#!/usr/bin/env python3
"""Prepare unmodified pinned reference worktrees. Never changes upstream or project policy."""
import json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCES=[('promptLiterateWorkflow','.plw-reference'),('codeConstitution','.code-constitution'),('repositoryLicensingPolicy','.licensing-policy')]
def main():
    sources=json.loads((ROOT/'manifest/upstream-sources.json').read_text())
    for name,directory in SOURCES:
        source=sources[name];target=ROOT/directory
        if not target.exists():
            subprocess.run(['git','init',str(target)],check=True,capture_output=True)
            subprocess.run(['git','-C',str(target),'remote','add','origin',source['repository']],check=True)
            subprocess.run(['git','-C',str(target),'fetch','--depth','1','origin',source['commit']],check=True)
            subprocess.run(['git','-C',str(target),'checkout','--detach','FETCH_HEAD'],check=True)
        actual=subprocess.check_output(['git','-C',str(target),'rev-parse','HEAD'],text=True).strip()
        if actual!=source['commit']:raise SystemExit('Pinned revision mismatch: '+directory)
        if subprocess.check_output(['git','-C',str(target),'status','--porcelain'],text=True).strip():raise SystemExit('Modified reference: '+directory)
        print(directory+': verified '+actual)
if __name__=='__main__':main()

#!/usr/bin/env python3
"""Offline verification. Install dependencies explicitly before running a profile."""
import argparse,hashlib,json,os,platform,shutil,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'build/check-reports'
def run(command,steps):
    started=time.monotonic();print('CHECK:',*command,flush=True)
    result=subprocess.run(command,cwd=ROOT)
    steps.append({'command':command,'exitCode':result.returncode,'seconds':round(time.monotonic()-started,3)})
    if result.returncode:raise RuntimeError('Check failed: '+' '.join(command))
def snapshots():
    result={}
    files=subprocess.check_output(['git','ls-files','-z','--','.'],cwd=ROOT).split(b'\0')
    for raw in files:
        if raw:
            p=ROOT/os.fsdecode(raw)
            if p.is_file():result[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--profile',choices=['stage00','native','wasm','web','all'],default='all');args=parser.parse_args()
    if args.profile=='stage00':return subprocess.call([sys.executable,str(ROOT/'tools/check-stage00.py')],cwd=ROOT)
    before=snapshots();steps=[];status='FAIL';REPORT.mkdir(parents=True,exist_ok=True)
    try:
        for item in json.loads((ROOT/'manifest/prepared-dependencies.json').read_text())['files']:
            p=ROOT/'build/dependencies'/item['path'];assert p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],'Prepare dependencies first: '+item['path']
        if args.profile in ['native','all']:
            run(['cmake','--preset','native-debug','-DHMAP_WARNINGS_AS_ERRORS=ON'],steps)
            run(['cmake','--build','--preset','native-debug','--parallel','2'],steps)
            run(['ctest','--preset','native-debug','--output-on-failure'],steps)
            exe=ROOT/'build/native-debug/bin'/('hmap.exe' if os.name=='nt' else 'hmap')
            run([sys.executable,'tools/test-cli-contracts.py',str(exe)],steps)
            run([sys.executable,'tools/test-cli-introduction.py',str(exe)],steps)
            run([sys.executable,'tools/test-cli-workflow.py',str(exe)],steps)
            run([str(exe),'validate','examples/architecture-workspace.roadmap.json'],steps)
        if args.profile in ['wasm','all']:
            run(['cmake','--preset','wasm-release'],steps)
            run(['cmake','--build','--preset','wasm-release','--parallel','2'],steps)
            run(['ctest','--preset','wasm-release','--output-on-failure'],steps)
            runner=ROOT/'build/native-debug/bin'/('hmap-api-runner.exe' if os.name=='nt' else 'hmap-api-runner')
            if not runner.is_file():raise RuntimeError('Run native profile first to prepare the parity runner')
            run(['node','tests/wasm/parity.mjs',str(ROOT/'build/wasm-release/engine/roadmap-engine.mjs'),str(runner),str(ROOT/'test/fixtures/minimal-v2.roadmap.json')],steps)
        if args.profile in ['web','all']:
            npm='npm.cmd' if os.name=='nt' else 'npm'
            for script in ['typecheck','test:storage','build','test:web']:
                run([npm,'run',script],steps)
            run([sys.executable,'tools/check-distribution.py'],steps)
        if args.profile=='all':
            run([sys.executable,'tools/check-governance.py'],steps)
            run([sys.executable,'methodology/upstream/prompt-literate-workflow/scripts/validate-project.py','--project','.','--state','candidate'],steps)
        assert before==snapshots(),'Control pass changed tracked file bytes'
        status='PASS'
    except Exception as error:
        print(str(error),file=sys.stderr)
    finally:
        revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
        (REPORT/'check-project.json').write_text(json.dumps({'status':status,'profile':args.profile,'sourceRevision':revision,'platform':platform.platform(),'python':platform.python_version(),'steps':steps,'trackedFilesUnchanged':before==snapshots()},indent=2)+'\n')
    return 0 if status=='PASS' else 1
if __name__=='__main__':raise SystemExit(main())

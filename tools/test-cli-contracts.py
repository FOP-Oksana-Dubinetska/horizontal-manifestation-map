#!/usr/bin/env python3
"""Integration scenarios for the real executable, streams, files and resource bounds."""
import copy,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    exe=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'build/native-debug/bin/hmap'
    fixture=json.loads((ROOT/'test/fixtures/minimal-v2.roadmap.json').read_text())
    passed=0
    def run(args,source='',code=0):
        nonlocal passed
        result=subprocess.run([str(exe),*args],input=source.encode() if isinstance(source,str) else source,capture_output=True)
        assert result.returncode==code,(args,result.returncode,result.stderr.decode(errors='replace'))
        passed+=1
        return result
    def validate(project,expected,code=3):
        result=run(['validate','-','--format=json'],json.dumps(project,ensure_ascii=False),code)
        envelope=json.loads(result.stdout);assert not result.stderr
        assert expected in {d['code'] for d in envelope['diagnostics']},envelope
    run(['--version']);run(['--help','extra'],code=2);run(['render','missing.json','--help']);run(['render','missing.json','--help','--unknown'],code=2);run(['validate','missing.json','--glyphs=unicode'],code=2)
    broken=copy.deepcopy(fixture);broken['routes'][0]['steps'][0]['linkedModuleIds']=['m-missing'];validate(broken,'E_REF_NOT_FOUND')
    broken=copy.deepcopy(fixture);broken['routes'][0]['steps'][0]['linkedModuleIds']=['i-check'];validate(broken,'E_REF_TYPE')
    broken=copy.deepcopy(fixture);broken['modules'][0]['id']=broken['chunks'][0]['id'];validate(broken,'E_ID_DUPLICATE')
    broken=copy.deepcopy(fixture);broken['intents'][0]['parentIntentIds']=['i-check'];validate(broken,'E_INTENT_CYCLE')
    broken=copy.deepcopy(fixture);broken['selectedIntentId']=None;validate(broken,'E_SELECTION')
    broken=copy.deepcopy(fixture);broken['estimates'][0]['value']={'type':'unknown','reason':''};validate(broken,'E_ESTIMATE_REASON')
    broken=copy.deepcopy(fixture);broken['estimates'][0]['value']={'type':'range','metric':'effort','minMinutes':2,'maxMinutes':1};validate(broken,'E_ESTIMATE_RANGE')
    broken=copy.deepcopy(fixture);broken['metadata']['createdAt']='2026-02-31T00:00:00Z';validate(broken,'E_FIELD_TYPE')
    broken=copy.deepcopy(fixture);broken['id']='p'+'a'*40000;validate(broken,'E_ID_INVALID')
    run(['validate','-','--format=json'],b'\xff',3)
    limited=run(['validate','-','--format=json'],' '*8388609,5);assert json.loads(limited.stdout)['diagnostics'][0]['code']=='E_INPUT_LIMIT'
    run(['validate','-','--input-format=json','--format=json'],'['*65+']'*65,5)
    warned=copy.deepcopy(fixture);warned['estimates'][0]['basis']='';strict=run(['validate','-','--strict','--format=json'],json.dumps(warned),7);assert json.loads(strict.stdout)['ok'] is False
    empty=copy.deepcopy(fixture)
    for key in ['intents','routes','modules','chunks','intersections','estimates']:empty[key]=[]
    empty['selectedIntentId']=None;empty['selectedRouteId']=None
    run(['validate','-','--format=json'],json.dumps(empty))
    assert json.loads(run(['import',str(ROOT/'test/fixtures/minimal-v2.roadmap.txt')]).stdout)==fixture
    text=run(['template','--format=roadmap-text']).stdout
    normalized=run(['import','-'],text).stdout
    assert json.loads(normalized)==fixture
    assert run(['export','-','--format=markdown'],normalized).stdout==run(['export','-','--format=markdown'],normalized).stdout
    import os
    environment=os.environ.copy();environment.pop('NO_COLOR',None)
    colored=subprocess.run([str(exe),'validate','-','--color=always'],input=b'{broken',capture_output=True,env=environment)
    assert colored.returncode==3 and b'\x1b[' in colored.stderr
    environment['NO_COLOR']='1'
    plain=subprocess.run([str(exe),'validate','-','--color=always'],input=b'{broken',capture_output=True,env=environment)
    assert plain.returncode==3 and b'\x1b[' not in plain.stderr
    passed+=2
    run(['help','llm','--format=markdown']);run(['hints','-','--format=json'],normalized)
    run(['inspect','-','--id=m-validator','--format=json'],normalized)
    for flag in ['--mystery','--id=x','--width=20','--format=banana']:
        run(['validate','-','--format=json',flag],normalized,2)
    with tempfile.TemporaryDirectory() as directory:
        output=Path(directory)/'result.json';source=Path(directory)/'source.json';source.write_bytes(normalized)
        run(['import',str(source),'--output',str(output)]);before=output.read_bytes()
        run(['import',str(source),'--output',str(output)],code=4);assert output.read_bytes()==before
        run(['import',str(source),'--output',str(source),'--overwrite'],code=4);assert source.read_bytes()==normalized
        output.unlink();source.write_text('{broken')
        run(['import',str(source),'--output',str(output)],code=3);assert not output.exists()
    legacy=(ROOT/'test/fixtures/minimal-v1.roadmap.json').read_text();migrated=run(['migrate','-','--from=1','--to=2'],legacy)
    assert json.loads(migrated.stdout)['schemaVersion']==2 and b'planned' in migrated.stderr
    run(['migrate','-','--from=1','--to=2','--strict'],legacy,7)
    run(['validate',str(ROOT/'examples/hmap-development.roadmap.json')])
    (ROOT/'build/check-reports').mkdir(parents=True,exist_ok=True)
    (ROOT/'build/check-reports/cli-contracts.json').write_text(json.dumps({'passed':passed,'status':'PASS'},indent=2)+'\n')
    print(f'CLI integration: {passed}/{passed} PASS')
if __name__=='__main__':main()

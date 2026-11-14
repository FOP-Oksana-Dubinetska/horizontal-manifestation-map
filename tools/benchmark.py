#!/usr/bin/env python3
import copy,json,platform,subprocess,time,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    project=json.loads((ROOT/'test/fixtures/minimal-v2.roadmap.json').read_text())
    step=project['routes'][0]['steps'][1];steps=[]
    for i in range(1000):
        item=copy.deepcopy(step);item['id']='s-load-'+str(i);steps.append(item)
    project['routes'][0]['steps']=steps
    for i in range(3):
        chunk=copy.deepcopy(project['chunks'][0]);chunk['id']='c-load-'+str(i);chunk['body']='a'*250000
        project['chunks'].append(chunk)
    text=json.dumps(project,ensure_ascii=False)
    data={'apiVersion':1,'requestId':'bench','operation':'validate','input':{'format':'json','text':text}}
    start=time.monotonic();result=subprocess.run([str(ROOT/'build/native-release/bin/hmap-api-runner')],input=json.dumps(data).encode(),capture_output=True);elapsed=time.monotonic()-start
    assert result.returncode==0 and json.loads(result.stdout)['ok']
    cpu=platform.processor()
    if Path('/proc/cpuinfo').is_file():
        cpu=next((line.split(':',1)[1].strip() for line in Path('/proc/cpuinfo').read_text().splitlines() if line.startswith('model name')),cpu)
    report={'platform':platform.platform(),'cpuModel':cpu or 'not reported','logicalCpusReported':os.cpu_count(),'configuration':'native-release; process startup included','inputBytes':len(text.encode()),'steps':1000,'seconds':elapsed,'targetNativeSeconds':0.5,'targetIsOrientationNotUniversalGuarantee':True}
    output=ROOT/'build/check-reports/benchmark.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()

#!/usr/bin/env python3
"""Exercise the intention-led map and three locale resources through the real CLI."""
import copy, json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
exe = str(Path(sys.argv[1]).resolve())
project = json.loads((ROOT/'test/fixtures/minimal-v2.roadmap.json').read_text())
second = copy.deepcopy(project['intents'][0])
second.update(id='i-other', title='Another intention', parentIntentIds=['i-check'])
project['intents'].append(second)
project['selectedIntentId'] = project['selectedRouteId'] = None
source = json.dumps(project)
passed = 0
def run(args, text=source):
    global passed
    result = subprocess.run([exe, *args], input=text, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    passed += 1
    return result.stdout
for language in ['en', 'uk', 'ru']:
    options = ['--lang='+language]
    result = json.loads(run(['render', '-', '--format=json', *options]))['result']
    assert [r['intent']['id'] for r in result['rows']] == ['i-check', 'i-other']
    assert result['rows'][1]['route'] is None
    assert 'Another intention' in run(['render', '-', *options])
    sliced = json.loads(run(['render', '-', '--route=r-check', '--format=json', *options]))['result']
    assert len(sliced['rows']) == 1 and sliced['scope'] == 'route'
    for topic in ['workflow', 'intersections']:
        help = json.loads(run(['help', topic, '--format=json', *options]))['result']
        assert help['language'] == language and len(help['text']) > 50
    normalized = json.loads(run(['normalize', '-', '--format=json', *options]))
    assert normalized == project
    empty = copy.deepcopy(project)
    for key in ['intents','routes','modules','chunks','estimates','intersections']: empty[key] = []
    message = run(['render', '-', *options], json.dumps(empty))
    assert message.strip() == json.loads((ROOT/f'locales/{language}.json').read_text())['map']['start']
print(f'CLI intention workflow and locales: {passed}/{passed} PASS')

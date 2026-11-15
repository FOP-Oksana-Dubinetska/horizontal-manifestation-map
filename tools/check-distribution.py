#!/usr/bin/env python3
import hashlib,json
from html.parser import HTMLParser
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
    assert (SITE/'example.roadmap.json').read_bytes()==(ROOT/'examples/architecture-workspace.roadmap.json').read_bytes(), 'Example differs from source'
    class StaticHtml(HTMLParser):
        def handle_starttag(self,tag,attrs):
            attrs=dict(attrs)
            assert not any(key.lower().startswith('on') for key in attrs), 'Inline handler in static HTML'
            for key in ['src','href']:
                value=attrs.get(key,'')
                assert not value.lower().startswith(('file:','javascript:')), 'Unsafe local/script link'
            if tag=='script':
                src=attrs.get('src','')
                assert src and not src.startswith(('//','http:','https:','data:')), 'Expected external same-origin script'
    for name in ['index.html','embedding-example.html']:
        StaticHtml().feed((SITE/name).read_text())
    class Introduction(HTMLParser):
        def __init__(self):
            super().__init__(); self.language=None; self.text={}
        def handle_starttag(self,tag,attrs):
            values=dict(attrs)
            if tag=='p' and 'data-introduction-text' in values:
                self.language=values['data-introduction-text']; self.text[self.language]=''
        def handle_data(self,data):
            if self.language:self.text[self.language]+=data
        def handle_endtag(self,tag):
            if tag=='p':self.language=None
    source=json.loads((ROOT/'content/project-introduction.json').read_text())
    html=(SITE/'index.html').read_text(); introduction=Introduction(); introduction.feed(html)
    for language in ['en','ru','uk']:
        assert introduction.text[language]==source[language]['text'], 'Introduction differs from source: '+language
    assert html.index('id="about-hmap"') < html.index('id="page-footer"'), 'Introduction must precede footer'
    assert source['reviewUrl'] in html, 'Missing review credit'

    assert "script-src 'self' 'wasm-unsafe-eval'" in (SITE/'_headers').read_text(), 'Expected static CSP'
    forbidden=['.licensing-policy' ,'.code-constitution','.git','node_modules','_worker.js']
    for path in SITE.rglob('*'):
        assert not any(part in forbidden for part in path.relative_to(SITE).parts),str(path)
    manifest={str(p.relative_to(SITE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(SITE.rglob('*')) if p.is_file()}
    (ROOT/'build/check-reports').mkdir(parents=True,exist_ok=True)
    (ROOT/'build/check-reports/distribution.json').write_text(json.dumps({'version':version,'sha256':manifest},indent=2)+'\n')
    print(f'Distribution: PASS ({len(manifest)} files)')
if __name__=='__main__':main()

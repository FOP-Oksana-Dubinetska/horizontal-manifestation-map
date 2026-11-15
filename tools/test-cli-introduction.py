#!/usr/bin/env python3
"""Exercise real terminal presentation separately from machine-readable streams."""
import errno, json, os, select, subprocess, sys, tempfile, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def main():
    exe = Path(sys.argv[1]).resolve()
    report = ROOT / 'build/check-reports/cli-introduction.json'
    if os.name == 'nt':
        report.write_text(json.dumps({'status':'SKIP','reason':'POSIX PTY scenarios; stream contracts run on every platform'})+'\n')
        print('CLI introduction PTY: skipped on this platform')
        return
    import pty, fcntl, struct, termios
    source = json.loads((ROOT/'content/project-introduction.json').read_text())
    text, title = source['en']['text'], source['en']['title']
    fixture = str(ROOT/'test/fixtures/minimal-v2.roadmap.json')
    def terminal(args):
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 80, 0, 0))
        process = subprocess.Popen([str(exe),*args], stdin=subprocess.DEVNULL, stdout=slave, stderr=subprocess.PIPE)
        os.close(slave); chunks = []; deadline = time.monotonic()+10
        try:
            while True:
                if time.monotonic()>deadline: raise TimeoutError('Terminal child timed out')
                ready,_,_ = select.select([master],[],[],.1)
                if not ready: continue
                try: data = os.read(master,65536)
                except OSError as error:
                    if error.errno==errno.EIO: break
                    raise
                if not data: break
                chunks.append(data)
            code = process.wait(timeout=2)
            errors = process.stderr.read().decode()
            return code,b''.join(chunks).decode().replace('\r\n','\n'),errors
        finally:
            os.close(master)
            if process.poll() is None: process.kill(); process.wait()
    passed = 0
    for arguments in [[],['--help'],['render',fixture],['validate',fixture]]:
        code,out,err = terminal(arguments)
        assert code==0 and not err, (arguments,code,err)
        assert ' '.join(out.split()).startswith(title+' '+text)
        assert out.count(source['reviewUrl'])==1
        passed+=1
    code,out,err=terminal(['--version'])
    assert (code,out,err)==(0,'hmap 0.0.0\nschema 2\nRoadmapText 1\nAPI 1\n',''); passed+=1
    for arguments in [['validate',fixture,'--format=json'],['schema'],['template']]:
        code,out,err=terminal(arguments)
        assert code==0 and not err and title not in out
        json.loads(out); passed+=1
    code,out,err=terminal(['help','intents','--format=markdown'])
    assert code==0 and title not in out; passed+=1
    with tempfile.TemporaryDirectory() as directory:
        target=Path(directory)/'route.txt'
        code,out,err=terminal(['render',fixture,'--output',str(target)])
        assert code==0 and not out and not err and title not in target.read_text(); passed+=1
    piped=subprocess.run([str(exe),'--help'],capture_output=True,text=True)
    assert piped.returncode==0 and piped.stdout.startswith('Usage: hmap') and title not in piped.stdout; passed+=1
    code,out,err=terminal(['--unknown'])
    assert code==2 and not out and err; passed+=1
    report.write_text(json.dumps({'status':'PASS','passed':passed,'source':'content/project-introduction.json','terminalColumns':80},indent=2)+'\n')
    print(f'CLI introduction PTY/streams: {passed}/{passed} PASS')
if __name__=='__main__': main()

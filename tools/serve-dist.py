#!/usr/bin/env python3
"""Serve the distribution at both / and /tools/roadmap/ with the declared MIME types."""
import argparse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import urllib.parse

ROOT = Path(__file__).resolve().parents[1] / 'dist' / 'site'
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.wasm':'application/wasm','.mjs':'text/javascript','.js':'text/javascript'}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def translate_path(self, path):
        prefix='/tools/roadmap/'
        if path.startswith(prefix):
            path='/' + path[len(prefix):]
        return super().translate_path(path)
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'")
        super().end_headers()
    def log_message(self, *args):
        pass
if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4173);args=parser.parse_args()
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()

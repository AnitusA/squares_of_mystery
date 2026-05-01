from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get('PORT', '3000'))
STATE_FILE = ROOT / 'game-state.json'

DEFAULT_STATE = {
    'version': 2,
    'board': None,
    'teams': [],
    'currentIndex': 0,
    'history': [],
    'winners': [],
    'latestEvent': None,
}


def clone_default_state():
    return json.loads(json.dumps(DEFAULT_STATE))


def read_shared_state():
    try:
        if not STATE_FILE.exists():
            return clone_default_state()
        raw = STATE_FILE.read_text(encoding='utf-8').strip()
        if not raw:
            return clone_default_state()
        parsed = json.loads(raw)
        state = clone_default_state()
        state.update(parsed if isinstance(parsed, dict) else {})
        state['teams'] = parsed.get('teams', []) if isinstance(parsed, dict) and isinstance(parsed.get('teams'), list) else []
        state['history'] = parsed.get('history', []) if isinstance(parsed, dict) and isinstance(parsed.get('history'), list) else []
        state['winners'] = parsed.get('winners', []) if isinstance(parsed, dict) and isinstance(parsed.get('winners'), list) else []
        return state
    except Exception:
        return clone_default_state()


def write_shared_state(state):
    next_state = clone_default_state()
    if isinstance(state, dict):
        next_state.update(state)
        next_state['teams'] = state.get('teams', []) if isinstance(state.get('teams'), list) else []
        next_state['history'] = state.get('history', []) if isinstance(state.get('history'), list) else []
        next_state['winners'] = state.get('winners', []) if isinstance(state.get('winners'), list) else []
    STATE_FILE.write_text(json.dumps(next_state, indent=2), encoding='utf-8')
    return next_state


class GameHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if urlparse(self.path).path == '/api/state':
            payload = json.dumps(read_shared_state()).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        return super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != '/api/state':
            self.send_error(405, 'Method not allowed')
            return

        length = int(self.headers.get('Content-Length', '0') or '0')
        body = self.rfile.read(length).decode('utf-8') if length else '{}'
        try:
            payload = json.loads(body) if body.strip() else {}
            next_state = write_shared_state(payload)
            response = json.dumps(next_state).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response)
        except json.JSONDecodeError:
            response = json.dumps({'error': 'Invalid JSON payload'}).encode('utf-8')
            self.send_response(400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response)


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer(('0.0.0.0', PORT), GameHandler)
    print(f'Square of Mysteries server running on http://0.0.0.0:{PORT}')
    server.serve_forever()


if __name__ == '__main__':
    main()
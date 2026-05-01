from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import threading
import json
import os

app = Flask(__name__, static_folder='.')
CORS(app)

_latest_lock = threading.Lock()
_latest = None
LATEST_FILE = 'latest_event.json'


def load_latest():
    global _latest
    if os.path.exists(LATEST_FILE):
        try:
            with open(LATEST_FILE, 'r', encoding='utf-8') as f:
                _latest = json.load(f)
        except Exception:
            _latest = None


def save_latest():
    with _latest_lock:
        try:
            with open(LATEST_FILE, 'w', encoding='utf-8') as f:
                json.dump(_latest or {}, f)
        except Exception:
            pass


@app.route('/latest', methods=['GET'])
def get_latest():
    with _latest_lock:
        return jsonify(_latest or {})


@app.route('/update', methods=['POST'])
def update():
    global _latest
    data = request.get_json() or {}
    with _latest_lock:
        _latest = data
        save_latest()
    return jsonify({'ok': True})


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def static_proxy(path):
    # serve files from the current directory
    return send_from_directory('.', path)


if __name__ == '__main__':
    load_latest()
    app.run(host='0.0.0.0', port=5000)

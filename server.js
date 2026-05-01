const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const STATE_FILE = path.join(ROOT, 'game-state.json');

const DEFAULT_STATE = {
  version: 2,
  board: null,
  teams: [],
  currentIndex: 0,
  history: [],
  winners: [],
  latestEvent: null
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function readSharedState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return cloneDefaultState();
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    if (!raw.trim()) return cloneDefaultState();
    const parsed = JSON.parse(raw);
    return {
      ...cloneDefaultState(),
      ...parsed,
      teams: Array.isArray(parsed.teams) ? parsed.teams : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      winners: Array.isArray(parsed.winners) ? parsed.winners : []
    };
  } catch (error) {
    return cloneDefaultState();
  }
}

function writeSharedState(state) {
  const nextState = {
    ...cloneDefaultState(),
    ...state,
    teams: Array.isArray(state?.teams) ? state.teams : [],
    history: Array.isArray(state?.history) ? state.history : [],
    winners: Array.isArray(state?.winners) ? state.winners : []
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(nextState, null, 2), 'utf8');
  return nextState;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function serveStatic(req, res, pathname) {
  const relativePath = pathname === '/' ? '/login.html' : pathname;
  const normalizedPath = path.normalize(relativePath).replace(/^([/\\])+/, '');
  const filePath = path.resolve(ROOT, normalizedPath);

  if (!filePath.startsWith(ROOT)) {
    return sendText(res, 403, 'Forbidden');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return sendText(res, 404, 'Not found');
  }

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'no-store'
    });
    res.end(content);
  } catch (error) {
    sendText(res, 500, 'Failed to read file');
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, readSharedState());
  }

  if (requestUrl.pathname === '/api/state' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const nextState = writeSharedState(parsed);
        sendJson(res, 200, nextState);
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendText(res, 405, 'Method not allowed');
  }

  serveStatic(req, res, requestUrl.pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Square of Mysteries server running on http://0.0.0.0:${PORT}`);
});

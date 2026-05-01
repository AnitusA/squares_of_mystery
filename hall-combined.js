// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDToHas8Id_5BiotcRirE222DR8ki93b88",
  authDomain: "squares-of-mystery.firebaseapp.com",
  projectId: "squares-of-mystery",
  storageBucket: "squares-of-mystery.firebasestorage.app",
  messagingSenderId: "91483191813",
  appId: "1:91483191813:web:700f71b3fc9178f5823a6c",
  measurementId: "G-5D2BNNHLQX"
};

const DB_PATHS = {
  gameState: 'gameState',
  latestEvent: 'latestEvent'
};

// ===== HALL APP =====
(() => {
  const waitingEl = document.getElementById('waiting');
  const displayEl = document.getElementById('display');
  const taskVisualEl = document.getElementById('taskVisual');
  const taskIconEl = document.getElementById('taskIcon');
  const tileNumEl = document.getElementById('tileNum');
  const tileTextEl = document.getElementById('tileText');
  const tileMetaEl = document.getElementById('tileMeta');
  const boardEl = document.getElementById('board');
  const BOARD_SIZE = 67;

  let db = null;
  try {
    const fbApp = firebase.initializeApp(firebaseConfig);
    db = firebase.database(fbApp);
  } catch (error) {
    console.log('Firebase not available');
  }

  function getTaskAsset(taskType) {
    const symbolMap = {
      dare: 'symbols/devil.png',
      treasure: 'symbols/treasure.png',
      hex: 'symbols/sword.png',
      snake: 'symbols/mine.png',
      quiz: 'symbols/quiz.png'
    };
    return symbolMap[taskType?.toLowerCase()] || '';
  }

  function render(payload) {
    if (!payload) return;
    waitingEl.hidden = true;
    displayEl.hidden = false;
    const taskType = payload.type ?? '-';
    const taskAsset = getTaskAsset(taskType);
    taskVisualEl.classList.add('flicker');
    if (taskAsset) {
      taskIconEl.src = taskAsset;
      taskIconEl.alt = `${taskType} symbol`;
      taskIconEl.hidden = false;
    } else {
      taskIconEl.hidden = true;
    }
    tileNumEl.textContent = payload.pos ?? '-';
    const status = payload.status ? ` (${payload.status})` : '';
    tileTextEl.textContent = `${taskType}${status}`;
    tileMetaEl.textContent = `${payload.team ?? 'Team'} · ${new Date(payload.ts || Date.now()).toLocaleTimeString()}`;
  }

  function getLatestEvent(sharedState) {
    if (sharedState && sharedState.latestEvent) return sharedState.latestEvent;
    if (sharedState && Array.isArray(sharedState.history) && sharedState.history.length) {
      const last = sharedState.history[sharedState.history.length - 1];
      return {
        type: last.type,
        text: last.text,
        team: last.team,
        pos: last.pos,
        status: 'completed',
        ts: last.ts
      };
    }
    return null;
  }

  function renderBoard(state) {
    const teams = Array.isArray(state.teams) ? state.teams : [];
    boardEl.innerHTML = '';
    for (let pos = 1; pos <= BOARD_SIZE; pos++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      const coins = teams
        .filter(team => (team.pos || 0) === pos)
        .map(team => `<span class="coin" title="${team.name}" style="background:${team.color || '#64748b'}">${team.name.slice(0,1).toUpperCase()}</span>`)
        .join('');
      tile.innerHTML = `<div class="num">${pos}</div>${coins ? `<div class="coins">${coins}</div>` : ''}`;
      boardEl.appendChild(tile);
    }
  }

  function renderLeaderboard(state) {
    const leaderboardEl = document.getElementById('leaderboard');
    const teams = Array.isArray(state.teams) ? state.teams : [];
    
    leaderboardEl.innerHTML = '';
    if (!teams.length) {
      leaderboardEl.innerHTML = '<div style="color:#9fb3d0;font-size:14px">No teams yet</div>';
      return;
    }
    
    const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
    
    sorted.forEach((team, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      item.innerHTML = `
        <div class="leaderboard-coin" style="background:${team.color || '#64748b'}">${team.name.slice(0,1).toUpperCase()}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${medalEmoji} ${team.name}</div>
          <div class="leaderboard-pos">Pos: ${team.pos || 0}</div>
        </div>
        <div class="leaderboard-points">${team.points || 0}</div>
      `;
      leaderboardEl.appendChild(item);
    });
  }

  function renderSharedState(state) {
    render(getLatestEvent(state));
    renderBoard(state);
    renderLeaderboard(state);
  }

  function setupFirebaseListeners() {
    if (!db) {
      setInterval(readLatest, 2000);
      return;
    }

    db.ref(DB_PATHS.gameState).on('value', (snapshot) => {
      if (snapshot.exists()) {
        const state = snapshot.val();
        renderSharedState(state || {});
      }
    });

    db.ref(DB_PATHS.latestEvent).on('value', (snapshot) => {
      if (snapshot.exists()) {
        render(snapshot.val());
      }
    });
  }

  async function readLatest() {
    try {
      if (!db) return;
      const snapshot = await db.ref(DB_PATHS.gameState).once('value');
      if (snapshot.exists()) {
        renderSharedState(snapshot.val() || {});
      }
    } catch (error) {
      // ignore fetch errors
    }
  }

  setupFirebaseListeners();
  readLatest();
})();

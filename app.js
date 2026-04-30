(() => {
  const BOARD_SIZE = 67;
  const STORAGE_KEY = 'squares_state_v2';

  // elements
  const teamListEl = document.getElementById('teamList');
  const addTeamBtn = document.getElementById('addTeam');
  const teamNameInput = document.getElementById('teamName');
  const teamMembersInput = document.getElementById('teamMembers');
  const teamColorSelect = document.getElementById('teamColor');
  const resetBoardBtn = document.getElementById('resetBoard');
  const boardEl = document.getElementById('board');
  const teamsStatusEl = document.getElementById('teamsStatus');
  const currentTeamEl = document.getElementById('currentTeam');
  const turnTeamSelect = document.getElementById('turnTeam');
  const setTurnBtn = document.getElementById('setTurnBtn');
  const rollBtn = document.getElementById('rollBtn');
  const diceEl = document.getElementById('dice');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalOk = document.getElementById('modalOk');
  const modalComplete = document.getElementById('modalComplete');
  const assignTeam = document.getElementById('assignTeam');
  const assignPoints = document.getElementById('assignPoints');
  const assignBtn = document.getElementById('assignBtn');
  const savedStateEl = document.getElementById('savedState');

  // game state
  let state = {
    version: 2,
    board: null,
    teams: [],
    currentIndex: 0,
    history: [], // {type,text,team,pos,ts}
    winners: [] // first three teams to reach 67
  };

  const TEAM_COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Stone', value: '#78716c' },
    { name: 'Zinc', value: '#52525b' }
  ];

  function refreshColorPicker(){
    if(!teamColorSelect) return;
    const usedColors = new Set(state.teams.map(team => team.color).filter(Boolean));
    const availableColors = TEAM_COLORS.filter(color => !usedColors.has(color.value));
    const fallbackColor = availableColors[0] || TEAM_COLORS[0];
    const previousValue = teamColorSelect.value;
    teamColorSelect.innerHTML = '';
    (availableColors.length ? availableColors : TEAM_COLORS).forEach((color, index) => {
      const option = document.createElement('option');
      option.value = color.value;
      option.textContent = color.name;
      option.style.background = color.value;
      option.style.color = '#fff';
      if(index === 0) option.selected = true;
      teamColorSelect.appendChild(option);
    });
    if (availableColors.length && availableColors.some(color => color.value === previousValue)) {
      teamColorSelect.value = previousValue;
    } else {
      teamColorSelect.value = fallbackColor.value;
    }
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateSavedLabel(); }
  function load() { const s = localStorage.getItem(STORAGE_KEY); if (s) state = JSON.parse(s); updateSavedLabel(); }
  function updateSavedLabel(){ savedStateEl.textContent = localStorage.getItem(STORAGE_KEY) ? 'yes' : 'no' }

  function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min }

  function resetGame(){
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
    state = {
      version: 2,
      board: generateBoard(),
      teams: [],
      currentIndex: 0,
      history: [],
      winners: []
    };
    diceEl.textContent = '-';
    if (moveSteps) moveSteps.value = '';
    try { localStorage.removeItem('som_latest_event_v1'); } catch (error) { /* ignore */ }
    save();
    renderBoard();
    renderTeams();
    renderWinners();
    renderHall();
  }

  function generateBoard(){
    // create empty board
    const tiles = Array.from({length:BOARD_SIZE}, (_,i)=>({pos:i+1,type:'empty'}));

    // First 50 (1..50): place only task tiles, no snakes or empty tiles
    const firstCount = 50;
    const pool = [];
    pool.push(...Array(15).fill('dare'));
    pool.push(...Array(15).fill('quiz'));
    pool.push(...Array(10).fill('hex'));
    pool.push(...Array(10).fill('treasure'));
    // fill remaining to reach firstCount with task tiles
    while(pool.length < firstCount) pool.push('empty');
    // assign randomly into first 50 slots
    for(let i=0;i<firstCount;i++){ const t = pool.splice(randInt(0,pool.length-1),1)[0]; tiles[i].type = t }

    // Last 17 (51..67): 7 snake tiles, rest empty
    const nextRangeIdx = Array.from({length:BOARD_SIZE - firstCount},(_,i)=>firstCount + i);
    const snakeSlots = new Set();
    while(snakeSlots.size < 7) snakeSlots.add(nextRangeIdx[randInt(0,nextRangeIdx.length-1)]);
    for(const idx of nextRangeIdx){ if(snakeSlots.has(idx)) tiles[idx].type = 'snake'; }

    // remaining are empty
    return tiles;
  }

  function renderBoard(){
    boardEl.innerHTML = '';
    // show grid 67 tiles in 11 columns (will wrap)
    state.board.forEach(tile => {
      const d = document.createElement('div');
      d.className = 'tile type-'+(tile.type||'empty');
      const onTileTeams = state.teams
        .filter(team => (team.pos || 0) === tile.pos)
        .map(team => `<span class="team-coin" title="${team.name}" style="background:${team.color || '#64748b'}">${team.name.slice(0, 1).toUpperCase()}</span>`)
        .join('');
      d.innerHTML = `<div class="num">${tile.pos}</div><div>${tile.type}</div>${onTileTeams ? `<div class="team-coins">${onTileTeams}</div>` : ''}`;
      boardEl.appendChild(d);
    });
  }

  function renderTeams(){
    teamListEl.innerHTML = '';
    teamsStatusEl.innerHTML = '';
    assignTeam.innerHTML = '';
    if (turnTeamSelect) turnTeamSelect.innerHTML = '';
    state.teams.forEach((t,i)=>{
      const li = document.createElement('li');
      li.innerHTML = `<span class="team-swatch" style="background:${t.color || '#64748b'}"></span><span>${t.name} (${t.members.length} members)</span>`;
      teamListEl.appendChild(li);

      const li2 = document.createElement('li');
      li2.innerHTML = `<span class="team-swatch" style="background:${t.color || '#64748b'}"></span><strong>${t.name}</strong> — pos: ${t.pos||0} pts: ${t.points||0}${state.winners.includes(t.name) ? ' <strong>(Winner)</strong>' : ''}`;
      teamsStatusEl.appendChild(li2);

      const opt = document.createElement('option'); opt.value = i; opt.textContent = t.name; assignTeam.appendChild(opt);

      if (turnTeamSelect) {
        const turnOpt = document.createElement('option');
        turnOpt.value = i;
        turnOpt.textContent = t.name;
        if (i === state.currentIndex) turnOpt.selected = true;
        turnTeamSelect.appendChild(turnOpt);
      }
    });
    currentTeamEl.textContent = state.teams[state.currentIndex] ? state.teams[state.currentIndex].name : '—';
    refreshColorPicker();
  }

  function renderWinners(){
    let winnersEl = document.getElementById('winnersList');
    if(!winnersEl) return;
    winnersEl.innerHTML = '';
    if(!state.winners.length){
      winnersEl.innerHTML = '<li class="small">No winners yet</li>';
      return;
    }
    state.winners.forEach((name, index) => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>#${index + 1}</strong> ${name}`;
      winnersEl.appendChild(item);
    });
  }

  function nextTurn(){ state.currentIndex = (state.currentIndex+1) % Math.max(1,state.teams.length); save(); renderTeams(); }

  function setManualTurn(index){
    if (!state.teams.length) return alert('Add teams first');
    const nextIndex = Number(index);
    if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= state.teams.length) {
      return alert('Select a valid team');
    }
    state.currentIndex = nextIndex;
    save();
    renderTeams();
  }

  function showModal(title, bodyHTML, showComplete=false, onComplete=null){
    modalTitle.textContent = title; modalBody.innerHTML = bodyHTML;
    modal.classList.remove('hidden');
    modalOk.classList.toggle('hidden', showComplete);
    modalOk.onclick = ()=>{ modal.classList.add('hidden'); if(!showComplete) nextTurn(); }
    if(showComplete){ modalComplete.classList.remove('hidden'); modalComplete.onclick = ()=>{ modal.classList.add('hidden'); if(onComplete) onComplete(); nextTurn(); }} else { modalComplete.classList.add('hidden'); modalComplete.onclick = null }
  }

  function handleTile(team, tile){
    let entryText = tile.type;
    if(tile.type === 'dare'){
      state.history.push({type:'dare', text:'dare', team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Dare', '<p>Offline dare challenge</p><p class="small">Complete it, then press Completed.</p>', true, ()=>{ team.points = (team.points||0) + 2; updateLatestEvent('dare', team, tile, 'completed'); });
    } else if(tile.type === 'treasure'){
      state.history.push({type:'treasure', text:'treasure', team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Treasure', '<p>Offline treasure challenge</p><p class="small">Complete it, then press Completed.</p>', true, ()=>{ team.points = (team.points||0) + 2; updateLatestEvent('treasure', team, tile, 'completed'); });
    } else if(tile.type === 'quiz'){
      state.history.push({type:'quiz', text:'quiz', team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Quiz', '<p>Offline quiz challenge</p><p class="small">Complete it, then press Completed.</p>', true, ()=>{ team.points = (team.points||0) + 2; updateLatestEvent('quiz', team, tile, 'completed'); });
    } else if(tile.type === 'hex'){
      entryText = `hex`;
      state.history.push({type:'hex', text:'hex', team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Hex', '<p>Offline hex challenge</p><p class="small">Complete it, then press Completed.</p>', true, ()=>{ updateLatestEvent('hex', team, tile, 'completed'); });
    } else if(tile.type === 'snake'){
      const loss = randInt(5,10);
      entryText = 'snake';
      state.history.push({type:'snake', text:'snake', team:team.name, pos:tile.pos, ts:Date.now()});
      team.points = Math.max(0,(team.points||0) - loss);
      showModal('Snake', `<p>Snake penalty: -${loss} points</p><p class="small">Press Completed to continue.</p>`, true, ()=>{ updateLatestEvent('snake', team, tile, 'completed'); });
    } else {
      // nothing
      entryText = 'Empty';
      state.history.push({type:'empty', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Nothing', `<p>Empty tile.</p><p class="small">Press Completed to continue.</p>`, true, ()=>{ updateLatestEvent('empty', team, tile, 'completed'); });
    }
    // generate hall url payload and place into hallUrl input
    if((team.pos || 0) >= BOARD_SIZE && !state.winners.includes(team.name) && state.winners.length < 3){
      state.winners.push(team.name);
      alert(`${team.name} reached ${BOARD_SIZE} and won!`);
    }
    updateLatestEvent(tile.type, team, tile, 'pending');
    save(); renderTeams(); renderWinners(); renderHall(); renderBoard();
  }

  function updateLatestEvent(type, team, tile, status){
    try{
      localStorage.setItem('som_latest_event_v1', JSON.stringify({
        type,
        text: status === 'completed' ? type : 'hidden',
        team: team.name,
        pos: tile.pos,
        status,
        ts: Date.now(),
        winners: state.winners
      }));
    }catch(e){ /* ignore shared display storage errors */ }
  }

  function renderHall(){
    const listEl = document.getElementById('hallList');
    listEl.innerHTML = '';
    if(!state.history || !state.history.length) return listEl.innerHTML = '<div class="small">No events yet</div>';

    // iterate newest-first and include entries, but cap identical text to max 3
    const counts = {}; let shown = 0;
    for(let i = state.history.length - 1; i >= 0 && shown < 200; i--){
      const e = state.history[i];
      const key = e.type + '||' + e.text;
      counts[key] = counts[key] || 0;
      if(counts[key] >= 3) continue; // skip further duplicates beyond 3
      counts[key]++;
      const item = document.createElement('div'); item.className = 'hall-item';
      const time = new Date(e.ts).toLocaleTimeString();
      item.innerHTML = `<strong>${e.type}</strong>: ${e.text} <span class="small">— ${e.team} @${e.pos} ${time}</span>`;
      listEl.appendChild(item);
      shown++;
    }
  }

  // Manual move handler: user rolls real dice and enters steps
  const moveBtn = document.getElementById('moveBtn');
  const moveSteps = document.getElementById('moveSteps');
  moveBtn.addEventListener('click', ()=>{
    if(!state.teams.length) return alert('Add teams first');
    const steps = Number(moveSteps.value);
    if(!steps || steps <= 0) return alert('Enter a positive number of steps');
    const team = state.teams[state.currentIndex];
    const d = steps; diceEl.textContent = d; moveSteps.value = '';
    team.pos = (team.pos || 0) + d;
    if(team.pos > BOARD_SIZE) team.pos = BOARD_SIZE;
    save(); renderTeams();
    const tile = state.board[team.pos-1];
    handleTile(team, tile);
  });

  // admin actions
  addTeamBtn.addEventListener('click', ()=>{
    const name = teamNameInput.value.trim(); if(!name) return alert('Enter name');
    const members = teamMembersInput.value.split(',').map(s=>s.trim()).filter(Boolean);
    const color = teamColorSelect ? teamColorSelect.value : TEAM_COLORS[0].value;
    state.teams.push({name,members,color,points:0,pos:0}); teamNameInput.value=''; teamMembersInput.value=''; if(teamColorSelect) teamColorSelect.value = TEAM_COLORS[0].value; save(); renderTeams(); renderBoard();
  });

  resetBoardBtn.addEventListener('click', ()=>{ if(confirm('Reset the full game? This clears teams, winners, history, and creates a new board.')){ resetGame(); } });

  assignBtn.addEventListener('click', ()=>{
    const idx = Number(assignTeam.value); const pts = Number(assignPoints.value)||0; if(isNaN(idx)) return;
    state.teams[idx].points = (state.teams[idx].points||0) + pts; save(); renderTeams();
  });

  if (setTurnBtn) {
    setTurnBtn.addEventListener('click', ()=> setManualTurn(turnTeamSelect.value));
  }

  modalOk.addEventListener('click', ()=>{ modal.classList.add('hidden'); nextTurn(); });

  modalComplete.addEventListener('click', ()=>{ modal.classList.add('hidden'); nextTurn(); });

  // Hall clear
  document.getElementById('clearHall').addEventListener('click', ()=>{ if(confirm('Clear hall history?')){ state.history = []; save(); renderHall(); } });

  // load or initialize
  load();
  if(!state.board) state.board = generateBoard();
  if(!Array.isArray(state.winners)) state.winners = [];
  refreshColorPicker();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        SOM_AUTH.logout();
        window.location.href = 'login.html';
      });
    }
  renderBoard(); renderTeams(); renderWinners();
  renderHall();

  // copy/open hall url buttons

  // expose for debugging
  window._SOM = {state, save, generateBoard};
})();

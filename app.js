(() => {
  const BOARD_SIZE = 67;
  const STORAGE_KEY = 'squares_state_v1';

  // elements
  const teamListEl = document.getElementById('teamList');
  const addTeamBtn = document.getElementById('addTeam');
  const teamNameInput = document.getElementById('teamName');
  const teamMembersInput = document.getElementById('teamMembers');
  const daresEl = document.getElementById('dares');
  const treasuresEl = document.getElementById('treasures');
  const saveContentBtn = document.getElementById('saveContent');
  const resetBoardBtn = document.getElementById('resetBoard');
  const boardEl = document.getElementById('board');
  const teamsStatusEl = document.getElementById('teamsStatus');
  const currentTeamEl = document.getElementById('currentTeam');
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
    board: null,
    teams: [],
    currentIndex: 0,
    content: { dares: [], treasures: [] },
    history: [] // {type,text,team,pos,ts}
  };

  // simple hardcoded quiz list (editable in code)
  const QUIZ = [
    {q:'Capital of France?', a:'paris', points:10},
    {q:'2+2*2 = ?', a:'6', points:5},
    {q:'Color of the sky on clear day?', a:'blue', points:5}
  ];

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateSavedLabel(); }
  function load() { const s = localStorage.getItem(STORAGE_KEY); if (s) state = JSON.parse(s); updateSavedLabel(); }
  function updateSavedLabel(){ savedStateEl.textContent = localStorage.getItem(STORAGE_KEY) ? 'yes' : 'no' }

  function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min }

  function generateBoard(){
    // create empty board
    const tiles = Array.from({length:BOARD_SIZE}, (_,i)=>({pos:i+1,type:'empty'}));

    // First 50 (1..50): place 15 dare, 15 quiz, 7 hex, 7 treasure -> 44 special, 6 empty
    const firstCount = 50;
    const pool = [];
    pool.push(...Array(15).fill('dare'));
    pool.push(...Array(15).fill('quiz'));
    pool.push(...Array(7).fill('hex'));
    pool.push(...Array(7).fill('treasure'));
    // fill remaining to reach firstCount with 'empty'
    while(pool.length < firstCount) pool.push('empty');
    // assign randomly into first 50 slots
    for(let i=0;i<firstCount;i++){ const t = pool.splice(randInt(0,pool.length-1),1)[0]; tiles[i].type = t }

    // Next 10 (51..60): 4 snake (minus points), rest empty
    const nextRangeIdx = Array.from({length:10},(_,i)=>firstCount + i);
    const snakeSlots = new Set();
    while(snakeSlots.size < 4) snakeSlots.add(nextRangeIdx[randInt(0,nextRangeIdx.length-1)]);
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
      d.innerHTML = `<div class="num">${tile.pos}</div><div>${tile.type}</div>`;
      boardEl.appendChild(d);
    });
  }

  function renderTeams(){
    teamListEl.innerHTML = '';
    teamsStatusEl.innerHTML = '';
    assignTeam.innerHTML = '';
    state.teams.forEach((t,i)=>{
      const li = document.createElement('li');
      li.textContent = `${t.name} (${t.members.length} members)`;
      teamListEl.appendChild(li);

      const li2 = document.createElement('li');
      li2.innerHTML = `<strong>${t.name}</strong> — pos: ${t.pos||0} pts: ${t.points||0}`;
      teamsStatusEl.appendChild(li2);

      const opt = document.createElement('option'); opt.value = i; opt.textContent = t.name; assignTeam.appendChild(opt);
    });
    currentTeamEl.textContent = state.teams[state.currentIndex] ? state.teams[state.currentIndex].name : '—';
  }

  function nextTurn(){ state.currentIndex = (state.currentIndex+1) % Math.max(1,state.teams.length); save(); renderTeams(); }

  function showModal(title, bodyHTML, showComplete=false, onComplete=null){
    modalTitle.textContent = title; modalBody.innerHTML = bodyHTML;
    modal.classList.remove('hidden');
    modalOk.onclick = ()=>{ modal.classList.add('hidden'); if(!showComplete) nextTurn(); }
    if(showComplete){ modalComplete.classList.remove('hidden'); modalComplete.onclick = ()=>{ modal.classList.add('hidden'); if(onComplete) onComplete(); nextTurn(); }} else { modalComplete.classList.add('hidden'); modalComplete.onclick = null }
  }

  function handleTile(team, tile){
    let entryText = '';
    if(tile.type === 'dare'){
      const list = state.content.dares.length ? state.content.dares : ['Do a team photo with a funny face','Sing a short song'];
      entryText = list[randInt(0,list.length-1)];
      state.history.push({type:'dare', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Dare!', `<p>${entryText}</p>`, true, ()=>{ team.points = (team.points||0) + 10 });
    } else if(tile.type === 'treasure'){
      const list = state.content.treasures.length ? state.content.treasures : ['Small treasure: +15 points','Find a hidden token: +20 points'];
      entryText = list[randInt(0,list.length-1)];
      state.history.push({type:'treasure', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Treasure', `<p>${entryText}</p>`, true, ()=>{ team.points = (team.points||0) + 15 });
    } else if(tile.type === 'quiz'){
      const q = QUIZ[randInt(0,QUIZ.length-1)];
      entryText = q.q;
      state.history.push({type:'quiz', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      modal.classList.remove('hidden');
      modalTitle.textContent = 'Quiz';
      modalBody.innerHTML = `<p>${q.q}</p><input id="quizAns" placeholder="answer" />`;
      modalOk.onclick = ()=>{
        const ans = document.getElementById('quizAns').value.trim().toLowerCase();
        if(ans === q.a.toLowerCase()){ team.points = (team.points||0) + (q.points||5); alert('Correct! +' + (q.points||5) + ' points') } else { alert('Wrong answer') }
        modal.classList.add('hidden'); nextTurn(); save(); renderTeams(); renderHall();
      }
      modalComplete.classList.add('hidden');
    } else if(tile.type === 'hex'){
      // give small random bonus
      const bonus = randInt(5,20);
      entryText = `Hex +${bonus}`;
      state.history.push({type:'hex', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Hex', `<p>Hex effect: +${bonus} points</p>`, false, null);
      team.points = (team.points||0) + bonus;
    } else if(tile.type === 'snake'){
      const loss = randInt(6,15);
      entryText = `Snake -${loss}`;
      state.history.push({type:'snake', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      team.points = Math.max(0,(team.points||0) - loss);
      showModal('Snake!', `<p>Unlucky! -${loss} points</p>`, false, null);
    } else {
      // nothing
      entryText = 'Empty';
      state.history.push({type:'empty', text:entryText, team:team.name, pos:tile.pos, ts:Date.now()});
      showModal('Nothing', `<p>Empty tile.</p>`, false, null);
    }
    // generate hall url payload and place into hallUrl input
    save(); renderTeams(); renderHall();
    try{ const payload = {type: tile.type, text: entryText || tile.type, team: team.name, pos: tile.pos, ts: Date.now() };
      const enc = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const url = window.location.origin + window.location.pathname.replace(/index.html$/,'') + 'hall.html#' + enc;
      const hallInput = document.getElementById('hallUrl'); if(hallInput) hallInput.value = url;
    }catch(e){ /* ignore */ }
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

  // gameplay: roll dice and move current team
  rollBtn.addEventListener('click', ()=>{
    // (old roll handler removed)
  });

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
    state.teams.push({name,members,points:0,pos:0}); teamNameInput.value=''; teamMembersInput.value=''; save(); renderTeams();
  });

  saveContentBtn.addEventListener('click', ()=>{
    state.content.dares = daresEl.value.split('\n').map(s=>s.trim()).filter(Boolean);
    state.content.treasures = treasuresEl.value.split('\n').map(s=>s.trim()).filter(Boolean);
    save(); alert('Saved content');
  });

  resetBoardBtn.addEventListener('click', ()=>{ if(confirm('Randomize board?')){ state.board = generateBoard(); save(); renderBoard(); } });

  assignBtn.addEventListener('click', ()=>{
    const idx = Number(assignTeam.value); const pts = Number(assignPoints.value)||0; if(isNaN(idx)) return;
    state.teams[idx].points = (state.teams[idx].points||0) + pts; save(); renderTeams();
  });

  modalOk.addEventListener('click', ()=>{ modal.classList.add('hidden'); nextTurn(); });

  modalComplete.addEventListener('click', ()=>{ modal.classList.add('hidden'); nextTurn(); });

  // Hall clear
  document.getElementById('clearHall').addEventListener('click', ()=>{ if(confirm('Clear hall history?')){ state.history = []; save(); renderHall(); } });

  // load or initialize
  load();
  if(!state.board) state.board = generateBoard();
  // populate content inputs
  daresEl.value = state.content.dares.join('\n'); treasuresEl.value = state.content.treasures.join('\n');
  renderBoard(); renderTeams();
  renderHall();

  // copy/open hall url buttons
  const copyHallBtn = document.getElementById('copyHall');
  const openHallBtn = document.getElementById('openHall');
  copyHallBtn.addEventListener('click', ()=>{ const v = document.getElementById('hallUrl').value; if(!v) return alert('No Hall URL'); navigator.clipboard.writeText(v).then(()=>alert('Copied')); });
  openHallBtn.addEventListener('click', ()=>{ const v = document.getElementById('hallUrl').value; if(!v) return alert('No Hall URL'); window.open(v,'_blank'); });

  // expose for debugging
  window._SOM = {state, save, generateBoard};
})();

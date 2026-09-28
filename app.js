'use strict';

const STORAGE_KEY = 'ultiCalculator_session_v1';

// Minden leosztásban pontosan egy "alapjáték" van jelen (parti / 40-100 /
// 20-100 — jatekAlap: true — vagy egy "színtelen" bemondás, amely helyettesíti
// azt), és ehhez tetszés szerint társulhatnak további extra bemondások. A
// felhasználó egyetlen közös legördülőből választ (a mezőn belül nincs
// megkülönböztetve "kötelező játék" és "extra bemondás") — ha egy olyan
// extrát választ, ami megkövetel egy alapjátékot (ulti, négy ász, színes
// durchmars/redurchmars), és még nincs alapjáték vagy színtelen sor a
// leosztásban, az app automatikusan hozzáadja a "Parti" alapjátékot egy külön
// sorként (ld. ensureBaseGameLine).
//
// A durchmars/redurchmars (más néven terített durchmars) lehet "színes" (van
// adu, ezért kombinálható az alapjátékkal és pl. ultival, közös/joint
// kontrával) vagy "színtelen" (nincs adu, helyettesíti az alapjátékot, mint
// a betli — egyénenkénti/split kontrával).
//
// A "piros" itt NEM önálló katalógus-elem: egy leosztásban egyetlen valódi
// adu-szín van, tehát ha az alapjáték piros, a hozzá adott "színes" extrák
// (négy ász, ulti, színes durchmars/redurchmars) automatikusan és kizárólag
// pirosak is — ezt a "Piros adu" jelölőnégyzet (piros-adu-toggle) dupláz
// egységesen mindannyiukra, nincs rá külön választás soronként.
// A betli ezzel szemben mindig "színtelen" (nem kombinálható semmi mással), a
// "piros betli" pedig nem aduszínt jelent, csak egy önálló, erősebb (dupla
// értékű) fokozatot — ezért ez az egyetlen bemondás, amelynek saját,
// soronkénti piros jelölőnégyzete van (pirosVariant: true).
const BEMONDASOK = [
  { id: 'parti', nev: 'Parti', ertek: 1, kategoria: 'szin', jatekAlap: true },
  { id: '40_100', nev: '40-100', ertek: 4, kategoria: 'szin', jatekAlap: true },
  { id: '20_100', nev: '20-100', ertek: 8, kategoria: 'szin', jatekAlap: true },
  { id: 'negy_asz', nev: 'Négy ász', ertek: 4, kategoria: 'szin', optional: 'negyasz' },
  { id: 'ulti', nev: 'Ulti', ertek: 4, kategoria: 'szin', ultiSpecial: true },
  { id: 'durchmars_szintelen', nev: 'Durchmars (színtelen)', ertek: 6, kategoria: 'adu_nelkuli' },
  { id: 'durchmars_szines', nev: 'Durchmars (színes)', ertek: 6, kategoria: 'szin' },
  { id: 'redurchmars_szintelen', nev: 'Redurchmars / Terített durchmars (színtelen)', ertek: 24, kategoria: 'adu_nelkuli' },
  { id: 'redurchmars_szines', nev: 'Redurchmars / Terített durchmars (színes)', ertek: 24, kategoria: 'szin' },
  { id: 'betli', nev: 'Betli', ertek: 5, kategoria: 'adu_nelkuli', pirosVariant: true },
  { id: 'rebetli', nev: 'Rebetli / Terített betli', ertek: 20, kategoria: 'adu_nelkuli' },
];

const KONTRA_SZINTEK = ['Nincs kontra', 'Kontra', 'Rekontra', 'Szubkontra', 'Mordkontra', 'Hirschkontra', 'Fedák Sári'];

function bemondasById(id) {
  return BEMONDASOK.find(b => b.id === id);
}

// Ulti bukása esetén a sima duplázás helyett 2^szint + 1 az érvényes szorzó
// (kontra nélkül is duplán fizet, kontrával 3x, rekontrával 5x, szubkontrával 9x).
function multiplier(level, ultiSpecial, result) {
  if (ultiSpecial && result === 'bukas') return Math.pow(2, level) + 1;
  return Math.pow(2, level);
}

let state = loadState();

function defaultState() {
  return null;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
  state = null;
}

// ---------- SETUP SCREEN ----------

const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const resumeBanner = document.getElementById('resume-banner');
const setupFormWrapper = document.getElementById('setup-form-wrapper');
const playerCountSelect = document.getElementById('player-count');
const playerNamesDiv = document.getElementById('player-names');
const startingDealerSelect = document.getElementById('starting-dealer');
const negyaszToggle = document.getElementById('negyasz-toggle');
const btnExport = document.getElementById('btn-export');
const btnReset = document.getElementById('btn-reset');

function renderPlayerNameInputs() {
  const count = parseInt(playerCountSelect.value, 10);
  playerNamesDiv.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const label = document.createElement('label');
    label.className = 'field';
    label.textContent = `${i + 1}. játékos neve`;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `player-name-${i}`;
    input.placeholder = `Játékos ${i + 1}`;
    label.appendChild(input);
    playerNamesDiv.appendChild(label);
  }
  renderStartingDealerOptions();
}

function renderStartingDealerOptions() {
  const count = parseInt(playerCountSelect.value, 10);
  startingDealerSelect.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${i + 1}. játékos`;
    startingDealerSelect.appendChild(opt);
  }
}

playerCountSelect.addEventListener('change', renderPlayerNameInputs);

document.getElementById('btn-start').addEventListener('click', () => {
  const count = parseInt(playerCountSelect.value, 10);
  const players = [];
  for (let i = 0; i < count; i++) {
    const val = document.getElementById(`player-name-${i}`).value.trim();
    players.push(val || `Játékos ${i + 1}`);
  }
  const dealerIndex = parseInt(startingDealerSelect.value, 10);

  state = {
    playerCount: count,
    players: players,
    dealerIndex: dealerIndex,
    round: 1,
    totals: new Array(count).fill(0),
    history: [],
    pirosAszOsztNemOszt: false,
    negyaszEnabled: negyaszToggle.checked,
  };
  saveState();
  showGameScreen();
});

document.getElementById('btn-resume').addEventListener('click', () => {
  showGameScreen();
});

document.getElementById('btn-discard').addEventListener('click', () => {
  if (confirm('Biztosan elveted a mentett parti-estet? Ez nem vonható vissza.')) {
    clearState();
    resumeBanner.hidden = true;
    setupFormWrapper.hidden = false;
  }
});

btnReset.addEventListener('click', () => {
  if (confirm('Biztosan új parti-estet indítasz? A jelenlegi állás elvész.')) {
    clearState();
    location.reload();
  }
});

// ---------- GAME SCREEN ----------

const scoreLedgerEl = document.getElementById('score-ledger');
const roundTitleEl = document.getElementById('round-title');
const roundMetaEl = document.getElementById('round-meta');
const pirosAszToggle = document.getElementById('piros-asz-toggle');
const declarerSelect = document.getElementById('declarer-select');
const defendersInfoEl = document.getElementById('defenders-info');
const pirosAduToggle = document.getElementById('piros-adu-toggle');
const bemondasLinesDiv = document.getElementById('bemondas-lines');
const handForm = document.getElementById('hand-form');
const handPreviewEl = document.getElementById('hand-preview');
const historyListEl = document.getElementById('history-list');
const btnUndo = document.getElementById('btn-undo');
const btnAddLine = document.getElementById('btn-add-line');
const lineTemplate = document.getElementById('tpl-bemondas-line');

pirosAszToggle.addEventListener('change', () => {
  state.pirosAszOsztNemOszt = pirosAszToggle.checked;
  saveState();
});

function activePlayerIndices() {
  const indices = [];
  for (let i = 0; i < state.playerCount; i++) {
    if (state.playerCount === 4 && i === state.dealerIndex) continue;
    indices.push(i);
  }
  return indices;
}

function showGameScreen() {
  setupScreen.hidden = true;
  gameScreen.hidden = false;
  btnExport.hidden = false;
  btnReset.hidden = false;
  if (bemondasLinesDiv.children.length === 0) resetHandForm();
  renderAll();
}

function renderAll() {
  renderScoreLedger();
  renderRoundHeader();
  renderDeclarerOptions();
  renderDefendersInfo();
  renderHistory();
  renderPreview();
  pirosAszToggle.checked = !!state.pirosAszOsztNemOszt;
}

function renderScoreLedger() {
  let html = '<tr><th>Kör</th>';
  state.players.forEach(name => { html += `<th>${escapeHtml(name)}</th>`; });
  html += '</tr>';
  const running = new Array(state.playerCount).fill(0);
  state.history.forEach(h => {
    h.perPlayerDelta.forEach((d, i) => { running[i] += d; });
    html += `<tr><td class="player-name">${h.round}.</td>`;
    running.forEach(v => {
      const cls = v > 0 ? 'amount-pos' : (v < 0 ? 'amount-neg' : '');
      html += `<td class="${cls}">${v}</td>`;
    });
    html += '</tr>';
  });
  scoreLedgerEl.innerHTML = html;
}

function renderRoundHeader() {
  roundTitleEl.textContent = `${state.round}. leosztás`;
  const dealerName = state.players[state.dealerIndex];
  if (state.playerCount === 4) {
    roundMetaEl.textContent = `Osztó és kiálló: ${dealerName}`;
  } else {
    roundMetaEl.textContent = `Osztó: ${dealerName}`;
  }
}

function renderDeclarerOptions() {
  const active = activePlayerIndices();
  const prev = declarerSelect.value;
  declarerSelect.innerHTML = '';
  active.forEach(i => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = state.players[i];
    declarerSelect.appendChild(opt);
  });
  if (active.includes(parseInt(prev, 10))) declarerSelect.value = prev;
  renderDefendersInfo();
}

function currentDefenderIndices() {
  const active = activePlayerIndices();
  const declarer = parseInt(declarerSelect.value, 10);
  return active.filter(i => i !== declarer);
}

function renderDefendersInfo() {
  const defenders = currentDefenderIndices();
  const names = defenders.map(i => state.players[i]);
  defendersInfoEl.textContent = `Ellenjátékosok: ${names.join(' és ')}`;
  updateAllKontraSplitLabels();
}

declarerSelect.addEventListener('change', () => {
  renderDefendersInfo();
  renderPreview();
});

function updateAllKontraSplitLabels() {
  const defenders = currentDefenderIndices();
  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(line => {
    const aLabel = line.querySelector('.defender-a-label');
    const bLabel = line.querySelector('.defender-b-label');
    if (aLabel) aLabel.textContent = state.players[defenders[0]] || '1. ellenjátékos';
    if (bLabel) bLabel.textContent = state.players[defenders[1]] || '2. ellenjátékos';
  });
}

function kontraOptionsHtml() {
  return KONTRA_SZINTEK.map((label, i) => `<option value="${i}">${label}</option>`).join('');
}

// Az adu nélküli (betli/durchmars-család) bemondások helyettesítik a teljes
// menetet, ezért csak akkor választhatók, ha a leosztásban egyáltalán nincs
// más bemondás; a színes extrák (négy ász, ulti, egy-egy durchmars/
// redurchmars variáns) pedig csak egyszer szólhatnak le. `excludeLineEl`
// annak a sornak a select-jét zárja ki a "már használt" számításból, amelyhez
// épp az elérhető opciókat állítjuk össze (hogy a sor saját, jelenlegi
// választása sose tűnjön el a felsorolásból).
function usedBemondasok(excludeLineEl) {
  const used = [];
  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(lineEl => {
    if (lineEl === excludeLineEl) return;
    used.push(bemondasById(lineEl.querySelector('.line-bemondas').value));
  });
  return used;
}

function availableBemondasok(excludeLineEl) {
  const used = usedBemondasok(excludeLineEl);
  if (used.some(b => b.kategoria === 'adu_nelkuli')) return [];
  const usedIds = new Set(used.map(b => b.id));
  const usedJatekAlap = used.some(b => b.jatekAlap);
  const usedColoredDurchmarsFamily = used.some(b => b.id === 'durchmars_szines' || b.id === 'redurchmars_szines');
  return BEMONDASOK.filter(b => {
    if (b.optional === 'negyasz' && !state.negyaszEnabled) return false;
    if (usedIds.has(b.id)) return false;
    if (b.kategoria === 'adu_nelkuli' && used.length > 0) return false;
    if (b.jatekAlap && usedJatekAlap) return false;
    if ((b.id === 'durchmars_szines' || b.id === 'redurchmars_szines') && usedColoredDurchmarsFamily) return false;
    // Színes durchmars/redurchmars mellé csak 40-100 vagy 20-100 alapjáték
    // választható, sima Parti mellett nem lehet durchmars-t/redurchmars-t
    // bemondani.
    if (b.id === 'parti' && usedColoredDurchmarsFamily) return false;
    if ((b.id === 'durchmars_szines' || b.id === 'redurchmars_szines') && usedIds.has('parti')) return false;
    return true;
  });
}

// Ha egy olyan extra bemondás marad "árván" a leosztásban (pl. Ulti), amihez
// kötelezően kellene egy alapjáték (parti/40-100/20-100) vagy egy azt
// helyettesítő színtelen bemondás, de az még nincs jelen, automatikusan
// hozzáadjuk az alapjátékot egy külön sorként — színes durchmars/redurchmars
// mellé "40-100"-at (mert sima Parti mellett az nem választható), egyébként
// "Parti"-t.
function ensureBaseGameLine() {
  const boms = [...bemondasLinesDiv.querySelectorAll('.bemondas-line')]
    .map(lineEl => bemondasById(lineEl.querySelector('.line-bemondas').value));
  const hasColorless = boms.some(b => b.kategoria === 'adu_nelkuli');
  const hasJatekAlap = boms.some(b => b.jatekAlap);
  const hasOrphanSzinExtra = boms.some(b => b.kategoria === 'szin' && !b.jatekAlap);
  if (hasOrphanSzinExtra && !hasColorless && !hasJatekAlap) {
    const needsHigherAlap = boms.some(b => b.id === 'durchmars_szines' || b.id === 'redurchmars_szines');
    addBemondasLine(needsHigherAlap ? '40_100' : 'parti');
  }
}

function bemondasOptionsHtml(excludeLineEl, currentId) {
  let list = availableBemondasok(excludeLineEl);
  if (currentId && !list.some(b => b.id === currentId)) list = list.concat([bemondasById(currentId)]);
  const szin = list.filter(b => b.kategoria === 'szin');
  const aduNelkuli = list.filter(b => b.kategoria === 'adu_nelkuli');
  const group = (label, items) => items.length
    ? `<optgroup label="${label}">${items.map(b => `<option value="${b.id}">${b.nev} (${b.ertek})</option>`).join('')}</optgroup>`
    : '';
  return group('Színjátékok (adu van)', szin) + group('Adu nélküli játékok', aduNelkuli);
}

// Minden sor legördülőjét frissíti a testvér-sorok jelenlegi választása alapján
// (pl. ha egy sorban Ulti van, a többi sorból eltűnik az Ulti opció), és
// letiltja a "+ Bemondás hozzáadása" gombot, ha már nincs mit hozzáadni.
function refreshAllLineOptions() {
  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(lineEl => {
    const sel = lineEl.querySelector('.line-bemondas');
    const current = sel.value;
    sel.innerHTML = bemondasOptionsHtml(lineEl, current);
    sel.value = current;
  });
  updateAddLineButtonState();
}

function updateAddLineButtonState() {
  const canAdd = availableBemondasok(null).length > 0;
  btnAddLine.disabled = !canAdd;
  btnAddLine.title = canAdd ? '' : 'Nincs több hozzáadható bemondás ehhez a leosztáshoz.';
}

// A piros adu a teljes leosztásra (minden színes sorára egyaránt, beleértve
// az alapjátékot is) egységesen érvényes, ezért a kapcsoló váltásakor minden
// sor előnézetét újra kell számolni.
function updateAllLineResultTexts() {
  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(updateLineResultText);
}

pirosAduToggle.addEventListener('change', () => { updateAllLineResultTexts(); renderPreview(); });

let bemondasLineCounter = 0;

function addBemondasLine(presetId) {
  const clone = lineTemplate.content.cloneNode(true);
  const lineEl = clone.querySelector('.bemondas-line');

  // Egyedi radio-csoport név soronként, különben a böngésző az összes bemondás-sor
  // Sikerült/Bukott rádiógombját egyetlen (form-szintű) csoportnak kezelné.
  const groupName = `result-${bemondasLineCounter++}`;
  lineEl.querySelectorAll('input[type="radio"]').forEach(r => r.name = groupName);

  const bemondasSelect = lineEl.querySelector('.line-bemondas');
  bemondasSelect.innerHTML = bemondasOptionsHtml(null, presetId || null);
  if (presetId) bemondasSelect.value = presetId;

  const jointSelect = lineEl.querySelector('.kontra-joint-select');
  const aSelect = lineEl.querySelector('.kontra-a-select');
  const bSelect = lineEl.querySelector('.kontra-b-select');
  const pirosToggleLabel = lineEl.querySelector('.line-piros-toggle');
  const pirosCheckbox = lineEl.querySelector('.line-piros-checkbox');
  jointSelect.innerHTML = kontraOptionsHtml();
  aSelect.innerHTML = kontraOptionsHtml();
  bSelect.innerHTML = kontraOptionsHtml();

  function refreshKategoria() {
    const bem = bemondasById(bemondasSelect.value);
    const isSzin = bem.kategoria === 'szin';
    lineEl.querySelector('.kontra-joint').hidden = !isSzin;
    lineEl.querySelector('.kontra-split').hidden = isSzin;
    const showPiros = !!bem.pirosVariant;
    pirosToggleLabel.hidden = !showPiros;
    if (!showPiros) pirosCheckbox.checked = false;
    updateLineResultText(lineEl);
  }

  bemondasSelect.addEventListener('change', () => {
    refreshKategoria();
    refreshAllLineOptions();
    ensureBaseGameLine();
    renderPreview();
  });
  lineEl.querySelectorAll('input[type="radio"]').forEach(r =>
    r.addEventListener('change', () => { updateLineResultText(lineEl); renderPreview(); })
  );
  [jointSelect, aSelect, bSelect, pirosCheckbox].forEach(sel =>
    sel.addEventListener('change', () => { updateLineResultText(lineEl); renderPreview(); })
  );
  lineEl.querySelector('.btn-remove-line').addEventListener('click', () => {
    lineEl.remove();
    refreshAllLineOptions();
    ensureBaseGameLine();
    renderPreview();
  });

  bemondasLinesDiv.appendChild(lineEl);
  refreshKategoria();
  updateAllKontraSplitLabels();
  refreshAllLineOptions();
  ensureBaseGameLine();
  renderPreview();
}

btnAddLine.addEventListener('click', () => addBemondasLine());

function resetHandForm() {
  bemondasLinesDiv.innerHTML = '';
  pirosAduToggle.checked = false;
  addBemondasLine('parti');
}

function readLine(lineEl) {
  const bem = bemondasById(lineEl.querySelector('.line-bemondas').value);
  const result = lineEl.querySelector('input[type="radio"]:checked').value;
  const isSzin = bem.kategoria === 'szin';
  let levelA, levelB;
  if (isSzin) {
    levelA = levelB = parseInt(lineEl.querySelector('.kontra-joint-select').value, 10);
  } else {
    levelA = parseInt(lineEl.querySelector('.kontra-a-select').value, 10);
    levelB = parseInt(lineEl.querySelector('.kontra-b-select').value, 10);
  }
  // Színes bemondásnál (beleértve az alapjátékot is) a piros adu a leosztás
  // egészére vonatkozó, közös kapcsolóból jön (nem választható el egymástól);
  // a betlinél (az egyetlen pirosVariant bemondásnál) ez egy önálló,
  // soronkénti kapcsoló.
  let piros = false;
  if (isSzin) {
    piros = pirosAduToggle.checked;
  } else if (bem.pirosVariant) {
    piros = lineEl.querySelector('.line-piros-checkbox').checked;
  }
  return { bem, result, levelA, levelB, piros };
}

function updateLineResultText(lineEl) {
  const defenders = currentDefenderIndices();
  const { bem, result, levelA, levelB, piros } = readLine(lineEl);
  const ertek = bem.ertek * (piros ? 2 : 1);
  const multA = multiplier(levelA, bem.ultiSpecial, result);
  const multB = multiplier(levelB, bem.ultiSpecial, result);
  const amountA = ertek * multA;
  const amountB = ertek * multB;
  const nameA = state.players[defenders[0]] || '1. ellenjátékos';
  const nameB = state.players[defenders[1]] || '2. ellenjátékos';
  const verb = result === 'siker' ? 'kap' : 'fizet';
  const pirosNote = piros ? ' (piros)' : '';
  lineEl.querySelector('.line-result').textContent =
    `Felvevő ${verb} ${amountA} pontot (${nameA}) és ${amountB} pontot (${nameB}) ellen${pirosNote}.`;
}

function computeHandDeltas() {
  const declarer = parseInt(declarerSelect.value, 10);
  const defenders = currentDefenderIndices();
  const perPlayerDelta = new Array(state.playerCount).fill(0);
  const lineSummaries = [];

  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(lineEl => {
    const { bem, result, levelA, levelB, piros } = readLine(lineEl);
    const ertek = bem.ertek * (piros ? 2 : 1);
    const multA = multiplier(levelA, bem.ultiSpecial, result);
    const multB = multiplier(levelB, bem.ultiSpecial, result);
    const amountA = ertek * multA;
    const amountB = ertek * multB;
    const sign = result === 'siker' ? 1 : -1;

    perPlayerDelta[declarer] += sign * (amountA + amountB);
    perPlayerDelta[defenders[0]] -= sign * amountA;
    perPlayerDelta[defenders[1]] -= sign * amountB;

    lineSummaries.push({ nev: bem.nev + (piros ? ' (piros)' : ''), result, amountA, amountB });
  });

  return { declarer, defenders, perPlayerDelta, lineSummaries };
}

function renderPreview() {
  if (bemondasLinesDiv.children.length === 0) {
    handPreviewEl.hidden = true;
    return;
  }
  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(updateLineResultText);

  const { declarer, perPlayerDelta } = computeHandDeltas();
  let rows = '';
  state.players.forEach((name, i) => {
    if (perPlayerDelta[i] === 0 && i !== declarer) return;
    const cls = perPlayerDelta[i] > 0 ? 'amount-pos' : (perPlayerDelta[i] < 0 ? 'amount-neg' : '');
    rows += `<tr><td>${escapeHtml(name)}</td><td class="${cls}">${perPlayerDelta[i] > 0 ? '+' : ''}${perPlayerDelta[i]}</td></tr>`;
  });
  handPreviewEl.innerHTML = `<strong>Leosztás eredménye (előnézet)</strong><table>${rows}</table>`;
  handPreviewEl.hidden = false;
}

handForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (bemondasLinesDiv.children.length === 0) {
    alert('Adj hozzá legalább egy bemondást a leosztáshoz.');
    return;
  }
  const { declarer, defenders, perPlayerDelta, lineSummaries } = computeHandDeltas();

  state.history.push({
    round: state.round,
    dealerIndex: state.dealerIndex,
    declarerIndex: declarer,
    defenderIndices: defenders,
    lineSummaries,
    perPlayerDelta,
  });
  perPlayerDelta.forEach((d, i) => { state.totals[i] += d; });

  // Alapesetben a felvevő lesz a következő osztó; "Piros ász oszt, nem oszt"
  // módban (napi játék végén szokásos) az osztás egyszerűen körbemegy.
  state.dealerIndex = state.pirosAszOsztNemOszt
    ? (state.dealerIndex + 1) % state.playerCount
    : declarer;
  state.round += 1;

  saveState();
  resetHandForm();
  handPreviewEl.hidden = true;
  renderAll();
});

btnUndo.addEventListener('click', () => {
  if (state.history.length === 0) return;
  if (!confirm('Visszavonod az utolsó leosztást?')) return;
  const last = state.history.pop();
  last.perPlayerDelta.forEach((d, i) => { state.totals[i] -= d; });
  state.dealerIndex = last.dealerIndex;
  state.round = last.round;
  saveState();
  renderAll();
});

function renderHistory() {
  btnUndo.hidden = state.history.length === 0;
  if (state.history.length === 0) {
    historyListEl.innerHTML = '<p class="muted">Még nincs rögzített leosztás.</p>';
    return;
  }
  let html = '';
  state.history.slice().reverse().forEach(h => {
    const declarerName = state.players[h.declarerIndex];
    const defenderNames = h.defenderIndices.map(i => state.players[i]).join(' és ');
    const linesText = h.lineSummaries.map(l =>
      `${l.nev}: ${l.result === 'siker' ? 'sikerült' : 'bukott'} (${l.amountA}/${l.amountB})`
    ).join(', ');
    const deltaText = h.perPlayerDelta.map((d, i) => `${state.players[i]}: ${d > 0 ? '+' : ''}${d}`).join(', ');
    html += `<div class="history-entry">
      <div class="history-round-title">${h.round}. leosztás — felvevő: ${escapeHtml(declarerName)}, ellenjátékosok: ${escapeHtml(defenderNames)}</div>
      <div class="muted">${escapeHtml(linesText)}</div>
      <div>${escapeHtml(deltaText)}</div>
    </div>`;
  });
  historyListEl.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ---------- EXPORT ----------

function buildExportHtml() {
  const dateStr = new Date().toLocaleDateString('hu-HU');
  let headerCells = '<th>Kör</th>' + state.players.map(n => `<th>${escapeHtml(n)}</th>`).join('');
  const running = new Array(state.playerCount).fill(0);
  let rows = '';
  state.history.forEach(h => {
    h.perPlayerDelta.forEach((d, i) => { running[i] += d; });
    const cells = running.map(v => {
      const cls = v > 0 ? 'pos' : (v < 0 ? 'neg' : '');
      return `<td class="${cls}">${v}</td>`;
    }).join('');
    rows += `<tr><td class="round">${h.round}.</td>${cells}</tr>`;
  });
  const finalCells = running.map(v => {
    const cls = v > 0 ? 'pos' : (v < 0 ? 'neg' : '');
    return `<td class="${cls}">${v}</td>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>Ulti Pontozó — Pontállás körről-körre (${dateStr})</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f4f1ea; color: #2c2a26; margin: 0; padding: 2rem; }
  h1 { color: #8a1f1f; margin-top: 0; }
  .muted { color: #7a756a; margin-top: -0.5rem; }
  table { border-collapse: collapse; width: 100%; max-width: 640px; background: #fff;
    border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  th, td { padding: 0.6rem 1rem; text-align: center; border-bottom: 1px solid #ddd6c8; }
  th { background: #4a5a48; color: #fff; }
  td.round { text-align: left; font-weight: 600; }
  tr.final td { font-weight: 700; border-top: 2px solid #4a5a48; }
  td.pos { color: #2f6b2f; font-weight: 600; }
  td.neg { color: #a33a2e; font-weight: 600; }
</style>
</head>
<body>
  <h1>Ulti Pontozó</h1>
  <p class="muted">Pontállás körről-körre — ${dateStr}</p>
  <table>
    <tr>${headerCells}</tr>
    ${rows}
    <tr class="final"><td class="round">Végeredmény</td>${finalCells}</tr>
  </table>
</body>
</html>`;
}

btnExport.addEventListener('click', () => {
  const html = buildExportHtml();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ulti-pontallas-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- INIT ----------

renderPlayerNameInputs();

if (state) {
  resumeBanner.hidden = false;
  setupFormWrapper.hidden = true;
} else {
  resumeBanner.hidden = true;
  setupFormWrapper.hidden = false;
}

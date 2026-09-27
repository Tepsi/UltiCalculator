'use strict';

const STORAGE_KEY = 'ultiCalculator_session_v1';

// A "játék" (parti / 40-100 / 20-100) minden színjátékos leosztásban kötelezően
// jelen van, és önállóan (a többi bemondástól függetlenül) sikerülhet vagy
// bukhat, kontrázható. Adu nélküli (betli/durchmars család) leosztásban nincs
// játék-szint, mert azok maguk helyettesítik a normál (aduval játszott) menetet.
const JATEK_SZINTEK = [
  { id: 'parti', nev: 'Parti', ertek: 1 },
  { id: 'piros_parti', nev: 'Piros parti', ertek: 2 },
  { id: '40_100', nev: '40-100', ertek: 4 },
  { id: 'piros_40_100', nev: 'Piros 40-100', ertek: 8 },
  { id: '20_100', nev: '20-100', ertek: 8 },
  { id: 'piros_20_100', nev: 'Piros 20-100', ertek: 16 },
];

// Ezek a játék-szinthez képest önállóan hozzáadható extra bemondások — az
// alapértékük már NEM tartalmazza a parti/40-100/20-100 értékét, azt a
// kötelező játék-szint blokk adja hozzá külön.
//
// A durchmars/redurchmars (más néven terített durchmars) lehet "színes" (van
// adu, ezért kombinálható a játék-szinttel és pl. ultival, közös/joint
// kontrával) vagy "színtelen" (nincs adu, helyettesíti a játék-szintet, mint
// a betli — egyénenkénti/split kontrával). A "piros" előtag itt a piros adu
// miatti duplázást jelenti, ezért az mindig "színes".
// A betli/rebetli (más néven terített betli) ezzel szemben mindig "színtelen"
// (nem kombinálható semmi mással) — a "piros betli" is, az csak egy erősebb
// (dupla értékű) betli, nem jelent aduszínt.
const BEMONDASOK = [
  { id: 'negy_asz', nev: 'Négy ász', ertek: 4, kategoria: 'szin', optional: 'negyasz' },
  { id: 'piros_negy_asz', nev: 'Piros négy ász', ertek: 8, kategoria: 'szin', optional: 'negyasz' },
  { id: 'ulti', nev: 'Ulti', ertek: 4, kategoria: 'szin', ultiSpecial: true },
  { id: 'piros_ulti', nev: 'Piros ulti', ertek: 8, kategoria: 'szin', ultiSpecial: true },
  { id: 'durchmars_szintelen', nev: 'Durchmars (színtelen)', ertek: 6, kategoria: 'adu_nelkuli' },
  { id: 'durchmars_szines', nev: 'Durchmars (színes)', ertek: 6, kategoria: 'szin' },
  { id: 'piros_durchmars', nev: 'Piros durchmars', ertek: 12, kategoria: 'szin' },
  { id: 'redurchmars_szintelen', nev: 'Redurchmars / Terített durchmars (színtelen)', ertek: 24, kategoria: 'adu_nelkuli' },
  { id: 'redurchmars_szines', nev: 'Redurchmars / Terített durchmars (színes)', ertek: 24, kategoria: 'szin' },
  { id: 'piros_redurchmars', nev: 'Piros redurchmars / Piros terített durchmars', ertek: 48, kategoria: 'szin' },
  { id: 'betli', nev: 'Betli', ertek: 5, kategoria: 'adu_nelkuli' },
  { id: 'piros_betli', nev: 'Piros betli', ertek: 10, kategoria: 'adu_nelkuli' },
  { id: 'rebetli', nev: 'Rebetli / Terített betli', ertek: 20, kategoria: 'adu_nelkuli' },
];

const KONTRA_SZINTEK = ['Nincs kontra', 'Kontra', 'Rekontra', 'Szubkontra', 'Mordkontra', 'Hirschkontra', 'Fedák Sári'];

function bemondasById(id) {
  return BEMONDASOK.find(b => b.id === id);
}

function jatekSzintById(id) {
  return JATEK_SZINTEK.find(j => j.id === id);
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
const jatekBlockEl = document.getElementById('jatek-block');
const jatekSelect = document.getElementById('jatek-select');
const jatekKontraSelect = document.getElementById('jatek-kontra-select');
const jatekResultTextEl = document.getElementById('jatek-result-text');
const bemondasLinesDiv = document.getElementById('bemondas-lines');
const handForm = document.getElementById('hand-form');
const handPreviewEl = document.getElementById('hand-preview');
const historyListEl = document.getElementById('history-list');
const btnUndo = document.getElementById('btn-undo');
const lineTemplate = document.getElementById('tpl-bemondas-line');

jatekSelect.innerHTML = JATEK_SZINTEK.map(j => `<option value="${j.id}">${j.nev} (${j.ertek})</option>`).join('');
jatekKontraSelect.innerHTML = KONTRA_SZINTEK.map((label, i) => `<option value="${i}">${label}</option>`).join('');

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
  updateJatekBlockVisibility();
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

function bemondasOptionsHtml() {
  const visible = BEMONDASOK.filter(b => b.optional !== 'negyasz' || state.negyaszEnabled);
  const szin = visible.filter(b => b.kategoria === 'szin');
  const aduNelkuli = visible.filter(b => b.kategoria === 'adu_nelkuli');
  const group = (label, items) =>
    `<optgroup label="${label}">${items.map(b => `<option value="${b.id}">${b.nev} (${b.ertek})</option>`).join('')}</optgroup>`;
  return group('Színjátékok (adu van)', szin) + group('Adu nélküli játékok', aduNelkuli);
}

// A kötelező játék-szint (parti/40-100/20-100) csak akkor tűnik el, ha a
// leosztásban van adu nélküli (betli/durchmars család) bemondás — azok
// helyettesítik a normál, aduval játszott menetet, tehát nincs önálló
// játék-szintjük.
function hasAduNelkuliLine() {
  let found = false;
  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(lineEl => {
    const bem = bemondasById(lineEl.querySelector('.line-bemondas').value);
    if (bem.kategoria === 'adu_nelkuli') found = true;
  });
  return found;
}

function updateJatekBlockVisibility() {
  jatekBlockEl.hidden = hasAduNelkuliLine();
}

function readJatekLine() {
  const jatek = jatekSzintById(jatekSelect.value);
  const result = document.querySelector('input[name="jatek-result"]:checked').value;
  const level = parseInt(jatekKontraSelect.value, 10);
  return { jatek, result, level };
}

function updateJatekResultText() {
  const defenders = currentDefenderIndices();
  const { jatek, result, level } = readJatekLine();
  const mult = multiplier(level, false, result);
  const amount = jatek.ertek * mult;
  const nameA = state.players[defenders[0]] || '1. ellenjátékos';
  const nameB = state.players[defenders[1]] || '2. ellenjátékos';
  const verb = result === 'siker' ? 'kap' : 'fizet';
  jatekResultTextEl.textContent = `Felvevő ${verb} ${amount} pontot mindkét ellenjátékos (${nameA}, ${nameB}) ellen.`;
}

jatekSelect.addEventListener('change', () => { updateJatekResultText(); renderPreview(); });
jatekKontraSelect.addEventListener('change', () => { updateJatekResultText(); renderPreview(); });
document.querySelectorAll('input[name="jatek-result"]').forEach(r =>
  r.addEventListener('change', () => { updateJatekResultText(); renderPreview(); })
);

let bemondasLineCounter = 0;

function addBemondasLine() {
  const clone = lineTemplate.content.cloneNode(true);
  const lineEl = clone.querySelector('.bemondas-line');

  // Egyedi radio-csoport név soronként, különben a böngésző az összes bemondás-sor
  // Sikerült/Bukott rádiógombját egyetlen (form-szintű) csoportnak kezelné.
  const groupName = `result-${bemondasLineCounter++}`;
  lineEl.querySelectorAll('input[type="radio"]').forEach(r => r.name = groupName);

  const bemondasSelect = lineEl.querySelector('.line-bemondas');
  bemondasSelect.innerHTML = bemondasOptionsHtml();

  const jointSelect = lineEl.querySelector('.kontra-joint-select');
  const aSelect = lineEl.querySelector('.kontra-a-select');
  const bSelect = lineEl.querySelector('.kontra-b-select');
  jointSelect.innerHTML = kontraOptionsHtml();
  aSelect.innerHTML = kontraOptionsHtml();
  bSelect.innerHTML = kontraOptionsHtml();

  function refreshKategoria() {
    const bem = bemondasById(bemondasSelect.value);
    const isSzin = bem.kategoria === 'szin';
    lineEl.querySelector('.kontra-joint').hidden = !isSzin;
    lineEl.querySelector('.kontra-split').hidden = isSzin;
    updateLineResultText(lineEl);
  }

  bemondasSelect.addEventListener('change', () => { refreshKategoria(); updateJatekBlockVisibility(); renderPreview(); });
  lineEl.querySelectorAll('input[type="radio"]').forEach(r =>
    r.addEventListener('change', () => { updateLineResultText(lineEl); renderPreview(); })
  );
  [jointSelect, aSelect, bSelect].forEach(sel =>
    sel.addEventListener('change', () => { updateLineResultText(lineEl); renderPreview(); })
  );
  lineEl.querySelector('.btn-remove-line').addEventListener('click', () => {
    lineEl.remove();
    updateJatekBlockVisibility();
    renderPreview();
  });

  bemondasLinesDiv.appendChild(lineEl);
  refreshKategoria();
  updateAllKontraSplitLabels();
  updateJatekBlockVisibility();
  renderPreview();
}

document.getElementById('btn-add-line').addEventListener('click', addBemondasLine);

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
  return { bem, result, levelA, levelB };
}

function updateLineResultText(lineEl) {
  const defenders = currentDefenderIndices();
  const { bem, result, levelA, levelB } = readLine(lineEl);
  const multA = multiplier(levelA, bem.ultiSpecial, result);
  const multB = multiplier(levelB, bem.ultiSpecial, result);
  const amountA = bem.ertek * multA;
  const amountB = bem.ertek * multB;
  const nameA = state.players[defenders[0]] || '1. ellenjátékos';
  const nameB = state.players[defenders[1]] || '2. ellenjátékos';
  const verb = result === 'siker' ? 'kap' : 'fizet';
  lineEl.querySelector('.line-result').textContent =
    `Felvevő ${verb} ${amountA} pontot (${nameA}) és ${amountB} pontot (${nameB}) ellen.`;
}

function computeHandDeltas() {
  const declarer = parseInt(declarerSelect.value, 10);
  const defenders = currentDefenderIndices();
  const perPlayerDelta = new Array(state.playerCount).fill(0);
  const lineSummaries = [];

  if (!jatekBlockEl.hidden) {
    const { jatek, result, level } = readJatekLine();
    const mult = multiplier(level, false, result);
    const amount = jatek.ertek * mult;
    const sign = result === 'siker' ? 1 : -1;

    perPlayerDelta[declarer] += sign * (amount + amount);
    perPlayerDelta[defenders[0]] -= sign * amount;
    perPlayerDelta[defenders[1]] -= sign * amount;

    lineSummaries.push({ nev: jatek.nev, result, amountA: amount, amountB: amount });
  }

  bemondasLinesDiv.querySelectorAll('.bemondas-line').forEach(lineEl => {
    const { bem, result, levelA, levelB } = readLine(lineEl);
    const multA = multiplier(levelA, bem.ultiSpecial, result);
    const multB = multiplier(levelB, bem.ultiSpecial, result);
    const amountA = bem.ertek * multA;
    const amountB = bem.ertek * multB;
    const sign = result === 'siker' ? 1 : -1;

    perPlayerDelta[declarer] += sign * (amountA + amountB);
    perPlayerDelta[defenders[0]] -= sign * amountA;
    perPlayerDelta[defenders[1]] -= sign * amountB;

    lineSummaries.push({ nev: bem.nev, result, amountA, amountB });
  });

  return { declarer, defenders, perPlayerDelta, lineSummaries };
}

function renderPreview() {
  if (jatekBlockEl.hidden && bemondasLinesDiv.children.length === 0) {
    handPreviewEl.hidden = true;
    return;
  }
  if (!jatekBlockEl.hidden) updateJatekResultText();
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
  if (jatekBlockEl.hidden && bemondasLinesDiv.children.length === 0) {
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
  bemondasLinesDiv.innerHTML = '';
  handPreviewEl.hidden = true;
  updateJatekBlockVisibility();
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

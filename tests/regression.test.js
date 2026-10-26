'use strict';
/*
 * Regressziós teszt-készlet az Ulti Pontozó (index.html) funkcióira.
 * Nincs UI-keretrendszer: a tényleges DOM-ot (jsdom) hajtja végig, ugyanúgy,
 * ahogy egy felhasználó tenné (mezők kitöltése, gombkattintás, change/submit
 * események) — nem a belső JS-függvényeket hívja közvetlenül, mert azok nincsenek
 * exportálva a <script> blokkból.
 *
 * Futtatás: npm test  (vagy: node tests/regression.test.js)
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const HTML = fs.readFileSync(HTML_PATH, 'utf8');
const SESSION_KEY = 'ultiCalculator_session_v1';
const SETUP_DEFAULTS_KEY = 'ultiCalculator_setup_defaults_v1';

// ---------- Minimál teszt-keretrendszer ----------

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}
function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg ? msg + ' — ' : ''}Elvárt: ${JSON.stringify(expected)}, kapott: ${JSON.stringify(actual)}`);
  }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- DOM segédfüggvények ----------

async function newApp(beforeParse) {
  // omitJSDOMErrors: az Exportálás gomb egy <a download> elemet klikkeltet,
  // amit jsdom navigációként próbál kezelni és "Not implemented" hibát ír ki —
  // ez az app szempontjából irreleváns zaj, nem valós hiba.
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/', virtualConsole, beforeParse });
  const win = dom.window;
  // A confirm()/alert() jsdom alatt nem implementált — ezek nélkül a
  // megerősítést kérő gombok (Undo, Elvetés, Új parti-est) nem tesztelhetők.
  win.confirm = () => true;
  win.alert = () => {};
  // jsdom nem implementálja a Blob URL-eket — az Exportálás gomb ezt hívja.
  if (win.URL && typeof win.URL.createObjectURL !== 'function') {
    win.URL.createObjectURL = () => 'blob:stub';
    win.URL.revokeObjectURL = () => {};
  }
  await wait(20);
  return dom.window.document;
}

// Az app betöltése előtt a localStorage-ba írja a megadott kulcs → érték párokat
// (a nem szöveges értékeket JSON-ként).
function newAppWithStorage(items) {
  return newApp((window) => {
    Object.entries(items).forEach(([key, value]) =>
      window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)));
  });
}

// Egy mentett parti-est (4 fő, Anna oszt, 1. kör); `overrides` felülírja a
// mezőket (undefined értékű mező a mentésből kimarad, mint egy régi verziónál).
function savedSession(overrides = {}) {
  return {
    playerCount: 4,
    players: ['Anna', 'Bela', 'Cili', 'Deszo'],
    playerIcons: ['●', '▲', '■', '◆'],
    dealerIndex: 0,
    round: 1,
    totals: [0, 0, 0, 0],
    history: [],
    pirosAszOsztNemOszt: false,
    negyaszEnabled: false,
    alapTet: 1,
    ...overrides,
  };
}

// Mentett parti-est, amelyben a pontok összege nem nulla (egyenleghiba).
function unbalancedSession() {
  return savedSession({
    round: 2,
    totals: [0, 5, -3, 0],
    history: [{ round: 1, dealerIndex: 0, declarerIndex: 1, defenderIndices: [2, 3], lineSummaries: [], perPlayerDelta: [0, 5, -3, 0] }],
  });
}

function fire(el, type) {
  const Event = el.ownerDocument.defaultView.Event;
  el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
}

function setValue(el, value) {
  el.value = String(value);
  fire(el, 'change');
}

function setChecked(el, checked) {
  el.checked = !!checked;
  fire(el, 'change');
}

function startGame(doc, { playerCount = 4, names = ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer = 0, alapTet = 1, negyasz = false } = {}) {
  setValue(doc.getElementById('player-count'), playerCount);
  const inputs = doc.querySelectorAll('#player-names input');
  inputs.forEach((inp, i) => { if (names[i] !== undefined) inp.value = names[i]; });
  setValue(doc.getElementById('starting-dealer'), startingDealer);
  doc.getElementById('alap-tet').value = String(alapTet);
  setChecked(doc.getElementById('negyasz-toggle'), negyasz);
  doc.getElementById('btn-start').click();
}

// Új app egy elindított parti-esttel (alapból 4 fő: Anna, Bela, Cili, Deszo; Anna oszt).
async function newGame(options) {
  const doc = await newApp();
  startGame(doc, options);
  return doc;
}

function lines(doc) {
  return [...doc.querySelectorAll('.bemondas-line')];
}

function addLine(doc, presetId) {
  doc.getElementById('btn-add-line').click();
  const ls = lines(doc);
  const line = ls[ls.length - 1];
  if (presetId) setValue(line.querySelector('.line-bemondas'), presetId);
  return line;
}

function removeLine(line) {
  line.querySelector('.btn-remove-line').click();
}

function setJointKontra(line, levelIndex) {
  setValue(line.querySelector('.kontra-joint-select'), levelIndex);
}
function setSplitKontra(line, levelA, levelB) {
  setValue(line.querySelector('.kontra-a-select'), levelA);
  setValue(line.querySelector('.kontra-b-select'), levelB);
}
function setBukott(line, bukott) {
  setChecked(line.querySelector('.line-bukott-checkbox'), bukott);
}
function lineById(doc, presetId) {
  return lines(doc).find(l => l.querySelector('.line-bemondas').value === presetId);
}

// A "Felvevő kap/fizet 12 pontot (Bela) és 3 pontot (Cili) ellen (piros)."
// előnézet-szövegből szedi ki a tényleges kifizetéseket.
function lineResult(line) {
  const text = line.querySelector('.line-result').textContent;
  const m = text.match(/Felvevő (kap|fizet) ([\d.]+) pontot \(([^)]+)\) és ([\d.]+) pontot \(([^)]+)\) ellen(?: \(piros\))?\.?/);
  assert(m, `Nem sikerült feldolgozni a sor eredmény-szövegét: "${text}"`);
  return { verb: m[1], amountA: parseFloat(m[2]), nameA: m[3], amountB: parseFloat(m[4]), nameB: m[5], piros: text.includes('(piros)') };
}

function setDeclarer(doc, playerIndex) {
  setValue(doc.getElementById('declarer-select'), playerIndex);
}
function setDealer(doc, playerIndex) {
  setValue(doc.getElementById('dealer-select'), playerIndex);
}

function submitHand(doc) {
  fire(doc.getElementById('hand-form'), 'submit');
}

function ledgerLastRow(doc) {
  const rows = doc.querySelectorAll('#score-ledger tr');
  if (rows.length < 2) return null;
  const last = rows[rows.length - 1];
  return [...last.querySelectorAll('td')].slice(1).map(td => parseFloat(td.textContent));
}

function bemondasOptionValues(select) {
  return [...select.options].map(o => o.value);
}

// Kattintható-e az elem a felhasználónak: nincs letiltva, és egyik szülője sem inert.
function isUsable(el) {
  for (let node = el; node; node = node.parentElement) if (node.inert) return false;
  return !el.disabled;
}

// ---------- Tesztek ----------

test('4 fős mód: az osztó kiáll, a Felvevő legördülőben nem szerepel', async () => {
  const doc = await newGame();
  const opts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!opts.includes('Anna'), 'Az osztó (Anna) nem lehet a Felvevő-választóban');
  assertEqual(opts.length, 3, 'Pontosan 3 aktív játékosnak kell lennie 4 fős módban');
});

test('3 fős mód: mindenki aktív, senki nem áll ki', async () => {
  const doc = await newGame({ playerCount: 3 });
  const opts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assertEqual(opts.length, 3, '3 fős módban mindhárom játékosnak választhatónak kell lennie');
});

test('Alapjáték (Parti), sikerült, kontra nélkül: 1 pont mindkét ellenjátékos ellen', async () => {
  const doc = await newGame();
  const line = lines(doc)[0];
  const r = lineResult(line);
  assertEqual(r.verb, 'kap');
  assertEqual(r.amountA, 1);
  assertEqual(r.amountB, 1);
});

test('Bukott checkbox: alapból "Teljesült", bejelölve "Bukott"-ra vált és a felvevő fizet', async () => {
  const doc = await newGame();
  const line = lines(doc)[0];
  assertEqual(line.querySelector('.result-toggle-label').textContent, 'Teljesült');
  assert(!line.classList.contains('is-bukott'));

  setBukott(line, true);
  assertEqual(line.querySelector('.result-toggle-label').textContent, 'Bukott');
  assert(line.classList.contains('is-bukott'));
  assertEqual(lineResult(line).verb, 'fizet');

  setBukott(line, false);
  assertEqual(line.querySelector('.result-toggle-label').textContent, 'Teljesült');
  assert(!line.classList.contains('is-bukott'));
});

test('Piros adu duplázza a színes sor (Parti) értékét', async () => {
  const doc = await newGame();
  const line = lines(doc)[0];
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  const r = lineResult(line);
  assertEqual(r.amountA, 2);
  assertEqual(r.amountB, 2);
  assert(r.piros);
});

test('Csendes 100: 2 pont ellenjátékosonként (piros adunál 4), 40-100 mellett nem választható', async () => {
  const doc = await newGame();
  const field = doc.getElementById('csendes-100-field');
  const toggle = doc.getElementById('csendes-100-toggle');
  assert(!field.hidden, 'Parti mellett választhatónak kell lennie');
  setChecked(toggle, true);
  setDeclarer(doc, 1);
  submitHand(doc);
  // Parti 1+1, csendes 100: 2+2 -> felvevő +6, ellenjátékosok -3
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, 6, -3, -3]));

  setChecked(doc.getElementById('piros-adu-toggle'), true);
  setChecked(toggle, true);
  setDeclarer(doc, 2); // Bela oszt, Cili a felvevő
  submitHand(doc);
  // Parti 2+2 + csendes 100 4+4 = Cili +12, Anna/Deszo -6
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([-6, 6, 9, -9]));
  assertEqual(toggle.checked, false, 'Mentés után törlődnie kell');

  setChecked(toggle, true);
  setValue(lines(doc)[0].querySelector('.line-bemondas'), '40_100');
  assert(field.hidden, '40-100 mellett el kell tűnnie');
  assertEqual(toggle.checked, false, 'El kell veszítenie a jelölést');
});

test('Csendes 100 / ellen csendes 100 mellett, ha van más bemondás is, a Parti eltűnik és nem fizet', async () => {
  const doc = await newGame();
  const csendes = doc.getElementById('csendes-100-toggle');
  const ellen = doc.getElementById('ellen-100-toggle');
  const parti = lines(doc)[0];
  setChecked(csendes, true);
  assert(!parti.hidden, 'Önmagában a Parti látszik');
  addLine(doc, 'ulti');
  assert(parti.hidden, 'Más bemondás mellett a Parti eltűnik');
  setDeclarer(doc, 1);
  submitHand(doc);
  // Ulti 4+4, csendes 100 2+2 (Parti nem fizet) -> felvevő +12, ellenjátékosok -6
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, 12, -6, -6]));

  setChecked(ellen, true);
  addLine(doc, 'ulti');
  assert(lines(doc)[0].hidden, 'Ellen csendes 100 mellett is eltűnik');
  setChecked(ellen, false);
  assert(!lines(doc)[0].hidden, 'A jelölés nélkül újra látszik');
});

test('Bedobás: a felvevő elbukik egy kontrázott Partit, csak az ellenjátékosoknak fizet (az osztónak nem)', async () => {
  const doc = await newGame();
  setDeclarer(doc, 1);
  fire(doc.getElementById('btn-bedobas'), 'click');
  // Parti 1 × kontra bukás 2 = 2 pont az ellenjátékosoknak (Cili, Deszo); Bela -4; Anna (osztó) 0
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, -4, 2, 2]));
  const text = doc.getElementById('history-list').textContent;
  assert(text.includes('Bedobás') && text.includes('Bela: -4'), 'Előzményekben szerepel: ' + text);
  assertEqual(doc.getElementById('dealer-select').value, '1', 'A felvevő oszt tovább');
});

test('Kézi szerkesztés: új sor az utolsó sor értékeivel, jóváhagyáskor 0 összeg kell, előzményben rögzül, közben minden más zárolt', async () => {
  const doc = await newGame();
  setDeclarer(doc, 1);
  submitHand(doc); // Bela +2 (parti), Cili/Deszo -1
  const before = JSON.stringify(ledgerLastRow(doc));
  const round = doc.getElementById('round-title').textContent;

  fire(doc.getElementById('btn-edit-ledger'), 'click');
  const inputs = [...doc.querySelectorAll('.manual-input')];
  assertEqual(inputs.length, 4);
  assertEqual(JSON.stringify(inputs.map(i => Number(i.value))), before, 'Alapérték = utolsó sor');
  assert(doc.getElementById('hand-card').inert && doc.getElementById('history-card').inert, 'Többi rész zárolt');
  assert(doc.getElementById('btn-export').inert, 'Export zárolt');

  // nem nulla összeg -> nem hagyható jóvá
  setValue(inputs[0], 5);
  fire(doc.getElementById('btn-manual-ok'), 'click');
  assert(doc.querySelectorAll('.manual-input').length === 4, 'Marad szerkesztésben');
  assert(doc.getElementById('manual-edit-msg').textContent.includes('összege'), 'Hibaüzenet');

  // mégse: semmi sem változik
  fire(doc.getElementById('btn-manual-cancel'), 'click');
  assertEqual(doc.querySelectorAll('.manual-input').length, 0);
  assertEqual(JSON.stringify(ledgerLastRow(doc)), before);
  assert(!doc.getElementById('hand-card').inert, 'Zárolás feloldva');

  // érvényes módosítás
  fire(doc.getElementById('btn-edit-ledger'), 'click');
  const inp = [...doc.querySelectorAll('.manual-input')];
  setValue(inp[0], 3);
  setValue(inp[1], -1);
  fire(doc.getElementById('btn-manual-ok'), 'click');
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([3, -1, -1, -1]));
  assertEqual(doc.getElementById('round-title').textContent, round, 'A kör nem lép tovább');
  assert(doc.getElementById('history-list').textContent.includes('Kézi módosítás'), 'Előzményben szerepel');

  // visszavonható
  fire(doc.getElementById('btn-undo'), 'click');
  assertEqual(JSON.stringify(ledgerLastRow(doc)), before);
});

test('Kézi szerkesztés: gépelés közben élő összeg, hibás (üres / tört) érték hibaüzenetet ad, változatlan sor nem rögzül', async () => {
  const doc = await newGame();
  submitHand(doc); // Bela +2, Cili/Deszo -1
  const msg = doc.getElementById('manual-edit-msg');
  fire(doc.getElementById('btn-edit-ledger'), 'click');
  const input = doc.querySelector('.manual-input');
  input.value = '4';
  fire(input, 'input');
  assert(msg.textContent.includes('összege 4') && !msg.classList.contains('is-error'), 'Gépelés közben az összeg látszik, még nem hibaként: ' + msg.textContent);
  for (const bad of ['', '1.5']) {
    input.value = bad;
    fire(doc.getElementById('btn-manual-ok'), 'click');
    assert(msg.textContent.includes('egész számot') && msg.classList.contains('is-error'), `"${bad}": hibaüzenet kell`);
    assertEqual(doc.querySelectorAll('.manual-input').length, 4, 'Szerkesztésben marad');
  }
  fire(doc.getElementById('btn-manual-cancel'), 'click');

  fire(doc.getElementById('btn-edit-ledger'), 'click');
  fire(doc.getElementById('btn-manual-ok'), 'click'); // változatlan értékekkel
  assertEqual(doc.querySelectorAll('.manual-input').length, 0, 'A szerkesztés véget ér');
  assertEqual(doc.querySelectorAll('#score-ledger tr').length, 2, 'Nem kerül új sor a pontállásba');
  assert(!doc.getElementById('history-list').textContent.includes('Kézi módosítás'), 'és az előzményekbe sem');
});

test('Csendes ulti: feleannyi mint az ulti, bukáskor duplán fizet, nincs kontra, kizárja az ultit', async () => {
  const doc = await newGame();
  const line = addLine(doc, 'csendes_ulti');
  assert(line.querySelector('.kontra-joint').hidden, 'Nem lehet kontrázni');
  assert(line.querySelector('.kontra-split').hidden);
  let r = lineResult(line);
  assertEqual(r.amountA, 2, 'Siker: 2 pont');
  setBukott(line, true);
  r = lineResult(line);
  assertEqual(r.verb, 'fizet');
  assertEqual(r.amountA, 4, 'Bukás: duplán fizet (2*2)');
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  assertEqual(lineResult(line).amountA, 8, 'Piros adu duplázza');
  const optsOfParti = bemondasOptionValues(lines(doc)[0].querySelector('.line-bemondas'));
  assert(!optsOfParti.includes('ulti'), 'Csendes ulti mellett nem választható az ulti');
  removeLine(line);
  assert(bemondasOptionValues(lines(doc)[0].querySelector('.line-bemondas')).includes('ulti'));
});

test('Ellenulti: mint a csendes ulti, de fordított előjellel (ellenjátékosok kapnak/fizetnek), nincs kontra, kizárja az ultit', async () => {
  const doc = await newGame();
  const line = addLine(doc, 'ellenulti');
  assert(line.querySelector('.kontra-joint').hidden && line.querySelector('.kontra-split').hidden, 'Nem lehet kontrázni');
  assert(!bemondasOptionValues(lines(doc)[0].querySelector('.line-bemondas')).includes('ulti'), 'Ellenulti mellett nem választható az ulti');
  assert(!bemondasOptionValues(lines(doc)[0].querySelector('.line-bemondas')).includes('csendes_ulti'));
  setDeclarer(doc, 1);
  assert(line.querySelector('.line-result').textContent.startsWith('Ellenjátékosok kapnak 2 pontot'));
  submitHand(doc);
  // Parti 1+1 a felvevőnek (+2), ellenulti 2+2 az ellenjátékosoknak: Bela -2, Cili/Deszo +1
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, -2, 1, 1]));

  const line2 = addLine(doc, 'ellenulti');
  setBukott(line2, true);
  assert(line2.querySelector('.line-result').textContent.startsWith('Ellenjátékosok fizetnek 4 pontot'), 'Bukás: duplán fizet');
});

test('Ellen csendes 100: csendes 100 tükörképe, ellenjátékosok kapják, kizárja a csendes 100-at', async () => {
  const doc = await newGame();
  const ellen = doc.getElementById('ellen-100-toggle');
  const csendes = doc.getElementById('csendes-100-toggle');
  setChecked(csendes, true);
  setChecked(ellen, true);
  assertEqual(csendes.checked, false, 'A kettő kizárja egymást');
  setDeclarer(doc, 1);
  submitHand(doc);
  // A Parti automatikusan bukik (-1-1), ellen csendes 100: 2+2 az ellenjátékosoknak
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, -6, 3, 3]));
  assertEqual(ellen.checked, false, 'Mentés után törlődnie kell');

  setChecked(ellen, true);
  setValue(lines(doc)[0].querySelector('.line-bemondas'), '40_100');
  assert(doc.getElementById('ellen-100-field').hidden, '40-100 mellett el kell tűnnie');
  assertEqual(ellen.checked, false);
});

test('Ha a pontok összege nem nulla: piros pontállás, hibaüzenet, zárolt leosztás-rögzítés; visszavonás után újra működik', async () => {
  const doc = await newAppWithStorage({ [SESSION_KEY]: unbalancedSession() });
  doc.getElementById('btn-resume').click();
  assert(doc.getElementById('ledger-card').classList.contains('balance-error'), 'Piros háttér kell');
  assert(!doc.getElementById('balance-error').hidden, 'Hibaüzenet kell');
  assert(doc.getElementById('hand-form').inert, 'A leosztás-űrlap zárolt');
  assertEqual(doc.getElementById('dealer-select').disabled, true);
  assertEqual(doc.getElementById('btn-bedobas').disabled, true, 'A Bedobás is zárolt');
  submitHand(doc);
  fire(doc.getElementById('btn-bedobas'), 'click');
  assertEqual(doc.querySelectorAll('#score-ledger tr').length, 2, 'Zárolt állapotban a mentés / bedobás nem megy át');
  assert(!doc.getElementById('btn-undo').hidden, 'A visszavonás elérhető');
  doc.getElementById('btn-undo').click();
  assert(!doc.getElementById('ledger-card').classList.contains('balance-error'), 'Visszavonás után nincs hiba');
  assert(doc.getElementById('balance-error').hidden);
  assert(!doc.getElementById('hand-form').inert);
  assertEqual(doc.getElementById('dealer-select').disabled, false);
  assertEqual(doc.getElementById('btn-bedobas').disabled, false);
});

test('Egyenleghiba a pontállás kézi szerkesztésével is javítható', async () => {
  const doc = await newAppWithStorage({ [SESSION_KEY]: unbalancedSession() });
  doc.getElementById('btn-resume').click();
  assert(doc.getElementById('ledger-card').classList.contains('balance-error'));
  const editBtn = doc.getElementById('btn-edit-ledger');
  assert(isUsable(editBtn), 'A kézi szerkesztés egyenleghibánál is elérhető');
  editBtn.click();
  setValue(doc.querySelectorAll('.manual-input')[1], 3); // [0, 5, -3, 0] -> [0, 3, -3, 0]
  fire(doc.getElementById('btn-manual-ok'), 'click');
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, 3, -3, 0]));
  assert(!doc.getElementById('ledger-card').classList.contains('balance-error'), 'Az egyenleghiba megszűnik');
  assert(!doc.getElementById('hand-form').inert, 'A leosztás újra rögzíthető');
  assertEqual(doc.getElementById('btn-bedobas').disabled, false);
});

test('Csendes 100 mellett az alapjáték biztosan teljesül, ellen csendes 100 mellett biztosan bukik; nem módosítható', async () => {
  const doc = await newGame();
  const parti = lines(doc)[0];
  const cb = parti.querySelector('.line-bukott-checkbox');
  const note = parti.querySelector('.line-lock-note');
  const csendes = doc.getElementById('csendes-100-toggle');
  const ellen = doc.getElementById('ellen-100-toggle');
  assert(note.hidden);
  setBukott(parti, true);
  setChecked(csendes, true);
  assert(!csendes.closest('#csendes-100-field').classList.contains('is-locked'), 'Sosem inaktív');
  assert(parti.classList.contains('is-auto-bukott'), 'Csendes 100 mellett zárolt');
  assertEqual(cb.checked, false, 'Teljesült');
  assert(note.hidden, 'Üzenet kattintás előtt nem látszik');
  cb.click();
  assert(!note.hidden && note.textContent.includes('Csendes 100'), 'Kattintásra megjelenik');
  assertEqual(cb.checked, false, 'Kattintásra nem változhat');
  assert(note.classList.contains('shake'), 'Hibaüzenet/jelzés kell');
  setChecked(ellen, true);
  assertEqual(csendes.checked, false);
  assertEqual(cb.checked, true, 'Ellen csendes 100 mellett bukott');
  assert(parti.classList.contains('is-auto-bukott'));
  assert(note.hidden, 'Váltás után az üzenet újra rejtett');
  cb.click();
  assertEqual(cb.checked, true, 'Kattintásra nem változhat');
  setChecked(ellen, false);
  assert(!parti.classList.contains('is-auto-bukott'), 'Feloldódik');
  assertEqual(cb.checked, false);
  assert(note.hidden);
  assert(!doc.getElementById('csendes-100-field').classList.contains('is-locked'), 'Sosem inaktív');
  setChecked(csendes, true);
  assertEqual(cb.checked, false);
});

test('A fejlécben halványan látszik a verziószám', async () => {
  const doc = await newApp();
  const v = doc.getElementById('app-version');
  assert(v && /^v[0-9]+([.][0-9]+){1,2}$/.test(v.textContent), 'Verziószám kell a fejlécben');
});

test('Pontállás melletti gomb a leosztás beírásához görget', async () => {
  const doc = await newGame();
  const btn = doc.getElementById('btn-jump-to-hand');
  assert(btn, 'Legyen ugrás gomb');
  assert(btn.closest('.card').querySelector('h2').textContent.includes('Pontállás'), 'A Pontállás címsor mellett legyen');
  let target = null;
  doc.getElementById('round-title').scrollIntoView = function () { target = this; };
  btn.click();
  assertEqual(target && target.id, 'round-title', 'A Leosztás kártyához kell ugrania');
});

test('Pontállás összecsukó gomb: összecsukva csak a fejléc és az utolsó sor látszik, az állapot új sornál is megmarad', async () => {
  const doc = await newGame();
  submitHand(doc);
  submitHand(doc);
  const table = doc.getElementById('score-ledger');
  const btn = doc.getElementById('btn-collapse-ledger');
  assert(btn.compareDocumentPosition(doc.getElementById('btn-jump-to-hand')) & 4, 'Az összecsukó gomb a bal oldali (előbb áll)');
  assert(!table.classList.contains('is-collapsed'));
  btn.click();
  assert(table.classList.contains('is-collapsed'), 'Összecsukva');
  assertEqual(btn.getAttribute('aria-expanded'), 'false');
  submitHand(doc);
  assert(table.classList.contains('is-collapsed'), 'Új leosztás után is összecsukva marad');
  btn.click();
  assert(!table.classList.contains('is-collapsed'), 'Újra kinyitva');
  assertEqual(btn.getAttribute('aria-expanded'), 'true');
});

test('A pontállásban a pozitív állás zöld, a negatív piros, félkövéren (ahogy az exportban)', async () => {
  const doc = await newGame();
  setDeclarer(doc, 1);
  submitHand(doc); // Anna 0, Bela +2, Cili -1, Deszo -1
  const [zero, pos, neg] = [...doc.querySelectorAll('#score-ledger tr')[1].querySelectorAll('td')]
    .slice(1).map(td => doc.defaultView.getComputedStyle(td));
  assertEqual(pos.color, 'rgb(47, 107, 47)', 'Pozitív: zöld');
  assert(neg.color !== zero.color && neg.color !== pos.color, 'Negatív: saját (piros) szín');
  assertEqual(pos.fontWeight, '600');
  assertEqual(neg.fontWeight, '600');
  assert(zero.fontWeight !== '600', 'A nulla nincs kiemelve');
});

test('A Leosztás melletti gomb az oldal tetejére görget', async () => {
  const doc = await newGame();
  const btn = doc.getElementById('btn-jump-to-top');
  assert(btn.closest('.card').contains(doc.getElementById('round-title')), 'A Leosztás címsor mellett legyen');
  let args = null;
  doc.defaultView.scrollTo = (a) => { args = a; };
  btn.click();
  assertEqual(args && args.top, 0, 'A lap tetejére kell görgetnie');
});

test('Piros betli külön bemondás (10 pont), és színtelen sornál eltűnik a Piros adu kapcsoló', async () => {
  const doc = await newGame();
  const line = lines(doc)[0];
  setValue(line.querySelector('.line-bemondas'), 'betli');
  let r = lineResult(line);
  assertEqual(r.amountA, 5, 'Betli alapértéke 5 legyen');

  const pirosAdu = doc.getElementById('piros-adu-toggle');
  setChecked(pirosAdu, true);
  assertEqual(lineResult(line).amountA, 5, 'A Piros adu nem hat a betlire');
  assert(doc.getElementById('piros-adu-field').hidden, 'Színtelen sornál el kell tűnnie a Piros adu kapcsolónak');
  assertEqual(pirosAdu.checked, false, 'El kell veszítenie a jelölést');
  assert(!line.querySelector('.line-piros-checkbox'), 'Nincs soronkénti piros jelölőnégyzet');

  setValue(line.querySelector('.line-bemondas'), 'piros_betli');
  r = lineResult(line);
  assertEqual(r.amountA, 10, 'Piros betli 10 legyen');
  assert(!line.querySelector('.kontra-split').hidden, 'Egyénenkénti kontra');

  setValue(line.querySelector('.line-bemondas'), 'parti');
  assert(!doc.getElementById('piros-adu-field').hidden, 'Színes sornál vissza kell jönnie');
});

test('Háromlapos ulti: siker +20, bukás +10 ellenjátékosonként, kontra és piros adu nem szorozza', async () => {
  const doc = await newGame({ negyasz: true });
  const parti = lines(doc)[0];
  assert(parti.querySelector('.line-haromlapos-toggle').hidden, 'Partin nincs háromlapos');
  const ulti = addLine(doc, 'ulti');
  const box = ulti.querySelector('.line-haromlapos-checkbox');
  assert(!ulti.querySelector('.line-haromlapos-toggle').hidden);
  setChecked(box, true);
  assertEqual(lineResult(ulti).amountA, 24, 'Ulti 4 + 20');
  setJointKontra(ulti, 1);
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  assertEqual(lineResult(ulti).amountA, 36, '8*2 + 20: a felár fix');
  setBukott(ulti, true);
  assertEqual(lineResult(ulti).amountA, 8 * 3 + 10, 'bukás: 8*(2+1) + 10');
  setValue(ulti.querySelector('.line-bemondas'), 'csendes_ulti');
  assert(ulti.querySelector('.line-haromlapos-toggle').hidden, 'Csendes ultin nincs háromlapos');
  assertEqual(box.checked, false, 'Csendes ultira váltva elveszti a jelölést');
  setValue(ulti.querySelector('.line-bemondas'), 'negy_asz');
  assert(ulti.querySelector('.line-haromlapos-toggle').hidden);
  assertEqual(box.checked, false, 'Elveszti a jelölést');
});

test('Ulti bukása: a szorzó 2^szint+1, nem a szokásos 2^szint', async () => {
  const doc = await newGame();
  addLine(doc, 'ulti');
  const ultiLine = lineById(doc, 'ulti');
  setJointKontra(ultiLine, 1); // Kontra
  setBukott(ultiLine, true);
  const r = lineResult(ultiLine);
  // Ulti ertéke 4, bukás+kontra esetén szorzó = 2^1+1 = 3 -> 12
  assertEqual(r.amountA, 12);
  assertEqual(r.amountB, 12);
  assertEqual(r.verb, 'fizet');
});

test('Színes Durchmars automatikusan bukik, ha a hozzá tartozó alapjáték (40-100) bukik, és nem módosítható', async () => {
  const doc = await newGame();
  const baseLine = lines(doc)[0];
  setValue(baseLine.querySelector('.line-bemondas'), '40_100');
  const durchmarsLine = addLine(doc, 'durchmars_szines');

  assert(!durchmarsLine.classList.contains('is-auto-bukott'), 'Sikerült alapjáték mellett a Durchmars ne legyen zárolva');

  setBukott(baseLine, true);
  assert(durchmarsLine.classList.contains('is-auto-bukott'), 'Bukott alapjáték mellett a színes Durchmarsnak automatikusan zárolódnia kell');
  assert(durchmarsLine.querySelector('.line-bukott-checkbox').checked, 'A zárolt Durchmars sornak Bukottra kell állnia');
  assertEqual(durchmarsLine.querySelector('.result-toggle-label').textContent, 'Bukott');
  assert(!durchmarsLine.querySelector('.line-lock-note').hidden, 'Látható hibaüzenetnek kell megjelennie');
  assert(durchmarsLine.querySelector('.line-lock-note').textContent.includes('40-100'), 'Az üzenetnek utalnia kell az okra (40-100 bukott)');

  // Kattintásra (próbált módosítás) nem változhat, és jeleznie kell a hibát.
  durchmarsLine.querySelector('.line-bukott-checkbox').click();
  assert(durchmarsLine.querySelector('.line-bukott-checkbox').checked, 'Zárolt sornál a kattintás nem módosíthatja a Bukott állapotot');
  assert(durchmarsLine.querySelector('.line-lock-note').classList.contains('shake'), 'A kattintásnak vizuális jelzést kell adnia');

  // Ha az alapjáték újra sikerül, a zárolásnak fel kell oldódnia.
  setBukott(baseLine, false);
  assert(!durchmarsLine.classList.contains('is-auto-bukott'), 'Sikerült alapjáték mellett a zárolásnak fel kell oldódnia');
  assert(!durchmarsLine.querySelector('.line-bukott-checkbox').checked, 'Feloldás után a Durchmarsnak vissza kell állnia Sikerültre');
  assert(durchmarsLine.querySelector('.line-lock-note').hidden, 'A hibaüzenetnek el kell tűnnie feloldás után');
});

test('Színes Redurchmars automatikusan bukik, ha a mellé bemondott Ulti bukik', async () => {
  const doc = await newGame();
  setValue(lines(doc)[0].querySelector('.line-bemondas'), '40_100');
  const ultiLine = addLine(doc, 'ulti');
  const redurchmarsLine = addLine(doc, 'redurchmars_szines');

  assert(!redurchmarsLine.classList.contains('is-auto-bukott'));

  setBukott(ultiLine, true);
  assert(redurchmarsLine.classList.contains('is-auto-bukott'), 'Bukott Ulti mellett a színes Redurchmarsnak zárolódnia kell');
  assert(redurchmarsLine.querySelector('.line-bukott-checkbox').checked);
  assert(redurchmarsLine.querySelector('.line-lock-note').textContent.includes('Ulti'), 'Az üzenetnek utalnia kell az okra (Ulti bukott)');

  setValue(ultiLine.querySelector('.line-bemondas'), 'csendes_ulti'); // a Bukott jelölés megmarad
  assert(redurchmarsLine.classList.contains('is-auto-bukott'), 'Bukott csendes ulti mellett is zárolt');
  assert(redurchmarsLine.querySelector('.line-lock-note').textContent.includes('csendes ulti'), 'Az ok: a csendes ulti bukott');
});

test('Színes Durchmars/Redurchmars automatikusan bukik, ha mellette az Ellenulti sikerül', async () => {
  const doc = await newGame();
  setValue(lines(doc)[0].querySelector('.line-bemondas'), 'durchmars_szines');
  const ellenulti = addLine(doc, 'ellenulti');
  const durchmars = lineById(doc, 'durchmars_szines');
  const locked = () => durchmars.classList.contains('is-auto-bukott');
  assert(locked(), 'Sikerült Ellenulti mellett a Durchmars nem teljesülhet');
  assert(durchmars.querySelector('.line-bukott-checkbox').checked, 'Bukottra áll');
  assert(durchmars.querySelector('.line-lock-note').textContent.includes('Ellenulti'), 'Az üzenet az okra utal');

  setBukott(ellenulti, true);
  assert(!locked(), 'Bukott Ellenulti mellett feloldódik');
  assert(!durchmars.querySelector('.line-bukott-checkbox').checked, 'és visszaáll Teljesültre');

  setValue(durchmars.querySelector('.line-bemondas'), 'redurchmars_szines');
  setBukott(ellenulti, false);
  assert(locked(), 'A színes Redurchmarsra is vonatkozik');
  removeLine(ellenulti);
  assert(!locked(), 'Az Ellenulti törlése után feloldódik');
});

test('Színtelen bemondás (Durchmars, színtelen) kizár minden mást, és letiltja a sor hozzáadását', async () => {
  const doc = await newGame();
  const line = lines(doc)[0];
  setValue(line.querySelector('.line-bemondas'), 'durchmars_szintelen');
  assertEqual(lines(doc).length, 1, 'Egyetlen sor maradhat, ha színtelen bemondás van');
  assert(doc.getElementById('btn-add-line').disabled, 'A "+ Bemondás hozzáadása" gombnak letiltva kell lennie');
  assert(!line.querySelector('.kontra-split').hidden, 'Színtelen bemondásnál a split (egyénenkénti) kontra jelenjen meg');
  assert(line.querySelector('.kontra-joint').hidden, 'Színtelen bemondásnál a közös kontra ne jelenjen meg');
});

test('Ulti bemondás alapjáték nélkül automatikusan felveszi a "Parti" alapjátékot', async () => {
  const doc = await newGame();
  removeLine(lines(doc)[0]); // az induló "Parti" sor eltávolítása
  assertEqual(lines(doc).length, 0);
  let alerted = false;
  doc.defaultView.alert = () => { alerted = true; };
  submitHand(doc);
  assert(alerted, 'Bemondás nélkül a mentés figyelmeztet');
  assertEqual(doc.querySelectorAll('#score-ledger tr').length, 1, 'és nem rögzít leosztást');

  addLine(doc, 'ulti');
  const after = lines(doc);
  assertEqual(after.length, 2, 'Az Ulti mellé automatikusan pótolnia kell egy alapjáték-sort');
  const values = after.map(l => l.querySelector('.line-bemondas').value);
  assert(values.includes('ulti'));
  assert(values.includes('parti'), 'A pótolt alapjáték "Parti" legyen (nem színes durchmars mellett)');
});

test('Ha az egyetlen alapjáték-sort törlik, és marad mellette extra bemondás, az alapjáték újra pótlódik', async () => {
  const doc = await newGame();
  addLine(doc, 'ulti'); // most: [parti, ulti]
  assertEqual(lines(doc).length, 2);

  const partiLine = lineById(doc, 'parti');
  removeLine(partiLine);
  const after = lines(doc);
  assertEqual(after.length, 2, 'Az alapjátéknak azonnal vissza kell kerülnie, hogy az Ulti ne maradjon árván');
  assert(after.some(l => l.querySelector('.line-bemondas').value === 'parti'));
  assert(after.some(l => l.querySelector('.line-bemondas').value === 'ulti'));
});

test('Ulti mellé utólag bemondott színes Durchmars/Redurchmars megszünteti a "Parti" automatikus pótlásának szükségességét (regresszió)', async () => {
  const doc = await newGame();
  removeLine(lines(doc)[0]); // az induló "Parti" sor eltávolítása
  addLine(doc, 'ulti'); // Ulti árván marad -> automatikusan pótlódik mellé a "Parti"
  assertEqual(lines(doc).length, 2);
  assert(lines(doc).some(l => l.querySelector('.line-bemondas').value === 'parti'));

  const partiLine = lineById(doc, 'parti');
  setValue(partiLine.querySelector('.line-bemondas'), 'redurchmars_szines');

  const after = lines(doc);
  assertEqual(after.length, 2, 'A színes Redurchmars önmagában elég az Ultinak, nem pótlódhat mellé újra a "Parti"');
  const values = after.map(l => l.querySelector('.line-bemondas').value);
  assert(values.includes('ulti'));
  assert(values.includes('redurchmars_szines'));
  assert(!values.includes('parti'), 'A "Parti" nem térhet vissza, amíg a színes Durchmars/Redurchmars jelen van');
});

test('Színes Durchmars/Redurchmars önálló játékként bemondható, alapjáték nélkül, automatikus pótlás nélkül (regresszió)', async () => {
  const doc = await newGame();
  const baseLine = lines(doc)[0]; // induláskor alapból 'parti'
  setValue(baseLine.querySelector('.line-bemondas'), 'durchmars_szines');

  assertEqual(lines(doc).length, 1, 'A színes Durchmars önmagában megáll, nem pótlódhat mellé automatikusan semmi');
  assertEqual(lines(doc)[0].querySelector('.line-bemondas').value, 'durchmars_szines');

  const r = lineResult(lines(doc)[0]);
  assertEqual(r.amountA, 6, 'A színes Durchmars önálló alapértéke (6) érvényesüljön, alapjáték hozzáadása nélkül');
});

test('Színes Durchmars mellé opcionálisan hozzáadható 40-100/20-100, de a Parti nem', async () => {
  const doc = await newGame();
  setValue(lines(doc)[0].querySelector('.line-bemondas'), 'durchmars_szines');

  const secondLine = addLine(doc);
  const opts = bemondasOptionValues(secondLine.querySelector('.line-bemondas'));
  assert(!opts.includes('parti'), 'A Parti ne legyen választható a színes Durchmars mellé');
  assert(opts.includes('40_100'));
  assert(opts.includes('20_100'));

  setValue(secondLine.querySelector('.line-bemondas'), '40_100');
  assertEqual(lines(doc).length, 2, 'A 40-100 hozzáadása után is csak a két sor legyen jelen (nincs pótlás)');
});

test('Színtelen (split) kontránál a két ellenjátékos szintje egymástól függetlenül számít', async () => {
  const doc = await newGame();
  const line = lines(doc)[0];
  setValue(line.querySelector('.line-bemondas'), 'betli'); // ertek: 5
  setSplitKontra(line, 1, 0); // A: Kontra (2x), B: Nincs kontra (1x)
  const r = lineResult(line);
  assertEqual(r.amountA, 10);
  assertEqual(r.amountB, 5);
  const labels = () => [line.querySelector('.defender-a-label').textContent, line.querySelector('.defender-b-label').textContent].join(',');
  assertEqual(labels(), 'Cili,Deszo', 'A kontra-választók az ellenjátékosok nevét mutatják');
  setDeclarer(doc, 2);
  assertEqual(labels(), 'Bela,Deszo', 'Felvevő-váltáskor a nevek is frissülnek');
});

test('Idézőjelet / HTML-jelet tartalmazó játékosnév sem töri el a pontállást és a kézi szerkesztést', async () => {
  const tricky = 'Ann "A" <b>&';
  const doc = await newGame({ names: [tricky, 'Bela', 'Cili', 'Deszo'] });
  assertEqual(doc.querySelectorAll('#score-ledger th')[1].textContent, tricky, 'A fejlécben pontosan a név látszik');
  fire(doc.getElementById('btn-edit-ledger'), 'click');
  assertEqual(doc.querySelector('.manual-input').getAttribute('aria-label'), `${tricky} új állása`);
});

test('Színes (joint) kontránál egyetlen szint egyszerre vonatkozik mindkét ellenjátékosra', async () => {
  const doc = await newGame();
  const line = lines(doc)[0]; // 'parti', ertek: 1
  setJointKontra(line, 2); // Rekontra (4x)
  const r = lineResult(line);
  assertEqual(r.amountA, 4);
  assertEqual(r.amountB, 4);
});

test('Alaptét: minden érték az alaptéttel szorzódik (legördülő, sorok, háromlapos felár, csendes 100, bedobás)', async () => {
  const doc = await newGame({ alapTet: 3 });
  assert(doc.getElementById('round-meta').textContent.includes('Alaptét: 3/pont'));
  const optionText = (id) => [...lines(doc)[0].querySelector('.line-bemondas').options].find(o => o.value === id).textContent;
  assertEqual(optionText('parti'), 'Parti (3)', 'A legördülő az alaptéttel szorzott értéket mutatja');
  assertEqual(optionText('betli'), 'Betli (15)');
  assertEqual(lineResult(lines(doc)[0]).amountA, 3, 'Parti: 1 × 3');

  // 1. leosztás (Bela a felvevő): Parti 1 × 3 + csendes 100 2 × 3 ellenjátékosonként
  setChecked(doc.getElementById('csendes-100-toggle'), true);
  submitHand(doc);
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([0, 18, -9, -9]));

  // 2. leosztás (Bela oszt, Anna a felvevő): bedobás = bukott kontrázott Parti, 2 × 3 fejenként
  fire(doc.getElementById('btn-bedobas'), 'click');
  assertEqual(JSON.stringify(ledgerLastRow(doc)), JSON.stringify([-12, 18, -3, -3]));

  // Háromlapos felár: a kontra és a piros adu nem szorozza, az alaptét igen
  const ulti = addLine(doc, 'ulti');
  setChecked(ulti.querySelector('.line-haromlapos-checkbox'), true);
  setJointKontra(ulti, 1);
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  assertEqual(lineResult(ulti).amountA, 4 * 2 * 3 * 2 + 20 * 3, 'siker: 4 × piros 2 × alaptét 3 × kontra 2 + 20 × 3');
  setBukott(ulti, true);
  assertEqual(lineResult(ulti).amountA, 4 * 2 * 3 * 3 + 10 * 3, 'bukás: 4 × 2 × 3 × (2+1) + 10 × 3');
});

test('Négyász bemondás csak bekapcsolt kapcsolóval jelenik meg a katalógusban', async () => {
  let doc = await newGame();
  let opts = bemondasOptionValues(lines(doc)[0].querySelector('.line-bemondas'));
  assert(!opts.includes('negy_asz'), 'Kikapcsolt négyász-kapcsolónál a Négy ász ne jelenjen meg');

  doc = await newGame({ negyasz: true });
  addLine(doc); // második sor, hogy a Négy ász elérhető legyen a Parti alapjáték mellett
  opts = bemondasOptionValues(lines(doc)[1].querySelector('.line-bemondas'));
  assert(opts.includes('negy_asz'), 'Bekapcsolt négyász-kapcsolónál a Négy ász megjelenjen');
});

test('Osztó módosítása mentés közben visszaállítja a leosztás összes beállítását alapállapotba (regresszió)', async () => {
  const doc = await newGame();
  // dealer=0 (Anna kiáll) -> aktívak: Bela, Cili, Deszo
  addLine(doc);
  const line = lines(doc)[0];
  setJointKontra(line, 1);
  setBukott(line, true);
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  assertEqual(lines(doc).length, 2);
  assertEqual(doc.getElementById('defenders-info').textContent, 'Ellenjátékosok: Cili és Deszo');

  setDealer(doc, 1); // Bela lesz az osztó -> aktívak: Anna, Cili, Deszo

  const after = lines(doc);
  assertEqual(after.length, 1, 'A leosztás bemondás-sorainak alapállapotba kell állniuk');
  assert(!after[0].querySelector('.line-bukott-checkbox').checked, 'A "Bukott" jelölésnek törlődnie kell');
  assertEqual(after[0].querySelector('.kontra-joint-select').value, '0', 'A kontraszintnek "Nincs kontra"-ra kell állnia');
  assertEqual(doc.getElementById('piros-adu-toggle').checked, false, 'A Piros adu kapcsolónak ki kell kapcsolnia');
  const declarerOpts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!declarerOpts.includes('Bela'), 'Az új osztó (Bela) nem lehet Felvevő');
  assertEqual(doc.getElementById('defenders-info').textContent, 'Ellenjátékosok: Cili és Deszo', 'Az új felálláshoz tartozó ellenjátékosokat kell mutatnia');
});

test('Alapesetben a felvevő lesz a következő osztó', async () => {
  const doc = await newGame();
  setDeclarer(doc, 2); // Cili a felvevő
  submitHand(doc);
  const declarerOptsNow = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!declarerOptsNow.includes('Cili'), 'A most osztó Cili nem lehet a következő kör Felvevője');
});

test('"Piros ász oszt, nem oszt" bekapcsolva egyszerű körbe járó osztásra vált', async () => {
  const doc = await newGame();
  setChecked(doc.getElementById('piros-asz-toggle'), true);
  setDeclarer(doc, 2); // Cili a felvevő
  submitHand(doc);
  // dealer volt 0 (Anna) -> körbe járva a következő 1 (Bela), a felvevőtől (Cili) függetlenül
  const declarerOptsNow = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!declarerOptsNow.includes('Bela'), 'Körbe járó osztásnál Belának kell kiállnia osztóként');
  assert(declarerOptsNow.includes('Cili'), 'Körbe járó osztásnál a felvevő (Cili) maradhat aktív a következő körben');
});

test('"Utolsó leosztás visszavonása" visszaállítja a pontállást, a kört és az osztót', async () => {
  const doc = await newGame({ playerCount: 3 });
  setDeclarer(doc, 1); // Bela a felvevő
  submitHand(doc);

  const rowAfterSubmit = ledgerLastRow(doc);
  assert(rowAfterSubmit, 'A mentés után egy pontállás-sornak meg kell jelennie');
  assertEqual(rowAfterSubmit[1], 2, 'Bela (felvevő) +2 pontot kapjon');
  assertEqual(doc.getElementById('round-title').textContent, '2. leosztás');

  doc.defaultView.confirm = () => false;
  doc.getElementById('btn-undo').click();
  assertEqual(doc.getElementById('round-title').textContent, '2. leosztás', 'Mégse esetén nem von vissza semmit');
  doc.defaultView.confirm = () => true;
  doc.getElementById('btn-undo').click();

  assertEqual(ledgerLastRow(doc), null, 'A visszavonás után a pontállás-táblázatnak üresnek kell lennie');
  assertEqual(doc.getElementById('round-title').textContent, '1. leosztás');
  const declarerOpts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(declarerOpts.includes('Anna'), 'A visszavonás után az eredeti osztónak (Anna) kell visszakerülnie kiállóként/osztóként');
});

test('Előzmények: felvevő, ellenjátékosok, bemondások (piros / háromlapos jelzéssel, összegekkel), pontmozgás; a legújabb elöl', async () => {
  const doc = await newGame();
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  const ulti = addLine(doc, 'ulti');
  setChecked(ulti.querySelector('.line-haromlapos-checkbox'), true);
  setBukott(lines(doc)[0], true);
  submitHand(doc); // Parti (piros) bukott: 2/2; Ulti (piros, háromlapos) sikerült: 8 + 20 = 28/28
  const entry = () => doc.querySelector('#history-list .history-entry');
  assertEqual(entry().querySelector('.history-round-title').textContent, '1. leosztás — felvevő: Bela, ellenjátékosok: Cili és Deszo');
  assertEqual(entry().querySelector('.muted').textContent, 'Parti (piros): bukott (2/2), Ulti (piros) (háromlapos): sikerült (28/28)');
  assert(entry().textContent.includes('Anna: 0, Bela: +52, Cili: -26, Deszo: -26'), 'Pontmozgás: ' + entry().textContent);
  submitHand(doc);
  assert(entry().querySelector('.history-round-title').textContent.startsWith('2. leosztás'), 'A legújabb leosztás áll elöl');
});

test('A leosztás mentése után az állás a localStorage-ba is elmentődik', async () => {
  const doc = await newGame({ alapTet: 2 });
  setDeclarer(doc, 1);
  submitHand(doc);

  const raw = doc.defaultView.localStorage.getItem(SESSION_KEY);
  assert(raw, 'A session kulcsnak léteznie kell a localStorage-ban');
  const saved = JSON.parse(raw);
  assertEqual(saved.round, 2);
  assertEqual(saved.history.length, 1);
  assertEqual(saved.alapTet, 2);
});

test('Terített bemondás (Rebetli/Redurchmars) kiemeli a leosztás sorát, és a felvevő cellájában megjelenik az ikonja', async () => {
  const doc = await newGame();
  const cellsOf = (row) => [...row.querySelectorAll('td')];

  // 1. kör: Rebetli, felvevő alapból Bela (első aktív játékos, dealer=Anna).
  setValue(lines(doc)[0].querySelector('.line-bemondas'), 'rebetli');
  submitHand(doc);

  // 2. kör: sima Parti — ne emelkedjen ki semmi.
  submitHand(doc);

  // 3. kör: színes Redurchmars (40-100 alapjáték mellett) — újra ki kell emelkednie.
  setValue(lines(doc)[0].querySelector('.line-bemondas'), '40_100');
  addLine(doc, 'redurchmars_szines');
  submitHand(doc);

  const saved = JSON.parse(doc.defaultView.localStorage.getItem(SESSION_KEY));
  const rows = doc.querySelectorAll('#score-ledger tr');
  assertEqual(rows.length, 4, '1 fejléc + 3 leosztás sor');

  assert(rows[1].classList.contains('row-teritett'), '1. kör (Rebetli) sorának ki kell emelkednie');
  const declarer1 = saved.history[0].declarerIndex;
  const iconCell1 = cellsOf(rows[1])[1 + declarer1];
  assert(iconCell1.querySelector('.player-icon'), 'A felvevő cellájában meg kell jelennie az ikonjának');
  assertEqual(iconCell1.querySelector('.player-icon').textContent, saved.playerIcons[declarer1]);
  assert(!iconCell1.classList.contains('cell-declarer-teritett'), 'Külön színkiemelő class már nem kell, elég az ikon');

  assert(!rows[2].classList.contains('row-teritett'), '2. kör (sima Parti) sora ne emelkedjen ki');
  assert(cellsOf(rows[2]).every(td => !td.querySelector('.player-icon')), '2. körben semelyik cellában ne legyen ikon');

  assert(rows[3].classList.contains('row-teritett'), '3. kör (színes Redurchmars) sorának ki kell emelkednie');
  const declarer3 = saved.history[2].declarerIndex;
  assert(cellsOf(rows[3])[1 + declarer3].querySelector('.player-icon'), 'A 3. kör felvevőjének cellájában is ikon legyen');
});

test('A játékos ikonja csak az első terített bemondása után jelenik meg a Pontállás fejlécében', async () => {
  const doc = await newGame();

  const headerIconOf = (i) => {
    const th = [...doc.querySelectorAll('#score-ledger tr')[0].querySelectorAll('th')][1 + i];
    return th.querySelector('.player-icon');
  };

  const saved0 = JSON.parse(doc.defaultView.localStorage.getItem(SESSION_KEY));
  assert(Array.isArray(saved0.playerIcons) && saved0.playerIcons.length === 4, 'Az ikonokat már induláskor ki kell osztani');
  assertEqual(new Set(saved0.playerIcons).size, 4, 'Az ikonoknak egyedieknek kell lenniük a parti-esten belül');
  for (let i = 0; i < 4; i++) assert(!headerIconOf(i), 'Induláskor még senkinek nem látszódhat az ikonja');

  // 1. kör: sima Parti — utána se látszódjon senkinek az ikonja.
  submitHand(doc);
  for (let i = 0; i < 4; i++) assert(!headerIconOf(i), 'Sima kör (nincs terítve bemondás) után se jelenjen meg ikon');

  // 2. kör: Rebetli — csak a felvevő ikonjának kell megjelennie.
  setValue(lines(doc)[0].querySelector('.line-bemondas'), 'rebetli');
  submitHand(doc);

  const saved = JSON.parse(doc.defaultView.localStorage.getItem(SESSION_KEY));
  const declarerIndex = saved.history[1].declarerIndex;
  for (let i = 0; i < 4; i++) {
    if (i === declarerIndex) {
      const iconEl = headerIconOf(i);
      assert(iconEl, `A felvevő (${saved.players[i]}) ikonjának meg kell jelennie a terített bemondás után`);
      assertEqual(iconEl.textContent, saved.playerIcons[i]);
    } else {
      assert(!headerIconOf(i), `${saved.players[i]} ikonja ne jelenjen meg, ő nem mondott be terítettet`);
    }
  }
});

test('Régi (ikon nélküli) mentett parti-est visszatöltésekor pótlólag egyedi ikonokat kap minden játékos', async () => {
  const doc = await newAppWithStorage({
    [SESSION_KEY]: savedSession({ playerCount: 3, players: ['Anna', 'Bela', 'Cili'], totals: [0, 0, 0], playerIcons: undefined }),
  });
  const saved = JSON.parse(doc.defaultView.localStorage.getItem(SESSION_KEY));
  assert(Array.isArray(saved.playerIcons));
  assertEqual(saved.playerIcons.length, 3);
  assertEqual(new Set(saved.playerIcons).size, 3);
});

test('Sérült vagy hiányos mentésnél az app az indítási képernyővel indul; régi, alaptét nélküli mentésnél 1-es alaptéttel számol', async () => {
  let doc = await newAppWithStorage({ [SESSION_KEY]: '{nem json', [SETUP_DEFAULTS_KEY]: 'sérült' });
  assert(doc.getElementById('resume-banner').hidden, 'Nincs folytatható parti-est');
  assert(!doc.getElementById('setup-form-wrapper').hidden, 'Az indítási űrlap látszik');
  startGame(doc);
  assert(!doc.getElementById('game-screen').hidden, 'Új parti-est indítható');

  doc = await newAppWithStorage({ [SETUP_DEFAULTS_KEY]: { playerCount: 3 } }); // nevek nélküli beállítás
  assertEqual(doc.querySelectorAll('#player-names input').length, 3, 'A hiányos beállításból is betölt, amennyi van');

  doc = await newAppWithStorage({ [SESSION_KEY]: savedSession({ alapTet: undefined }) });
  doc.getElementById('btn-resume').click();
  assert(doc.getElementById('round-meta').textContent.includes('Alaptét: 1/pont'));
  assertEqual(lineResult(lines(doc)[0]).amountA, 1);
});

test('Exportálás: a .html ugyanazt a "Pontállás körről-körre" táblázatot tartalmazza, végeredmény-sorral', async () => {
  const doc = await newGame();
  let blob = null;
  doc.defaultView.URL.createObjectURL = (b) => { blob = b; return 'blob:stub'; };
  setValue(lines(doc)[0].querySelector('.line-bemondas'), 'rebetli');
  submitHand(doc);
  submitHand(doc);
  doc.getElementById('btn-export').click();
  assert(blob, 'Letöltendő fájl készül');

  const exported = new JSDOM(await blob.text()).window.document;
  const rowsText = (rows) => [...rows].map(tr => tr.textContent.replace(/\s+/g, ' ').trim());
  const appRows = doc.querySelectorAll('#score-ledger tr');
  const exportRows = exported.querySelectorAll('tr');
  assertEqual(exportRows.length, appRows.length + 1, 'Az app sorai + a végeredmény-sor');
  assertEqual(JSON.stringify(rowsText(exportRows).slice(0, -1)), JSON.stringify(rowsText(appRows)), 'Ugyanazok a sorok, mint az appban');
  assert(exportRows[1].classList.contains('row-teritett') && !exportRows[2].classList.contains('row-teritett'), 'A terített leosztás kiemelt');
  const finalCells = [...exportRows[exportRows.length - 1].querySelectorAll('td')].map(td => td.textContent);
  assertEqual(finalCells[0], 'Végeredmény');
  assertEqual(JSON.stringify(finalCells.slice(1).map(Number)), JSON.stringify(ledgerLastRow(doc)), 'A végeredmény a végállás');
});

test('Exportálás: a fájlnév a helyi dátumot tartalmazza (éjfél után is, nem az UTC szerintit)', async () => {
  const prevTz = process.env.TZ;
  process.env.TZ = 'Europe/Budapest';
  try {
    const fixed = Date.parse('2026-10-25T23:30:00Z'); // Budapesten már október 26., 00:30
    const doc = await newApp((window) => {
      const RealDate = window.Date;
      window.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : [fixed])); }
        static now() { return fixed; }
      };
    });
    startGame(doc);
    let fileName = null;
    doc.defaultView.HTMLAnchorElement.prototype.click = function () { fileName = this.download; };
    doc.getElementById('btn-export').click();
    assertEqual(fileName, 'ulti-pontallas-2026-10-26.html');
  } finally {
    if (prevTz === undefined) delete process.env.TZ;
    else process.env.TZ = prevTz;
  }
});

test('Parti-est indítása elmenti az indítási képernyő beállításait default-ként', async () => {
  const doc = await newGame({ playerCount: 3, startingDealer: 2, alapTet: 5, negyasz: true });
  const saved = JSON.parse(doc.defaultView.localStorage.getItem(SETUP_DEFAULTS_KEY));
  assertEqual(saved.playerCount, 3);
  assertEqual(saved.players.join(','), 'Anna,Bela,Cili');
  assertEqual(saved.dealerIndex, 2);
  assertEqual(saved.alapTet, 5);
  assertEqual(saved.negyaszEnabled, true);
});

test('Az alaptét csak nullánál nagyobb egész szám lehet: tört, nulla, negatív és üres érték nem indít partit', async () => {
  for (const bad of ['2.5', '0', '-3', '', 'abc', '1e1']) {
    const doc = await newGame({ alapTet: bad });
    assert(doc.getElementById('game-screen').hidden, `"${bad}" alaptéttel nem indulhat el a parti-est`);
    assert(!doc.getElementById('alap-tet-error').hidden, `"${bad}" esetén hibaüzenet kell`);
    assertEqual(doc.defaultView.localStorage.getItem(SESSION_KEY), null);
  }
  const doc = await newGame({ alapTet: 3 });
  assert(!doc.getElementById('game-screen').hidden, 'Egész alaptéttel elindul');
});

test('Új parti-est indításakor az előző indítási beállítások vannak default-ként betöltve', async () => {
  const doc = await newAppWithStorage({
    [SETUP_DEFAULTS_KEY]: { playerCount: 3, players: ['Elek', 'Feri', 'Gizi'], dealerIndex: 1, alapTet: 3, negyaszEnabled: true },
  });
  assertEqual(doc.getElementById('player-count').value, '3');
  const nameInputs = [...doc.querySelectorAll('#player-names input')];
  assertEqual(nameInputs.map(i => i.value).join(','), 'Elek,Feri,Gizi');
  assertEqual(doc.getElementById('starting-dealer').value, '1');
  assertEqual(doc.getElementById('alap-tet').value, '3');
  assertEqual(doc.getElementById('negyasz-toggle').checked, true);
});

test('Üresen hagyott játékosnév helyett "Játékos N" lesz a név', async () => {
  const doc = await newGame({ names: ['Anna', '', '   ', 'Deszo'] });
  const headers = [...doc.querySelectorAll('#score-ledger th')].map(th => th.textContent);
  assertEqual(headers.join(','), 'Kör,Anna,Játékos 2,Játékos 3,Deszo');
});

test('"Új parti-est": megerősítés után törli a folyamatban lévő parti-estet, az indítási beállításokat megtartja; Mégse esetén nem', async () => {
  const doc = await newGame();
  submitHand(doc);
  const win = doc.defaultView;
  win.confirm = () => false;
  doc.getElementById('btn-reset').click();
  assert(win.localStorage.getItem(SESSION_KEY), 'Mégse: a parti-est megmarad');
  win.confirm = () => true;
  doc.getElementById('btn-reset').click();
  assertEqual(win.localStorage.getItem(SESSION_KEY), null, 'A folyamatban lévő parti-est törlődik');
  assert(win.localStorage.getItem(SETUP_DEFAULTS_KEY), 'Az indítási képernyő beállításai megmaradnak');
});

test('"Elvetés, új indítása": megerősítés után törli a mentett parti-estet és az indítási űrlapot mutatja; Mégse esetén nem', async () => {
  const doc = await newAppWithStorage({ [SESSION_KEY]: savedSession() });
  const win = doc.defaultView;
  const banner = doc.getElementById('resume-banner');
  const form = doc.getElementById('setup-form-wrapper');
  assert(!banner.hidden && form.hidden, 'Mentett parti-estnél a folytatás-sáv látszik');
  win.confirm = () => false;
  doc.getElementById('btn-discard').click();
  assert(!banner.hidden && win.localStorage.getItem(SESSION_KEY), 'Mégse: semmi sem változik');
  win.confirm = () => true;
  doc.getElementById('btn-discard').click();
  assert(banner.hidden && !form.hidden, 'Az indítási űrlap jelenik meg');
  assertEqual(win.localStorage.getItem(SESSION_KEY), null, 'A mentett parti-est törlődik');
});

// ---------- Futtatás ----------

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
function green(s) { return useColor ? `\x1b[32m${s}\x1b[0m` : s; }
function red(s) { return useColor ? `\x1b[31m${s}\x1b[0m` : s; }

async function main() {
  let passed = 0;
  const failures = [];
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
      console.log(`${green('PASS')}  ${t.name}`);
    } catch (e) {
      failures.push({ name: t.name, error: e });
      console.log(`${red('FAIL')}  ${t.name}`);
      console.log(`      ${e.message}`);
    }
  }
  console.log('');
  console.log(`${passed}/${tests.length} teszt sikeres.`);
  if (failures.length > 0) {
    console.log(red(`${failures.length} teszt elbukott:`));
    failures.forEach(f => console.log(`  - ${f.name}`));
    process.exitCode = 1;
  }
}

main();

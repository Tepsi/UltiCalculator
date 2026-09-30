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

async function newApp() {
  // omitJSDOMErrors: az Exportálás gomb egy <a download> elemet klikkeltet,
  // amit jsdom navigációként próbál kezelni és "Not implemented" hibát ír ki —
  // ez az app szempontjából irreleváns zaj, nem valós hiba.
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/', virtualConsole });
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

function startGame(doc, { playerCount = 4, names = [], startingDealer = 0, alapTet = 1, negyasz = false } = {}) {
  setValue(doc.getElementById('player-count'), playerCount);
  const inputs = doc.querySelectorAll('#player-names input');
  inputs.forEach((inp, i) => { if (names[i] !== undefined) inp.value = names[i]; });
  setValue(doc.getElementById('starting-dealer'), startingDealer);
  doc.getElementById('alap-tet').value = String(alapTet);
  setChecked(doc.getElementById('negyasz-toggle'), negyasz);
  doc.getElementById('btn-start').click();
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
function setPirosVariant(line, val) {
  setChecked(line.querySelector('.line-piros-checkbox'), val);
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

// ---------- Tesztek ----------

test('4 fős mód: az osztó kiáll, a Felvevő legördülőben nem szerepel', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const opts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!opts.includes('Anna'), 'Az osztó (Anna) nem lehet a Felvevő-választóban');
  assertEqual(opts.length, 3, 'Pontosan 3 aktív játékosnak kell lennie 4 fős módban');
});

test('3 fős mód: mindenki aktív, senki nem áll ki', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 3, names: ['Anna', 'Bela', 'Cili'], startingDealer: 0 });
  const opts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assertEqual(opts.length, 3, '3 fős módban mindhárom játékosnak választhatónak kell lennie');
});

test('Alapjáték (Parti), sikerült, kontra nélkül: 1 pont mindkét ellenjátékos ellen', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  const r = lineResult(line);
  assertEqual(r.verb, 'kap');
  assertEqual(r.amountA, 1);
  assertEqual(r.amountB, 1);
});

test('Bukott checkbox: alapból "Sikerült", bejelölve "Bukott"-ra vált és a felvevő fizet', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  assertEqual(line.querySelector('.result-toggle-label').textContent, 'Sikerült');
  assert(!line.classList.contains('is-bukott'));

  setBukott(line, true);
  assertEqual(line.querySelector('.result-toggle-label').textContent, 'Bukott');
  assert(line.classList.contains('is-bukott'));
  assertEqual(lineResult(line).verb, 'fizet');

  setBukott(line, false);
  assertEqual(line.querySelector('.result-toggle-label').textContent, 'Sikerült');
  assert(!line.classList.contains('is-bukott'));
});

test('Piros adu duplázza a színes sor (Parti) értékét', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  const r = lineResult(line);
  assertEqual(r.amountA, 2);
  assertEqual(r.amountB, 2);
  assert(r.piros);
});

test('Betli piros fokozata duplázza az értéket, függetlenül a Piros adu kapcsolótól', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  setValue(line.querySelector('.line-bemondas'), 'betli');
  let r = lineResult(line);
  assertEqual(r.amountA, 5, 'Betli alapértéke 5 legyen');

  setPirosVariant(line, true);
  r = lineResult(line);
  assertEqual(r.amountA, 10, 'Piros betli duplázva 10 legyen');
  assert(r.piros);
});

test('Ulti bukása: a szorzó 2^szint+1, nem a szokásos 2^szint', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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

test('Színtelen bemondás (Durchmars, színtelen) kizár minden mást, és letiltja a sor hozzáadását', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  setValue(line.querySelector('.line-bemondas'), 'durchmars_szintelen');
  assertEqual(lines(doc).length, 1, 'Egyetlen sor maradhat, ha színtelen bemondás van');
  assert(doc.getElementById('btn-add-line').disabled, 'A "+ Bemondás hozzáadása" gombnak letiltva kell lennie');
  assert(!line.querySelector('.kontra-split').hidden, 'Színtelen bemondásnál a split (egyénenkénti) kontra jelenjen meg');
  assert(line.querySelector('.kontra-joint').hidden, 'Színtelen bemondásnál a közös kontra ne jelenjen meg');
});

test('Ulti bemondás alapjáték nélkül automatikusan felveszi a "Parti" alapjátékot', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  removeLine(lines(doc)[0]); // az induló "Parti" sor eltávolítása
  assertEqual(lines(doc).length, 0);

  const line = addLine(doc, 'ulti');
  const after = lines(doc);
  assertEqual(after.length, 2, 'Az Ulti mellé automatikusan pótolnia kell egy alapjáték-sort');
  const values = after.map(l => l.querySelector('.line-bemondas').value);
  assert(values.includes('ulti'));
  assert(values.includes('parti'), 'A pótolt alapjáték "Parti" legyen (nem színes durchmars mellett)');
});

test('Ha az egyetlen alapjáték-sort törlik, és marad mellette extra bemondás, az alapjáték újra pótlódik', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  addLine(doc, 'ulti'); // most: [parti, ulti]
  assertEqual(lines(doc).length, 2);

  const partiLine = lineById(doc, 'parti');
  removeLine(partiLine);
  const after = lines(doc);
  assertEqual(after.length, 2, 'Az alapjátéknak azonnal vissza kell kerülnie, hogy az Ulti ne maradjon árván');
  assert(after.some(l => l.querySelector('.line-bemondas').value === 'parti'));
  assert(after.some(l => l.querySelector('.line-bemondas').value === 'ulti'));
});

test('Színes Durchmars csak 40-100/20-100 alapjáték mellett választható, sima Parti mellett nem', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const baseLine = lines(doc)[0]; // 'parti'
  const secondLine = addLine(doc); // default preset egy második sorban
  let opts = bemondasOptionValues(secondLine.querySelector('.line-bemondas'));
  assert(!opts.includes('durchmars_szines'), 'Parti alapjáték mellett a színes Durchmars nem lehet választható');

  setValue(baseLine.querySelector('.line-bemondas'), '40_100');
  opts = bemondasOptionValues(secondLine.querySelector('.line-bemondas'));
  assert(opts.includes('durchmars_szines'), '40-100 alapjáték mellett a színes Durchmars választható legyen');
});

test('Színtelen (split) kontránál a két ellenjátékos szintje egymástól függetlenül számít', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  setValue(line.querySelector('.line-bemondas'), 'betli'); // ertek: 5
  setSplitKontra(line, 1, 0); // A: Kontra (2x), B: Nincs kontra (1x)
  const r = lineResult(line);
  assertEqual(r.amountA, 10);
  assertEqual(r.amountB, 5);
});

test('Színes (joint) kontránál egyetlen szint egyszerre vonatkozik mindkét ellenjátékosra', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0]; // 'parti', ertek: 1
  setJointKontra(line, 2); // Rekontra (4x)
  const r = lineResult(line);
  assertEqual(r.amountA, 4);
  assertEqual(r.amountB, 4);
});

test('Négyász bemondás csak bekapcsolt kapcsolóval jelenik meg a katalógusban', async () => {
  let doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0, negyasz: false });
  let opts = bemondasOptionValues(lines(doc)[0].querySelector('.line-bemondas'));
  assert(!opts.includes('negy_asz'), 'Kikapcsolt négyász-kapcsolónál a Négy ász ne jelenjen meg');

  doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0, negyasz: true });
  addLine(doc); // második sor, hogy a Négy ász elérhető legyen a Parti alapjáték mellett
  opts = bemondasOptionValues(lines(doc)[1].querySelector('.line-bemondas'));
  assert(opts.includes('negy_asz'), 'Bekapcsolt négyász-kapcsolónál a Négy ász megjelenjen');
});

test('Osztó módosítása mentés közben visszaállítja a leosztás összes beállítását alapállapotba (regresszió)', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  setDeclarer(doc, 2); // Cili a felvevő
  submitHand(doc);
  const declarerOptsNow = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!declarerOptsNow.includes('Cili'), 'A most osztó Cili nem lehet a következő kör Felvevője');
});

test('"Piros ász oszt, nem oszt" bekapcsolva egyszerű körbe járó osztásra vált', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  setChecked(doc.getElementById('piros-asz-toggle'), true);
  setDeclarer(doc, 2); // Cili a felvevő
  submitHand(doc);
  // dealer volt 0 (Anna) -> körbe járva a következő 1 (Bela), a felvevőtől (Cili) függetlenül
  const declarerOptsNow = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(!declarerOptsNow.includes('Bela'), 'Körbe járó osztásnál Belának kell kiállnia osztóként');
  assert(declarerOptsNow.includes('Cili'), 'Körbe járó osztásnál a felvevő (Cili) maradhat aktív a következő körben');
});

test('"Utolsó leosztás visszavonása" visszaállítja a pontállást, a kört és az osztót', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 3, names: ['Anna', 'Bela', 'Cili'], startingDealer: 0 });
  setDeclarer(doc, 1); // Bela a felvevő
  submitHand(doc);

  const rowAfterSubmit = ledgerLastRow(doc);
  assert(rowAfterSubmit, 'A mentés után egy pontállás-sornak meg kell jelennie');
  assertEqual(rowAfterSubmit[1], 2, 'Bela (felvevő) +2 pontot kapjon');
  assertEqual(doc.getElementById('round-title').textContent, '2. leosztás');

  doc.getElementById('btn-undo').click();

  assertEqual(ledgerLastRow(doc), null, 'A visszavonás után a pontállás-táblázatnak üresnek kell lennie');
  assertEqual(doc.getElementById('round-title').textContent, '1. leosztás');
  const declarerOpts = [...doc.getElementById('declarer-select').options].map(o => o.textContent);
  assert(declarerOpts.includes('Anna'), 'A visszavonás után az eredeti osztónak (Anna) kell visszakerülnie kiállóként/osztóként');
});

test('A leosztás mentése után az állás a localStorage-ba is elmentődik', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0, alapTet: 2 });
  setDeclarer(doc, 1);
  submitHand(doc);

  const raw = doc.defaultView.localStorage.getItem('ultiCalculator_session_v1');
  assert(raw, 'A session kulcsnak léteznie kell a localStorage-ban');
  const saved = JSON.parse(raw);
  assertEqual(saved.round, 2);
  assertEqual(saved.history.length, 1);
  assertEqual(saved.alapTet, 2);
});

test('Exportálás gomb nem dob hibát (a "Pontállás körről-körre" .html generálásakor)', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  submitHand(doc);
  doc.getElementById('btn-export').click();
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

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

test('Bukott checkbox: alapból "Teljesült", bejelölve "Bukott"-ra vált és a felvevő fizet', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const line = lines(doc)[0];
  setChecked(doc.getElementById('piros-adu-toggle'), true);
  const r = lineResult(line);
  assertEqual(r.amountA, 2);
  assertEqual(r.amountB, 2);
  assert(r.piros);
});

test('Csendes 100: 2 pont ellenjátékosonként (piros adunál 4), 40-100 mellett nem választható', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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

test('Csendes ulti: feleannyi mint az ulti, bukáskor duplán fizet, nincs kontra, kizárja az ultit', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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

test('Piros betli külön bemondás (10 pont), és színtelen sornál eltűnik a Piros adu kapcsoló', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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

test('Háromlapos ulti / csendes ulti: siker +20, bukás +10 ellenjátékosonként, kontra és piros adu nem szorozza', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0, negyasz: true });
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
  assert(!ulti.querySelector('.line-haromlapos-toggle').hidden, 'Csendes ultin is van');
  setValue(ulti.querySelector('.line-bemondas'), 'negy_asz');
  assert(ulti.querySelector('.line-haromlapos-toggle').hidden);
  assertEqual(box.checked, false, 'Elveszti a jelölést');
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

test('Színes Durchmars automatikusan bukik, ha a hozzá tartozó alapjáték (40-100) bukik, és nem módosítható', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  setValue(lines(doc)[0].querySelector('.line-bemondas'), '40_100');
  const ultiLine = addLine(doc, 'ulti');
  const redurchmarsLine = addLine(doc, 'redurchmars_szines');

  assert(!redurchmarsLine.classList.contains('is-auto-bukott'));

  setBukott(ultiLine, true);
  assert(redurchmarsLine.classList.contains('is-auto-bukott'), 'Bukott Ulti mellett a színes Redurchmarsnak zárolódnia kell');
  assert(redurchmarsLine.querySelector('.line-bukott-checkbox').checked);
  assert(redurchmarsLine.querySelector('.line-lock-note').textContent.includes('Ulti'), 'Az üzenetnek utalnia kell az okra (Ulti bukott)');
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

test('Ulti mellé utólag bemondott színes Durchmars/Redurchmars megszünteti a "Parti" automatikus pótlásának szükségességét (regresszió)', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  const baseLine = lines(doc)[0]; // induláskor alapból 'parti'
  setValue(baseLine.querySelector('.line-bemondas'), 'durchmars_szines');

  assertEqual(lines(doc).length, 1, 'A színes Durchmars önmagában megáll, nem pótlódhat mellé automatikusan semmi');
  assertEqual(lines(doc)[0].querySelector('.line-bemondas').value, 'durchmars_szines');

  const r = lineResult(lines(doc)[0]);
  assertEqual(r.amountA, 6, 'A színes Durchmars önálló alapértéke (6) érvényesüljön, alapjáték hozzáadása nélkül');
});

test('Színes Durchmars mellé opcionálisan hozzáadható 40-100/20-100, de a Parti nem', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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

test('Terített bemondás (Rebetli/Redurchmars) kiemeli a leosztás sorát, és a felvevő cellájában megjelenik az ikonja', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
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

  const saved = JSON.parse(doc.defaultView.localStorage.getItem('ultiCalculator_session_v1'));
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
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });

  const headerIconOf = (i) => {
    const th = [...doc.querySelectorAll('#score-ledger tr')[0].querySelectorAll('th')][1 + i];
    return th.querySelector('.player-icon');
  };

  const saved0 = JSON.parse(doc.defaultView.localStorage.getItem('ultiCalculator_session_v1'));
  assert(Array.isArray(saved0.playerIcons) && saved0.playerIcons.length === 4, 'Az ikonokat már induláskor ki kell osztani');
  assertEqual(new Set(saved0.playerIcons).size, 4, 'Az ikonoknak egyedieknek kell lenniük a parti-esten belül');
  for (let i = 0; i < 4; i++) assert(!headerIconOf(i), 'Induláskor még senkinek nem látszódhat az ikonja');

  // 1. kör: sima Parti — utána se látszódjon senkinek az ikonja.
  submitHand(doc);
  for (let i = 0; i < 4; i++) assert(!headerIconOf(i), 'Sima kör (nincs terítve bemondás) után se jelenjen meg ikon');

  // 2. kör: Rebetli — csak a felvevő ikonjának kell megjelennie.
  setValue(lines(doc)[0].querySelector('.line-bemondas'), 'rebetli');
  submitHand(doc);

  const saved = JSON.parse(doc.defaultView.localStorage.getItem('ultiCalculator_session_v1'));
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
  const legacyState = {
    playerCount: 3,
    players: ['Anna', 'Bela', 'Cili'],
    dealerIndex: 0,
    round: 1,
    totals: [0, 0, 0],
    history: [],
    pirosAszOsztNemOszt: false,
    negyaszEnabled: false,
    alapTet: 1,
  };
  const doc = await newApp((window) => {
    window.localStorage.setItem('ultiCalculator_session_v1', JSON.stringify(legacyState));
  });
  const saved = JSON.parse(doc.defaultView.localStorage.getItem('ultiCalculator_session_v1'));
  assert(Array.isArray(saved.playerIcons));
  assertEqual(saved.playerIcons.length, 3);
  assertEqual(new Set(saved.playerIcons).size, 3);
});

test('Exportálás gomb nem dob hibát (a "Pontállás körről-körre" .html generálásakor)', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 4, names: ['Anna', 'Bela', 'Cili', 'Deszo'], startingDealer: 0 });
  submitHand(doc);
  doc.getElementById('btn-export').click();
});

test('Parti-est indítása elmenti az indítási képernyő beállításait default-ként', async () => {
  const doc = await newApp();
  startGame(doc, { playerCount: 3, names: ['Anna', 'Bela', 'Cili'], startingDealer: 2, alapTet: 5, negyasz: true });
  const saved = JSON.parse(doc.defaultView.localStorage.getItem('ultiCalculator_setup_defaults_v1'));
  assertEqual(saved.playerCount, 3);
  assertEqual(saved.players.join(','), 'Anna,Bela,Cili');
  assertEqual(saved.dealerIndex, 2);
  assertEqual(saved.alapTet, 5);
  assertEqual(saved.negyaszEnabled, true);
});

test('Új parti-est indításakor az előző indítási beállítások vannak default-ként betöltve', async () => {
  const defaults = {
    playerCount: 3,
    players: ['Elek', 'Feri', 'Gizi'],
    dealerIndex: 1,
    alapTet: 2.5,
    negyaszEnabled: true,
  };
  const doc = await newApp((window) => {
    window.localStorage.setItem('ultiCalculator_setup_defaults_v1', JSON.stringify(defaults));
  });
  assertEqual(doc.getElementById('player-count').value, '3');
  const nameInputs = [...doc.querySelectorAll('#player-names input')];
  assertEqual(nameInputs.map(i => i.value).join(','), 'Elek,Feri,Gizi');
  assertEqual(doc.getElementById('starting-dealer').value, '1');
  assertEqual(doc.getElementById('alap-tet').value, '2.5');
  assertEqual(doc.getElementById('negyasz-toggle').checked, true);
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

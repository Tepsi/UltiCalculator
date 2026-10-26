'use strict';
/*
 * Lefedettségmérés: lefuttatja a regressziós teszteket a V8 beépített
 * lefedettségmérőjével (NODE_V8_COVERAGE), majd kiírja, hogy az index.html
 * <script>-jének mekkora része futott le, és mely sorai nem (vagy csak részben,
 * pl. egy feltétel egyik ága sosem). Nincs külső függősége.
 *
 * Futtatás: npm run coverage
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
// A tesztek ezen az URL-en töltik be az appot (ld. newApp a regression.test.js-ben).
const APP_URL = 'http://localhost/';

// Az app scriptje úgy, ahogy a jsdom látja: a HTML-parser a CRLF-et LF-re
// normalizálja, és a V8 karakter-pozíciói ehhez a szöveghez tartoznak.
function readAppScript() {
  const html = fs.readFileSync(HTML_PATH, 'utf8').replace(/\r\n?/g, '\n');
  const start = html.indexOf('<script>') + '<script>'.length;
  return {
    src: html.slice(start, html.lastIndexOf('</script>')),
    firstLine: html.slice(0, start).split('\n').length,
  };
}

// Karakterenként jelzi, hogy az adott pozíció lefutott-e valamelyik tesztben.
function coveredChars(covDir, src) {
  const covered = new Uint8Array(src.length);
  let found = false;
  for (const file of fs.readdirSync(covDir)) {
    for (const script of JSON.parse(fs.readFileSync(path.join(covDir, file), 'utf8')).result) {
      if (script.url !== APP_URL) continue;
      found = true;
      const length = Math.max(...script.functions.map(fn => fn.ranges[0].endOffset));
      if (length !== src.length) {
        throw new Error(`A lefedettségi adat (${length} karakter) nem az index.html mostani scriptjéhez (${src.length} karakter) tartozik.`);
      }
      // A V8 blokk-tartományai egymásba ágyazottak: a legbelső (legrövidebb) számít.
      const counts = new Float64Array(src.length);
      script.functions.flatMap(fn => fn.ranges)
        .sort((a, b) => (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset))
        .forEach(r => counts.fill(r.count, r.startOffset, r.endOffset));
      counts.forEach((count, i) => { if (count > 0) covered[i] = 1; });
    }
  }
  if (!found) throw new Error(`Nincs lefedettségi adat az app scriptjéhez (${APP_URL}).`);
  return covered;
}

function main() {
  const covDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ulti-coverage-'));
  try {
    const run = spawnSync(process.execPath, [path.join(__dirname, 'regression.test.js')], {
      env: { ...process.env, NODE_V8_COVERAGE: covDir },
      encoding: 'utf8',
    });
    if (run.status !== 0) {
      process.stdout.write(run.stdout + run.stderr);
      console.log('\nA tesztek nem futottak le hibátlanul, ezért nincs lefedettségi jelentés.');
      process.exitCode = run.status || 1;
      return;
    }
    console.log(run.stdout.trim().split('\n').pop()); // "N/N teszt sikeres."

    const { src, firstLine } = readAppScript();
    const covered = coveredChars(covDir, src);
    // Egy sor lefedetlen, ha a (megjegyzés nélküli) kódjának egy érdemi része
    // nem futott le; a magukban álló zárójelek / pontosvesszők nem számítanak.
    let offset = 0;
    let codeLines = 0;
    const uncovered = [];
    src.split('\n').forEach((text, i) => {
      const code = text.replace(/(^|\s)\/\/.*$/, '');
      let missed = '';
      for (let j = 0; j < code.length; j++) if (!covered[offset + j]) missed += code[j];
      if (/\S/.test(code)) codeLines++;
      if (/[^\s{}();,]/.test(missed)) uncovered.push(`${String(firstLine + i).padStart(5)}: ${text.trim().slice(0, 150)}`);
      offset += text.length + 1;
    });

    const percent = (100 * (codeLines - uncovered.length) / codeLines).toFixed(1);
    if (uncovered.length === 0) {
      console.log(`\nSorlefedettség (index.html <script>): 100% — mind a ${codeLines} kódsor lefutott.`);
    } else {
      console.log(`\nSorlefedettség (index.html <script>): ${percent}% — ${codeLines} kódsorból ${uncovered.length} nem, vagy csak részben futott le:`);
      uncovered.forEach(line => console.log(line));
    }
  } finally {
    fs.rmSync(covDir, { recursive: true, force: true });
  }
}

main();

# Ulti Pontozó — fejlesztői leírás

Kliensoldali, egyetlen fájlos web-app egy Ulti parti-est pontozására. A játékszabályok
és a felhasználói viselkedés teljes leírása: [DOKUMENTACIO.md](DOKUMENTACIO.md)
(felhasználói kézikönyv). Ez a fájl a kódbázis dolgozóinak szól.

## Fájlstruktúra

```
UltiCalculator/
├── index.html               -- a teljes app: HTML, beágyazott <style> és <script>
├── DOKUMENTACIO.md          -- felhasználói kézikönyv (szabályok, funkciók)
├── CLAUDE.md                -- ez a fájl
├── README.md                -- rövid ismertető
├── package.json             -- csak dev: a regressziós teszt futtatásához
└── tests/regression.test.js -- jsdom-alapú regressziós tesztek
```

## Architektúra

- **Az `index.html` szándékosan egyetlen, önálló fájl** — ne bontsd külön
  `style.css`/`app.js` fájlokra. Ok: Androidon (Edge, néha Chrome) a fájlkezelőből
  "Megnyitás ezzel" úton megnyitott HTML mellől a böngésző (`content://` URI) nem
  tölti be a relatív hivatkozású CSS/JS-t, ami üres mezőket vagy "file not found"
  hibát okozott. Nincs szerver, nincs build-lépés, nincs külső függőség.
- A kódot közvetlenül az `index.html`-ben kell szerkeszteni.
- Állapot: `localStorage` — `ultiCalculator_session_v1` (folyamatban lévő parti-est),
  `ultiCalculator_setup_defaults_v1` (indítási képernyő utolsó beállításai).

## Katalógus és szabályok a kódban

- Az összes alapjáték és bemondás a `BEMONDASOK` konstansban van az `index.html`
  `<script>` blokkjának elején. Alapjáték-elemek: `jatekAlap: true` (egyszerre egy
  lehet). Mezők: `ertek`, `kategoria` (`'szin'` / `'adu_nelkuli'`), `nincsKontra`,
  `ellen`, `haromlapos`, `optional` stb. Alapérték vagy új bemondás: itt kell módosítani.
- Kontraszintek: `KONTRA_SZINTEK`.
- Az extra bemondások (négy ász, ulti, színes durchmars/redurchmars) alapértéke
  **nem** tartalmazza az alapjáték értékét; azt az `ensureBaseGameLine` által
  automatikusan hozzáadott "Parti" sor adja.
- Piros duplázás: nem katalógus-elem a színes (`kategoria: 'szin'`) soroknál, hanem a
  leosztás egészére vonatkozó "Piros adu" kapcsolóból jön; a piros betli külön
  katalógus-elem (`piros_betli`).
- Kényszerített sor-eredmények (`updateDurchmarsAutoBukas`, `is-auto-bukott` osztály):
  színes durchmars/redurchmars bukik, ha az alapjáték/ulti bukik; az alapjáték
  teljesül csendes 100 mellett, bukik ellen csendes 100 mellett.
  A csendes 100-as esetben a magyarázó üzenet (`.line-lock-note`) csak kattintásra
  jelenik meg (`clickOnly`).
- Parti + csendes 100 / ellen csendes 100: ha a Partin kívül van más sor is, a Parti
  sor rejtett (`isPartiSuppressed`, `updatePartiSuppression`) és `computeHandDeltas`
  kihagyja; a sor a DOM-ban marad (hogy `ensureBaseGameLine` ne pótolja újra).
- Bedobás (`#btn-bedobas`): a kiválasztott felvevő bukott kontrázott Partit az ellenjátékosoknak; a history
  bejegyzés `bedobas: true` jelzőt kap (`renderHistory` ez alapján írja ki). Rögzítés:
  `commitHand` (a "Leosztás mentése" is ezt használja).
- Kézi szerkesztés (`editingLedger`, `startManualEdit`): a pontállás végére szerkeszthető
  `.manual-input` sor kerül; közben `setEditLock` `inert`-re állítja az oldal többi részét.
  Jóváhagyáskor `manual: true` history-bejegyzés (declarerIndex -1, üres lineSummaries)
  keletkezik, a `round`/`dealerIndex` nem lép tovább.
- `renderPreview` minden módosítás után lefut (elérhetőségek és zárolások frissítése,
  élő előnézet); az egyenleg-ellenőrzés (összeg = 0) zárolja a rögzítést eltérés esetén.

## Verziószám

A fejlécben halványan látszik (`#app-version`, jelenleg `v1.1`). A verziót csak akkor emeljük (és akkor pusholunk), ha a felhasználó külön szól.

## Tesztelés

- **Az `index.html` minden módosítása után futtasd az `npm test`-et**, és javítsd a
  hibákat, mielőtt késznek jelented a változtatást. Első alkalommal `npm install`.
- `tests/regression.test.js`: jsdom-ba tölti az `index.html`-t, és valódi felhasználóként
  hajtja (mezők kitöltése, change/click/submit események, DOM és localStorage
  olvasása). A belső JS-függvények nincsenek globálisan kitéve, ezért nem hívhatók
  közvetlenül.
- Új funkcióhoz vagy hibajavításhoz mindig adj hozzá/egészíts ki egy tesztet.

## Dokumentáció karbantartása

Szabály- vagy viselkedésváltozáskor frissítsd a `DOKUMENTACIO.md`-t (felhasználói
szemszögből, magyarul); architektúra- vagy konvencióváltozáskor ezt a fájlt.

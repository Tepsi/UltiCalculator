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
├── package.json             -- csak dev: a tesztek futtatásához
└── tests/
    ├── regression.test.js   -- jsdom-alapú regressziós tesztek (npm test)
    └── coverage.js          -- lefedettségmérés a teszteken (npm run coverage)
```

## Architektúra

- **Az `index.html` szándékosan egyetlen, önálló fájl** — ne bontsd külön
  `style.css`/`app.js` fájlokra. Ok: Androidon (Edge, néha Chrome) a fájlkezelőből
  "Megnyitás ezzel" úton megnyitott HTML mellől a böngésző (`content://` URI) nem
  tölti be a relatív hivatkozású CSS/JS-t, ami üres mezőket vagy "file not found"
  hibát okozott. Nincs szerver, nincs build-lépés, nincs külső függőség.
- A kódot közvetlenül az `index.html`-ben kell szerkeszteni.
- Élesítés: az app a GitHub Pages-en fut (https://tepsi.github.io/UltiCalculator/),
  közvetlenül a `master` ág gyökeréből — **minden push a `master`-re azonnal élesít**.
- Állapot: `localStorage` — `ultiCalculator_session_v1` (folyamatban lévő parti-est),
  `ultiCalculator_setup_defaults_v1` (indítási képernyő utolsó beállításai). A mentett
  formátumot (pl. a history-bejegyzések mezőit) csak visszafelé kompatibilisen szabad
  módosítani: a régebben mentett parti-estek is betöltődnek (ld. az ikonok pótlását).
- Eseménykezelés: a `#hand-form` egyetlen delegált `change` figyelője minden módosítás
  után `renderPreview`-t hív, ami minden származtatott állapotot újraszámol (hiányzó
  alapjáték pótlása, választható opciók, kapcsolók elérhetősége, kényszerített
  eredmények, a sorok megjelenése `renderLine`-nal, élő előnézet). A sor törlése és a
  zárolt eredményre kattintás a `#bemondas-lines` delegált `click` figyelőjében van;
  a soroknak nincs saját eseménykezelője. Ami a DOM-ot közvetlenül módosítja
  (`resetHandForm`, `addBemondasLine`), az nem renderel — utána `renderPreview` vagy
  `renderAll` kell.
- A pontállás-táblázatot (`scoreTableHtml`) az app és az Exportálás ugyanúgy állítja elő.

## Katalógus és szabályok a kódban

- Az összes alapjáték és bemondás a `BEMONDASOK` konstansban van az `index.html`
  `<script>` blokkjának elején. Alapjáték-elemek: `jatekAlap: true` (egyszerre egy
  lehet). Mezők: `ertek`, `kategoria` (`'szin'` / `'adu_nelkuli'`), `nincsKontra`,
  `ellen`, `haromlapos`, `teritett` (kiemelt pontállás-sor + felvevő-ikon), `optional`
  stb. Alapérték vagy új bemondás: itt kell módosítani. A kombinálhatósági szabályok
  (`availableBemondasok`) kölcsönösek legyenek (ha A kizárja B-t, B is A-t), különben
  egy már kiválasztott sor elveszítheti a saját opcióját.
- Kontraszintek: `KONTRA_SZINTEK`.
- Az extra bemondások (négy ász, ulti, színes durchmars/redurchmars) alapértéke
  **nem** tartalmazza az alapjáték értékét; azt külön alapjáték-sor adja. Ha egy
  alapjátékot igénylő extra (négy ász, ulti-félék) mellől hiányzik, az
  `ensureBaseGameLine` automatikusan "Parti" sort ad hozzá; a színes
  durchmars/redurchmars önállóan is megáll.
- Piros duplázás: nem katalógus-elem a színes (`kategoria: 'szin'`) soroknál, hanem a
  leosztás egészére vonatkozó "Piros adu" kapcsolóból jön; a piros betli külön
  katalógus-elem (`piros_betli`).
- Kényszerített sor-eredmények (`forcedResult`, `updateForcedResults`, `is-auto-bukott` osztály):
  színes durchmars/redurchmars bukik, ha az alapjáték/ulti/csendes ulti bukik vagy az
  ellenulti sikerül; az alapjáték
  teljesül csendes 100 mellett, bukik ellen csendes 100 mellett.
  A csendes 100-as esetben a magyarázó üzenet (`.line-lock-note`) csak kattintásra
  jelenik meg (`clickOnly`).
- Parti + csendes 100 / ellen csendes 100: ha a Partin kívül van más sor is, a Parti
  sor rejtett (`isPartiSuppressed`, `renderLine`) és `computeHandDeltas`
  kihagyja; a sor a DOM-ban marad (hogy `ensureBaseGameLine` ne pótolja újra).
- Bedobás (`#btn-bedobas`): a kiválasztott felvevő bukott kontrázott Partit az ellenjátékosoknak; a history
  bejegyzés `bedobas: true` jelzőt kap (`renderHistory` ez alapján írja ki). Rögzítés:
  `commitHand` (a "Leosztás mentése" is ezt használja).
- Kézi szerkesztés (`editingLedger`, `startManualEdit`): a pontállás végére szerkeszthető
  `.manual-input` sor kerül; közben `setEditLock` `inert`-re állítja az oldal többi részét.
  Jóváhagyáskor `manual: true` history-bejegyzés (declarerIndex -1, üres lineSummaries)
  keletkezik, a `round`/`dealerIndex` nem lép tovább.
- Az egyenleg-ellenőrzés (`updateBalanceCheck`, összeg = 0) eltérés esetén zárolja a
  rögzítést (űrlap, Bedobás, osztó, "Piros ász oszt, nem oszt").

## Verziószám

A fejlécben halványan látszik (`#app-version`, jelenleg `v1.2`). A verziót csak akkor emeljük (és akkor pusholunk), ha a felhasználó külön szól.

## Tesztelés

- **Az `index.html` minden módosítása után futtasd az `npm test`-et**, és javítsd a
  hibákat, mielőtt késznek jelented a változtatást. Első alkalommal `npm install`.
- `tests/regression.test.js`: jsdom-ba tölti az `index.html`-t, és valódi felhasználóként
  hajtja (mezők kitöltése, change/click/submit események, DOM és localStorage
  olvasása). A belső JS-függvények nincsenek globálisan kitéve, ezért nem hívhatók
  közvetlenül.
- Segédfüggvények: `newGame(opciók)` elindított parti-estet ad (alapból 4 fő: Anna,
  Bela, Cili, Deszo; Anna oszt); `newAppWithStorage({ [SESSION_KEY]: savedSession(...) })`
  mentett állapotból tölt be. Gombnál a `.click()` a valószerűbb (letiltott gombon nem
  fut le), a `fire(el, 'click')` letiltott gombon is lefut.
- Új funkcióhoz vagy hibajavításhoz mindig adj hozzá/egészíts ki egy tesztet.
- `npm run coverage`: a teszteket a V8 beépített lefedettségmérőjével futtatja, és kiírja
  az `index.html` scriptjének sorlefedettségét, valamint a le nem futott (vagy csak
  részben, pl. egy feltétel egyik ágán lefutott) sorokat. Új funkció után nézd meg, hogy
  a kódja lefut-e a tesztekben. Szándékosan lefedetlen: a `bemondasOptionsHtml`
  védőága (a kölcsönös kombinálhatósági szabályok mellett nem érhető el). A CSS-t nem
  méri.

## Dokumentáció karbantartása

Szabály- vagy viselkedésváltozáskor frissítsd a `DOKUMENTACIO.md`-t (felhasználói
szemszögből, magyarul); architektúra- vagy konvencióváltozáskor ezt a fájlt.

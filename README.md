# Ulti Pontozó

Egyszerű, kizárólag a böngészőben futó alkalmazás egy Ulti parti-est
pontjainak vezetésére. Nincs szerver, nincs telepítés, nincs build-lépés —
csak nyisd meg az `index.html`-t.

## Futtatás

- **PC-n:** dupla kattintás az `index.html`-re.
- **Telefonon:** töltsd fel a három fájlt (`index.html`, `style.css`,
  `app.js`) egy közös mappába, és a fájlkezelőből nyisd meg az `index.html`-t.

Részletek (mobilos webszerver-trükk, ha a böngésző nem engedi a helyi fájlt): [DOKUMENTACIO.md](DOKUMENTACIO.md).

## Fő funkciók

- 3 vagy 4 fős mód (4 fősnél az osztó kiáll az adott leosztásban).
- Egyetlen közös bemondás-katalógus (parti / 40-100 / 20-100, ulti,
  (kapcsolóval) négyász, betli, durchmars/redurchmars), soronként hozzáadva —
  ha egy alapjátékot igénylő extrát (pl. ulti) választasz alapjáték nélkül, az
  app automatikusan pótolja a "Parti" sort.
- Egy közös "Piros adu" kapcsoló duplázza a leosztás színes sorait; a betli
  saját, önálló piros jelölőnégyzettel rendelkezik.
- Durchmars/redurchmars színes (adus, kombinálható) és színtelen (adu nélküli,
  helyettesíti az alapjátékot) formában is választható.
- Színes bemondásoknál közös, színtelen bemondásoknál ellenjátékosonkénti
  kontra.
- Osztás menete: alapesetben a felvevő lesz a következő osztó; "Piros ász
  oszt, nem oszt" kapcsolóval egyszerű körbe járó osztásra állítható.
- "Pontállás körről-körre" táblázat, élő előnézet, leosztás-visszavonás.
- Automatikus mentés a böngésző `localStorage`-ába, exportálás jól olvasható
  `.html` fájlba.

A teljes funkció- és szabályleírást (bemondás-katalógus, pontértékek,
kontraszintek) lásd: [DOKUMENTACIO.md](DOKUMENTACIO.md).

## Fájlstruktúra

```
UltiCalculator/
├── index.html      -- a felület HTML szerkezete
├── style.css       -- reszponzív, mobilbarát megjelenés
├── app.js          -- játék-szint és bemondás-katalógus, pontszámítási logika, állapotkezelés
└── DOKUMENTACIO.md -- részletes dokumentáció
```

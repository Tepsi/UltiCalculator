# Ulti Pontozó

Egyszerű, böngészőben futó alkalmazás egy Ulti parti-est pontjainak vezetésére.

## 👉 [Az app megnyitása: tepsi.github.io/UltiCalculator](https://tepsi.github.io/UltiCalculator/) 👈

Telepíteni nem kell, telefonon és gépen is működik, bármilyen modern
böngészőben.

## Fő funkciók

- 3 vagy 4 fős mód (4 fősnél az osztó kiáll az adott leosztásban).
- Parti-est indításánál beállítható az alaptét (mennyit ér egy parti-pont) —
  minden bemondás ehhez arányosan skálázva fizet, nem csak egyforintos alapon.
- Egyetlen közös bemondás-katalógus (parti / 40-100 / 20-100, ulti,
  (kapcsolóval) négyász, betli, durchmars/redurchmars), soronként hozzáadva —
  ha egy alapjátékot igénylő extrát (pl. ulti) választasz alapjáték nélkül, az
  app automatikusan pótolja a "Parti" sort.
- Egy közös "Piros adu" kapcsoló duplázza a leosztás színes sorait; a piros
  betli külön bemondás a katalógusban.
- Durchmars/redurchmars színes (adus, kombinálható) és színtelen (adu nélküli,
  helyettesíti az alapjátékot) formában is választható.
- Színes bemondásoknál közös, színtelen bemondásoknál ellenjátékosonkénti
  kontra.
- Osztás menete: alapesetben a felvevő lesz a következő osztó; "Piros ász
  oszt, nem oszt" kapcsolóval egyszerű körbe járó osztásra állítható. Az
  osztó kézzel is felülírható (elgépelés javítására) — ilyenkor a
  folyamatban lévő leosztás beállításai alapállapotba állnak vissza.
- "Pontállás körről-körre" táblázat, élő előnézet, leosztás-visszavonás.
- Automatikus mentés a böngésző `localStorage`-ába, exportálás jól olvasható
  `.html` fájlba.

A teljes funkció- és szabályleírást (bemondás-katalógus, pontértékek,
kontraszintek) lásd: [DOKUMENTACIO.md](DOKUMENTACIO.md).

## Fájlstruktúra

```
UltiCalculator/
├── index.html      -- a teljes app: HTML szerkezet, beágyazott CSS és JS egyetlen fájlban
├── DOKUMENTACIO.md -- felhasználói kézikönyv
├── CLAUDE.md       -- fejlesztői leírás (architektúra, tesztelés, konvenciók)
└── tests/          -- fejlesztői regressziós tesztek (jsdom, `npm test`) és lefedettségmérés (`npm run coverage`) — nem kell az app futtatásához
```

Az `index.html` szándékosan egyetlen, önálló fájl (nincs benne külső
`style.css`/`app.js` hivatkozás) — ez azért fontos, mert egyes mobil
böngészők (pl. Android Edge, néha Chrome is) a fájlkezelőből "Megosztás" /
"Megnyitás ezzel" úton megnyitott HTML fájl mellől nem engedik betölteni a
mellette lévő különálló fájlokat, ilyenkor a lapon üres mezők vagy
"file not found" hibaüzenet jelenik meg. Egyetlen fájlban ez a probléma nem
jöhet elő.

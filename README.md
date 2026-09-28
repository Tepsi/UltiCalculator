# Ulti Pontozó

Egyszerű, kizárólag a böngészőben futó alkalmazás egy Ulti parti-est
pontjainak vezetésére. Nincs szerver, nincs telepítés, nincs build-lépés,
nem kell hozzá semmilyen programozói ismeret.

## Letöltés és futtatás

Az app egyetlen önálló `index.html` fájl (a CSS és a JS is bele van ágyazva) —
nincs szükség ZIP-re vagy több fájl együtt tartására.

1. Nyisd meg az `index.html` fájlt a GitHub oldalán, kattints a **"Raw"**
   gombra, majd mentsd el ("Kép/oldal mentése", `Ctrl+S`/`Cmd+S`).
2. **PC-n:** dupla kattintással indítsd el a mentett `index.html` fájlt —
   megnyílik az alapértelmezett böngészőben.
   **Telefonon:** töltsd fel az `index.html` fájlt (pl. felhő-tárhelyre,
   e-mailben), és a fájlkezelőből nyisd meg — nem kell mellé más fájl.

Ennyi — nincs szükség se szerverre, se internetkapcsolatra, az app onnantól
a böngésződben fut.

Részletek (git klónozás, mobilos webszerver-trükk, ha a böngésző nem engedi a helyi fájlt): [DOKUMENTACIO.md](DOKUMENTACIO.md).

## Fő funkciók

- 3 vagy 4 fős mód (4 fősnél az osztó kiáll az adott leosztásban).
- Parti-est indításánál beállítható az alaptét (mennyit ér egy parti-pont) —
  minden bemondás ehhez arányosan skálázva fizet, nem csak egyforintos alapon.
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
├── index.html      -- a teljes app: HTML szerkezet, beágyazott CSS és JS egyetlen fájlban
└── DOKUMENTACIO.md -- részletes dokumentáció
```

Az `index.html` szándékosan egyetlen, önálló fájl (nincs benne külső
`style.css`/`app.js` hivatkozás) — ez azért fontos, mert egyes mobil
böngészők (pl. Android Edge, néha Chrome is) a fájlkezelőből "Megosztás" /
"Megnyitás ezzel" úton megnyitott HTML fájl mellől nem engedik betölteni a
mellette lévő különálló fájlokat, ilyenkor a lapon üres mezők vagy
"file not found" hibaüzenet jelenik meg. Egyetlen fájlban ez a probléma nem
jöhet elő.

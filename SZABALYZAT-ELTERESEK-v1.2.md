# v1.2 – eltérések a hivatalos MAUSZ szabályzattól (játékszabályok)

Csak a **játékszabályok** számítanak, a programmódosítások nem. Viszonyítási alap: a *MAUSZ
Játékszabályzat 2025.* (`2025.-JATEKSZABALYOK-RENONSZOK.docx`). A részletes elemzés és a
kódhivatkozások: [SZABALYZAT-OSSZEHASONLITAS.md](SZABALYZAT-OSSZEHASONLITAS.md); a v1.2 →
v1.3 változások forrása a `cc61b1e` és `b063931` commit.

A szabályzat a játékot szabályozza; az app pontozó, ezért a licitálás/lejátszás menetét
nem vizsgáljuk — csak a pontértékeket, kombinálhatóságot, drágítást és csendes teljesítést.
(A feladás/bedobás, a renonsz és a "Piros ász oszt, nem oszt" házi szabály kikerült az
összevetésből.)

## 1. Amiben a v1.2 egyezik a hivatalossal

- Alapértékek: Parti 1, 40-100 4, 20-100 8, Ulti 4, Betli 5, Durchmars (színes és színtelen) 6, Négy ász 4.
- Piros duplázás (színes bemondásoknál ×2).
- Ulti bukás-többlet: bemondott −4, csendes −2, drágítástól független.
- Csendes ulti, ellenulti (2 / piros 4).
- Egyszerre egy alapjáték és egy ulti-féle; ulti mellé automatikus Parti; színes durchmars
  mellé csak 40-100 / 20-100; színtelen bemondás mellé semmi.
- Kontra (×2), rekontra (×4); színes bemondásnál közös, színtelennél egyéni védői kontra.
- Betli 5, "piros betli" 10 és terített betli 20 **értéke** (csak a nevek térnek el).

## 2. Eltérések a v1.2-ben

| # | Téma | Hivatalos szabály | v1.2 |
|---|---|---|---|
| 1 | **Drágítási fokozatok** | Csak kontra (×2) és rekontra (×4); más fokozat nincs | Szubkontra, Mordkontra, Hirschkontra, Fedák Sári is (×64-ig) |
| 2 | **Színes terített durchmars** | 12 (piros 24) | 24 (piros 48), "Redurchmars / Terített durchmars (színes)" |
| 3 | **Redurchmars (színtelen)** | Külön bemondás, 12 / Bemondásnál jelezni kell, hogy színtelen| Nincs; csak egy "Redurchmars / Terített durchmars (színtelen)" tétel 24-ért |
| 5 | **Rebetli / terített betli neve** | Rebetli = 10, Terített betli = 20 | "Piros betli" = 10, "Rebetli / Terített betli" = 20 (az érték jó, a név félrevezető) |
| 6 | **Négy ász** | Létezik és vele csendes négy ász, ellen, négy ász / Durchmarssal, terített durchmarssal nem kombinálható | Nincs |
| 7 | **Sima parti** | Le lehet játszani, sok csendes mondás + kontra érdekessé és értékessé teheti | Kötelezően bedobandó |
| 10 | **Háromlapos ulti** | A szabályzat nem ismeri | Mindig elérhető: +20 siker / +10 bukás felár (házi szabály, kapcsoló nélkül) |
| 11 | **Csendes 100 értéke** | A játék értéke megduplázódik; kontránál a megdrágított értékhez hozzáadódik a csendes 100 értéke (2 / piros 4) | Fix 2 (piros 4) pontos külön tétel. Parti mellett a Parti külön fizet; más sor mellett a Parti eltűnik, és a játékra tett kontra külön nem adható |
| 12 | **Szigorúbb renonsz szabályok** | Szabályzatba részletesen leírt | Csak rossz lap hozzárakásánál |
| 13 | **Parti kulcslap hiányában** | el lehet kezdeni pl.: ultit hetes nélkül, 40-100 40 nélkül | nem lehet elkezdeni |

A v1.2-ben az **ellenulti sikere esetén a színes durchmars automatikusan bukik**; ezt a
szabályzat szó szerint nem mondja ki, a logikából következik — nem tekintjük eltérésnek.

## 3. Összesítés

- **11 eltérés** a v1.2-ben: 4 az értékeknél/elnevezésnél (2–5.), 1 a drágításnál (1.),
  4 a négy ásznál (6–9.), 1 házi szabály kapcsoló nélkül (10.), 1 a csendes 100 értékénél (11.).
- **Pontérték-hatás:** a legnagyobb bemondás (piros 20-100 + ulti + terített durchmars)
  hivatalosan 16 + 8 + 24 = **48**, a v1.2-ben 16 + 8 + 48 = **72**.
- **Súlyos eltérés** (más pontszámot ad, mint a hivatalos): 1, 2, 3–4, 6–8, 11.
  **Elnevezési / házi:** 5, 9, 10.

## 4. Mi változott a v1.3-ban (a szabályok szempontjából)

| # | v1.3 |
|---|---|
| 6–7 | **Rendezve:** csendes és ellen csendes négy ász jelölőnégyzettel (2 / piros 4), csak alapjáték vagy ulti-féle mellett |
| 8 | **Rendezve:** a négy ász (bemondott, csendes, ellen csendes) és a színes durchmars kölcsönösen kizárja egymást |
| 9 | **Maradt házi szabály**, de az alapértelmezés most: négy ász van; az indításnál **tiltható** |
| 10 | **Házi szabály kapcsolóval** az indítási képernyőn, alapból kikapcsolva |
| 1–5, 11 | **Még nyitott** |

v1.3-ban új, a hivatalosban nem szereplő viselkedés: az *ellen csendes négy ász* mellett a
bemondott 40-100 / 20-100 biztosan bukik (a szabályzat nem mondja ki, de logikus).

**Eredmény:** a 11 v1.2-es eltérésből a v1.3 **4-et rendez** (6, 7, 8 teljesen; 10 kapcsolóval
házi szabállyá teszi), **7 nyitott marad** (1–5, 9, 11).

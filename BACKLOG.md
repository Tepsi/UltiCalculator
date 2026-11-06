# Backlog — igazítás a hivatalos MAUSZ játékszabályzathoz

Alap: [SZABALYZAT-OSSZEHASONLITAS.md](SZABALYZAT-OSSZEHASONLITAS.md) (az `E-x` jelölések az ottani
eltérésekre mutatnak). Jelölés: `[ ]` hátra van, `[x]` kész, `[~]` folyamatban,
`[?]` döntésre vár, `[-]` elvetve.

Minden tétel kész-feltétele: kód + új/átírt teszt (`npm test` zöld) + `DOKUMENTACIO.md`
(és ha kell `CLAUDE.md`) frissítve. Verziószám-emelés és push csak külön kérésre.

---

## Döntések (blokkolják a hozzájuk tartozó tételeket)

- [?] **D-1** Kontra-fokozatok (E-1): a Szubkontra…Fedák Sári szintek törlése, vagy házi szabály kapcsolóval?
- [x] **D-2** Háromlapos ulti, "Piros ász oszt, nem oszt" és a négy ász tiltása házi szabály kapcsolóval; alapból van négy ász, a másik kettő ki
- [?] **D-3** Színes „Redurchmars / Terített durchmars" 24 pontos sor lecserélése a szabályzat 12 pontos színes terített durchmarsára (E-2)?
- [x] **D-4** Renonsz: nem kell külön támogatás, a kézi szerkesztés elég (döntés: elvetve)
- [x] **D-5** Bedobás: marad kontrázott sima felvételként (Parti) könyvelve (döntés: nincs változtatás)

---

## 1. Katalógus-értékek és nevek *(alacsony kockázat)*

- [ ] **B-1** Színes terített durchmars → 12 pont (piros 24), `teritett` (E-2) — *függ: D-3*
- [ ] **B-2** Színtelen durchmars: külön „Redurchmars" 12 pont (nem terített) és „Színtelen terített durchmars" 24 pont (E-3)
- [ ] **B-3** Betli: „Rebetli (piros betli)" 10, „Terített betli" 20, `teritett` (E-4)
- [ ] **B-4** `teritett` kiemelés/ikon csak a ténylegesen terített tételekre (B-1…B-3 mellékhatása)
- [ ] **B-5** Meglévő tesztek és `DOKUMENTACIO.md` 3.3 táblázat átírása az új azonosítókra/nevekre; `npm run coverage`

## 2. Kombinálhatósági szabályok

- [x] **B-6** 4 ász ↔ durchmars kölcsönös tiltás, csendes/ellen csendes négy ász jelölők is (E-5) — kölcsönösen (`availableBemondasok` + jelölők elérhetősége)
- [x] **B-7** Csendes négy ász csak Parti / 40-100 / 20-100 / ulti-féle mellett (§4/C (2))
- [x] **B-8** Az „ellen csendes négy ász → durchmars bukik" ág törölve (holt kód: nem kombinálhatók); a 40-100 / 20-100 bukása marad

## 3. Drágítások

- [ ] **B-9** `KONTRA_SZINTEK` = Nincs, Kontra, Rekontra (E-1) — *függ: D-1*
- [ ] **B-10** Teszt: régi, nagyobb szintű értéket tartalmazó mentés betöltése; szubkontra-tesztek átírása
- [ ] **B-11** Parti kontrája csendes 100 mellett, ha a Parti sor el van rejtve (E-9, kisebb eltérés)

## 4. Feladás (bedobás) — elvetve: marad kontrázott Parti

- [-] **B-12** Bedobás a kitöltött, nem csendes sorok kontrázott bukásaként (nem csak Parti); alapeset: kontrázott Parti (E-7) — *elvetve: D-5*
- [-] **B-13** History-bejegyzés és `renderHistory` szövege a tényleges sorokkal; teszt (Ulti, 40-100, piros adu)

## 5. Házi szabályok

- [x] **B-14** „Házi szabályok" kapcsoló az indítási képernyőn (alapból ki), mentve a `SETUP_DEFAULTS_KEY`-be (E-6, E-8) — *függ: D-2*
- [x] **B-15** Háromlapos ulti és "Piros ász oszt, nem oszt" a kapcsoló mögött; régi mentésekben engedélyezettek maradnak; tesztek, doksi

## 6. Renonsz — elvetve: a kézi szerkesztés elég

- [-] **B-16** „Renonsz" művelet a leosztás rögzítésénél: hibázó (felvevő/védő) és a licit (E-10) — *elvetve: D-4*
- [-] **B-17** Védő hibája: fizet a felvevőnek és a vétlen védőtársnak is; előzmény-jelzés, egyenleg-ellenőrzés

---

## Kész

- [x] Csendes négy ász / ellen csendes négy ász értéke 2 pont (feleannyi, mint a négy ász), kontra és bukás nélkül
- [x] Csendes négy ász / ellen csendes négy ász jelölőnégyzetként (nem bemondás-sor), egymást kizárják, mint a csendes 100 párja
- [x] Ellen csendes négy ász mellett a bemondott 40-100 / 20-100 és a színes durchmars / redurchmars biztosan bukik
- [x] Szabályzat és app összehasonlítása (`SZABALYZAT-OSSZEHASONLITAS.md`)

### Már megfelelt a szabályzatnak (nem kell tenni semmit)

- [x] Alapértékek: Parti, 40-100, 20-100, Ulti, Betli, színtelen durchmars (E-11)
- [x] Piros duplázás, ulti bukás-többlet (−4 / csendes −2, drágítástól független)
- [x] Csendes ulti, ellenulti, csendes 100, ellen csendes 100

---

## Javasolt sorrend

1. B-3, B-2, B-1, B-4, B-5 (értékek/nevek — D-3 után a B-1)
2. ~~B-6…B-8~~ (kész)
3. B-9, B-10 (D-1 után)
4. ~~B-12, B-13~~ (elvetve)
5. ~~B-14, B-15~~ (kész)
6. B-11 (opcionális); ~~B-16, B-17~~ (elvetve)

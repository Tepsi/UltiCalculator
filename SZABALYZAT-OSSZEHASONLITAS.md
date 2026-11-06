# A hivatalos MAUSZ játékszabályzat és az Ulti Pontozó összehasonlítása

Forrás: *MAUSZ Játékszabályzat – A MAUSZ ultibajnokság játékszabályai, renonszok*
(érvényes: 2025., `2025.-JATEKSZABALYOK-RENONSZOK.docx`), valamint a szabályzat licittáblája
(a dokumentumba ágyazott kép). Az app oldaláról az `index.html` (`BEMONDASOK` stb.),
a `DOKUMENTACIO.md` és a `CLAUDE.md` az alap.

**Állapot:** az elemzés készen van; a megvalósítás a [BACKLOG.md](BACKLOG.md)-ben követhető. Kész: E-5 (négy ász ↔ durchmars), E-6, E-8 (házi szabály kapcsolók). Elvetve: E-7, E-10. Hátra: E-1…E-4.

A szabályzat a *játékot* szabályozza (osztás, licitálás, lejátszás, renonsz). Az app
*pontozó*: a licitálást és a lejátszást nem követi, csak a végeredményt számolja el. Ezért
a szabályzat nagy része (§1–3, §6 lejátszási részei, §9, §11) az appra nem vonatkozik;
az összehasonlítás a **pontértékekre, a bemondások kombinálhatóságára, a drágításokra, a
csendes teljesítésekre, a feladásra (bedobás) és a renonsz-elszámolásra** koncentrál.

---

## 1. Összefoglaló

| Terület | Állapot |
|---|---|
| Alapértékek (Parti, 40-100, 20-100, Ulti, Betli, színtelen durchmars) | ✅ egyezik |
| Piros duplázás | ✅ egyezik |
| Ulti bukás-többlet (−4 / csendes −2, drágítástól független) | ✅ egyezik (a `2^szint + 1` képlet ekvivalens) |
| Csendes ulti / ellenulti (védő csendes ultija, közös honorárium) | ✅ egyezik |
| Csendes 100 / ellen csendes 100 (érték, kontra mellett hozzáadódik) | ✅ lényegében egyezik (ld. E-9 kisebb eltérés) |
| Csendes 4 ász / védők csendes 4 ásza | ✅ egyezik (jelölőnégyzet; E-5 rendezve) |
| **Terített durchmars (színes) értéke** | ❌ eltér (E-2) |
| **Redurchmars / színtelen terített durchmars** | ❌ eltér (E-3) |
| **Rebetli / terített betli elnevezése** | ❌ eltér (E-4) |
| **Drágítási fokozatok** (szabályzat: csak kontra, rekontra) | ❌ eltér (E-1) |
| 4 ász + durchmars tilos | ✅ rendezve (E-5) |
| Feladás (bedobás) | ➖ marad kontrázott Parti (döntés, E-7) |
| Háromlapos ulti, Piros ász oszt/nem oszt | ✅ házi szabály kapcsolóval (E-6, E-8) |
| Renonsz-elszámolás | ➖ nem kell, a kézi szerkesztés elég (E-10) |

---

## 2. A bemondások pontértékei: szabályzat és app

A szabályzat licittáblája szerinti alapértékek (zöld/tök/makk színben; pirosban ×2).

| Bemondás | Szabályzat | App (`BEMONDASOK`) | Eltérés |
|---|---|---|---|
| Parti | 1 (piros 2) | 1 | – |
| 40-100 | 4 (piros 8) | 4 | – |
| 20-100 | 8 (piros 16) | 8 | – |
| 4 ász | 4 (+1 Parti) = 5, piros 8+2 | 4 + a külön Parti sor (1) | – (egyenértékű) |
| Csendes 4 ász | 2 (piros 4) | 2 | – |
| Ulti | 4 (+1 Parti) = 5, piros 8+2 | 4 + Parti sor | – |
| Csendes ulti | 2 (piros 4) | 2 | – |
| Ellen csendes ulti | 2 (piros 4), közös a partnerrel | 2, ellenjátékosoké | – |
| Betli | 5 | 5 | – |
| **Rebetli** (= „piros betli") | **10** | „Piros betli" 10 | elnevezés (E-4) |
| **Terített betli** | **20** | „Rebetli / Terített betli" 20 | elnevezés (E-4) |
| Durchmars (színes) | 6 (piros 12) | 6 (+piros kapcsoló) | – |
| **Terített durchmars (színes)** | **12 (piros 24)** | „Redurchmars / Terített durchmars (színes)" **24 (piros 48)** | **érték (E-2)** |
| Durchmars (színtelen) | 6 | 6 | – |
| **Redurchmars (színtelen)** | **12** | – (nincs külön) | **hiányzik (E-3)** |
| **Terített durchmars (színtelen)** | **24** | „Redurchmars / Terített durchmars (színtelen)" 24 | elnevezés/szétválás (E-3) |
| Csendes 100 | 2 (piros 4); a játék értéke megduplázódik | 2 (piros 4) | – |

Ellenőrzés a tábla végén: a legnagyobb bemondás *piros 20-100 + ulti + terített durchmars*
= 16 + 8 + 24 = **48**. Az app jelenlegi katalógusával ez 16 + 8 + 48 = 72 lenne.

---

## 3. Részletes eltérések

### E-1. Drágítási (kontra) fokozatok
- **Szabályzat §7:** kontra (×2), rekontra (×4) — „további drágítási fokozatok nincsenek".
- **App:** `KONTRA_SZINTEK` = Nincs, Kontra, Rekontra, Szubkontra, Mordkontra, Hirschkontra,
  Fedák Sári (×64-ig).
- **Hatás:** az app olyan fokozatokat enged, amelyek a szabályzatban nem léteznek.
- Egyezik: a kontra a bemondás egy-egy részére is szólhat (az app soronként kezeli);
  színes bemondásnál a kontra páros (`kontra-joint`), színtelennél egyéni (`kontra-split`).

### E-2. Színes terített durchmars értéke
- **Szabályzat §4/F:** színes terített durchmars **12** (piros 24).
- **App:** `redurchmars_szines` **24** (piros 48), „Redurchmars / Terített durchmars (színes)".
- A szabályzatban színes „redurchmars" fogalom nincs; a színes változatok: durchmars (6),
  terített durchmars (12), és ezek pirosban kétszeres értékkel.

### E-3. Redurchmars és színtelen terített durchmars
- **Szabályzat:** *Redurchmars* = színtelen durchmars magasabb értékkel, **12**;
  *Színtelen terített durchmars* **24**. Két külön bemondás.
- **App:** egyetlen „Redurchmars / Terített durchmars (színtelen)" tétel, 24, `teritett: true`.
- **Hatás:** a 12 pontos redurchmars nem választható; a 24-es tétel neve félrevezető.
- A kiemelés/ikon (`teritett`) csak a terített tételekre járjon (redurchmarsra nem).

### E-4. Betli-fokozatok elnevezése
- **Szabályzat:** Betli 5, **Rebetli 10** (a licittábla: „Rebetli (piros betli)"),
  **Terített betli 20**.
- **App:** Betli 5, „Piros betli" 10, „Rebetli / Terített betli" 20.
- Az értékek egyeznek, de a *Rebetli* a szabályzatban a 10-es fokozat, nem a 20-as; a
  terített betli külön tétel. (A „Piros adu" kapcsoló színtelen sornál eltűnik — ez
  helyes, a betli „piros" változata a rebetli.)

### E-5. A 4 ász kombinálhatósága — ✅ rendezve
- **Szabályzat §5 (1) a):** „A 4ász nem kombinálható semmilyen durchmarssal." A csendes 4 ász
  (§4/C (2)) csak bemondott ultimó, 20-100, 40-100 (és kombinációik) vagy egyszerű játék
  (parti) mellett számolható el.
- **Korábban az app:** nem tiltotta a négy ász és a színes durchmars együttes választását.
  **Rendezve:** kölcsönös tiltás (bemondott, csendes és ellen csendes négy ász is); a csendes
  négy ász csak alapjáték vagy ulti-féle mellett jelölhető. A csendes és ellen csendes négy ász
  jelölőnégyzet (a csendes 100 párjához hasonlóan), az „ellen csendes 4 ász → durchmars bukik"
  ág ezzel megszűnt, a 40-100 / 20-100 bukása marad.
- Védők csendes 4 ásza: csak akkor érvényes, ha **egyetlen** védő viszi el mind a négy ászt.
  Az app nem kérdezi, melyikük — nem is kell, mert a kifizetés mindkét védőre egyforma.

### E-6. Háromlapos ulti — nincs a szabályzatban — ✅ házi szabály kapcsolóval
- **App:** `haromlapos` jelölő, fix +20 (siker) / +10 (bukás) felár.
- **Szabályzat:** nem ismeri. **Rendezve:** az indítási képernyőn kapcsolható házi szabály (alapból ki).

### E-7. Feladás (bedobás) — döntés: marad kontrázott Partiként
- **Szabályzat §6 (9):** a felvevő az első lap kihívása előtt feladhatja a vállalást; ilyenkor
  „az **érvényes licitet** kontrázva kell fizetni" — tehát nem feltétlenül Partit.
- **App:** a „Bedobás" gomb mindig egy kontrázott **Partit** számol (2 × alaptét fejenként).
- **Hatás:** ha a felvevő pl. Ultit vagy 40-100-at vállalt, a bedobás összege ennél több.
  (Az első lap kihívása utáni feladáshoz a védők beleegyezése kell, ez nem pontozási kérdés.)

### E-8. „Piros ász oszt, nem oszt" — nincs a szabályzatban — ✅ házi szabály kapcsolóval
- Házi szabály az osztás rendjére; a szabályzat szerint az osztás joga mindig a következő
  játékosra száll (§2 (3)). **Rendezve:** az indítási képernyőn kapcsolható házi szabály (alapból ki).

### E-9. Csendes 100 és a Parti kontrája (kisebb)
- **Szabályzat §4/A (5):** a csendes 100 megduplázza a játék értékét; kontránál a
  megdrágított értékhez **hozzáadódik** a csendes 100 értéke (2 / piros 4).
- **App:** egyedül álló Partinál ez pontosan így működik. Ha a Parti más sor mellett
  eltűnik (`isPartiSuppressed`), a játékra tett kontra nem adható meg külön (a szabályzat
  szerint „kontra ultimó, kontra játék" mondható). Ritka eset.

### E-10. Renonsz (hibás játék elszámolása) — nincs az appban — döntés: nem kell, a kézi szerkesztés elég
A szabályzat II. része a renonsz következményeit rögzíti. Pontozási szempontból releváns:
- a hibázó **a teljes licitet fizeti**, az addig elhangzott kontrákkal/rekontrákkal együtt,
  a már teljesített részektől függetlenül;
- ha a hibát **védő** követi el: fizet a felvevőnek **és** kártalanítja a vétlen védőtársat is
  (a partner helyett és a partnernek is);
- terített játéknál, ha nem sikerül elfogni: a vállalást tevő nem kap pontot (0-0-0);
- elvesztett vállalás kontrával fizetendő esetek (pl. adu szín bemondásának elmulasztása,
  licitálási hibák egy része).
Az app ma ezeket kézzel (bukott sorok + kontra) tudja közelíteni, de nincs rá külön funkció.

### E-11. Ami egyezik és nem kell módosítani
- Ulti bukás: bemondott −4, csendes −2 (piros ×2), drágítástól független — az app
  `ertek × (2^szint + 1)` képlete ugyanezt adja.
- A 4 ász bukásánál nincs plusz büntetés; a csendes teljesítések nem „bukhatnak".
- A 4 fős asztalnál az osztó kiáll és nem érintett (§9 (11)).
- Az ulti mellé automatikus Parti (§5 (1) b)).
- Színes durchmars mellé csak 40-100 / 20-100, Parti nem; ulti mellé igen; színtelen
  bemondás mellé semmi.
- Egyszerre egy alapjáték (Parti / 40-100 / 20-100), egyszerre egy ulti-féle.

---

## 4. Terv: hogyan lehet az appot a szabályzathoz igazítani

Általános elvek (a `CLAUDE.md` alapján): egyetlen `index.html`, a mentett formátum csak
visszafelé kompatibilisen módosulhat, minden változtatás után `npm test`, új szabályhoz
új teszt, a `DOKUMENTACIO.md` frissítése. A kombinálhatósági szabályok legyenek
kölcsönösek. A verziószámot és a push-t csak külön kérésre.

### 0. lépés — döntések (ld. 5. fejezet)
Eldöntve: E-6/E-8 (házi szabály kapcsoló), E-7 (marad), E-10 (nem kell). Nyitott: E-1 (D-1) és
az E-2 színes terített durchmars cseréje (D-3).

### 1. lépés — Katalógus-értékek és nevek (E-2, E-3, E-4) — kicsi, alacsony kockázat
Fájl: `index.html`, `BEMONDASOK`.
1. `redurchmars_szines` → `terített durchmars (színes)`, `ertek: 12`, `teritett: true`
   (azonosító maradhat, vagy `teritett_durchmars_szines`; a mentett előzményben csak a
   `nev` szöveg szerepel, a régi bejegyzések ezért érintetlenek).
2. `redurchmars_szintelen` két tételre bontva: `redurchmars_szintelen` (`ertek: 12`,
   **nem** `teritett`) és `teritett_durchmars_szintelen` (`ertek: 24`, `teritett: true`).
3. Betli: `piros_betli` → „Rebetli (piros betli)" `ertek: 10`; `rebetli` →
   „Terített betli" `ertek: 20`, `teritett: true`.
4. Az `isColoredDurchmars` az új színes terített azonosítóra mutasson; a
   `availableBemondasok` „adu nélküli → kizár mindent" ága az új színtelen tételekre is
   érvényes (kategória alapján automatikus).
5. Tesztek: értékek (12 / 24 / 12·2 pirosban), a `teritett` kiemelés csak a terítettekre,
   a meglévő tesztekben szereplő azonosítók/nevek átírása (`piros_betli`, `rebetli`,
   `redurchmars_*`); `npm run coverage`.
6. Doksi: a `DOKUMENTACIO.md` 3.3 táblázata és a `CLAUDE.md` katalógus-szakasza.

### 2. lépés — A 4 ász és a durchmars kizárása (E-5) — ✅ kész
Megvalósítva (`availableBemondasok`, `updateCsendes100Availability`): a négy ász (bemondott,
csendes, ellen csendes) és a színes durchmars kölcsönösen kizárja egymást; a csendes négy ász
jelölők csak Parti / 40-100 / 20-100 / ulti-féle mellett jelennek meg. A csendes és ellen
csendes négy ász közben jelölőnégyzetté vált (mint a csendes 100 párja), nem bemondás-sor.
Az „ellen csendes 4 ász → durchmars bukik" ág holt kód lett, töröltük; a 40-100 / 20-100
automatikus bukása megmaradt.

### 3. lépés — Drágítási fokozatok (E-1)
Fájl: `index.html`, `KONTRA_SZINTEK`, `multiplier`, kontra-választók.
1. `KONTRA_SZINTEK` = Nincs kontra, Kontra, Rekontra (a többi szint kikerül).
2. Régi mentésben szereplő nagyobb szintű értékek nem fordulnak elő a *folyamatban lévő*
   űrlapon (a leosztás még nincs rögzítve), a rögzített előzmény a kifizetett összegeket
   őrzi — nincs migrációs teendő; ennek ellenére teszt: régi mentés betöltése.
3. Opcionális finomítás a §7 szerint: színtelen bemondásnál a védők egyéni kontrája
   („Csatlakozom") — ez már megvan (`kontra-split`).
4. Tesztek: a szubkontra stb. tesztek törlése/átírása; kontra/rekontra szorzók (×2, ×4),
   ulti bukás kontrával/rekontrával.

### 4. lépés — Bedobás az érvényes licitre (E-7) — **elvetve** (marad kontrázott Parti, D-5)
Fájl: `index.html`, `btnBedobas` kezelő, `renderHistory`.
1. A gomb ne fix Partit számoljon, hanem a **kitöltött bemondás-sorokat** vegye alapul:
   minden (nem csendes) sor bukott, kontrával (szint 1), az ulti bukás-többlettel;
   a csendes tételek (csendes 100, csendes ulti, csendes 4 ász) ne számítsanak.
2. Ha nincs kiválasztva más, a viselkedés marad a mostani (kontrázott Parti) — így a
   régi használat nem változik.
3. A history-bejegyzés `bedobas: true` jelzőt és a tényleges `lineSummaries`-t kapja;
   a `renderHistory` szövege ne mondja azt, hogy „Partit", ha nem az.
4. Tesztek: bedobás Ultival, 40-100-zal, piros adu mellett; egyenleg-ellenőrzés.

### 5. lépés — Házi szabályok kezelése (E-6, E-8) — ✅ kész
Megvalósítva a (b) úton: az indítási képernyőn „Házi szabályok" blokk — *Négy ász tiltása*
(alapból ki, tehát van négy ász), *Háromlapos ulti* és *Piros ász oszt, nem oszt* (alapból ki).
A beállítások a `SETUP_DEFAULTS_KEY`-be és a parti-est állapotába (`negyaszEnabled`,
`haromlaposEnabled`, `pirosAszEnabled`) mentődnek; a régi, jelzők nélküli mentésekben a
háromlapos és a piros ász továbbra is elérhető.

### 6. lépés — Renonsz-támogatás (E-10) — **elvetve** (a kézi szerkesztés elég, D-4)
- Új „Renonsz" művelet a leosztás rögzítésénél: a hibázó kiválasztása (felvevő vagy
  valamelyik védő) és a fizetendő licit (a kitöltött sorok, kontrákkal).
- Felvevő hibája: minden sor bukott, a kontrák megmaradnak.
- Védő hibája: a hibázó fizeti a felvevőnek a teljes licitet *és* a vétlen védőtársnak is
  (a szabályzat szerinti kártalanítás — összeg pontosítása a bíróval/felhasználóval).
- Előzményben külön jelzés (mint a `bedobas`), egyenleg-ellenőrzés érintetlen.
- Csak akkor érdemes, ha a felhasználó versenyhelyzetben is használná.

### 7. lépés — Dokumentáció és zárás (minden lépésnél folyamatosan)
- `DOKUMENTACIO.md`: szabályok magyarul, felhasználói szemszögből (értéktábla, drágítások,
  bedobás, házi szabályok); `CLAUDE.md`: katalógus- és kombinációs szabályok.
- `npm test` és `npm run coverage` az egyes lépések után; verziószám és push csak külön
  kérésre (jelenleg v1.3).

### Javasolt sorrend és állapot
| Lépés | Tartalom | Kockázat | Állapot |
|---|---|---|---|
| 1 | Értékek / nevek | alacsony | ⏳ hátra (B-1…B-5; B-1 D-3-tól függ) |
| 2 | 4 ász ↔ durchmars | alacsony–közepes | ✅ kész (B-6…B-8) |
| 3 | Kontra-fokozatok | alacsony (teszt-átírás) | ⏳ hátra, D-1-től függ (B-9, B-10) |
| 4 | Bedobás általánosítása | közepes | ❌ elvetve (D-5) |
| 5 | Házi szabályok kapcsolója | közepes | ✅ kész (B-14, B-15) |
| 6 | Renonsz | magasabb | ❌ elvetve (D-4) |

Az 1. és a 3. lépés külön-külön kiadható.

---

## 5. Döntések és nyitott kérdések

Eldöntve:
1. ✅ **Háromlapos ulti, Piros ász oszt, nem oszt, négy ász:** házi szabályok az indítási képernyőn
   (alapból csak a négy ász van; a másik kettő ki). *(D-2, megvalósítva: B-14, B-15)*
2. ✅ **Renonsz:** nincs külön funkció, a kézi szerkesztés elég. *(D-4)*
3. ✅ **Bedobás:** marad kontrázott sima felvételként (Parti) könyvelve. *(D-5)*
4. ✅ **Ellen csendes 4 ász → bukó 40-100:** marad (a szabályzat nem mondja ki, de logikusan
   következik); a durchmarsra a 4 ász–durchmars tiltás miatt nem releváns.

Még nyitott:
1. **Kontra-fokozatok** (D-1): a Szubkontra…Fedák Sári szintek töröljük (hivatalos), vagy
   házi szabályként megmaradjanak kapcsolóval?
2. **Redurchmars (színes)** (D-3): a szabályzat nem ismer ilyet — valóban a *terített
   durchmars (színes)* 12 pontos tételére cseréljük a mostani 24 pontos „Redurchmars /
   Terített durchmars (színes)" sort?

A nyomon követés a [BACKLOG.md](BACKLOG.md)-ben van.

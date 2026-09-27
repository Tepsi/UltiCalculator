# Ulti Pontozó — dokumentáció

Egyszerű, kizárólag a böngészőben futó (nincs szerver, nincs telepítés) alkalmazás egy
Ulti parti-est pontjainak vezetésére. Három fájlból áll: `index.html`, `style.css`,
`app.js`. Nincs külső függősége (nincs internetkapcsolat-igény, nincs build-lépés).

## 1. Futtatás

- **PC-n:** dupla kattintás az `index.html`-re, megnyílik az alapértelmezett böngészőben.
- **Androidon / iPhone-on:**
  - Legegyszerűbb: töltsd fel a három fájlt (azonos mappába) a telefonra (pl. felhő-tárhelyre,
    e-mailben, vagy egy pendrive-ról), és a fájlkezelőből nyisd meg az `index.html`-t —
    ez böngészőben megnyílik.
  - Ha a telefon böngészője nem engedi megnyitni a helyi fájlt közvetlenül (ez főleg iOS
    Safari-n előfordulhat), indíts egy pillanatnyi helyi webszervert a gépeden ugyanazon a
    Wi-Fi-n, és a telefonról a gép IP-címén érd el, pl.:
    ```
    cd C:\tools\UltiCalculator
    python -m http.server 8080
    ```
    majd a telefonon nyisd meg: `http://<a-géped-IP-címe>:8080/`.
- Az alkalmazás teljesen kliensoldali; egyszer betöltve internet nélkül is működik
  (nincs beépített "telepítés a kezdőképernyőre" funkció, csak egy sima weboldal).

## 2. Alapfogalmak az alkalmazásban

- **Parti-est** = egy session, amíg a jegyzőkönyvet vezetitek. Az adatok a böngésző
  `localStorage`-ában mentődnek automatikusan minden lépés után.
- **3 fős mód**: mindenki játszik minden leosztásban, nincs kiálló.
- **4 fős mód**: minden leosztásnál az aktuális osztó kiáll (nem kap lapot, nem
  licitál), a másik három játékos játszik.
- **Leosztás**: egy kör, amelyben egy **felvevő** (bemondó/licitnyertes) áll szemben két
  **ellenjátékossal**. Egy leosztásban mindig van egy **játék** (parti / 40-100 /
  20-100 — kivéve, ha egy "színtelen" bemondás váltja fel, ld. lentebb), és emellé
  tetszés szerint hozzáadható több további **bemondás** (pl. ulti, négy ász, vagy —
  a játék helyett — betli/durchmars). Ezeket az app egymástól teljesen függetlenül,
  külön sorként kezeli: mindegyiknek saját sikerült/bukott eredménye és saját kontrája
  van, tehát elképzelhető, hogy pl. az ulti megvan, de a játékot (a parti/40-100/20-100
  részt) kontrázva bukja a felvevő.
- **Osztás menete**: alapesetben a következő osztó mindig az, aki az előző
  leosztásban felvevő volt. A parti-est végén szokásos **"Piros ász oszt, nem
  oszt"** kapcsolóval ez átállítható egyszerű körbe járó osztásra — ld. 3.3 pont.

## 3. Képernyők és funkciók

### 3.1 Indítási képernyő

- Ha van korábban mentett, be nem zárt parti-est a böngészőben, egy sárga sáv jelzi
  ("Folytatás" / "Elvetés, új indítása" gombokkal).
- Új parti-est indításakor:
  1. Válaszd ki a létszámot (3 vagy 4 fő).
  2. Add meg a játékosok nevét (üresen hagyva "Játékos 1", "Játékos 2"... néven fut).
  3. Válaszd ki, ki osztja az elsőt (ő lesz 4 fős módban az első kiálló is).
  4. **Négyász bemondás engedélyezése**: alapértelmezetten kikapcsolva (a
     katalógusban nem is jelenik meg a "Négy ász" / "Piros négy ász" opció),
     mert sok asztalnál nem játszanak négyásszal. Bekapcsolható, ha az adott
     parti-esten szeretnétek négyászt is bemondani.
  5. "Parti-est indítása" — ettől kezdve minden változás automatikusan mentődik.

### 3.2 Főképernyő — pontállás táblázat

A lap tetején egyetlen táblázat látható, a **"Pontállás körről-körre"**: a
fejlécében a játékosok nevével, majd minden mentett leosztás után egy új
sorral — kör számmal és az akkori (kumulált) állással minden játékosra. Ez a
hagyományos, papíron vezetett ulti-jegyzőkönyv szerinti forma: soronként
visszakövethető, hogy egy adott körben ki hogyan állt; a legutolsó sor mindig
a jelenlegi végállást mutatja. Azt, hogy éppen ki oszt és (4 fős módban) ki áll
ki, a "Leosztás" kártya fejléce ("Osztó és kiálló: ...") mutatja.

### 3.3 Leosztás rögzítése

0. **Osztás iránya**: a "Leosztás" kártyán egy jelölőnégyzet — **"Piros ász
   oszt, nem oszt"** — szabályozza, ki lesz a következő osztó a leosztás
   mentése után:
   - **Kikapcsolva (alapértelmezett)**: a következő osztó az lesz, aki az
     imént mentett leosztásban **felvevő** volt.
   - **Bekapcsolva**: a hagyományos, egyszerű körbe járó osztás lép életbe
     (a következő játékos oszt), ahogy azt a parti-est végén szokás alkalmazni.
   Ez a kapcsoló bármikor átállítható, és azonnal el is mentődik.
1. **Felvevő kiválasztása**: legördülő menü, csak az aktív (nem kiálló) játékosokat
   listázza. A választás után az app automatikusan kiírja, kik az ellenjátékosok.
2. **Játék (kötelező)**: minden leosztásban — kivéve, ha a 3. pontban egy
   **"színtelen"** (nincs adu) bemondás kerül hozzáadásra (betli, rebetli/
   terített betli, vagy a "színtelen" durchmars/redurchmars) — ki kell
   választani a leosztás alap-játékát: **Parti / Piros parti / 40-100 / Piros
   40-100 / 20-100 / Piros 20-100**, majd be kell állítani, hogy ez sikerült-e
   vagy bukott, és milyen szintű kontra vonatkozik rá (mindkét ellenjátékos
   ellen egyszerre, mivel ez mindig színes/adus). Ez a blokk **önállóan**
   számolódik el a lentebbi extra bemondásoktól — ezért lehet, hogy pl. az
   ulti megvan, de a játékot (a parti/40-100/20-100 részt) kontrázva bukja a
   felvevő, vagy fordítva.
   Ha a 3. pontban egy "színtelen" bemondás kerül hozzáadásra, ez a blokk
   automatikusan **eltűnik** (és nem kötelező), mert azok a játékok maguk
   helyettesítik a normál, aduval játszott menetet — nincs melléjük külön
   "játék"-szint.
3. **További bemondás(ok) hozzáadása**: a "+ Bemondás hozzáadása" gombra
   kattintva új sor jelenik meg — ide kerülnek a bemondások:
   - **Ulti, piros ulti** (és — ha bekapcsoltátok — **négy ász, piros négy
     ász**): ezek a 2. pontban beállított játék *mellé* társulnak, nem
     helyettesítik azt.
   - **Betli, piros betli, rebetli / terített betli**: ezek mindig
     "színtelen" (nincs adu) játékok, tehát a 2. pontban leírtak szerint
     helyettesítik a kötelező játék-blokkot, és nem is kombinálhatók semmi
     mással.
   - **Durchmars / redurchmars (más néven terített durchmars)**: mindkettőnek
     van egy **"színtelen"** (nincs adu — helyettesíti a játékot, mint a
     betli, nem kombinálható mással) és egy **"színes"** (van adu — a 2.
     pontbeli játék *mellé* társul, kombinálható pl. ulti-val vagy a 40-100/
     20-100 szinttel is) változata, ezért ezek külön tételként jelennek meg a
     legördülőben. A piros adu miatti erősebb változatok ("Piros durchmars",
     "Piros redurchmars / piros terített durchmars") mindig "színesek".
   Egy leosztáshoz több sor is adható (pl. ha a felvevő egyszerre jelentett
   ulti-t és színes durchmars-ot) — ezeket a valóságnak megfelelően az app
   **külön-külön** számolja el, majd összeadja a hatásukat.
4. Minden bemondás sorban (és a 2. pont játék-blokkjában) beállítható:
   - **Sikerült / Bukott** rádiógomb.
   - **Kontra szintje**:
     - *Színes bemondásoknál* (a kötelező játék-szint, ulti, négy ász, és a
       "színes" durchmars/redurchmars variánsok) egyetlen kontraszint-választó
       jelenik meg, mert a kontrázás közös, mindkét ellenjátékos nevében
       egyszerre érvényes.
     - *Színtelen bemondásoknál* (betli, rebetli/terített betli, és a
       "színtelen" durchmars/redurchmars variánsok) **két külön**
       kontraszint-választó jelenik meg, a két ellenjátékos nevével felirat­ozva
       — mert ezekben a játékokban mindegyik ellenjátékos önállóan dönt a
       kontrázásról, tehát az egyik kontrázhat, míg a másik nem.
   - A sor alján azonnal látható egy mondat, hogy a felvevő mennyit kap/fizet az
     adott sor miatt az egyik és a másik ellenjátékos ellen.
   - A bemondás-sorok "✕" gombbal törölhetők (a kötelező játék-blokk nem
     törölhető, csak automatikusan tűnik el betli/durchmars választásakor).
5. **Élő előnézet**: a bemondás-sorok alatt egy táblázat mindig megmutatja, hogy a
   jelenleg beállított sorok (a játék-blokkal együtt) alapján ki hány pontot
   nyerne/veszítene, ha most mentenéd a leosztást.
6. **"Leosztás mentése"**: elmenti a leosztást, hozzáadja a pontokat az összesített
   állláshoz és a "Pontállás körről-körre" táblázathoz, a 0. pont szerint
   beállítja a következő osztót, a kör száma nő, és az űrlap kiürül a következő
   leosztáshoz.

### 3.4 Előzmények

A "Leosztás mentése" után minden korábbi leosztás megjelenik időrendben visszafelé:
kör száma, ki volt a felvevő, kik voltak az ellenjátékosok, milyen bemondások voltak
(sikerült/bukott + a két ellenjátékos elleni pontérték — a kötelező játék-szint is
egy soron belül), és a leosztás miatti pontelmozdulás mindenkinél.

**"Utolsó leosztás visszavonása"** gomb: ha elgépelés történt, ezzel egyetlen
lépésben visszavonható a legutóbb mentett leosztás (pontok, a "Pontállás
körről-körre" táblázat utolsó sora, és az osztó/kör-számláló is visszalép).

### 3.5 Exportálás és új parti-est

- **"Exportálás"** (fejléc): egy önálló, jól olvasható **`.html`** fájlt generál és
  letölt, amely a "Pontállás körről-körre" táblázatot tartalmazza (fejlécben a
  játékosok nevével, soronként a köri kumulált állással, és egy kiemelt
  végeredmény-sorral) — bármelyik böngészőben megnyitható, jó megosztásra vagy
  archiválásra.
- **"Új parti-est"** (fejléc): megerősítés után törli a mentett állást, és
  visszaugrik az indítási képernyőre.

## 4. Játék-szintek, bemondás-katalógus és pontértékek

Az alapértékek forrása az [ultiblog.hu Licit táblázat](https://ultiblog.hu/ulti-licit-tablazat/)
és [Ulti bemondások, licitek](https://ultiblog.hu/ulti-bemondasok-licitek/) oldala.

### 4.1 Kötelező játék-szint

Minden színjátékos leosztásban pontosan egy játék-szint van jelen (ld. 3.3/2.
pont) — ez a valóságban is mindig ott van a parti mögött, akár bemondanak rá
extra bemondást (ulti, négy ász), akár nem:

| Játék | Alapérték |
|---|---|
| Parti | 1 |
| Piros parti | 2 |
| 40-100 | 4 |
| Piros 40-100 | 8 |
| 20-100 | 8 |
| Piros 20-100 | 16 |

### 4.2 Extra bemondások

Ezek a játék-szint fölé (színes bemondásoknál), vagy helyette (színtelen
bemondásoknál) adhatók hozzá — az alapértékük **nem** tartalmazza a
játék-szint értékét, azt a 4.1 blokk külön, önállóan adja hozzá:

| Bemondás | Alapérték | Kategória |
|---|---|---|
| Négy ász *(kapcsolóval engedélyezhető, ld. 3.1 pont)* | 4 | Színes |
| Piros négy ász *(kapcsolóval engedélyezhető)* | 8 | Színes |
| Ulti | 4 | Színes (speciális bukás-szabály, ld. 5. pont) |
| Piros ulti | 8 | Színes (speciális bukás-szabály) |
| Durchmars (színtelen) | 6 | Színtelen |
| Durchmars (színes) | 6 | Színes |
| Piros durchmars | 12 | Színes |
| Redurchmars / Terített durchmars (színtelen) | 24 | Színtelen |
| Redurchmars / Terített durchmars (színes) | 24 | Színes |
| Piros redurchmars / Piros terített durchmars | 48 | Színes |
| Betli | 5 | Színtelen |
| Piros betli | 10 | Színtelen |
| Rebetli / Terített betli | 20 | Színtelen |

A kategória ("Színes" vagy "Színtelen") határozza meg, hogy a kontra közös
(mindkét ellenjátékos nevében egyben) vagy egyénenkénti — ld. 5. pont. Ha a
leosztásban bármelyik "Színtelen" sor szerepel, a 4.1-es kötelező játék-szint
blokk automatikusan eltűnik (ld. 3.3/2. pont), mivel az adott sor önmagában
helyettesíti a normál, aduval játszott menetet.

A betli és a rebetli/terített betli **mindig** színtelenek (nem kombinálhatók
semmi mással) — a "piros betli" elnevezés itt csak egy erősebb (dupla értékű)
fokozatot jelent, nem aduszínt. A durchmars és a redurchmars/terített durchmars
ezzel szemben **mindkét** formában (színes és színtelen) elérhető a
katalógusban — a "piros" előtag mindig a színes (piros adu) változatot
erősíti tovább.

## 5. Kontra rendszer

| Szint | Szorzó |
|---|---|
| Nincs kontra | 1× |
| Kontra | 2× |
| Rekontra | 4× |
| Szubkontra | 8× |
| Mordkontra | 16× |
| Hirschkontra | 32× |
| Fedák Sári | 64× |

**Színes bemondásoknál** (van adu — ez vonatkozik a kötelező játék-szintre is:
parti/40-100/20-100, az ulti és négy ász extra bemondásokra, valamint a
színes durchmars/piros durchmars/redurchmars/piros redurchmars variánsokra) a
kontra közös döntés: a két ellenjátékos együtt kontráz, tehát egy soron belül
egyetlen szorzó vonatkozik mindkét ellenjátékosra.

**Színtelen bemondásoknál** (betli, piros betli, rebetli/terített betli, és a
színtelen durchmars/redurchmars variánsok) minden ellenjátékos önállóan dönt:
lehet, hogy csak az egyik kontráz, a másik nem — ezért az app itt két külön
szorzót kér.

### Az Ulti bukásának speciális szabálya

Az "Ulti" és a "Piros ulti" bemondásra **bukás esetén**
nem az egyébként szokásos 2ⁿ szorzó él (ahol *n* a kontraszint sorszáma: 0=nincs,
1=kontra, 2=rekontra, 3=szubkontra...), hanem **2ⁿ + 1**:

| Kontraszint | Szokásos szorzó (siker, és minden más bemondás bukása) | Ulti **bukása** esetén |
|---|---|---|
| Nincs kontra | 1× | **2×** |
| Kontra | 2× | **3×** |
| Rekontra | 4× | **5×** |
| Szubkontra | 8× | **9×** |

Ez azt jelenti, hogy a bukott ulti kontra nélkül is duplán fizet, kontrázva pedig
nem a "várt" négyszeresét, hanem háromszorosát — ezt az app automatikusan
kezeli, nincs vele teendő a felhasználó részéről, csak jelöld be a "Bukott"
opciót.

## 6. Adatmentés, adatvesztés

- Minden mentés a böngésző `localStorage`-ába kerül, kulcs:
  `ultiCalculator_session_v1`. Ez azt jelenti:
  - Ugyanazon böngészőben, ugyanazon eszközön bezárás/újranyitás után is megmarad
    az állás (amíg nem törlöd a böngésző adatait, vagy nem kattintasz az
    "Új parti-est" gombra).
  - **Nem szinkronizálódik** más eszközre vagy böngészőre — ha telefonon és
    laptopon is megnyitod, két külön, egymástól független parti-est lesz.
  - Böngésző "inkognitó" módban bezárás után elveszik.
- Fontos leosztásoknál/parti-est végén ajánlott az "Exportálás" gombbal `.html`
  fájlba mentett másolatot is készíteni.

## 7. Ismert korlátozások és feltételezések

- A bemondás-katalógus a fenti forrásoldalak szöveges táblázatait tükrözi. Az
  oldalon van egy **kép formátumú**, részletes "kombinált licit táblázat" is, ami
  a bemondások pontos kombinálhatósági szabályait (mi mivel vonható össze)
  tartalmazza — ez képként nem volt automatikusan feldolgozható, ezért az
  alkalmazás **nem ellenőrzi**, hogy egy adott bemondás-kombináció a szabályok
  szerint egyáltalán licitálható-e egy leosztásban. Ez a játékosok/jegyző
  felelőssége marad, az app csak a pontszámítást végzi el a megadott bemondások
  alapján.
- Csak az "alap kör" bemondásai szerepelnek a katalógusban (a leggyakrabban
  használt bemondások); a nagyon ritka variánsok (pl. két/négy ász ellen,
  teljesen kifordított különleges variánsok) nincsenek benne. A katalógus a
  `app.js` fájl elején lévő `BEMONDASOK` tömbben bővíthető/pontosítható, ha a
  játékostársaság más pontértékekkel vagy bemondásokkal játszik.
- A durchmars/redurchmars és betli/rebetli pontértékei és színes/színtelen
  besorolása a ti asztalotoknál szokásos, konkrét szabályokat követi (nem az
  ultiblog.hu általános táblázatát) — ha egy másik asztalnál ettől eltérő
  értékekkel vagy besorolással játszanak, a `BEMONDASOK` tömb `ertek` és
  `kategoria` mezői az `app.js` elején szabadon átállíthatók.
- Az alkalmazás nem validálja, hogy egy leosztásban legális-e a választott felvevő/
  ellenjátékos-felosztás a tényleges licitmenet szempontjából (ki miért nyerte a
  licitet) — ez emberi döntés, az app csak a végeredményt (ki a felvevő, mi lett a
  bemondás/eredmény) rögzíti és számolja el.
- Az app nem validálja azt sem, hogy egy adott extra bemondás (pl. négy ász)
  kombinálható-e a kiválasztott játék-szinttel (pl. csak parti mellett szokás
  bemondani) — ez is a játékosok/jegyző felelőssége.

## 8. Fájlstruktúra

```
UltiCalculator/
├── index.html      -- a felület HTML szerkezete
├── style.css       -- reszponzív, mobilbarát megjelenés
├── app.js          -- játék-szint és bemondás-katalógus, pontszámítási logika, állapotkezelés
└── DOKUMENTACIO.md -- ez a dokumentum
```

A kötelező játék-szint lista az `app.js` tetején, a `JATEK_SZINTEK` konstansban
van; az extra bemondások (négy ász, ulti, betli, durchmars és variánsaik) a
`BEMONDASOK` konstansban, a kontraszintek a `KONTRA_SZINTEK` konstansban — ide
kell nyúlni, ha egy alapérték módosul, vagy új bemondást szeretnétek felvenni.
A `BEMONDASOK` alapértékei már **nem** tartalmazzák a játék-szint értékét, azt
a `JATEK_SZINTEK` blokk adja hozzá önállóan.

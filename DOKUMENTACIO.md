# Ulti Pontozó — dokumentáció

Egyszerű, kizárólag a böngészőben futó (nincs szerver, nincs telepítés) alkalmazás egy
Ulti parti-est pontjainak vezetésére. Egyetlen önálló `index.html` fájlból áll (a CSS és
a JS is bele van ágyazva, nincs külön `style.css`/`app.js`). Nincs külső függősége
(nincs internetkapcsolat-igény, nincs build-lépés).

## 1. Letöltés és futtatás

### 1.1 Letöltés GitHub-ról

Nincs szükség programozói ismeretre, telepítőre vagy fejlesztői eszközre — a
GitHub-os projekt oldaláról 3 kattintással letölthető:

1. Nyisd meg a projekt GitHub oldalát: https://github.com/Tepsi/UltiCalculator
2. Kattints a zöld **"Code"** gombra a fájllista fölött, majd a megnyíló
   menüben **"Download ZIP"**.
3. Csomagold ki a letöltött `UltiCalculator-master.zip` fájlt egy tetszőleges
   mappába:
   - **Windows:** jobb klikk a ZIP-re → **"Kibontás mind…"** (Extract All).
   - **Mac:** dupla kattintás a ZIP-re, automatikusan kicsomagolja.
4. Nyisd meg a kicsomagolt mappát — ebben lesz az `index.html` fájl, amire az
   1.2 pontban van szükség.

(Ha valaki inkább git-tel dolgozik: `git clone https://github.com/Tepsi/UltiCalculator.git`.
Ha csak az `index.html`-t akarod egyben letölteni ZIP nélkül: nyisd meg a fájlt a GitHub
oldalán, kattints a **"Raw"** gombra, majd `Ctrl+S`/`Cmd+S`-sel mentsd el.)

### 1.2 Futtatás

- **PC-n:** dupla kattintás a kicsomagolt mappában lévő `index.html`-re,
  megnyílik az alapértelmezett böngészőben.
- **Androidon / iPhone-on:**
  - Töltsd fel az `index.html` fájlt a telefonra (pl. felhő-tárhelyre, e-mailben,
    vagy egy pendrive-ról), és a fájlkezelőből nyisd meg — ez böngészőben megnyílik.
    Mivel az app egyetlen önálló fájl (nincs benne külső `style.css`/`app.js`
    hivatkozás), nem kell mellé más fájlt is feltölteni, és elkerülhető az a
    gyakori Android-hiba, hogy a fájlkezelőből "Megnyitás ezzel" úton indított
    HTML mellől a böngésző (pl. Edge, néha Chrome is) nem engedi betölteni a
    mellette lévő különálló fájlokat — ez korábban üres beviteli mezőkként vagy
    egyenesen "file not found" hibaüzenetként jelentkezett.
  - Ha a telefon böngészője így sem engedi megnyitni a helyi fájlt közvetlenül (ez
    főleg iOS Safari-n előfordulhat), indíts egy pillanatnyi helyi webszervert a
    gépeden ugyanazon a Wi-Fi-n, és a telefonról a gép IP-címén érd el, pl.:
    ```
    cd <a kicsomagolt mappa útvonala>
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
- **Alaptét**: a parti-est indításánál megadható szám, ami azt mondja meg, mennyit
  ér egy "pont" (pl. a `BEMONDASOK` katalógusban a Parti alapértéke 1 pont — 2-es
  alaptétnél ez 2, az Ulti 4 pontos alapértéke pedig 8). A leosztásokban minden
  bemondás (alapjáték, ulti, négy ász, betli, durchmars stb.) ehhez arányosan
  skálázva fizet, tehát nem kell egyforintos alapon játszani. A leosztás
  mentése után az alaptét már nem módosítható az adott parti-esten belül.

## 3. Képernyők és funkciók

### 3.1 Indítási képernyő

- Ha van korábban mentett, be nem zárt parti-est a böngészőben, egy sárga sáv jelzi
  ("Folytatás" / "Elvetés, új indítása" gombokkal).
- Új parti-est indításakor:
  1. Válaszd ki a létszámot (3 vagy 4 fő).
  2. Add meg a játékosok nevét (üresen hagyva "Játékos 1", "Játékos 2"... néven fut).
  3. Válaszd ki, ki osztja az elsőt (ő lesz 4 fős módban az első kiálló is).
  4. **Alaptét**: add meg, mennyit ér egy pont (alapértéke 1). Ha nem
     egyforintos alapon játszotok, itt állítsd be a tényleges tétet — minden
     bemondás automatikusan ehhez arányosan skálázva fizet.
  5. **Négyász bemondás engedélyezése**: alapértelmezetten kikapcsolva (a
     katalógusban nem is jelenik meg a "Négy ász" / "Piros négy ász" opció),
     mert sok asztalnál nem játszanak négyásszal. Bekapcsolható, ha az adott
     parti-esten szeretnétek négyászt is bemondani.
  6. "Parti-est indítása" — ettől kezdve minden változás automatikusan mentődik.

### 3.2 Főképernyő — pontállás táblázat

A lap tetején egyetlen táblázat látható, a **"Pontállás körről-körre"**: a
fejlécében a játékosok nevével (mindegyik mellett egy-egy kis ikonnal, ld.
lentebb), majd minden mentett leosztás után egy új sorral — kör számmal és az
akkori (kumulált) állással minden játékosra. Ez a hagyományos, papíron
vezetett ulti-jegyzőkönyv szerinti forma: soronként visszakövethető, hogy egy
adott körben ki hogyan állt; a legutolsó sor mindig a jelenlegi végállást
mutatja. Azt, hogy éppen ki oszt és (4 fős módban) ki áll ki, a "Leosztás"
kártya fejléce ("Osztó és kiálló: ...") mutatja.

**Játékos-ikonok**: a parti-est indításakor minden játékos egy véletlenszerűen
kiosztott, a többiekétől eltérő egyszerű ikont kap egy alapkészletből (●, ▲,
■, ◆, ★, ▼) — ez a parti-est végéig hozzá van kötve. Az ikon a "Pontállás
körről-körre" táblázat fejlécében a neve mellett azonban csak azután jelenik
meg, hogy az adott játékos **legalább egyszer terített bemondást tett** —
addig, ha még senki nem terített, a fejléc csak a neveket mutatja.

Ha egy leosztásban **terített** bemondás (Rebetli/Terített betli, vagy
Redurchmars/Terített durchmars — színes vagy színtelen formában) is szerepelt,
az adott kör sora kiemelt (sárga) háttérrel jelenik meg, és a felvevő
cellájában megjelenik a saját ikonja is (ez az esemény az, ami a fenti
fejléc-ikonját "felfedi") — így egy hosszabb parti-est jegyzőkönyvében is
könnyen visszakereshetők a legnagyobb tételű, terített leosztások, és az is,
ki mondta be. Ez az "Exportálás" gombbal mentett `.html`-ben is megjelenik.

### 3.3 Leosztás rögzítése

0. **Osztó**: a "Leosztás" kártya tetején egy legördülő menü mutatja az
   aktuális osztót — alapesetben automatikusan a szabály szerint van
   kitöltve, de bármikor kézzel felülírható, ha hiba csúszna a felállásba.
   **Fontos**: az osztó kézi módosítása visszaállítja alapállapotba a
   folyamatban lévő leosztás összes beállítását (Felvevő, Piros adu, az
   összes bemondás-sor) — hiszen ezek mind attól függnek, ki az osztó (4 fős
   módban ő áll ki), tehát a kontraszintek/eredmények a régi felálláshoz
   tartoznának, ha megmaradnának. Emellett egy jelölőnégyzet — **"Piros ász
   oszt, nem oszt"** — szabályozza, ki lesz a *következő* osztó a leosztás
   mentése után:
   - **Kikapcsolva (alapértelmezett)**: a következő osztó az lesz, aki az
     imént mentett leosztásban **felvevő** volt.
   - **Bekapcsolva**: a hagyományos, egyszerű körbe járó osztás lép életbe
     (a következő játékos oszt), ahogy azt a parti-est végén szokás alkalmazni.
   Ez a kapcsoló bármikor átállítható, és azonnal el is mentődik.
1. **Felvevő kiválasztása**: legördülő menü, csak az aktív (nem kiálló) játékosokat
   listázza. A választás után az app automatikusan kiírja, kik az ellenjátékosok.
2. **"Piros adu"**: jelölőnégyzet a Felvevő mező alatt — bejelölve duplázza a
   leosztás összes "színes" sorának (alapjáték, ulti, négy ász, színes
   durchmars/redurchmars) értékét egységesen (ld. 4. pont), mert egy
   leosztásban egyetlen valódi adu-szín van, tehát ezek pirossága nem
   választható el egymástól.
3. **Bemondás sorok**: nincs külön "kötelező játék" mező — egyetlen közös
   katalógusból választasz, soronként, a "+ Bemondás hozzáadása" gombbal
   felvehető további sorokban. A leosztás indításakor automatikusan megjelenik
   egy első sor, alapból **Parti**-ra állítva, de bármelyik sorban átválthatsz
   bármelyik bemondásra:
   - **Alapjáték: Parti / 40-100 / 20-100** — ezekből egy leosztásban legfeljebb
     egy lehet jelen.
   - **Ulti**, és — ha bekapcsoltátok — **négy ász**: ezek egy alapjáték
     *mellé* társulnak, nem helyettesítik azt. Ha ilyet választasz anélkül,
     hogy már lenne alapjáték (vagy azt helyettesítő "színtelen" sor) a
     leosztásban, az app **automatikusan hozzáadja a "Parti" alapjátékot** egy
     külön sorként (ezt utána át is állíthatod 40-100-ra/20-100-ra, ha az
     történt valójában). Ugyanez fordítva is igaz: ha eltávolítod az egyetlen
     alapjáték-sort, miközben még van mellette ulti/négy ász sor, az app újra
     pótolja az alapjátékot, hogy sose maradjon "árva" extra bemondás
     alapjáték nélkül. (A színes durchmars/redurchmars-ra ez nem vonatkozik —
     ld. lentebb, az önmagában, alapjáték nélkül is megáll.)
   - **Betli, rebetli / terített betli**: mindig "színtelen" (nincs adu)
     játékok, tehát helyettesítik az alapjátékot, és nem is kombinálhatók
     semmi mással. A betli sorban — egyedüliként a katalógusban — saját,
     önálló **"Piros"** jelölőnégyzet jelenik meg, mert a "piros betli" itt
     nem aduszínt jelent, csak egy erősebb (dupla értékű) fokozatot; ezért ez
     a leosztás tényleges adu-színétől függetlenül be- és kikapcsolható.
   - **Durchmars / redurchmars (más néven terített durchmars)**: mindkettőnek
     van egy **"színtelen"** (nincs adu — helyettesíti az alapjátékot, mint a
     betli, nem kombinálható mással) és egy **"színes"** (van adu, a 2.
     pontbeli "Piros adu" kapcsoló szerint duplázódik) változata, ezért ezek
     külön tételként jelennek meg a legördülőben. A **színes** durchmars/
     redurchmars **önálló játékként is bemondható**, alapjáték nélkül is —
     ilyenkor egyedüli sorként áll a leosztásban. Emellett opcionálisan
     *mellé* is társítható **40-100 vagy 20-100** alapjáték (sima **Parti**
     mellé nem választható) és/vagy az Ulti, ha az adott leosztásban valóban
     ez történt — ez utóbbiak sosem kötelezőek/automatikusak, csak választható
     lehetőségek. Ha a színes
     durchmars/redurchmars mellé **van** bemondva alapjáték vagy Ulti, és az
     bukik, a durchmars/redurchmars sor is **automatikusan Bukottra áll, és a
     jelölőnégyzete letiltásra kerül** (a sor alatt megjelenik az ok is) —
     mivel a durchmars valójában az összes ütés megnyerését jelenti, ez nem a
     jegyző döntése, a szabály szerint szükségszerű, ezért az app nem engedi
     kézzel felülírni. Amint az alapjáték/Ulti újra sikerül (vagy törlődik),
     a zárolás feloldódik, és a sor visszaáll Sikerültre.
   A legördülő mindig csak azokat az opciókat kínálja fel, amelyek a
   leosztásban már megadott többi sor mellett még valóban választhatók (pl. ha
   már van egy Ulti sor, onnantól az Ulti eltűnik a további sorok listájából;
   ha van egy "színtelen" sor, semmi más nem adható hozzá) — a "+ Bemondás
   hozzáadása" gomb is letiltásra kerül, ha már nincs mit hozzáadni. Egy
   leosztáshoz több sor is adható (pl. Parti + Ulti + színes durchmars) —
   ezeket a valóságnak megfelelően az app **külön-külön** számolja el, majd
   összeadja a hatásukat.
4. Minden bemondás sorban beállítható:
   - **Sikerült / Bukott** jelölőnégyzet: alapból nincs bejelölve (Sikerült),
     bejelölve Bukott-ra vált (és pirosra színezi a sort).
   - **Kontra szintje**:
     - *Színes soroknál* (alapjáték, ulti, négy ász, és a "színes"
       durchmars/redurchmars variánsok) egyetlen kontraszint-választó jelenik
       meg, mert a kontrázás közös, mindkét ellenjátékos nevében egyszerre
       érvényes.
     - *Színtelen soroknál* (betli, rebetli/terített betli, és a "színtelen"
       durchmars/redurchmars variánsok) **két külön** kontraszint-választó
       jelenik meg, a két ellenjátékos nevével felirat­ozva — mert ezekben a
       játékokban mindegyik ellenjátékos önállóan dönt a kontrázásról, tehát
       az egyik kontrázhat, míg a másik nem.
   - A sor alján azonnal látható egy mondat, hogy a felvevő mennyit kap/fizet az
     adott sor miatt az egyik és a másik ellenjátékos ellen.
   - A sorok "✕" gombbal törölhetők — ha egy törlés miatt egy extra bemondás
     alapjáték nélkül maradna, az app azonnal pótolja a "Parti" sort (ld. 3. pont).
5. **Élő előnézet**: a sorok alatt egy táblázat mindig megmutatja, hogy a
   jelenleg beállított sorok alapján ki hány pontot nyerne/veszítene, ha most
   mentenéd a leosztást.
6. **"Leosztás mentése"**: elmenti a leosztást, hozzáadja a pontokat az összesített
   állláshoz és a "Pontállás körről-körre" táblázathoz, a 0. pont szerint
   beállítja a következő osztót, a kör száma nő, és az űrlap újra egy alapból
   Parti-ra állított sorral kezdődik a következő leosztáshoz.

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

## 4. Bemondás-katalógus és pontértékek

Az alapértékek forrása az [ultiblog.hu Licit táblázat](https://ultiblog.hu/ulti-licit-tablazat/)
és [Ulti bemondások, licitek](https://ultiblog.hu/ulti-bemondasok-licitek/) oldala.

### 4.1 Alapjáték

Minden színjátékos leosztásban pontosan egy alapjáték van jelen (ld. 3.3/3.
pont) — ez a valóságban is mindig ott van a parti mögött, akár bemondanak rá
extra bemondást (ulti, négy ász), akár nem. A "Piros adu" jelölőnégyzet (ld.
3.3/2. pont) mindig **duplázza** az alapértéket — ezért a dropdown csak az
alap (nem piros) neveket tartalmazza:

| Alapjáték | Alapérték | Piros adu esetén |
|---|---|---|
| Parti | 1 | 2 |
| 40-100 | 4 | 8 |
| 20-100 | 8 | 16 |

### 4.2 Extra bemondások

Ezek egy alapjáték fölé (színes bemondásoknál), vagy helyette (színtelen
bemondásoknál) adhatók hozzá — az alapértékük **nem** tartalmazza az
alapjáték értékét, azt a 4.1 blokk külön, önállóan adja hozzá. A dropdown itt
is csak az alap neveket listázza; a piros duplázást a "Színes" soroknál a
2. pontbeli "Piros adu" kapcsoló, a betlinél saját, önálló "Piros"
jelölőnégyzet adja hozzá (ld. 3.3/3. pont):

| Bemondás | Alapérték | Piros esetén | Kategória |
|---|---|---|---|
| Négy ász *(kapcsolóval engedélyezhető, ld. 3.1 pont)* | 4 | 8 | Színes |
| Ulti | 4 | 8 | Színes (speciális bukás-szabály, ld. 5. pont) |
| Durchmars (színtelen) | 6 | — | Színtelen |
| Durchmars (színes)*(önállóan is bemondható; 40-100/20-100 opcionálisan társítható, Parti nem)* | 6 | 12 | Színes |
| Redurchmars / Terített durchmars (színtelen) | 24 | — | Színtelen |
| Redurchmars / Terített durchmars (színes)*(önállóan is bemondható; 40-100/20-100 opcionálisan társítható, Parti nem)* | 24 | 48 | Színes |
| Betli | 5 | 10 | Színtelen |
| Rebetli / Terített betli | 20 | — | Színtelen |

A kategória ("Színes" vagy "Színtelen") határozza meg, hogy a kontra közös
(mindkét ellenjátékos nevében egyben) vagy egyénenkénti — ld. 5. pont. Ha a
leosztásban bármelyik "Színtelen" sor szerepel, semmi más nem adható hozzá
(ld. 3.3/3. pont), mivel az adott sor önmagában helyettesíti a normál, aduval
játszott menetet — a 4.1-es alapjáték-táblázat elemei ilyenkor nem is
jelennek meg a legördülőben.

A betli és a rebetli/terített betli **mindig** színtelenek (nem kombinálhatók
semmi mással) — a betli piros jelölőnégyzete csak egy erősebb (dupla értékű)
fokozatot jelent, nem aduszínt, ezért az a leosztás tényleges adu-színétől
függetlenül kapcsolható (a rebetlinek nincs piros fokozata). A durchmars és a
redurchmars/terített durchmars ezzel szemben **mindkét** formában (színes és
színtelen) elérhető a katalógusban — a színes formák a 2. pontbeli "Piros adu"
kapcsoló szerint duplázódnak, hiszen egy leosztásban csak egyetlen valódi
adu-szín létezik, tehát a játék és a hozzá adott színes extrák pirossága nem
választható el egymástól.

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
  `index.html` beágyazott `<script>` blokkjának elején lévő `BEMONDASOK` tömbben bővíthető/pontosítható, ha a
  játékostársaság más pontértékekkel vagy bemondásokkal játszik.
- A durchmars/redurchmars és betli/rebetli pontértékei és színes/színtelen
  besorolása a ti asztalotoknál szokásos, konkrét szabályokat követi (nem az
  ultiblog.hu általános táblázatát) — ha egy másik asztalnál ettől eltérő
  értékekkel vagy besorolással játszanak, a `BEMONDASOK` tömb `ertek` és
  `kategoria` mezői az `index.html` beágyazott `<script>` blokkjának elején szabadon átállíthatók.
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
├── index.html               -- a teljes app: HTML szerkezet, beágyazott <style> és <script> egyetlen fájlban
├── DOKUMENTACIO.md          -- ez a dokumentum
├── package.json             -- csak fejlesztői eszköz: a regressziós teszt futtatásához (nem kell az app működéséhez)
└── tests/regression.test.js -- jsdom-alapú regressziós teszt-készlet, futtatás: `npm test`
```

Az `index.html` az app maga — továbbra is szándékosan egyetlen, önálló
fájl, nincs benne külső
`style.css`/`app.js` hivatkozás. Ennek oka egy Androidon (Edge-en, néha
Chrome-on is) tapasztalt hiba: ha valaki a fájlkezelőből "Megnyitás ezzel" /
"Megosztás" úton nyit meg egy HTML fájlt, a böngésző csak az adott fájlra kap
hozzáférést (`content://` URI), a mellette lévő különálló fájlokat (CSS, JS)
nem tudja relatív útvonalon betölteni — ez a felületen üres beviteli
mezőkként (pl. a játékosnevek mezői sosem jelentek meg) vagy egyenesen
"file not found" hibaüzenetként jelentkezett. Egyetlen fájlban ez nem
fordulhat elő. A beágyazott `<style>` blokk tartalma megfelel a korábbi
`style.css`-nek, a beágyazott `<script>` blokk tartalma pedig a korábbi
`app.js`-nek — a kódot közvetlenül az `index.html`-ben kell szerkeszteni.

Az összes alapjáték és bemondás (parti/40-100/20-100, négy ász, ulti, betli,
durchmars és variánsaik) egyetlen közös `BEMONDASOK` konstansban van az
`index.html` beágyazott `<script>` blokkjának elején — az alapjáték-elemeket a `jatekAlap: true` mező jelöli meg
(ezekből egyszerre csak egy lehet a leosztásban); a kontraszintek a
`KONTRA_SZINTEK` konstansban vannak — ide kell nyúlni, ha egy alapérték
módosul, vagy új bemondást szeretnétek felvenni. Az extra bemondások (négy
ász, ulti, színes durchmars/redurchmars) alapértékei **nem** tartalmazzák az
alapjáték értékét, azt egy külön, automatikusan hozzáadott "Parti" sor adja
hozzá (ld. `ensureBaseGameLine` az `index.html` beágyazott scriptjében). A piros duplázás nem önálló
katalógus-elem: a "színes" (`kategoria: 'szin'`) bemondásoknál a leosztás
egészére vonatkozó "Piros adu" kapcsolóból jön, a `pirosVariant: true` jelölésű
bemondásnál (jelenleg csak a betlinél) pedig saját, soronkénti
jelölőnégyzetből.

Ha módosítasz az `index.html`-en, a `tests/regression.test.js` egy jsdom-alapú
regressziós teszt-készlet, amely a fenti szabályok jó részét (pontszámítás,
kontra, alapjáték-pótlás, osztás menete stb.) valódi DOM-interakciókkal
ellenőrzi. Futtatás: `npm install` (egyszer), majd `npm test` — ez nem
igényli az app futtatásához szükséges böngészőt, csak Node.js-t.

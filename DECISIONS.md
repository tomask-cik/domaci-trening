# DECISIONS.md — rozhodnutia a predpoklady

Každý bod: čo bolo nejasné, čo sme zvolili, prečo, a kde sa to dá zmeniť. Dátumy sú absolútne.

## A. Chýbajúce údaje v zadaní (doplnené predpoklady)

| # | Údaj v zadaní | Zvolený predpoklad | Prečo | Kde zmeniť |
|---|---|---|---|---|
| A1 | Vek `[vek]` | **35 rokov** | stredná hodnota pre sedavého pracujúceho muža; vek vstupuje len do Mifflin-St Jeor (±5 kcal/rok) | úvodné nastavenie v appke |
| A2 | Výška `[výška]` | **180 cm** | slovenský priemer dospelého muža ~179–180 cm | úvodné nastavenie |
| A3 | Kettlebelly | **12, 16, 24 kg** (po jednom kuse) | príklad zo zadania; program počíta s veľkými skokmi (R4) | úvodné nastavenie (ľubovoľný zoznam) |
| A4 | Gumy / podložka | **áno, 1 odporová slučka (stredná) + podložka** | guma je najlacnejšia regresia zhybov/dipov (R5); ak nie je, program má náhrady (stolička) | knižnica cvikov ponúka alternatívu bez gumy |
| A5 | Dni a čas | **3 dni/týždeň, 45–50 min** silový tréning; mobilita 10 min denne | pri 3 dňoch je najjednoduchšie splniť frekvenciu 2×/partiu (R3) full-body rozvrhom; 45 min stačí na 5–6 cvikov × 3 série | úvodné nastavenie: 2–4 dni, 30–60 min; program sa prispôsobí (menej cvikov / sérií) |
| A6 | % tuku | **neznáme; odhad 30 %** pri 105 kg / 180 cm (BMI 32,4) | potrebné pre bielkoviny na kg čistej hmoty (R2); ak používateľ zadá % tuku, použije sa | úvodné nastavenie (voliteľné pole) |
| A7 | Stav Achilovej šľachy | **chronická/opakujúca sa tendinopatia bez akútnej fázy**, bez lekárskeho zákazu chôdze a výponov | zadanie hovorí „problém“, nie „zákaz zaťaženia“; RCT podporujú pomalé zaťaženie (R12) | výpony sú voliteľný cvik; pri bolesti >5/10 sa vynechajú |
| A8 | Aktuálna bolesť chrbta/krku | **žiadna akútna** | zadanie hovorí o prevencii a držaní tela, nie o bolesti | ak sa objaví, cviky majú „náhradu pri bolesti“ |
| A9 | Skúsenosť so silovým tréningom | **začiatočník až mierne pokročilý** (vie techniku drepu/mŕtveho ťahu s KB, nespraví zhyb) | „ťažší začiatočník“ na hrazde je v zadaní explicitne | progresie sa autoregulujú podľa zápisu sérií |
| A10 | Cieľové tempo | **0,5–0,7 %/týž**, štartovací deficit 500 kcal | Garthe 2011, Murphy & Koehler 2022 (R1) | konštanty v `src/domain/constants.ts` a nastavenia |
| A11 | Faktor aktivity | **1,4** (sedavý + 3 tréningy + 8 000 krokov) | konzervatívny štart; adaptívny algoritmus ho do 2–3 týždňov opraví (R10) | konštanta; nastavenia |
| A12 | Cieľ bielkovín | **2,0 g/kg cieľovej hmotnosti** (85 kg → 170 g); ak je zadané % tuku: **2,3 g/kg čistej hmoty** | R2 (Morton 2018, Helms 2014/2025, ISSN 2017) | konštanty |
| A13 | Cieľ krokov | **štart 6 000, cieľ 8 000–10 000/deň**, +500/týž | Paluch 2022, Mabire 2017 (R6) | nastavenia |
| A14 | Deload | **každý 7. týždeň** (6 týždňov práce + 1 ľahký), spustiteľný skôr | Coleman 2024 (deload každé 4 týž. je zbytočný), únava v deficite (R11) | konštanta `DELOAD_EVERY_WEEKS` |

## B. Rozhodnutia v programe (odôvodnenie v PROGRAM.md)

| # | Rozhodnutie | Prečo |
|---|---|---|
| B1 | Full-body 3×/týž (A/B/A, B/A/B striedavo), nie split | frekvencia 2×/partiu s 3 dňami (R3); menej „stratených“ dní pri vynechaní tréningu |
| B2 | Rozpätie opakovaní 6–15 s dvojitou progresiou (opakovania → séria → ťažší KB) | veľké skoky KB (R4: Plotkin 2022, Schoenfeld 2017 load) |
| B3 | Cieľ 1–3 RIR (RPE 7–9), nie zlyhanie | Refalo 2023 (R4) |
| B4 | Žiadne skoky, šprinty, plyometria, švihadlo, beh | zadanie (Achilova šľacha); bicykel/chôdza/veslovanie ako kardio (R6, R12) |
| B5 | Švihy s KB len ako voliteľná kondícia, bezbolestne | ballistické, ale bez nárazu; vylúčiť pri bolesti (R12) |
| B6 | Big 3 ako súčasť dennej mobilitnej rutiny, výdrže 8–10 s | R9 |
| B7 | Mobilita: 30–60 s na pozíciu, ~10 min/deň | R8 (Konrad 2024: strop 10 min/sval/týž) |
| B8 | Mikropauzy každých 30–45 min, 1–3 min | R7 (Loh 2020, Saunders 2018) |
| B9 | Kalorický cieľ upravovaný týždenne max ±150 kcal, podlaha BMR×1,1 | R10 |
| B10 | Fázy programu podľa hmotnosti (105→95→85), nie podľa času | progresie na hrazde závisia od hmotnosti; bielkoviny viazané na cieľovú hmotnosť |

## C. Technické rozhodnutia (appka)

| # | Rozhodnutie | Prečo |
|---|---|---|
| C1 | Samostatný repozitár `~/Desktop/Projekty/domaci-trening` (nie v crypto-research) | iný projekt, iný stack; commit po každej fáze podľa zadania |
| C2 | Vite 7 + React 19 + TypeScript strict, Tailwind v4 (`@tailwindcss/vite`), Dexie 4 + `dexie-react-hooks`, Recharts 3, `vite-plugin-pwa` | zadaný stack; Tailwind v4 nepotrebuje config súbor |
| C3 | Všetka logika (progresia, deload, priemer, kalórie, bielkoviny, plán) v `src/domain/` ako čisté funkcie bez React a bez DB | testovateľné Vitestom bez mockov; UI len zobrazuje |
| C4 | Slovenské reťazce priamo v komponentoch, bez i18n knižnice | jediný jazyk; menej závislostí |
| C5 | Dátumy ako ISO reťazce `YYYY-MM-DD` v lokálnom čase; žiadne knižnice na dátumy | jednoduchosť, indexovateľnosť v Dexie |
| C6 | Deploy: GitHub Pages cez GitHub Actions (`base` z env `VITE_BASE`), Vercel alternatíva | zadanie: zadarmo, na mobil |
| C7 | Playwright len Chromium, e2e beží proti `vite preview` (build) | rýchlosť; PWA plugin generuje SW len pri buildе |
| C8 | Časovač pauzy: `navigator.vibrate` + WebAudio pípnutie (bez audio súborov) | offline, bez assetov; iOS Safari vibrácie nepodporuje – pípnutie zostáva |
| C9 | Export/import JSON cez Dexie tabuľky (verzia schémy v súbore) | jednoduchá záloha; import validuje verziu |
| C10 | Ikony PWA generované ako SVG + PNG (192/512) skriptom pri buildе (bez externých obrázkov) | žiadne binárne assety v repozitári okrem generovaných |

## D. Čo sme zámerne nespravili

- Žiadny jedálniček ani zápis jedál po položkách (zadanie: „žiadne striktné jedálničky“). Voliteľný je len jeden denný údaj: priemerný odhad kalórií, ak ho chce používateľ zadať.
- Žiadna synchronizácia do cloudu, žiadne účty. Záloha je export JSON.
- Žiadne notifikácie na pozadí (PWA push vyžaduje server); mikropauzy sú pripomienka v appke + odporúčanie nastaviť si budík.

## E. Self-review: čo sa pri kontrole oproti RESEARCH.md našlo a opravilo

Po dokončení appky som prešiel program aj kód oproti RESEARCH.md. Toto sú nájdené rozpory a ich opravy. Každá je pokrytá testom, aby sa nevrátila.

| # | Čo bolo zle | Proti čomu | Oprava | Test |
|---|---|---|---|---|
| E1 | **Ramená sa trénovali 1× týždenne.** Tlak nad hlavu bol len v tréningu B, takže v týždni A/B/A mali ramená 3 série a frekvenciu 1×. | R3: každá partia aspoň 2× týždenne | Obe šablóny prebudované na rovnaké vzory pohybu (8 cvikov). Každá partia má teraz frekvenciu 3× a 6–18 sérií, rovnako pri A/B/A aj B/A/B. | `tests/program.test.ts`: frekvencia ≥ 2 pre každú partiu pri oboch poradiach týždňa |
| E2 | **Mobilitná rutina trvala 17 minút**, hoci zadanie aj PROGRAM.md hovorili 8–12 min. Pyramída 5-3-1 na tri cviky a dve strany je 45 výdrží. | zadanie; R8 (nad 10 min/partiu/týždeň už bez prínosu) | Pyramída 3-2-1, pauzy 2 s, kratšie strečingové pozície → 11:55 min. Verzia 5-3-1 je spomenutá ako progresia pre pokročilých. | `tests/program.test.ts`: rutina ≤ 12 min |
| E3 | **Týždenné vyhodnotenie by po deloade znížilo kalórie.** V deloade sa je na udržiavacej úrovni, hmotnosť zámerne stojí – algoritmus by to čítal ako „chudne pomaly“ a ubral 150 kcal. | R10 + R11: deload je prestávka v deficite | `computeWeeklyReview` deload týždeň preskakuje. Appka v deloade zobrazuje udržiavací príjem namiesto deficitného cieľa. | `tests/review.test.ts`: deload týždeň bez zmeny, nasledujúci týždeň už normálne |
| E4 | **Cieľ bielkovín klesal s chudnutím.** Čistá hmota sa počítala z aktuálnej hmotnosti a jednorazovo zadaného % tuku, takže pri 95 kg vyšlo o 16 g menej než pri 105 kg. | R2: bielkoviny sa viažu na čistú hmotu, ktorú sa snažíme zachovať | Čistá hmota sa počíta z hmotnosti, pri ktorej sa % tuku meralo (štartovacej). Cieľ zostáva stabilný. | `tests/protein.test.ts`: cieľ neklesá s referenčnou hmotnosťou |
| E5 | **Návod k zhybom obsahoval výskok** („hore stolička/výskok“) – priamy rozpor so zákazom skokov. | zadanie; R12 (Achilova šľacha) | Text zmenený na výstup po stoličke, s vysvetlením prečo. | knižnica cvikov; v celej appke nie je cvik so skokom |
| E6 | **Deload neubral objem finišerom.** Nosenie a stred tela majú 2 série a podlaha deloadu bola 2, takže zostali nezmenené. | R11: deload = nižší objem | Podlaha znížená na 1 sériu, takže „o sériu menej“ platí všade. | `tests/program.test.ts`: deload zníži objem každej partie |
| E7 | **Kalorická podlaha mlčky blokovala adaptáciu.** Pri 105 kg je podlaha 2 200 kcal a cieľ 2 310, takže krok −150 sa orezal bez vysvetlenia. | R1: deficit nad ~500 kcal blokuje rast svalov | Podlaha zostáva (je to správne miesto), ale appka k nej dopĺňa radu pridať kroky namiesto ďalšieho rezania kalórií (R6). | `tests/calories.test.ts`: pri podlahe je v odôvodnení rada s krokmi |
| E8 | **Zaokrúhľovanie kalórií nebolo symetrické.** −55 kcal sa zaokrúhlilo na −50, +55 na +60; navyše plávajúca čiarka dávala 54,999…, takže výsledok závisel od zaokrúhľovacej chyby. | determinizmus výpočtu | `round10` zaokrúhľuje symetricky od nuly a s epsilon. | `tests/calories.test.ts` |
| E9 | **PROGRAM.md tvrdil objem, ktorý šablóny nedávali** („chrbát ~18, zadok ~12, ramená ~9“ – skutočnosť bola 15 / 12 / 3). | konzistentnosť dokumentov s kódom | Objem sa počíta z kódu (`weeklyVolume`), v PROGRAM.md je tabuľka so skutočnými číslami a test ju stráži. | `tests/program.test.ts` |

### Čo som po kontrole nechal tak a prečo

- **Chrbát má 18 sérií týždenne**, viac než pásmo 10–14 z R3. Sú to dva rôzne vzory (zhyby a veslovanie) a v prvých štádiách sú „série“ zhybov 20–40 s visy, ktoré unavia málo. Znižovať to by ubralo z nácviku zhybu, čo je explicitný cieľ.
- **Menšie partie majú 9 sérií**, nie 10–14. V deficite je limitom regenerácia (R1, R11) a R3 zároveň ukazuje, že už oveľa menší objem udrží silu. Radšej menej sérií dobre odcvičených.
- **Appka nesleduje kardio jednotky**, len kroky. Zadanie žiadalo zápis krokov; kardio je v PROGRAM.md ako inštrukcia. Pridanie ďalšieho zápisu by appku zaťažilo bez úžitku.
- **Mikropauzy nemajú notifikácie na pozadí.** PWA bez servera to nedokáže; appka radí nastaviť budík v telefóne.
- **Predný sklon panvy sa nikde „neopravuje“.** Appka o ňom nehovorí ako o chybe – R7 hovorí, že to nie je príčina bolesti a 85 % mužov bez ťažkostí ho má. Mobilita je zdôvodnená rozsahom pohybu a pohodlím, nie naprávaním.

## F. Kolo 2 (2026-09-15): dotiahnutie appky – rozhodnutia

| # | Rozhodnutie | Prečo |
|---|---|---|
| F1 | **Záloha cez Web Share API** (súbor do share sheetu → iCloud Drive), inak stiahnutie; **API kľúč sa do zálohy nedáva** | záloha ide do cloudu alebo mailu; kľúč sa po obnove zadá znova. Pripomienka na Dnes bez zálohy od 3. dňa, inak po 14 dňoch |
| F2 | `saveDay` v rw transakcii | dva rýchle zápisy (hmotnosť, hneď kroky) prečítali rovnaký starý riadok a druhý prepísal prvý – strata hmotnosti; e2e test to odhalil |
| F3 | **Rozcvičovacie série** ako `SetLog.warmup`, mimo progresie, rekordov, objemu a počtu sérií | PROGRAM.md 1.3 bod 6; jedna vlajka, žiadna druhá tabuľka |
| F4 | **Výmena cviku** ako `Workout.swaps` (poradie v šablóne → id), nie zmena šablóny | história vie, čo sa cvičilo; ďalší tréning je podľa plánu; bez zmeny schémy Dexie |
| F5 | **Apple Health**: appka spustí Skratku cez `shortcuts://run-shortcut` s JSON `{id, start, end, return}`; návrat cez `?hk=workout…` **alebo schránka** | adresa zo Skratiek môže otvoriť Safari, nie appku na ploche (oddelené IndexedDB); schránka funguje vždy. **Neoverené na skutočnom iPhone.** |
| F6 | **Skutočný objem** z `SetLog × Exercise.groups` podľa dátumu série; plán z reálneho poradia šablón v týždni | A/B/A a B/A/B majú iný objem zadku (výpady); plán sa nemá tváriť, že je paušálny |
| F7 | **Dodržiavanie** = ukončené tréningy / `daysPerWeek` z aktuálnych nastavení pre všetky týždne | história zmien nastavení sa neukladá; percento len z uzavretých týždňov |
| F8 | **Ručná úprava stavu cviku** oreže na rozsah a vynuluje streaky | človek vie viac než algoritmus; ale nesmie vytvoriť stav mimo rozsahu, s ktorým progresia nepočíta |
| F9 | **% tuku** s referenčnou hmotnosťou z času merania (`bodyFatRefKg`) | E4: čistá hmota sa viaže na hmotnosť pri meraní, nie na štart ani na dnešok |
| F10 | **Wake lock** počas tréningu a mobility; **−/+ steppery** namiesto klávesnice; mazanie série s prečíslovaním | telefón na zemi, spotené ruky; po zmazaní série 2 z 3 by ďalší zápis prepísal tretiu |
| F11 | Ukončený tréning otvorený znova je len na čítanie | progresia sa vyhodnocuje raz; ďalšie série by do nej nevstúpili |

### Čo som v kole 2 nechal tak a prečo (čaká na rozhodnutie)

- **Vzorec pre beh** (`running.ts`): „hrubý výdaj 1,036 kcal/kg/km nezávislý od tempa mínus pokojový metabolizmus“ podhodnocuje čistý výdaj o ~7–10 % pri pomalšom tempe. Nezávislý od tempa je podľa ACSM **čistý** výdaj (~1,0 kcal/kg/km), nie hrubý. Ručný zápis navyše nemá typ „chôdza“ (chôdza má ~polovičný výdaj). Číslo nevstupuje do kalorického cieľa (ten je adaptívny z trendu), takže chyba je len v zobrazení a v AI kontexte. Zmena čaká na súhlas.
- **Znaky skoršieho deloadu** (PROGRAM.md 5): appka vyhodnocuje len spánok (opravené okno 7 nocí); pokles opakovaní, bolesť kĺbov a vysoké RPE sa z dát dajú spočítať, ale prahy (koľko cvikov, koľko tréningov) sú nové doménové rozhodnutie. Čaká na súhlas.
- **Týždeň po deloade** vo vyhodnotení kalórií: po udržiavacom týždni hmotnosť spadne (voda, glykogén), algoritmus to číta ako rýchle chudnutie a pridá kalórie. Možnosť: týždeň po deloade tiež preskočiť, alebo porovnávať s týždňom pred deloadom. Čaká na súhlas.
- **Guma** (`hasBand`) sa nikde nepoužíva – štádiá zhybov 4 a 5 ju predpokladajú. Bez gumy má štádium 3 alternatívu „noha na stoličke“; appka to nerozlišuje.
- **`PAIN_SKIP_ABOVE` (5/10)** je konštanta bez použitia: pri bolesti > 5 program hovorí „vynechať cvik“, appka len ustúpi o krok (> 3).
- **Program s hrazdou a bradlami (5.5)**: obsahové poznámky sú v správe z kola 2, nie v kóde.

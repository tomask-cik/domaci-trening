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

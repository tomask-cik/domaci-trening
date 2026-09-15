# PROGRAM.md — domáci program rekompozície 105 → 85 kg

> Každé rozhodnutie odkazuje na sekciu [RESEARCH.md](RESEARCH.md) (R1–R12). Predpoklady o chýbajúcich údajoch sú v [DECISIONS.md](DECISIONS.md) (A1–A14). Appka implementuje presne tieto pravidlá (`src/domain/`), preto sú napísané ako algoritmus.

## 0. Prehľad týždňa (3 tréningové dni, 45–50 min)

| Deň | Ráno (2 min) | Cez deň | Poobede/večer |
|---|---|---|---|
| Po | váženie, zápis | mikropauzy každých 30–45 min, kroky | **Silový tréning A** (45–50 min) + mobilita ~12 min |
| Ut | váženie | mikropauzy, kroky | kardio 20–35 min (bicykel/kopec/veslovanie) + mobilita ~12 min |
| St | váženie | mikropauzy, kroky | **Silový tréning B** + mobilita |
| Št | váženie | mikropauzy, kroky | mobilita ~12 min (voliteľne prechádzka navyše) |
| Pi | váženie | mikropauzy, kroky | **Silový tréning A** + mobilita |
| So | váženie | kroky (dlhšia prechádzka) | kardio 20–35 min + mobilita |
| Ne | váženie, **týždenné vyhodnotenie** (appka) | kroky | mobilita ~12 min, voľno |

Nasledujúci týždeň sa poradie otočí (B/A/B), aby každá partia mala v priemere 2 jednotky týždenne (R3). Dni sa dajú presunúť; dôležité je 3× silový tréning s aspoň 1 dňom pauzy medzi nimi, 2× kardio, mobilita denne, kroky denne.

**Prečo full-body 3×:** frekvencia ≥2×/partiu (R3, Schoenfeld 2016) sa s 3 dňami dosiahne len celotelovým rozvrhom; pri vynechaní jedného dňa sa nestratí celá partia (DECISIONS B1).

**Kľúčové čísla:** deficit ~500 kcal/deň (R1), bielkoviny ~170 g/deň (R2), 10–14 pracovných sérií/partiu/týždeň (R3), 1–3 opakovania v rezerve (R4), kroky 8 000–10 000 (R6), spánok 7–9 h (R11), deload každý 7. týždeň (R11).

---

## 1. Silový tréning

### 1.1 Štruktúra jednotky (45–50 min)

1. **Rozcvička 5 min** (R8, Fradkin 2010; Behm 2016 – statický strečing ≤30 s): 10× cat-camel, 8× výpad vzad s rotáciou trupu, 10× drep bez záťaže, 10× kĺbové krúženie ramien, 10× „pull-apart“ s gumou, 1 ľahká séria prvého cviku.
2. **Hlavná časť 35–40 min:** 6 cvikov v **dvojiciach (supersety antagonistov)** – cvik 1, pauza 60 s, cvik 2, pauza 60–90 s, opakovať 3×. Pauza medzi sériami toho istého cviku tak vychádza na 2–3 min (R4, Grgic 2018; Singer 2024 – nad 60 s).
3. **Stred tela 3 min**, **výpony 3 min** (R12).
4. Mobilitná rutina (časť 2, ~12 min) sa dá spraviť hneď po tréningu alebo večer.

### 1.2 Tréning A a B

Obe jednotky sú celotelové a pokrývajú **rovnaké vzory pohybu** (drep, hinge, vertikálny ťah, horizontálny ťah, tlak, tlak nad hlavu, lýtka, stred). Líšia sa variantom cviku. Dôvod je v R3: každá partia má mať frekvenciu aspoň 2× týždenne — a to musí platiť aj v týždni, ktorý vyjde B/A/B. Prvá verzia tohto programu mala tlak nad hlavu len v tréningu B, takže ramená vychádzali 1× týždenne; to je opravené (pozri DECISIONS E).

**Tréning A** (drep, klik, veslovanie)

| Dvojica | Cvik | Séria × opakovania | Štart (KB 12/16/24) | Pauza |
|---|---|---|---|---|
| 1a | Goblet drep | 3 × 6–15 | 16 kg | 60 s |
| 1b | Progresia zhybu (štádium podľa stavu) | 3 × podľa štádia | – | 90 s |
| 2a | Rumunský mŕtvy ťah s KB | 3 × 8–15 | 24 kg | 60 s |
| 2b | Progresia kliku | 3 × 6–15 | – | 90 s |
| 3a | Jednoručné veslovanie s KB | 3 × 8–15 / strana | 16 kg | 60 s |
| 3b | Jednoručný tlak nad hlavu | 3 × 6–12 / strana | 12 kg | 90 s |
| 4a | Pomalé výpony (3 s hore / 3 s dole) | 3 × 8–15 | 16 kg | 60 s |
| 4b | Nosenie kufríka (suitcase carry) | 2 × 30–45 s / strana | 24 kg | 60 s |

**Tréning B** (mŕtvy ťah, dipy, výpady)

| Dvojica | Cvik | Séria × opakovania | Štart | Pauza |
|---|---|---|---|---|
| 1a | Mŕtvy ťah s KB (sumo) → neskôr jednonožný RDL | 3 × 8–15 | 24 kg | 60 s |
| 1b | Progresia zhybu (podhmat / neutrálny úchop) | 3 × podľa štádia | – | 90 s |
| 2a | Spätný výpad s KB (goblet) | 3 × 6–12 / strana | 12 kg | 60 s |
| 2b | Progresia dipov (štádium) | 3 × podľa štádia | – | 90 s |
| 3a | Jednoručné veslovanie s KB | 3 × 8–15 / strana | 16 kg | 60 s |
| 3b | Jednoručný tlak nad hlavu | 3 × 6–12 / strana | 12 kg | 90 s |
| 4a | Pomalé výpony | 3 × 8–15 | 16 kg | 60 s |
| 4b | Hollow hold / dead bug | 2 × 20–40 s | – | 60 s |

**Týždenný objem priamych pracovných sérií** (3 tréningy, 45 min; rovnaký pri A/B/A aj B/A/B — test v `tests/program.test.ts` to stráži):

| Partia | Sérií/týždeň | Frekvencia |
|---|---|---|
| Chrbát (zhyby + veslovanie) | 18 | 3× |
| Zadok a hamstringy | 12–15 | 3× |
| Kvadricepsy | 9 | 3× |
| Hrudník a triceps | 9 | 3× |
| Ramená | 9 | 3× |
| Lýtka (protokol pre Achilovu šľachu) | 9 | 3× |
| Stred tela | 6 | 3× |

K tomu ide nepriamy objem (kliky a dipy zaťažujú aj ramená, zhyby a veslovanie aj biceps, výpady aj zadok), takže efektívne čísla sú vyššie. Pásmo 10–14 z R3 je splnené pre veľké partie; menšie partie sú na 9, čo je v deficite zámerné — regenerácia, nie objem, je limit (R1, R11). Nič nejde nad 18 sérií.

**Prispôsobenie času (appka to robí automaticky):** 30 min → zostanú len dvojice 1 a 2 (4 cviky, 12 sérií); 60 min → 4 série v dvojiciach 1 a 2. **2 dni/týždeň** → A a B striedavo; každá partia stále 2× týždenne, len s menším objemom (minimálna účinná dávka podľa Androulakis-Korakakis 2020, R3). **4 dni** → A B A B.

### 1.3 Pravidlá progresie (algoritmus)

Každá séria sa zapíše ako (váha, opakovania, RPE 6–10). RIR = 10 − RPE. Cieľ **RPE 7–9** (1–3 RIR), nie zlyhanie (R4, Refalo 2023).

**Cviky s kettlebellom** (rozpätie opakovaní `lo–hi`, aktuálna váha `w`, cieľové opakovania `t`):

1. **Pridaj opakovanie:** ak v poslednom tréningu **všetky** série dosiahli ≥ `t` opakovaní a priemerné RPE ≤ 8,5 → `t = t + 1` (max `hi`).
2. **Pridaj váhu:** ak všetky série dosiahli `hi` s RPE ≤ 8,5 → ďalší ťažší kettlebell, `t = lo`. Ak ťažší nie je → **progresný variant** (unilaterálne, tempo 3-1-1, pauza 2 s v najťažšom bode) so `t = lo` (R4: Plotkin 2022 – opakovania sú plnohodnotná progresia; Liao 2022/Zhang 2025 – unilaterálne varianty).
3. **Drž:** ak niektorá séria nedosiahla `t`, alebo RPE ≥ 9,5 → rovnaké `w` a `t`.
4. **Ustúp:** ak 2 tréningy za sebou nedosiahnuté `lo` v niektorej sérii, alebo nahlásená bolesť > 3/10 → ľahší kettlebell (`t = hi − 3`) alebo regresný variant.
5. **Deload týždeň:** 2 série namiesto 3, rovnaké `w`, `t − 2`, pravidlá 1–4 sa nevyhodnocujú (R11).
6. **Rozcvičovacie série** (označené v appke) sa evidujú, ale do pravidiel 1–4, rekordov ani objemu nevstupujú – 12 kg × 15 z rozcvičky by inak zmenilo cieľ.
7. **Výmena cviku v tréningu** (bolesť, obsadená hrazda): náhrada preberá miesto, série a pauzu, vyhodnocuje sa podľa vlastného stavu; šablóna sa nemení a ďalší tréning ide opäť podľa plánu. **Ručná úprava plánu** v knižnici (štádium, váha, cieľ) vynuluje počítadlá a je novým bodom štartu.

**Cviky s vlastnou váhou (štádiá)** – zhyby, dipy, kliky:

- Každé štádium má rozpätie `lo–hi` (opakovania alebo sekundy). Pravidlo 1 a 3 rovnaké ako vyššie (pridaj 1 opakovanie / 5 s).
- **Postup do ďalšieho štádia:** všetky série na `hi` s RPE ≤ 8,5 v **dvoch** tréningoch za sebou (istota techniky).
- **Ústup:** dva tréningy za sebou pod `lo` → predchádzajúce štádium na jeho `hi − 2`.
- Poznámka k hmotnosti: pri zhyboch appka zobrazuje „prekonanú hmotnosť“ = telesná hmotnosť − odhadovaná asistencia; schudnutie samo o sebe je progres (R5).

**Štádiá zhybu (R5: Roig 2009, Oranchuk 2019, RCT lezci 2024):**

| Št. | Cvik | Rozpätie | Poznámka |
|---|---|---|---|
| 0 | Pasívny + aktívny vis (lopatky dole) | 3 × 20–40 s | ramená „preč od uší“ |
| 1 | Negatívy (stolička hore, 5 s dole) | 3 × 3–6 | plný rozsah, bez pádu do visu |
| 2 | Izometria hore (brada nad tyčou) + v strede | 3 × 5–15 s | dve pozície, striedať |
| 3 | Zhyby s gumou (silná) alebo noha na stoličke | 3 × 4–8 | čo najmenej pomoci |
| 4 | Zhyby s gumou (slabá) | 3 × 4–8 | |
| 5 | Zhyby | 3 × 1–8 | potom záťaž (KB 12 kg na opasku/medzi nohami) 3 × 3–8 |

Variant B (v tréningu B): rovnaké štádium, ale **podhmat (chin-up)** alebo neutrálny úchop; v štádiu 2 dlhšie výdrže (10–20 s).

**Štádiá dipov (R5 – konzervatívne kvôli ramenám, dôkazy slabé):**

| Št. | Cvik | Rozpätie | Poznámka |
|---|---|---|---|
| 0 | Kliky (patrí do progresie kliku) | 3 × 8–15 | pokiaľ nie sú kliky na zemi 3 × 10, dipy nezačínať |
| 1 | Podpor na bradlách (lakte vystreté, lopatky dole) | 3 × 20–40 s | |
| 2 | Negatívy v obmedzenom rozsahu (4 s dole, nadlaktie po rovnobežku) | 3 × 3–6 | hore pomôcť nohami |
| 3 | Asistované dipy (guma pod kolená / špičky na stoličke za telom) | 3 × 4–10 | |
| 4 | Dipy v obmedzenom rozsahu | 3 × 3–10 | trup mierne vpred, lakte pri tele |
| 5 | Dipy so záťažou | 3 × 3–8 | KB medzi nohami |

**Štádiá kliku:** 0 vyvýšené kliky (ruky na stole) 3 × 8–15 → 1 kliky na nižšej opore (stolička) 3 × 8–15 → 2 kliky na zemi 3 × 6–15 → 3 kliky s nohami na stoličke 3 × 6–15 → 4 kliky s KB na chrbte / tempo 3-1-1 3 × 6–12.

### 1.4 Knižnica cvikov (technika, chyby, regresia, progresia, náhrada pri bolesti)

Rovnaké texty sú v appke (`src/domain/exercises.ts`). Všetky cviky sú bez skokov (R12).

**Goblet drep** (kvadricepsy, zadok, stred tela) — KB držať pri hrudi za „rohy“, chodidlá na šírku bokov, špičky mierne von, sadať medzi kolená, päty na zemi, hĺbka kam dovolí neutrálny chrbát, hore vydýchnuť. *Chyby:* kolená dnu, päty hore, guľatý chrbát dole. *Regresia:* drep na stoličku (box squat) / bez záťaže. *Progresia:* ťažší KB → tempo 3 s dole + 1 s pauza → bulharský drep s KB. *Náhrada pri bolesti kolena:* vyšší box, výstupy na nízky schod; pri bolesti chrbta: menšia hĺbka.

**Rumunský mŕtvy ťah s KB** (hamstringy, zadok, extenzory chrbta) — KB obojručne pred stehnami, mierne pokrčené kolená, boky dozadu, chrbát rovný, KB kĺže po nohách po polovicu holene, hore stisnúť zadok. *Chyby:* ohýbanie kolien namiesto bokov, guľatenie, záklon hore. *Regresia:* hip hinge s tyčou pozdĺž chrbta / KB z vyvýšenia. *Progresia:* ťažší KB → jednonožný RDL (16 → 24 kg) → tempo. *Náhrada pri bolesti chrbta:* mostík s KB.

**Mŕtvy ťah s KB (sumo)** — KB medzi chodidlami, širší postoj, boky dole, chrbát rovný, tlačiť nohy do zeme, KB tesne pri tele. *Chyby:* štart guľatým chrbtom, „trh“. *Regresia:* z vyvýšenia (KB na knihe). *Progresia:* → jednonožný RDL → švihy (len bezbolestne, päty na zemi). *Náhrada:* mostík.

**Jednonožný RDL** (unilaterálny hinge) — KB v ruke na strane stojnej nohy alebo opačnej (ľahšie), voľná noha ide vzad, panva rovno, dotyk špičkou zeme povolený. *Regresia:* „kickstand“ (špička zadnej nohy na zemi). *Progresia:* ťažší KB, bez opory.

**Jednoručné veslovanie s KB** (široký sval chrbta, zadné ramená) — opora rukou o stoličku, chrbát rovný, ťahať lakeť k boku, lopatka dozadu, 1 s pauza hore, pomaly dole. *Chyby:* rotácia trupu, krčenie ramena k uchu. *Regresia:* ľahší KB. *Progresia:* ťažší → pauza 2 s → tempo. *Náhrada pri bolesti lakťa/ramena:* veslovanie s gumou neutrálnym úchopom.

**Jednoručný tlak nad hlavu** (ramená, triceps, stred tela) — KB v „rack“ polohe, zápästie rovné, stisnúť zadok a brucho, tlačiť hore mierne dopredu od tváre, hore biceps pri uchu, kontrolovane dole. *Chyby:* záklon v drieku, zápästie ohnuté. *Regresia:* v polokľaku (half-kneeling) / ľahší KB. *Progresia:* ťažší → tempo → „push press“ nie (Achilova šľacha – bez odrazu). *Náhrada pri bolesti ramena:* tlak z podlahy (floor press) alebo vyvýšené kliky.

**Tlak z podlahy s KB** (hrudník, triceps) — ľah, KB v jednej ruke nad ramenom, lakeť ~45° od tela, dole po dotyk tricepsu so zemou. *Náhrada dipov pri bolesti ramena.*

**Spätný výpad s KB (goblet)** — krok vzad, koleno zadnej nohy k zemi, trup vzpriamený, odraz z päty prednej nohy (nie zo špičky – šetrí Achilovu šľachu). *Chyby:* koleno dnu, krátky krok, odraz zo špičky. *Regresia:* split squat s oporou / bez záťaže. *Progresia:* ťažší KB → výstup na stoličku → bulharský drep. *Náhrada pri bolesti kolena:* výstupy na nízky schod; pri bolesti Achilovej šľachy: výstupy (bez odrazu).

**Výstup na stoličku (step-up)** — celé chodidlo na stoličke, hore bez odrazu zo zadnej nohy, dole pomaly. *Progresia:* vyššia opora, KB.

**Mostík / hip thrust s KB** (zadok) — KB na bokoch, päty blízko zadku, hore stisnúť zadok, brada k hrudi, bez prehnutia drieku. *Regresia:* bez záťaže. *Progresia:* jednonožný mostík, lopatky na gauči (hip thrust).

**Pomalé výpony** (lýtka, Achilova šľacha – R12: Beyer 2015 HSR) — na schode alebo na zemi, 3 s hore, 1 s výdrž, 3 s dole, plný rozsah bez bolesti > 3/10. *Regresia:* obojnožne bez záťaže, menší rozsah, izometrická výdrž 30–45 s. *Progresia:* KB v ruke → jednonožne → ťažší KB. *Náhrada pri bolesti > 5/10:* vynechať, izometria na rovnej zemi, konzultovať fyzioterapeuta.

**Nosenie kufríka (suitcase carry)** (bočný stred tela, úchop) — KB v jednej ruke, kráčať vzpriamene, ramená rovno, 30–45 s, vymeniť. *Progresia:* ťažší KB, dlhší čas. *Náhrada:* bočný most.

**Hollow hold / dead bug** — driek pritlačený k zemi, ruky a nohy vystreté len tak ďaleko, kým driek drží. *Regresia:* dead bug (striedavo ruka–noha). *Progresia:* dlhší čas, vystreté končatiny.

**Progresia zhybu, dipov a kliku** — pozri tabuľky 1.3. Technika zhybu: aktívny vis, lopatky dole a dozadu, ťahať lakte k rebrám, brada nad tyč bez kývania, dole kontrolovane do plného visu. Technika dipu: lopatky dole, lakte dozadu (nie do strán), trup mierne vpred, dole len po rovnobežku nadlaktia (R5), hore bez zamykania lakťov nárazom. Technika kliku: telo v jednej línii, ruky pod ramenami, lakte ~45°, hrudník k zemi.

---

## 2. Denná mobilitná rutina (~12 min, zamerané na sedenie)

Dôvod a dávka: R8 (Konrad 2024 – strop 10 min/sval/týždeň, nad 4 min na jednu jednotku už bez prínosu; Thomas 2018 – ≥5 min/sval/týždeň rozložených do ≥5 dní) a R9 (Big 3 – výdrž trupu pri nízkej kompresii chrbtice). Nie je to „oprava“ držania tela (R7), je to rozsah pohybu pre cviky a pohodlie po sedení.

| # | Cvik | Dávka | Čas | Cieľ |
|---|---|---|---|---|
| 1 | Cat-camel (mačka–ťava) | 10 pomalých opakovaní | 35 s | mobilita chrbtice, rozcvičenie |
| 2 | Strečing flexorov bedier v polokľaku (zadok stiahnutý, panva „podsadená“) | 45 s / strana | 90 s | predná strana bokov |
| 3 | 90/90 prehadzovanie bokov | plynulo | 40 s | vnútorná a vonkajšia rotácia bedra |
| 4 | Strečing zadku „štvorka“ (figure-4) v ľahu | 45 s / strana | 90 s | zadok, hlboké rotátory |
| 5 | Extenzia hrudnej chrbtice cez operadlo + „open book“ rotácie na boku | 8 × extenzia, 8 × rotácia / strana | 70 s | hrudná chrbtica |
| 6 | Wall slides / pull-apart s gumou | 10 opakovaní | 30 s | ramená, lopatky, horný chrbát |
| 7 | **McGill curl-up** (jedna noha pokrčená, ruky pod driekom, dvíhať len hlavu a ramená 2–3 cm) | pyramída 3-2-1 × 10 s | 72 s | predná stena trupu |
| 8 | **Bočný most** (na kolenách → na chodidlách) | 3-2-1 × 10 s / strana | 144 s | bočná stena trupu |
| 9 | **Bird dog** (ruka + opačná noha, „zametanie“ späť) | 3-2-1 × 10 s / strana | 144 s | extenzory chrbta, kontrola panvy |

**Spolu 715 s ≈ 12 min** vrátane 2 s pauz medzi výdržami (appka to počíta presne, test to stráži). Strečingové pozície dávajú ~5 min na partiu za týždeň pri dennom cvičení – presne pásmo z R8; viac by už nič nepridalo.

Pyramída 3-2-1 je štartovacia verzia. Kto zvládne všetky výdrže bez triašky, môže prejsť na McGillovu 5-3-1; rutina sa tým predĺži na ~17 min (appka to zatiaľ nemení automaticky). Pri bolesti pri cviku: vynechať a zaznamenať.

---

## 3. Mikropauzy počas sedenia

Dôkazy: R7 (Loh 2020, Saunders 2018 – krátke aktívne prerušenia zlepšujú glykémiu/inzulín rovnako ako súvislé cvičenie; Chen 2018 – posilňovanie krku/ramien pri bolesti krku). Cieľom je meniť polohu, nie „sedieť správne“ (Swain 2020).

- **Každých 30–45 min: 1–3 min** – vstať, 40 krokov, **10 vstávaní zo stoličky** alebo 10 hip hinge, 5 extenzií hrudníka cez operadlo, 20 s strečing hrudníka v dverách.
- **Každé 2 h: 5 min chôdze** (aj po byte, schody bez behu).
- **Pri bolesti krku:** 2×/deň 10 × zasúvanie brady (chin tuck) + 10 × pull-apart s gumou (Chen 2018).
- Stôl na státie: voliteľný; striedať sed/stoj po 30–60 min (R7, Shrestha 2018 – znižuje sedenie, zdravotný efekt nepreukázaný).
- Appka má prepínač „pripomienky mikropauz“ (len keď je otvorená – PWA nemá pozadie, DECISIONS D) a odporúča nastaviť budík v mobile.

---

## 4. Kondícia bez skokov a kroky

Dôkazy: R6 (Keating 2017, Wewege 2017 – HIIT = ustálené; Donnelly 2009 – 250–300 min/týž; Paluch 2022 – kroky; Schumann 2022 – bicykel < interferencia než beh), R12 (žiadne nárazy).

- **Kroky:** štart = aktuálny priemer (predpoklad 6 000), **+500/týždeň až po 8 000–10 000/deň**. Rozdeliť do 3–4 prechádzok (Achilova šľacha znáša lepšie kratšie úseky).
- **Ustálené kardio 2×/týždeň, 20–35 min** v intenzite „dá sa rozprávať“: stacionárny bicykel/bicykel, chôdza do kopca alebo na trenažéri so sklonom, veslovanie, plávanie. Postupne 25 → 35 min.
- **Voliteľné intervaly bez nárazu (max 1×/týž):** bicykel 8 × 1 min rýchlo / 1 min pomaly, alebo KB komplex 10 min (goblet drep – veslovanie – tlak – švihy len bezbolestne) 30 s práca / 30 s pauza. Nezaraďovať pred silový tréning.
- Zakázané: beh, skoky, švihadlo, burpees, šprinty, plyometria.
- Celkovo ~150 min/týž kardio + chôdza + silový tréning ⇒ nad 250 min/týž pohybu (ACSM).

---

## 5. Deload

Dôkazy: R11 (Coleman 2024 – deload každé 4 týždne nezlepšuje hypertrofiu; Bosquet 2013 – krátke prestávky spôsobujú len malé straty; v deficite sa únava hromadí).

- **Plánovaný: každý 7. týždeň** (6 týždňov práce + 1 ľahký). Appka ho zobrazuje v kalendári (DECISIONS A14).
- **Skorší deload**, ak platia 2 z 4: (a) pokles opakovaní v 2 tréningoch za sebou pri rovnakej váhe, (b) bolesť kĺbov/šliach > 3/10, (c) spánok < 6 h viac než 3 noci, (d) RPE 9–10 pri bežných sériách. Tlačidlo „Spustiť deload teraz“.
- **Obsah:** o sériu menej v každom cviku (3 → 2, finišery 2 → 1), rovnaké váhy, cieľ −2 opakovania, RPE ≤ 7; kardio 1×; mobilita bez zmeny; **príjem na udržiavacej úrovni** (R10 bod 6) – ľahký týždeň je zároveň prestávka v deficite.
- **Dôsledok pre kalórie:** v deloade sa je na udržiavacej úrovni, takže hmotnosť zámerne nejde dole. Týždenné vyhodnotenie preto deload týždeň **preskakuje** – inak by appka znížila kalórie za správne dodržaný plán. Appka v deloade zobrazuje udržiavací príjem namiesto deficitného cieľa.
- Po deloade sa progresie vyhodnocujú od prvého normálneho tréningu.

---

## 6. Fázy programu podľa hmotnosti

Fázy sa prepínajú podľa **7-dňového priemeru hmotnosti**, nie podľa dátumu (DECISIONS B10). Bielkoviny sú viazané na cieľovú/čistú hmotu a nemenia sa (R2); kalórie sa prepočítavajú týždenne (R10).

| Fáza | Hmotnosť | Trvanie (odhad pri 0,5–0,7 %/týž) | Silový tréning | Kardio a kroky | Výživa |
|---|---|---|---|---|---|
| **1 Základy** | 105 → 97 kg | ~12–14 týž | technika, 3 série, štádiá 0–2 zhybov/dipov, dvojitá progresia | 2 × 20–25 min, kroky 6 000 → 8 000 | deficit 500, bielkoviny 170 g |
| **2 Sila** | 97 → 90 kg | ~11–13 týž | 3–4 série na dvojice 1–2, ťažšie KB, unilaterálne varianty, štádiá 3–4 (guma) | 2 × 25–30 min, kroky 8 000–10 000 | deficit 500 (cieľ sa adaptuje nadol so zníženým výdajom), 1 udržiavací týždeň po 8 týž. |
| **3 Dokončenie** | 90 → 85 kg | ~9–11 týž | cieľ prvý zhyb bez gumy a dipy v obmedzenom rozsahu; objem stály; ak sila klesá, znížiť deficit na 300–400 | 2 × 30–35 min, kroky 10 000 | deficit 300–500, potom **2–4 týždne udržiavanie** na 85 kg pred ďalším rozhodnutím |

**Prispôsobenie pri poklese hmotnosti:** (1) kalorický cieľ klesá automaticky (R10); (2) zhyby/dipy sú relatívne ľahšie – appka zobrazuje prekonanú hmotnosť a odporučí ďalšie štádium skôr; (3) kettlebellové cviky: rovnaké pravidlá, relatívna záťaž rastie; (4) ak sa sila v kľúčových cvikoch zníži > 10 % za 4 týždne, cieľ +150 kcal a kontrola spánku (R11).

---

## 7. Výživa – jednoduché pravidlá (bez jedálnička)

- **Kalorický cieľ:** štart = Mifflin-St Jeor × 1,4 − 500. Pri 35 r., 180 cm, 105 kg: BMR 2 005, výdaj 2 807, **cieľ 2 310 kcal/deň**. Potom **týždenná adaptácia** podľa trendu (R10): pomalšie než 0,5 %/týž → dole, rýchlejšie než 0,7 %/týž → hore, krok max ±150 kcal. **Podlaha = max(1 500; BMR × 1,1)**, na začiatku 2 210 kcal. Podlaha nie je formalita: zodpovedá deficitu ~550 kcal a je presne tam, kde R1 (Murphy & Koehler 2022) končí s rastom svalov. Keď na ňu cieľ narazí, appka **neznižuje kalórie ďalej** a povie pridať kroky (R6). Číslo je orientačné; **trend hmotnosti je pravda**.
- **Bielkoviny: ~170 g/deň** (2,0 g/kg cieľovej hmotnosti; R2), 3–4 jedlá po 35–50 g. Zdroje: mäso, ryby, vajcia, tvaroh, skyr, grécky jogurt, strukoviny, srvátkový proteín podľa potreby.
- **Pravidlá:** (1) bielkovina v každom jedle ako prvá; (2) zelenina/ovocie 400 g+/deň, vláknina 25–35 g; (3) tekutiny prevažne bez kalórií; alkohol max 2 nápoje/týždeň; (4) 80/20 – 80 % jedál z celých potravín, zvyšok voľne; (5) nejesť „za odmenu“ po tréningu navyše; (6) víkendy sú súčasť týždňa – priemer sa počíta za 7 dní.
- **Váženie:** denne ráno, appka počíta 7-dňový priemer; denné výkyvy ±1 kg sú voda (R10, Zheng 2015 – denné váženie je bezpečné).
- **Udržiavacie týždne:** pri deloade a po ~8 týždňoch deficitu 1–2 týždne na odhadovanom výdaji (R10 bod 6, R11).
- **Spánok 7–9 h** – ak < 6 h ≥ 3 noci, appka odporučí zvýšiť príjem o 150 kcal a znížiť objem, nie záťaž (R11, Nedeltcheva 2010).

---

## 8. Kontrolný zoznam „čo sledovať“

| Ukazovateľ | Frekvencia | Dobre | Zle → akcia |
|---|---|---|---|
| 7-dňový priemer hmotnosti | týždenne | −0,5 až −0,75 kg/týž (fáza 1) | mimo pásma → úprava kalórií ±150 (R10) |
| Sila v kľúčových cvikoch (goblet drep, RDL, tlak, zhyby) | každý tréning | opakovania/váha rastú alebo stagnujú | pokles 2× za sebou → deload / +150 kcal (R11) |
| Kroky | denne | ≥ cieľ týždňa | < 80 % cieľa 2 týždne → rozdeliť prechádzky |
| Spánok | denne (voliteľné) | 7–9 h | < 6 h 3 noci → menší objem, +150 kcal |
| Bolesť (Achilova šľacha, ramená, kolená) | každý tréning | ≤ 3/10 a do rána preč | 4–5/10 → regresia; > 5/10 → vynechať cvik (R12) |
| Bielkoviny | denne | 150–190 g | < 130 g 3 dni → pridať proteínové jedlo |

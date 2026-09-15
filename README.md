# Domáci tréning

Evidence-based domáci tréningový systém a PWA appka. Celé po slovensky, funguje offline, dá sa pridať na plochu mobilu.

- **[RESEARCH.md](RESEARCH.md)** — čo hovorí výskum (metaanalýzy, RCT, position stands) na 12 otázok + tabuľka FUNGUJE / NEFUNGUJE / NEJASNÉ.
- **[PROGRAM.md](PROGRAM.md)** — konkrétny program (tréning, mobilita, kondícia, deload, výživa). Každé rozhodnutie odkazuje na sekciu RESEARCH.md.
- **[DECISIONS.md](DECISIONS.md)** — predpoklady doplnené za chýbajúce údaje a technické rozhodnutia.

Program je postavený pre profil: muž, sedavá práca, 105 kg → 85 kg, rekompozícia, doma kettlebelly + hrazda + bradlá, **bez skokov a plyometrie** (Achilova šľacha).

> Toto nie je lekárske odporúčanie. Pri bolesti, ktorá neustúpi do rána alebo rastie, patrí slovo fyzioterapeutovi alebo lekárovi.

## Čo appka vie

| Funkcia | Kde |
|---|---|
| Úvodné nastavenie (vek, výška, hmotnosť, cieľ, kettlebelly, dni, minúty) | prvé spustenie |
| Dnešný tréning s odporúčanou váhou a opakovaniami | **Dnes** |
| Zápis sérií (váha, opakovania, RPE, bolesť, poznámka, rozcvičovacia), −/+ jednou rukou, mazanie série, časovač pauzy, obrazovka nezhasne | **Dnes → tréning** |
| Výmena cviku počas tréningu (náhrada pri bolesti z knižnice) | **Dnes → tréning → vymeniť** |
| Automatický návrh progresie na ďalší tréning; ručná úprava plánu cviku (štádium, váha, cieľ) | po ukončení tréningu; **Cviky** |
| Tep a aktívna energia z hodiniek k tréningu (Skratka, schránka) | po ukončení tréningu, **História** |
| Denná hmotnosť, 7-dňový kĺzavý priemer, graf trendu | **Dnes**, **Telo** |
| Adaptívny kalorický cieľ (prepočet raz týždenne z trendu) a cieľ bielkovín | **Dnes**, **Viac** |
| Kroky a týždenný prehľad | **Dnes**, **Telo** |
| Grafy: hmotnosť, sila v čase pre každý cvik s dátami (odhad 1RM / opakovania / sekundy), zápis pre iný deň | **Telo** |
| Skutočný týždenný objem na partiu oproti plánu, dodržiavanie plánu po týždňoch | **História** |
| Mobilitná rutina so sprievodcom a časovačom (~12 min) | **Mobilita** |
| Knižnica cvikov: technika, chyby, regresia, progresia, náhrada pri bolesti | **Cviky** |
| Deload v kalendári + tlačidlo „spustiť skôr“ | **Viac** |
| Záloha na jedno klepnutie (share sheet → iCloud Drive), import, pripomienka | **Viac**, **Dnes** |
| Denník jedla s odhadom kalórií cez Claude API, AI sumár dňa a týždňa | **Dnes → Jedlo**, **História** |

Dáta sú **len v telefóne** (IndexedDB). Nikam sa neposielajú, nie je tu účet ani cloud. Záloha = JSON súbor (bez API kľúča). Jediné, čo ide na internet, sú volania Claude API pri odhade kalórií a sumároch – a tie sa dajú nepoužívať.

## Spustenie lokálne

Treba Node 20+ (vyvíjané na Node 26).

```bash
npm install
npm run dev
```

Otvor adresu, ktorú vypíše Vite (zvyčajne `http://localhost:5173`).

### Kontroly

```bash
npm run check
```

Spustí ESLint, TypeScript, unit testy (Vitest) a produkčný build. E2E testy zvlášť:

```bash
npx playwright install chromium
npm run e2e
```

| Príkaz | Čo robí |
|---|---|
| `npm run dev` | vývojový server |
| `npm run build` | ikony + typecheck + produkčný build do `dist/` |
| `npm run preview` | náhľad produkčného buildu na porte 4173 (vrátane service workera) |
| `npm test` | unit testy (progresia, deload, kĺzavý priemer, kalórie, bielkoviny, plán, záloha) |
| `npm run e2e` | Playwright: hlavný tok, mobilita, export/import, offline |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript strict |

## Nasadenie zadarmo

Appka je statická, takže stačí hocijaký statický hosting. Routovanie je cez `#` (HashRouter), takže netreba nič nastavovať na serveri.

### Možnosť A: GitHub Pages (v repozitári je hotový workflow)

1. Vytvor repozitár na GitHube a nahraj projekt:
   ```bash
   git remote add origin https://github.com/POUZIVATEL/domaci-trening.git
   git push -u origin main
   ```
2. V repozitári: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Každý push do `main` spustí [.github/workflows/deploy.yml](.github/workflows/deploy.yml): lint, typecheck, testy, build a deploy.
4. Appka pobeží na `https://POUZIVATEL.github.io/domaci-trening/`.

Workflow nastaví `VITE_BASE` podľa názvu repozitára automaticky. Ak by si build robil ručne:

```bash
VITE_BASE="/domaci-trening/" npm run build
```

### Možnosť B: Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importuj repozitár.
2. Framework **Vite**, build command `npm run build`, output directory `dist`. Žiadne premenné netreba (`base` ostáva `/`).
3. **Deploy**. Dostaneš adresu typu `https://domaci-trening.vercel.app`.

Alternatívne z príkazového riadka:

```bash
npx vercel --prod
```

### Pridanie na plochu mobilu

- **Android (Chrome):** otvor adresu → menu (⋮) → *Pridať na plochu plochy / Install app*.
- **iPhone (Safari):** otvor adresu → *Zdieľať* → *Pridať na plochu*.

Po pridaní funguje appka offline (service worker), spúšťa sa na celú obrazovku a dáta zostávajú v telefóne. Vibrácie časovača fungujú na Androide; iOS vibrácie z webu nepodporuje, tam ostáva zvuk.

## Apple Health cez Skratky (iPhone)

Safari nemá prístup k HealthKitu, takže dáta z hodiniek musí do appky dotlačiť aplikácia **Skratky**. Appka rozumie trom adresám:

| Čo | Adresa (za základnou adresou appky) |
|---|---|
| kroky za deň | `?hk=steps&date=2026-09-15&steps=8432` (`date` sa dá vynechať = dnes) |
| beh, chôdza, joga | `?hk=activity&type=run&date=2026-09-15&meters=5120&seconds=1840&kcal=430&hr=148` (`type`: run, walk, yoga, strength, other) |
| tep a energia k tréningu z appky | `?hk=workout&id=17&kcal=380&hr=132` |

Všetky čísla sa kontrolujú (tep 30–230, kroky do 200 000…); nezmysel sa nezapíše.

### Skratka „Tréning do appky“ (tep a energia po tréningu)

Po ukončení tréningu appka ponúkne tlačidlo **Doplniť tep a energiu z hodiniek**. To spustí Skratku cez `shortcuts://run-shortcut?name=…&input=text&text=…` a dá jej text v tvare

```json
{"id": 17, "start": "2026-09-15T16:00:00.000Z", "end": "2026-09-15T16:45:00.000Z", "return": "https://tomask-cik.github.io/domaci-trening/?hk=workout&id=17"}
```

Skratka (názov si nastav vo **Viac → Apple Health**, musí sedieť presne):

1. **Prijať vstup** – typ Text (Skratka bez vstupu sa spustí s prázdnym textom).
2. **Získať slovník zo vstupu** (Get Dictionary from Input).
3. **Získať hodnotu zo slovníka** pre kľúče `start`, `end`, `return` (a `id` pre kontrolu).
4. **Nájsť vzorky zdravia** (Find Health Samples): typ *Aktívna energia*, filter *Dátum začiatku je po* `start` a *Dátum konca je pred* `end` → **Vypočítať štatistiku** Súčet → premenná `kcal` (zaokrúhli na celé číslo).
5. **Nájsť vzorky zdravia**: typ *Tep*, rovnaký filter → **Vypočítať štatistiku** Priemer → premenná `hr` (zaokrúhli).
6. **Text**: `return` + `&kcal=` + `kcal` + `&hr=` + `hr` (napr. `https://…/domaci-trening/?hk=workout&id=17&kcal=380&hr=132`).
7. **Otvoriť adresu** s týmto textom. **Odporúčanie:** pridaj ešte **Kopírovať do schránky** s tým istým textom.

**Prečo aj schránka.** Adresa otvorená zo Skratiek sa na iPhone môže otvoriť v Safari, nie v appke pridanej na plochu – a tie dve majú **oddelené úložisko** (IndexedDB). Ak sa to stane, v appke na ploche stlač pri tréningu **Vložiť zo schránky**: appka si text prečíta a zapíše to isté. Bod 7 preto rob oboma spôsobmi. Pri prvom čítaní schránky sa iOS spýta na povolenie.

Skratky na kroky a beh sa robia rovnako, len bez vstupu: prečítaj vzorky za dnešok (kroky: súčet) a otvor adresu `…/?hk=steps&steps=…`. Automatizácia „každý deň o 22:00“ ich vie spúšťať sama.

> Toto je overené len logicky a v testoch (`tests/healthImport.test.ts`, `tests/healthShortcut.test.ts`), nie na skutočnom iPhone. Ak sa niečo v Skratkách volá inak, riadi sa tým, čo appka očakáva v adrese.

## Ako to funguje vo vnútri

```
src/
  domain/        čistá logika bez Reactu a bez databázy — tu je celý program
    constants.ts   všetky čísla programu (deficit, RPE, deload, kroky, bielkoviny)
    progression.ts pravidlá progresie (dvojitá progresia, štádiá, regresia pri bolesti)
    calories.ts    Mifflin-St Jeor, týždenná adaptácia cieľa, podlaha
    weight.ts      7-dňový kĺzavý priemer, tempo, fázy programu
    deload.ts      kalendár deloadov, skorší deload
    exercises.ts   knižnica cvikov (technika, chyby, regresia, progresia, náhrada)
    program.ts     šablóny A/B, prispôsobenie času, rozcvička
    mobility.ts    denná rutina rozbalená na kroky časovača
    review.ts      týždenné vyhodnotenie
  db/            Dexie (IndexedDB) + export/import zálohy
  pages/         obrazovky (Dnes, Tréning, Mobilita, Telo, Cviky, Viac)
tests/           Vitest — 91 testov nad logikou v domain/ a nad zálohou
e2e/             Playwright — hlavný tok, mobilita, export/import, offline
```

Logika je zámerne oddelená od UI: pravidlá z PROGRAM.md sú čisté funkcie, ktoré sa dajú testovať bez prehliadača. Keď zmeníš číslo v `constants.ts`, zmení sa program aj appka naraz.

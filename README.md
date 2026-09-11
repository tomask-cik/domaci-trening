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
| Zápis sérií (váha, opakovania, RPE, bolesť) a časovač pauzy s vibráciou a zvukom | **Dnes → tréning** |
| Automatický návrh progresie na ďalší tréning | po ukončení tréningu |
| Denná hmotnosť, 7-dňový kĺzavý priemer, graf trendu | **Dnes**, **Telo** |
| Adaptívny kalorický cieľ (prepočet raz týždenne z trendu) a cieľ bielkovín | **Dnes**, **Viac** |
| Kroky a týždenný prehľad | **Dnes**, **Telo** |
| Grafy: hmotnosť, odhad 1RM v kľúčových cvikoch, zhyby | **Telo** |
| Mobilitná rutina so sprievodcom a časovačom (~12 min) | **Mobilita** |
| Knižnica cvikov: technika, chyby, regresia, progresia, náhrada pri bolesti | **Cviky** |
| Deload v kalendári + tlačidlo „spustiť skôr“ | **Viac** |
| Export a import dát (JSON) | **Viac** |

Dáta sú **len v telefóne** (IndexedDB). Nikam sa neposielajú, nie je tu účet ani cloud. Záloha = export JSON.

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

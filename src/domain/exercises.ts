import type { ExerciseKind } from './types'

export interface Stage {
  name: string
  unit: 'reps' | 'sec'
  lo: number
  hi: number
  note: string
}

/** Partie pre kontrolu týždenného objemu (RESEARCH R3). `direct` = pracovná séria pre danú partiu. */
export type MuscleGroup = 'chrbat' | 'hrudnik_triceps' | 'ramena' | 'kvadricepsy' | 'zadok_hamstringy' | 'lytka' | 'stred'

export interface Exercise {
  id: string
  name: string
  muscles: string
  /** Partie, pre ktoré je cvik priamou pracovnou sériou. */
  groups?: MuscleGroup[]
  kind: ExerciseKind
  category: 'sila' | 'stred' | 'mobilita'
  perSide: boolean
  /** load: rozpätie opakovaní */
  range?: [number, number]
  /** load/timed: odporúčaná štartovacia váha (vyberie sa najťažší dostupný KB ≤ tejto hodnoty) */
  startWeightKg?: number
  /** timed: rozpätie sekúnd */
  timedRange?: [number, number]
  /** load: varianty ako „páky“ progresie, keď nie je ťažší KB (index 0 = základ) */
  variants?: string[]
  stages?: Stage[]
  key: boolean
  technique: string
  mistakes: string
  regression: string
  progression: string
  painSub: string
}

const KB = 'kettlebell'

export const EXERCISES: Exercise[] = [
  {
    id: 'goblet_squat',
    name: 'Goblet drep',
    muscles: 'kvadricepsy, zadok, stred tela',
    groups: ['kvadricepsy'],
    kind: 'load',
    category: 'sila',
    perSide: false,
    range: [6, 15],
    startWeightKg: 16,
    variants: ['Základ', 'Tempo 3 s dole + 1 s pauza', 'Bulharský drep s KB (na stranu)'],
    key: true,
    technique: `${KB} drž pri hrudi za „rohy“, chodidlá na šírku bokov, špičky mierne von. Sadaj medzi kolená, päty na zemi, hĺbka kam dovolí neutrálny chrbát. Hore vydýchni a stisni zadok.`,
    mistakes: 'Kolená idú dnu; päty sa dvíhajú; chrbát sa dole guľatí; príliš plytko.',
    regression: 'Drep na stoličku (box squat) alebo drep bez záťaže.',
    progression: 'Ťažší KB → tempo 3 s dole + 1 s pauza → bulharský drep s KB.',
    painSub: 'Bolesť kolena: vyšší box, výstupy na nízky schod. Bolesť chrbta: menšia hĺbka.',
  },
  {
    id: 'kb_rdl',
    name: 'Rumunský mŕtvy ťah s KB',
    muscles: 'hamstringy, zadok, extenzory chrbta',
    groups: ['zadok_hamstringy'],
    kind: 'load',
    category: 'sila',
    perSide: false,
    range: [8, 15],
    startWeightKg: 24,
    variants: ['Základ (obojručne)', 'Jednonožný RDL (na stranu)', 'Jednonožný RDL, tempo 3 s dole'],
    key: true,
    technique: `${KB} obojručne pred stehnami, kolená mierne pokrčené. Boky idú dozadu, chrbát rovný, KB kĺže po nohách po polovicu holene. Hore stisni zadok, nezakláňaj sa.`,
    mistakes: 'Ohýbanie kolien namiesto bokov; guľatenie chrbta; záklon v hornej polohe.',
    regression: 'Hip hinge s tyčou pozdĺž chrbta; KB z vyvýšenia.',
    progression: 'Ťažší KB → jednonožný RDL (16 → 24 kg) → tempo.',
    painSub: 'Bolesť chrbta: mostík s KB.',
  },
  {
    id: 'kb_deadlift',
    name: 'Mŕtvy ťah s KB (sumo)',
    muscles: 'zadok, hamstringy, stred tela',
    groups: ['zadok_hamstringy'],
    kind: 'load',
    category: 'sila',
    perSide: false,
    range: [8, 15],
    startWeightKg: 24,
    variants: ['Základ (sumo)', 'Jednonožný RDL (na stranu)', 'Jednonožný RDL, tempo 3 s dole'],
    key: true,
    technique: `${KB} medzi chodidlami, širší postoj, boky dole, chrbát rovný, pohľad vpred. Tlač nohy do zeme, KB tesne pri tele, hore stisni zadok. Dole kontrolovane.`,
    mistakes: 'Štart s guľatým chrbtom; trhnutie; KB ďaleko od tela.',
    regression: 'KB z vyvýšenia (na knihe).',
    progression: 'Ťažší KB → jednonožný RDL → švihy (len bez bolesti, päty na zemi).',
    painSub: 'Bolesť chrbta: mostík s KB. Bolesť Achilovej šľachy pri švihoch: vynechať švihy.',
  },
  {
    id: 'kb_row',
    name: 'Jednoručné veslovanie s KB',
    muscles: 'široký sval chrbta, zadné ramená, biceps',
    groups: ['chrbat'],
    kind: 'load',
    category: 'sila',
    perSide: true,
    range: [8, 15],
    startWeightKg: 16,
    variants: ['Základ', 'Pauza 2 s hore', 'Tempo 3 s dole'],
    key: true,
    technique: 'Opora rukou o stoličku, chrbát rovný. Ťahaj lakeť k boku, lopatka ide dozadu, 1 s pauza hore, pomaly dole.',
    mistakes: 'Rotácia trupu; krčenie ramena k uchu; krátky rozsah.',
    regression: 'Ľahší KB.',
    progression: 'Ťažší KB → pauza 2 s hore → tempo 3 s dole.',
    painSub: 'Bolesť lakťa/ramena: veslovanie s gumou neutrálnym úchopom.',
  },
  {
    id: 'kb_press',
    name: 'Jednoručný tlak nad hlavu',
    muscles: 'ramená, triceps, stred tela',
    groups: ['ramena'],
    kind: 'load',
    category: 'sila',
    perSide: true,
    range: [6, 12],
    startWeightKg: 12,
    variants: ['Základ (v stoji)', 'Tempo 3 s dole', 'Pauza 2 s v polovici'],
    key: true,
    technique: 'KB v „rack“ polohe, zápästie rovné. Stisni zadok a brucho, tlač hore mierne dopredu od tváre, hore biceps pri uchu. Kontrolovane dole. Bez odrazu nohami (žiadny push press).',
    mistakes: 'Záklon v drieku; ohnuté zápästie; lakeť uteká do strany.',
    regression: 'Tlak v polokľaku (half-kneeling) alebo ľahší KB.',
    progression: 'Ťažší KB → tempo 3 s dole → pauza v polovici.',
    painSub: 'Bolesť ramena: tlak z podlahy (floor press) alebo vyvýšené kliky.',
  },
  {
    id: 'kb_floor_press',
    name: 'Tlak z podlahy s KB',
    muscles: 'hrudník, triceps, predné ramená',
    groups: ['hrudnik_triceps'],
    kind: 'load',
    category: 'sila',
    perSide: true,
    range: [8, 15],
    startWeightKg: 16,
    variants: ['Základ', 'Tempo 3 s dole', 'Pauza 2 s dole'],
    key: false,
    technique: 'Ľah na chrbte, KB v jednej ruke nad ramenom, lakeť ~45° od tela. Dole po dotyk tricepsu so zemou, hore vytlačiť.',
    mistakes: 'Lakeť ďaleko od tela; zápästie ohnuté.',
    regression: 'Ľahší KB.',
    progression: 'Ťažší KB → tempo → pauza.',
    painSub: 'Náhrada dipov a tlaku nad hlavu pri bolesti ramena.',
  },
  {
    id: 'reverse_lunge',
    name: 'Spätný výpad s KB (goblet)',
    muscles: 'kvadricepsy, zadok, stabilita bokov',
    groups: ['kvadricepsy', 'zadok_hamstringy'],
    kind: 'load',
    category: 'sila',
    perSide: true,
    range: [6, 12],
    startWeightKg: 12,
    variants: ['Základ', 'Výstup na stoličku s KB', 'Bulharský drep s KB'],
    key: false,
    technique: 'KB pri hrudi. Krok vzad, koleno zadnej nohy k zemi, trup vzpriamený. Odraz z päty prednej nohy (nie zo špičky – šetrí Achilovu šľachu).',
    mistakes: 'Koleno prednej nohy ide dnu; krátky krok; odraz zo špičky.',
    regression: 'Split squat s oporou o stenu; bez záťaže.',
    progression: 'Ťažší KB → výstup na stoličku → bulharský drep.',
    painSub: 'Bolesť kolena: výstupy na nízky schod. Bolesť Achilovej šľachy: výstupy bez odrazu.',
  },
  {
    id: 'step_up',
    name: 'Výstup na stoličku',
    muscles: 'kvadricepsy, zadok',
    groups: ['kvadricepsy'],
    kind: 'load',
    category: 'sila',
    perSide: true,
    range: [6, 12],
    startWeightKg: 12,
    variants: ['Základ', 'Vyššia opora', 'Tempo 3 s dole'],
    key: false,
    technique: 'Celé chodidlo na stoličke, hore bez odrazu zo zadnej nohy, dole pomaly (3 s).',
    mistakes: 'Odraz zo zadnej nohy; koleno dnu; pád dole.',
    regression: 'Nižší schod, bez záťaže.',
    progression: 'KB → vyššia opora → tempo.',
    painSub: 'Náhrada výpadov pri bolesti kolena alebo Achilovej šľachy.',
  },
  {
    id: 'glute_bridge',
    name: 'Mostík / hip thrust s KB',
    muscles: 'zadok, hamstringy',
    groups: ['zadok_hamstringy'],
    kind: 'load',
    category: 'sila',
    perSide: false,
    range: [10, 20],
    startWeightKg: 24,
    variants: ['Základ (mostík)', 'Hip thrust (lopatky na gauči)', 'Jednonožný mostík (na stranu)'],
    key: false,
    technique: 'Ľah, KB na bokoch, päty blízko zadku. Hore stisni zadok, brada k hrudi, bez prehnutia drieku, 1 s výdrž.',
    mistakes: 'Prehnutie v drieku; tlačenie cez špičky.',
    regression: 'Bez záťaže.',
    progression: 'Hip thrust → jednonožný mostík.',
    painSub: 'Náhrada mŕtveho ťahu pri bolesti chrbta.',
  },
  {
    id: 'calf_raise_slow',
    name: 'Pomalé výpony',
    muscles: 'lýtka, Achilova šľacha',
    groups: ['lytka'],
    kind: 'load',
    category: 'sila',
    perSide: false,
    range: [8, 15],
    startWeightKg: 16,
    variants: ['Obojnožne s KB v ruke', 'Jednonožne s KB (na stranu)', 'Jednonožne, 3 s hore / 3 s dole, ťažší KB'],
    key: false,
    technique: 'Na schode alebo na zemi: 3 s hore, 1 s výdrž, 3 s dole, plný rozsah. Bolesť max 3/10 a do rána preč (RESEARCH R12: ťažké pomalé zaťaženie).',
    mistakes: 'Rýchle odrazy; skrátený rozsah; bolesť nad 3/10.',
    regression: 'Obojnožne bez záťaže, menší rozsah, izometrická výdrž 30–45 s.',
    progression: 'KB v ruke → jednonožne → ťažší KB.',
    painSub: 'Bolesť > 5/10: vynechať, izometria na rovnej zemi, konzultovať fyzioterapeuta.',
  },
  {
    id: 'suitcase_carry',
    name: 'Nosenie kufríka (suitcase carry)',
    muscles: 'bočný stred tela, úchop, ramená',
    groups: ['stred'],
    kind: 'timed',
    category: 'stred',
    perSide: true,
    timedRange: [30, 45],
    startWeightKg: 24,
    key: false,
    technique: 'KB v jednej ruke, kráčaj vzpriamene, ramená rovno, brucho pevné. Vymeň ruku.',
    mistakes: 'Naklonenie k záťaži; zdvihnuté rameno.',
    regression: 'Ľahší KB, kratší čas.',
    progression: 'Ťažší KB, dlhší čas.',
    painSub: 'Bočný most.',
  },
  {
    id: 'hollow_hold',
    name: 'Hollow hold / dead bug',
    muscles: 'predná stena trupu',
    groups: ['stred'],
    kind: 'timed',
    category: 'stred',
    perSide: false,
    timedRange: [20, 40],
    key: false,
    technique: 'Driek pritlačený k zemi, ruky a nohy vystreté len tak ďaleko, kým driek drží. Dýchaj.',
    mistakes: 'Driek sa dvíha od zeme; zadržaný dych.',
    regression: 'Dead bug (striedavo ruka–opačná noha).',
    progression: 'Dlhší čas, vystreté končatiny.',
    painSub: 'Dead bug alebo McGill curl-up.',
  },
  {
    id: 'pullup_prog',
    name: 'Progresia zhybu',
    muscles: 'široký sval chrbta, biceps, lopatky',
    groups: ['chrbat'],
    kind: 'stage',
    category: 'sila',
    perSide: false,
    key: true,
    stages: [
      { name: 'Pasívny + aktívny vis', unit: 'sec', lo: 20, hi: 40, note: 'Lopatky dole, ramená preč od uší.' },
      { name: 'Negatívy (5 s dole)', unit: 'reps', lo: 3, hi: 6, note: 'Hore vystúp po stoličke (bez výskoku – Achilova šľacha), plný rozsah dole bez pádu.' },
      { name: 'Izometria hore + v strede', unit: 'sec', lo: 5, hi: 15, note: 'Brada nad tyčou / lakeť 90°, striedaj.' },
      { name: 'Zhyby s gumou (silná) / noha na stoličke', unit: 'reps', lo: 4, hi: 8, note: 'Čo najmenej pomoci.' },
      { name: 'Zhyby s gumou (slabá)', unit: 'reps', lo: 4, hi: 8, note: '' },
      { name: 'Zhyby', unit: 'reps', lo: 1, hi: 8, note: 'Potom záťaž: KB 12 kg medzi nohami, 3 × 3–8.' },
    ],
    technique: 'Aktívny vis, lopatky dole a dozadu, ťahaj lakte k rebrám, brada nad tyč bez kývania. Dole kontrolovane do plného visu. V tréningu B podhmat (chin-up) alebo neutrálny úchop.',
    mistakes: 'Kývanie; krčenie ramien k ušiam; polovičný rozsah; pád do visu.',
    regression: 'Predchádzajúce štádium (vis → negatívy → izometria → guma).',
    progression: 'Ďalšie štádium po 2 tréningoch na hornej hranici; nakoniec záťaž.',
    painSub: 'Bolesť lakťa/ramena: veslovanie s KB, vis bez ťahania, neutrálny úchop.',
  },
  {
    id: 'dip_prog',
    name: 'Progresia dipov',
    muscles: 'hrudník, triceps, predné ramená',
    groups: ['hrudnik_triceps'],
    kind: 'stage',
    category: 'sila',
    perSide: false,
    key: true,
    stages: [
      { name: 'Kliky na zemi (brána)', unit: 'reps', lo: 8, hi: 15, note: 'Kým nie sú kliky 3 × 10, dipy nezačínať.' },
      { name: 'Podpor na bradlách', unit: 'sec', lo: 20, hi: 40, note: 'Lakte vystreté, lopatky dole.' },
      { name: 'Negatívy v obmedzenom rozsahu (4 s)', unit: 'reps', lo: 3, hi: 6, note: 'Nadlaktie po rovnobežku, hore pomôž nohami.' },
      { name: 'Asistované dipy (guma / špičky na stoličke)', unit: 'reps', lo: 4, hi: 10, note: '' },
      { name: 'Dipy v obmedzenom rozsahu', unit: 'reps', lo: 3, hi: 10, note: 'Trup mierne vpred, lakte pri tele.' },
      { name: 'Dipy so záťažou', unit: 'reps', lo: 3, hi: 8, note: 'KB medzi nohami.' },
    ],
    technique: 'Lopatky dole, lakte dozadu (nie do strán), trup mierne vpred, dole len po rovnobežku nadlaktia (RESEARCH R5 – konzervatívne kvôli ramenám), hore bez nárazového zamknutia lakťov.',
    mistakes: 'Príliš hlboko; ramená k ušiam; lakte do strán; rýchly pád.',
    regression: 'Predchádzajúce štádium; kliky.',
    progression: 'Ďalšie štádium po 2 tréningoch na hornej hranici; nakoniec záťaž.',
    painSub: 'Bolesť vpredu v ramene: tlak z podlahy s KB alebo vyvýšené kliky.',
  },
  {
    id: 'pushup_prog',
    name: 'Progresia kliku',
    muscles: 'hrudník, triceps, ramená, stred tela',
    groups: ['hrudnik_triceps'],
    kind: 'stage',
    category: 'sila',
    perSide: false,
    key: false,
    stages: [
      { name: 'Vyvýšené kliky (ruky na stole)', unit: 'reps', lo: 8, hi: 15, note: '' },
      { name: 'Kliky na nižšej opore (stolička)', unit: 'reps', lo: 8, hi: 15, note: '' },
      { name: 'Kliky na zemi', unit: 'reps', lo: 6, hi: 15, note: '' },
      { name: 'Kliky s nohami na stoličke', unit: 'reps', lo: 6, hi: 15, note: '' },
      { name: 'Kliky s KB na chrbte / tempo 3-1-1', unit: 'reps', lo: 6, hi: 12, note: '' },
    ],
    technique: 'Telo v jednej línii, ruky pod ramenami, lakte ~45°, hrudník k zemi, hore vytlačiť bez prehnutia drieku.',
    mistakes: 'Prehnutý driek; lakte do strán; krátky rozsah.',
    regression: 'Vyššia opora.',
    progression: 'Nižšia opora → nohy hore → záťaž/tempo.',
    painSub: 'Bolesť zápästia: kliky na pästiach alebo na KB rúčkach; bolesť ramena: menší rozsah.',
  },
  // --- Mobilita (len popis; rutina je v mobility.ts) ---
  {
    id: 'cat_camel', name: 'Cat-camel (mačka–ťava)', muscles: 'chrbtica', kind: 'timed', category: 'mobilita', perSide: false, key: false,
    technique: 'Na štyroch pomaly guľatiť a prehýbať celú chrbticu, bez tlaku do krajných polôh.', mistakes: 'Rýchlo; len driek.', regression: 'Menší rozsah.', progression: '—', painSub: 'Pri bolesti vynechať prehnutie.',
  },
  {
    id: 'hip_flexor_stretch', name: 'Strečing flexorov bedier v polokľaku', muscles: 'flexory bedra, predné stehno', kind: 'timed', category: 'mobilita', perSide: true, key: false,
    technique: 'Polokľak, zadok stiahnutý, panva „podsadená“, mierne posunúť boky vpred. Ťah vpredu na stehne, nie v drieku. 45 s.', mistakes: 'Prehnutie v drieku namiesto ťahu v bedre.', regression: 'Kratšie, opora o stoličku.', progression: 'Zadná noha na stoličke.', painSub: 'Pri bolesti kolena podložiť koleno.',
  },
  {
    id: 'ninety_ninety', name: '90/90 prehadzovanie bokov', muscles: 'rotátory bedra, zadok', kind: 'timed', category: 'mobilita', perSide: false, key: false,
    technique: 'Sed s oboma kolenami v 90°, pomaly prehadzovať kolená na druhú stranu, trup vzpriamený.', mistakes: 'Guľatenie chrbta.', regression: 'Opora rukami vzadu.', progression: 'Bez opory rúk, predklon nad predné koleno.', painSub: 'Menší rozsah.',
  },
  {
    id: 'figure_four', name: 'Strečing zadku „štvorka“', muscles: 'zadok, hlboké rotátory', kind: 'timed', category: 'mobilita', perSide: true, key: false,
    technique: 'V ľahu členok na opačné koleno, pritiahnuť stehno k sebe. 45 s.', mistakes: 'Zdvihnutá hlava/ramená.', regression: 'V sede na stoličke.', progression: 'Pigeon.', painSub: 'Pri bolesti kolena držať za stehno.',
  },
  {
    id: 'thoracic_ext', name: 'Extenzia hrudnej chrbtice + open book', muscles: 'hrudná chrbtica', kind: 'timed', category: 'mobilita', perSide: true, key: false,
    technique: 'Extenzia cez operadlo stoličky (8×, ruky za hlavou) a rotácie „open book“ v ľahu na boku (8× na stranu), kolená pri sebe.', mistakes: 'Prehýbanie drieku namiesto hrudníka.', regression: 'Menší rozsah.', progression: 'Výdrž 3 s.', painSub: '—',
  },
  {
    id: 'wall_slides', name: 'Wall slides / pull-apart s gumou', muscles: 'ramená, lopatky, horný chrbát', kind: 'timed', category: 'mobilita', perSide: false, key: false,
    technique: 'Chrbát a lakte pri stene, posúvať ruky hore a dole bez straty kontaktu; alebo rozťahovať gumu pred hrudníkom 10×.', mistakes: 'Krčenie ramien.', regression: 'Bez steny.', progression: 'Pomalšie.', painSub: 'Pull-apart namiesto wall slides.',
  },
  {
    id: 'mcgill_curlup', name: 'McGill curl-up', muscles: 'predná stena trupu', kind: 'timed', category: 'stred', perSide: false, key: false,
    technique: 'Ľah, jedna noha pokrčená, ruky pod driekom (zachovať prirodzené prehnutie). Dvíhať len hlavu a ramená o 2–3 cm, 10 s výdrž. Pyramída 5-3-1.', mistakes: 'Vysoký „sed-ľah“; ohnutie krku.', regression: 'Kratšie výdrže.', progression: 'Lakte nad zemou.', painSub: 'Dead bug.',
  },
  {
    id: 'side_bridge', name: 'Bočný most', muscles: 'bočná stena trupu', kind: 'timed', category: 'stred', perSide: true, key: false,
    technique: 'Na kolenách (neskôr na chodidlách), lakeť pod ramenom, telo v jednej línii, 10 s výdrž. Pyramída 5-3-1 na stranu.', mistakes: 'Boky klesajú; rotácia.', regression: 'Na kolenách.', progression: 'Na chodidlách, horná noha vpredu.', painSub: 'Kratšie výdrže, na kolenách.',
  },
  {
    id: 'bird_dog', name: 'Bird dog', muscles: 'extenzory chrbta, zadok, kontrola panvy', kind: 'timed', category: 'stred', perSide: true, key: false,
    technique: 'Na štyroch, vystrieť ruku a opačnú nohu, panva rovno, 10 s výdrž, „zametaj“ späť. Pyramída 5-3-1 na stranu.', mistakes: 'Prehnutý driek; rotácia panvy.', regression: 'Len noha alebo len ruka.', progression: 'Malé kruhy rukou/nohou počas výdrže.', painSub: 'Len ruka.',
  },
]

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise {
  const ex = EXERCISE_MAP[id]
  if (!ex) throw new Error(`Neznámy cvik: ${id}`)
  return ex
}

export const KEY_EXERCISE_IDS = EXERCISES.filter((e) => e.key).map((e) => e.id)

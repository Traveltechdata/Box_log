// Templates describe the SHAPE of a session (format, movement slots, rep scheme),
// not the exact movements/loads — those are filled in by the generator.
//
// format values and what they mean for movement_slots / repScheme:
//   FOR_TIME     2-3 movements. repScheme.type 'ladder' (e.g. 21-15-9, same reps every
//                movement each round) or 'rounds' (N rounds x constant reps/movement).
//   AMRAP_ROUNDS 2-4 movements, fixed reps/round each, scored in rounds+reps.
//   AMRAP_REPS   1 movement, continuous max reps in the time cap.
//   EMOM         1-2 movements, explicit reps done at the top of each minute.
//   TABATA       1-2 movements, 8 rounds of 20"/10" (alternates if 2), scored on worst round.
//   DEATH_BY     1 movement, +1 rep every minute until failure/time cap.
//   STRENGTH     1 barbell lift, sets/reps/% handled by the generator from the athlete's 1RM.
//   SKILL        1-2 gymnastics/olympic movements, technical sets/reps (never %1RM).
//   STEADY       1 monostructural movement, continuous steady-state.
//   RECOVERY / TECHNICAL   low-readiness fallback sessions.

export const TEMPLATES = [
  // ---------------- FOR TIME ----------------
  {
    id: 'for_time_ladder',
    label: 'For Time (scaletta 21-15-9)',
    goals: ['conditioning', 'race_prep', 'general'],
    format: 'FOR_TIME',
    time_domain: [8, 18],
    duration: 12,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'pull', modality: 'gymnastics' },
    ],
    repScheme: { type: 'ladder', reps: [21, 15, 9] },
    target_rpe: [8, 9],
    stimulus: 'sprint dall\u2019inizio alla fine, poche transizioni, ritmo il più possibile costante',
  },
  {
    id: 'for_time_rounds_couplet',
    label: 'For Time (round fissi, couplet)',
    goals: ['conditioning', 'race_prep', 'general'],
    format: 'FOR_TIME',
    time_domain: [10, 20],
    duration: 14,
    movement_slots: [
      { pattern: 'hinge', modality: 'weightlifting' },
      { pattern: 'push', modality: 'bodyweight' },
    ],
    repScheme: { type: 'rounds', rounds: 5, reps: 12 },
    target_rpe: [7, 9],
    stimulus: 'round ripetibili, gestisci il ritmo per non spaccarti nei primi round',
  },
  {
    id: 'for_time_triplet',
    label: 'For Time (triplet)',
    goals: ['conditioning', 'race_prep'],
    format: 'FOR_TIME',
    time_domain: [12, 22],
    duration: 16,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'pull', modality: 'gymnastics' },
      { pattern: 'cyclical', modality: 'monostructural' },
    ],
    repScheme: { type: 'rounds', rounds: 4, reps: 10 },
    target_rpe: [7, 9],
    stimulus: 'tre movimenti in sequenza, transizioni rapide',
  },
  {
    id: 'benchmark_test',
    label: 'Test / benchmark',
    goals: ['strength', 'conditioning', 'race_prep'],
    format: 'FOR_TIME',
    time_domain: [8, 16],
    duration: 12,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'pull', modality: 'gymnastics' },
    ],
    repScheme: { type: 'ladder', reps: [21, 15, 9] },
    target_rpe: [9, 10],
    stimulus: 'test a intensità massima su un formato noto, solo con readiness alta',
    high_readiness_only: true,
  },
  {
    id: 'strongman_conditioning',
    label: 'Strongman conditioning',
    goals: ['conditioning', 'strength'],
    format: 'FOR_TIME',
    time_domain: [10, 20],
    duration: 14,
    movement_slots: [
      { pattern: 'carry', modality: 'weightlifting' },
      { pattern: 'squat', modality: 'weightlifting' },
    ],
    repScheme: { type: 'rounds', rounds: 4, reps: 8 },
    target_rpe: [7, 9],
    stimulus: 'carichi da spostare/trasportare, potenza e resistenza muscolare',
  },

  // ---------------- AMRAP ROUNDS ----------------
  {
    id: 'amrap_rounds_triplet',
    label: 'AMRAP a round (triplet)',
    goals: ['conditioning', 'general'],
    format: 'AMRAP_ROUNDS',
    time_domain: [8, 16],
    duration: 12,
    movement_slots: [
      { pattern: 'cyclical', modality: 'monostructural' },
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'push', modality: 'bodyweight' },
    ],
    repScheme: { reps: 15 },
    target_rpe: [7, 8],
    stimulus: 'ritmo sostenibile, poche pause, quanti round riesci a completare',
  },
  {
    id: 'amrap_rounds_chipper',
    label: 'AMRAP a round (chipper)',
    goals: ['conditioning', 'race_prep', 'general'],
    format: 'AMRAP_ROUNDS',
    time_domain: [14, 26],
    duration: 18,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'pull', modality: 'gymnastics' },
      { pattern: 'core', modality: 'gymnastics' },
      { pattern: 'cyclical', modality: 'monostructural' },
    ],
    repScheme: { reps: 15 },
    target_rpe: [7, 9],
    stimulus: 'quattro movimenti, gestione dell\u2019energia su un tempo più lungo',
  },
  {
    id: 'amrap_rounds_couplet_heavy',
    label: 'AMRAP a round (couplet con carico)',
    goals: ['conditioning', 'strength'],
    format: 'AMRAP_ROUNDS',
    time_domain: [8, 16],
    duration: 10,
    movement_slots: [
      { pattern: 'hinge', modality: 'weightlifting' },
      { pattern: 'push', modality: 'bodyweight' },
    ],
    repScheme: { reps: 10 },
    target_rpe: [7, 9],
    stimulus: 'carico moderato-alto, round brevi e intensi',
  },

  // ---------------- AMRAP REPS ----------------
  {
    id: 'amrap_reps_single',
    label: 'AMRAP reps (singolo movimento)',
    goals: ['conditioning', 'general'],
    format: 'AMRAP_REPS',
    time_domain: [8, 12],
    duration: 10,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
    ],
    repScheme: {},
    target_rpe: [8, 9],
    stimulus: 'massimo numero di ripetizioni possibili nel tempo dato, un solo movimento, sforzo massimale dal primo secondo',
  },
  {
    id: 'amrap_reps_monostructural',
    label: 'AMRAP reps (cardio)',
    goals: ['conditioning', 'aerobic'],
    format: 'AMRAP_REPS',
    time_domain: [8, 12],
    duration: 10,
    movement_slots: [
      { pattern: 'cyclical', modality: 'monostructural' },
    ],
    repScheme: { unitOverride: 'cal' },
    target_rpe: [8, 9],
    stimulus: 'massimo numero di calorie sulla macchina scelta, sforzo massimale sostenuto',
  },

  // ---------------- EMOM ----------------
  {
    id: 'emom_conditioning',
    label: 'EMOM conditioning',
    goals: ['conditioning', 'general'],
    format: 'EMOM',
    time_domain: [10, 20],
    duration: 14,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'pull', modality: 'gymnastics' },
      { pattern: 'core', modality: 'gymnastics' },
    ],
    repScheme: { repsPerMinute: 12 },
    target_rpe: [6, 8],
    stimulus: 'ogni minuto un lavoro diverso, ritmo costante senza affanno eccessivo',
  },
  {
    id: 'emom_olympic',
    label: 'EMOM weightlifting',
    goals: ['weightlifting'],
    format: 'EMOM',
    time_domain: [10, 20],
    duration: 14,
    movement_slots: [
      { pattern: 'olympic', modality: 'weightlifting' },
    ],
    repScheme: { repsPerMinute: 3 },
    target_rpe: [6, 8],
    stimulus: 'qualità tecnica e velocità, carico submassimale, riposo nel resto del minuto',
  },

  // ---------------- TABATA ----------------
  {
    id: 'tabata_pair',
    label: 'Tabata (due blocchi)',
    goals: ['conditioning', 'general'],
    format: 'TABATA',
    time_domain: [8, 8],
    duration: 8,
    movement_slots: [
      { pattern: 'squat', modality: 'bodyweight' },
      { pattern: 'push', modality: 'bodyweight' },
    ],
    repScheme: {},
    target_rpe: [8, 9],
    stimulus: '8 round da 20"/10" sul primo movimento, poi 8 round da 20"/10" sul secondo \u2014 8 minuti totali, nessun tempo morto',
  },

  // ---------------- DEATH BY ----------------
  {
    id: 'death_by',
    label: 'Death By',
    goals: ['conditioning', 'race_prep'],
    format: 'DEATH_BY',
    time_domain: [8, 20],
    duration: 14,
    movement_slots: [
      { pattern: 'pull', modality: 'gymnastics' },
    ],
    repScheme: { startReps: 1, increment: 1 },
    target_rpe: [8, 9],
    stimulus: 'minuto 1 = 1 rep, +1 rep ogni minuto, finché regge il ritmo o fino al time cap',
  },

  // ---------------- STRENGTH ----------------
  {
    id: 'strength_squat',
    label: 'Forza \u2014 squat',
    goals: ['strength'],
    format: 'STRENGTH',
    time_domain: [15, 25],
    duration: 20,
    movement_slots: [{ pattern: 'squat', modality: 'weightlifting' }],
    preferredMovementIds: ['back_squat', 'front_squat', 'overhead_squat'],
    stimulus: 'forza massimale/sub-massimale, recupero quasi completo tra le serie',
  },
  {
    id: 'strength_hinge',
    label: 'Forza \u2014 hinge',
    goals: ['strength'],
    format: 'STRENGTH',
    time_domain: [15, 25],
    duration: 20,
    movement_slots: [{ pattern: 'hinge', modality: 'weightlifting' }],
    preferredMovementIds: ['deadlift'],
    stimulus: 'forza massimale/sub-massimale, recupero quasi completo tra le serie',
  },
  {
    id: 'strength_press',
    label: 'Forza \u2014 press',
    goals: ['strength'],
    format: 'STRENGTH',
    time_domain: [15, 25],
    duration: 20,
    movement_slots: [{ pattern: 'press', modality: 'weightlifting' }],
    preferredMovementIds: ['strict_press', 'push_press', 'push_jerk'],
    stimulus: 'forza massimale/sub-massimale, recupero quasi completo tra le serie',
  },
  {
    id: 'strength_olympic',
    label: 'Forza \u2014 olympic',
    goals: ['strength', 'weightlifting'],
    format: 'STRENGTH',
    time_domain: [15, 25],
    duration: 20,
    movement_slots: [{ pattern: 'olympic', modality: 'weightlifting' }],
    preferredMovementIds: ['clean', 'power_clean', 'snatch', 'power_snatch', 'clean_and_jerk'],
    stimulus: 'forza e potenza sui sollevamenti olimpici, tecnica prioritaria sul carico',
  },

  // ---------------- SKILL ----------------
  {
    id: 'skill_gymnastics_pull',
    label: 'Skill \u2014 ginnastica (pull)',
    goals: ['gymnastics'],
    format: 'SKILL',
    time_domain: [12, 22],
    duration: 16,
    movement_slots: [{ pattern: 'pull', modality: 'gymnastics' }],
    preferredMovementIds: ['muscle_up', 'bar_muscle_up', 'ctb_pullup', 'kipping_pullup', 'rope_climb'],
    stimulus: 'lavoro tecnico su un movimento di trazione avanzato, qualità sopra la quantità',
  },
  {
    id: 'skill_gymnastics_press',
    label: 'Skill \u2014 ginnastica (press)',
    goals: ['gymnastics'],
    format: 'SKILL',
    time_domain: [12, 22],
    duration: 16,
    movement_slots: [{ pattern: 'press', modality: 'gymnastics' }],
    preferredMovementIds: ['handstand_walk', 'hspu', 'wall_walk'],
    stimulus: 'lavoro tecnico su equilibrio e spinta sopra la testa a corpo libero',
  },
  {
    id: 'skill_olympic_technique',
    label: 'Skill \u2014 tecnica olimpica',
    goals: ['weightlifting'],
    format: 'SKILL',
    time_domain: [12, 22],
    duration: 16,
    movement_slots: [{ pattern: 'olympic', modality: 'weightlifting' }],
    preferredMovementIds: ['snatch', 'power_snatch', 'clean', 'power_clean'],
    stimulus: 'tecnica a carico leggero/moderato, velocità sotto il bilanciere, mai a cedimento',
  },

  // ---------------- STEADY / RECOVERY ----------------
  {
    id: 'engine_zone2',
    label: 'Aerobico Zona 2',
    goals: ['aerobic', 'general'],
    format: 'STEADY',
    time_domain: [20, 45],
    duration: 30,
    movement_slots: [{ pattern: 'cyclical', modality: 'monostructural' }],
    repScheme: {},
    target_rpe: [4, 6],
    stimulus: 'intensità stabile e bassa, nessun accumulo di fatica locale',
  },
  {
    id: 'recovery_technical',
    label: 'Tecnica leggera',
    goals: ['general', 'aerobic', 'conditioning', 'strength', 'weightlifting', 'gymnastics'],
    format: 'TECHNICAL',
    time_domain: [10, 30],
    duration: 18,
    movement_slots: [
      { pattern: 'squat', modality: 'weightlifting' },
      { pattern: 'cyclical', modality: 'monostructural' },
    ],
    repScheme: {},
    target_rpe: [3, 5],
    stimulus: 'qualità del movimento, carico leggero, nessuna fretta',
  },
  {
    id: 'recovery_session',
    label: 'Recovery / mobilità',
    goals: ['general', 'aerobic', 'conditioning', 'strength', 'weightlifting', 'gymnastics', 'race_prep'],
    format: 'RECOVERY',
    time_domain: [10, 40],
    duration: 20,
    movement_slots: [
      { pattern: 'mobility', modality: 'bodyweight' },
      { pattern: 'cyclical', modality: 'monostructural' },
    ],
    repScheme: {},
    target_rpe: [2, 4],
    stimulus: 'recupero attivo, nessun accumulo di fatica',
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

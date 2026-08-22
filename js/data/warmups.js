// Movement-specific warm-up drills, built as a structured circuit (2-3 rounds),
// not a flat one-pass list. Every item is measurable and repeatable (explicit
// reps, seconds, or distance) — "se non è misurabile non è CrossFit".

export const GENERAL_RAISE = [
  { name: 'Vogatore', equipment: ['rower'] },
  { name: 'Echo bike / Assault bike', equipment: ['bike'] },
  { name: 'Ski erg', equipment: ['ski_erg'] },
  { name: 'Corda (single-under)', equipment: ['jump_rope'] },
  { name: 'Corsa leggera', equipment: [] },
];

// Each pattern has a POOL of drill variants so repeated sessions don't always
// show the same two exercises in the same order.
export const PATTERN_WARMUP = {
  squat: [
    { name: 'Air squat', reps: '10' },
    { name: 'Squat con bastone (overhead se possibile)', reps: '8' },
    { name: 'Goblet squat leggero', reps: '10' },
    { name: 'Cossack squat', reps: '8 per lato' },
  ],
  hinge: [
    { name: 'Good morning senza carico', reps: '10' },
    { name: 'Hip hinge con bastone sulla schiena', reps: '8' },
    { name: 'Kettlebell deadlift leggero', reps: '10' },
    { name: 'Banded good morning', reps: '10' },
  ],
  press: [
    { name: 'Shoulder dislocate con bastone/elastico', reps: '10' },
    { name: 'Strict press con bastone o bilanciere scarico', reps: '8' },
    { name: 'Wall slide', reps: '8' },
    { name: 'Scapular push-up', reps: '10' },
  ],
  olympic: [
    { name: 'Hang power clean con bastone', reps: '5' },
    { name: 'High pull con bastone', reps: '8' },
    { name: 'Muscle snatch con bastone', reps: '5' },
    { name: 'Overhead squat con bastone', reps: '8' },
  ],
  pull: [
    { name: 'Scapular pull-up (o scapular row)', reps: '8' },
    { name: 'Band pull-apart', reps: '15' },
    { name: 'Ring row leggero', reps: '10' },
    { name: 'Arm circle', reps: '10 per verso' },
  ],
  push: [
    { name: 'Push-up in ginocchio o standard', reps: '8' },
    { name: 'Plank shoulder tap', reps: '10 per lato' },
    { name: 'Scapular push-up', reps: '10' },
  ],
  core: [
    { name: 'Hollow hold', reps: '20"' },
    { name: 'Dead bug', reps: '10 per lato' },
    { name: 'Plank', reps: '30"' },
  ],
  carry: [
    { name: "Farmer's carry leggero", reps: '20m' },
    { name: 'Suitcase carry leggero', reps: '20m per lato' },
  ],
  jump: [
    { name: 'Salti sul posto leggeri', reps: '20"' },
    { name: 'Single-under di prova (ritmo, non velocità)', reps: '20' },
    { name: 'Pogo hop', reps: '15' },
  ],
  lunge: [
    { name: 'Walking lunge senza carico', reps: '10' },
    { name: 'Reverse lunge', reps: '8 per lato' },
  ],
  cyclical: [
    { name: 'Cambi di ritmo leggeri sulla macchina scelta', reps: '20"' },
  ],
  mobility: [],
};

// Baseline drills used to top up a thin warm-up (e.g. single-movement sessions
// where only one or two patterns are involved) so it never feels like an afterthought.
const GENERIC_TOPUP = [
  { name: 'Leg swing (avanti/indietro e laterali)', reps: '10 per lato' },
  { name: 'Arm circle + band pull-apart', reps: '10' },
  { name: 'Inchworm walk-out', reps: '5' },
  { name: 'World\u2019s greatest stretch', reps: '5 per lato' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Picks 2-3 circuit drills (one per pattern, randomized so repeated
// generations don't always show the same exercises in the same order).
function pickCircuitDrills(patterns) {
  const uniquePatterns = shuffle([...new Set(patterns)].filter(p => PATTERN_WARMUP[p] && PATTERN_WARMUP[p].length > 0));
  let drills = uniquePatterns.slice(0, 3).map(p => pickRandom(PATTERN_WARMUP[p]));
  if (drills.length < 2) {
    const pool = shuffle(GENERIC_TOPUP);
    while (drills.length < 2) drills.push(pool[drills.length]);
  }
  return drills.slice(0, 3);
}

export function pickGeneralRaise(equipment) {
  const usable = shuffle(GENERAL_RAISE.filter(o => o.equipment.length === 0 || o.equipment.every(e => equipment.includes(e))));
  return usable[0] || GENERAL_RAISE[GENERAL_RAISE.length - 1]; // fall back to jog, needs no equipment
}

// Builds a full structured warm-up: a measurable cardio raise, then 2-3 rounds
// of a small movement-prep circuit sized to actually fill the allocated time.
export function buildStructuredWarmup(totalMinutes, patterns, equipment) {
  const raiseOption = pickGeneralRaise(equipment);
  const raiseMinutes = Math.max(2, Math.min(5, Math.round(totalMinutes * 0.35)));
  const remaining = Math.max(2, totalMinutes - raiseMinutes);

  let rounds;
  if (remaining >= 6) rounds = 3;
  else if (remaining >= 3) rounds = 2;
  else rounds = 1;

  const circuit = pickCircuitDrills(patterns);

  return {
    minutes: totalMinutes,
    raise: { name: raiseOption.name, minutes: raiseMinutes, prescription: `${raiseMinutes} min facili` },
    rounds,
    circuit,
  };
}

// Movement-specific warm-up drills. These prep the joints/patterns that will
// actually be loaded in today's session — not generic filler.
// Each drill: { name, prescription } where prescription is a short set x rep string.

export const GENERAL_RAISE = [
  { name: 'Row leggero', equipment: ['rower'] },
  { name: 'Bike leggera', equipment: ['bike'] },
  { name: 'Corsa leggera / jog', equipment: [] },
  { name: 'Corda (single-under)', equipment: ['jump_rope'] },
];

export const PATTERN_WARMUP = {
  squat: [
    { name: 'Air squat', prescription: '2x10' },
    { name: 'Squat con bastone (overhead se possibile)', prescription: '2x8' },
  ],
  hinge: [
    { name: 'Good morning senza carico', prescription: '2x10' },
    { name: 'Hip hinge con bastone sulla schiena', prescription: '2x8' },
  ],
  press: [
    { name: 'Shoulder dislocate con bastone/elastico', prescription: '2x10' },
    { name: 'Strict press con bastone o bilanciere scarico', prescription: '2x8' },
  ],
  olympic: [
    { name: 'Hang power clean/snatch con bastone', prescription: '3x5' },
    { name: 'High pull con bastone', prescription: '2x8' },
  ],
  pull: [
    { name: 'Scapular pull-up (o scapular row)', prescription: '2x8' },
    { name: 'Band pull-apart', prescription: '2x15' },
  ],
  push: [
    { name: 'Push-up in ginocchio o standard', prescription: '2x8' },
  ],
  core: [
    { name: 'Hollow hold', prescription: '3x20"' },
  ],
  carry: [
    { name: 'Farmer carry leggero', prescription: '2x20m' },
  ],
  jump: [
    { name: 'Salti sul posto leggeri', prescription: '2x20"' },
    { name: 'Single-under di prova (ritmo, non velocità)', prescription: '2x20' },
  ],
  lunge: [
    { name: 'Walking lunge senza carico', prescription: '2x10' },
  ],
  cyclical: [
    { name: 'Cambi di ritmo leggeri sulla macchina scelta', prescription: '3x20"' },
  ],
  mobility: [],
};

// Baseline drills used to top up a thin warm-up (e.g. single-movement sessions
// where only one or two patterns are involved) so it never feels like an afterthought.
const GENERIC_TOPUP = [
  { name: 'Leg swing (avanti/indietro e laterali)', prescription: '2x10 per lato' },
  { name: 'Arm circle + band pull-apart', prescription: '2x10' },
  { name: 'Inchworm walk-out', prescription: '2x5' },
];

export function warmupDrillsForPatterns(patterns) {
  const unique = [...new Set(patterns)].filter(p => PATTERN_WARMUP[p]);
  let drills = unique.slice(0, 3).flatMap(p => PATTERN_WARMUP[p]);
  if (drills.length < 2) {
    const need = 2 - drills.length;
    drills = drills.concat(GENERIC_TOPUP.slice(0, need));
  }
  return drills;
}

export function pickGeneralRaise(equipment) {
  const usable = GENERAL_RAISE.filter(o => o.equipment.length === 0 || o.equipment.every(e => equipment.includes(e)));
  return usable[0] || GENERAL_RAISE[2]; // fall back to jog, needs no equipment
}

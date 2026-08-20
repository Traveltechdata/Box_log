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
    { name: 'Step-up su box (senza salto)', prescription: '2x8' },
  ],
  lunge: [
    { name: 'Walking lunge senza carico', prescription: '2x10' },
  ],
  cyclical: [],
  mobility: [],
};

export function warmupDrillsForPatterns(patterns) {
  const unique = [...new Set(patterns)].filter(p => PATTERN_WARMUP[p] && PATTERN_WARMUP[p].length > 0);
  return unique.slice(0, 3).flatMap(p => PATTERN_WARMUP[p]);
}

export function pickGeneralRaise(equipment) {
  const usable = GENERAL_RAISE.filter(o => o.equipment.length === 0 || o.equipment.every(e => equipment.includes(e)));
  return usable[0] || GENERAL_RAISE[2]; // fall back to jog, needs no equipment
}

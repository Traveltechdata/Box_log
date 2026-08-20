import { TEMPLATES } from '../data/templates.js';
import { getMovement } from '../data/movements.js';
import { pickMovement, readinessScaling, allocateTime } from './scaling.js';
import { validate, score } from './validation.js';
import { readinessBand } from './readiness.js';
import { warmupDrillsForPatterns, pickGeneralRaise } from '../data/warmups.js';

// Estimated seconds per rep, by pattern - rough, used only for FOR_TIME time-fit checks
// (AMRAP/EMOM/TABATA/DEATH_BY/STRENGTH/SKILL are time-capped by definition, no estimate needed).
const SEC_PER_REP = {
  squat: 3, hinge: 3, press: 3, push: 2.5, pull: 3, olympic: 4,
  core: 2.5, jump: 2, lunge: 3, carry: 8, cyclical: 1, mobility: 1,
};

const STRENGTH_SCHEMES = {
  high: { sets: 5, reps: 3, pct: 0.85 },
  normal: { sets: 5, reps: 5, pct: 0.75 },
  moderate: { sets: 4, reps: 5, pct: 0.65 },
};

function secPerRep(movement) {
  return SEC_PER_REP[movement.patterns[0]] || 3;
}

function loadTextFor(movement, loadMult) {
  if (!movement.loadRx) return null;
  const m = Math.round((movement.loadRx.m * loadMult) / 1 * 2) / 2; // nearest 0.5kg
  const f = Math.round((movement.loadRx.f * loadMult) / 1 * 2) / 2;
  return `${m}/${f}kg`;
}

function pickMetconMovement(slot, context, usedIds) {
  const picked = pickMovement(slot, context, usedIds);
  return picked; // { movement, chain }
}

function pickPreferredMovement(template, context) {
  const ids = template.preferredMovementIds || [];
  const candidates = ids
    .map(getMovement)
    .filter(Boolean)
    .filter(m => m.equipment.every(e => context.equipment.includes(e)))
    .filter(m => !context.limitations.includes(m.id));
  if (candidates.length === 0) return null;
  const goalMatch = candidates.find(m => context.priorityMovementIds.includes(m.id));
  return goalMatch || candidates[0];
}

// ---------------- warm-up ----------------
function buildWarmup(minutes, patterns, equipment) {
  const raise = pickGeneralRaise(equipment);
  const raiseMinutes = Math.max(2, Math.min(5, Math.round(minutes * 0.35)));
  const drills = warmupDrillsForPatterns(patterns);
  return {
    minutes,
    raise: { name: raise.name, minutes: raiseMinutes },
    drills,
  };
}

// ---------------- STRENGTH ----------------
function buildStrength(template, context, minutes) {
  const movement = pickPreferredMovement(template, context);
  if (!movement) return null;

  const base = STRENGTH_SCHEMES[context.readinessBand.key] || STRENGTH_SCHEMES.normal;
  let { sets, reps, pct } = base;
  const isOlympic = movement.patterns.includes('olympic');
  if (isOlympic) {
    reps = Math.max(1, reps - 2);
    pct = Math.max(0.5, pct - 0.05);
  }

  const oneRM = context.oneRMs?.[movement.id];
  let loadText;
  if (oneRM) {
    const loadKg = Math.round((oneRM * pct) / 2.5) * 2.5;
    loadText = `${loadKg}kg`;
  }

  return {
    kind: 'strength',
    label: 'Forza',
    movement: { name: movement.name },
    movementRef: movement,
    sets, reps, pct: Math.round(pct * 100),
    loadText,
    minutes,
    prescriptionText: loadText
      ? `${sets} x ${reps} @ ${Math.round(pct * 100)}% (${loadText})`
      : `${sets} x ${reps} @ ${Math.round(pct * 100)}% del tuo 1RM \u2014 inserisci il massimale in Profilo per vedere il carico in kg`,
    patternsHit: movement.patterns,
  };
}

// ---------------- SKILL ----------------
function buildSkill(template, context, minutes) {
  const movement = pickPreferredMovement(template, context);
  if (!movement) return null;

  const isComplex = movement.skill >= 5;
  let prescriptionText, sets, reps;

  if (isComplex) {
    const attempts = context.readinessBand.key === 'high' ? 6 : 5;
    sets = attempts; reps = 1;
    prescriptionText = `${attempts} tentativi singoli, recupero 60-90" tra i tentativi, RPE 5-6 (qualità sopra la quantità)`;
  } else {
    sets = context.readinessBand.key === 'high' ? 5 : 4;
    reps = movement.patterns.includes('olympic') ? 3 : 5;
    prescriptionText = `${sets} serie x ${reps} ripetizioni tecniche, recupero 90", RPE 5-6`;
  }

  if (movement.patterns.includes('olympic')) {
    const oneRM = context.oneRMs?.[movement.id];
    if (oneRM) {
      const pct = context.readinessBand.key === 'high' ? 0.65 : 0.6;
      const loadKg = Math.round((oneRM * pct) / 2.5) * 2.5;
      prescriptionText += ` \u2014 carico leggero per la tecnica, ~${loadKg}kg (${Math.round(pct * 100)}%)`;
    }
  }

  return {
    kind: 'skill',
    label: 'Skill',
    movement: { name: movement.name },
    movementRef: movement,
    sets, reps,
    minutes,
    prescriptionText,
    patternsHit: movement.patterns,
  };
}

// ---------------- metcon formats ----------------
function buildForTime(template, context) {
  const usedIds = new Set();
  const movements = [];
  const scalingInfo = readinessScaling(context.readinessBand);

  for (const slot of template.movement_slots) {
    const picked = pickMetconMovement(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const scheme = template.repScheme;
  let structureText, perMovementReps;
  if (scheme.type === 'ladder') {
    const scaled = scheme.reps.map(r => Math.max(3, Math.round(r * scalingInfo.volumeMult)));
    structureText = scaled.join('-');
    perMovementReps = scaled.reduce((a, b) => a + b, 0);
  } else {
    const rounds = Math.max(2, Math.round(scheme.rounds * scalingInfo.volumeMult));
    const reps = Math.max(4, Math.round(scheme.reps * scalingInfo.volumeMult));
    structureText = `${rounds} round \u2014 ${reps} reps a movimento`;
    perMovementReps = rounds * reps;
  }

  const displayMovements = movements.map(({ movement }) => ({
    name: movement.name,
    repsText: `${perMovementReps}`,
    loadText: loadTextFor(movement, scalingInfo.loadMult),
  }));

  const totalSeconds = movements.reduce((acc, { movement }) => acc + secPerRep(movement) * perMovementReps, 0);
  const estimatedMinutes = Math.max(4, Math.round(totalSeconds / 60));

  return {
    mainMovements: movements,
    estimatedMinutes: Math.min(estimatedMinutes, Math.round(template.duration * 1.6)),
    goalMatch: template.goals.includes(context.goal),
    structureText: `For Time \u2014 ${structureText}`,
    scoreType: 'Tempo totale per completare',
    displayMovements,
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: movements.flatMap(({ movement }) => movement.patterns),
  };
}

function buildAmrapRounds(template, context) {
  const usedIds = new Set();
  const movements = [];
  const scalingInfo = readinessScaling(context.readinessBand);
  const baseReps = template.repScheme.reps;

  for (const slot of template.movement_slots) {
    const picked = pickMetconMovement(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const durationMinutes = Math.max(template.time_domain[0], Math.min(template.time_domain[1], Math.round(template.duration)));

  const displayMovements = movements.map(({ movement }, i) => {
    const reps = Math.max(4, Math.round(baseReps * (1 - 0.2 * i) * scalingInfo.volumeMult));
    return { name: movement.name, repsText: `${reps}`, loadText: loadTextFor(movement, scalingInfo.loadMult) };
  });

  return {
    mainMovements: movements,
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `AMRAP ${durationMinutes}\u2019 \u2014 round di ${displayMovements.map(m => m.repsText).join('-')}`,
    scoreType: 'Round completi + reps extra',
    displayMovements,
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: movements.flatMap(({ movement }) => movement.patterns),
  };
}

function buildAmrapReps(template, context) {
  const usedIds = new Set();
  const slot = template.movement_slots[0];
  const picked = pickMetconMovement(slot, context, usedIds);
  if (!picked) return null;
  const scalingInfo = readinessScaling(context.readinessBand);
  const durationMinutes = Math.max(template.time_domain[0], Math.min(template.time_domain[1], Math.round(template.duration)));
  const unit = template.repScheme.unitOverride || (picked.movement.modality === 'monostructural' ? 'm' : 'reps');

  return {
    mainMovements: [{ movement: picked.movement, chain: picked.chain }],
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `AMRAP reps ${durationMinutes}\u2019 \u2014 massime ripetizioni totali`,
    scoreType: `Reps totali (${unit})`,
    displayMovements: [{ name: picked.movement.name, repsText: 'max', loadText: loadTextFor(picked.movement, scalingInfo.loadMult) }],
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: picked.movement.patterns,
  };
}

function buildEmom(template, context) {
  const usedIds = new Set();
  const movements = [];
  const scalingInfo = readinessScaling(context.readinessBand);

  for (const slot of template.movement_slots) {
    const picked = pickMetconMovement(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const durationMinutes = Math.max(template.time_domain[0], Math.min(template.time_domain[1], Math.round(template.duration)));
  const repsPerMinute = Math.max(2, Math.round(template.repScheme.repsPerMinute * scalingInfo.volumeMult));

  const displayMovements = movements.map(({ movement }) => ({
    name: movement.name,
    repsText: `${repsPerMinute}`,
    loadText: loadTextFor(movement, scalingInfo.loadMult),
  }));

  const rotationNote = movements.length > 1
    ? `alterna un movimento diverso ogni minuto (${movements.length} stazioni a rotazione)`
    : 'stesso movimento ogni minuto';

  return {
    mainMovements: movements,
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `EMOM ${durationMinutes}\u2019 \u2014 ${rotationNote}`,
    scoreType: 'Completamento nel minuto, non a cedimento',
    displayMovements,
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: movements.flatMap(({ movement }) => movement.patterns),
  };
}

function buildTabata(template, context) {
  const usedIds = new Set();
  const movements = [];
  const scalingInfo = readinessScaling(context.readinessBand);

  for (const slot of template.movement_slots) {
    const picked = pickMetconMovement(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const roundsEach = movements.length > 1 ? 4 : 8;
  const displayMovements = movements.map(({ movement }) => ({
    name: movement.name,
    repsText: `${roundsEach} round`,
    loadText: loadTextFor(movement, scalingInfo.loadMult),
  }));

  const structureText = movements.length > 1
    ? `Tabata \u2014 8 round da 20"/10" totali, alternando i due movimenti (${roundsEach} round ciascuno)`
    : `Tabata \u2014 8 round da 20"/10" sullo stesso movimento`;

  return {
    mainMovements: movements,
    estimatedMinutes: 4,
    goalMatch: template.goals.includes(context.goal),
    structureText,
    scoreType: 'Reps nel round peggiore (il più basso)',
    displayMovements,
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: movements.flatMap(({ movement }) => movement.patterns),
  };
}

function buildDeathBy(template, context) {
  const usedIds = new Set();
  const slot = template.movement_slots[0];
  const picked = pickMetconMovement(slot, context, usedIds);
  if (!picked) return null;
  const scalingInfo = readinessScaling(context.readinessBand);
  const durationMinutes = Math.max(template.time_domain[0], Math.min(template.time_domain[1], Math.round(template.duration)));

  return {
    mainMovements: [{ movement: picked.movement, chain: picked.chain }],
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `Death By \u2014 minuto 1: 1 rep, +1 rep ogni minuto (cap ${durationMinutes}\u2019)`,
    scoreType: 'Ultimo minuto completato per intero',
    displayMovements: [{ name: picked.movement.name, repsText: '1, +1/min', loadText: loadTextFor(picked.movement, scalingInfo.loadMult) }],
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: picked.movement.patterns,
  };
}

function buildSteadyOrRecovery(template, context) {
  const usedIds = new Set();
  const movements = [];
  for (const slot of template.movement_slots) {
    const picked = pickMetconMovement(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }
  const durationMinutes = Math.max(template.time_domain[0], Math.min(template.time_domain[1], Math.round(template.duration)));
  const label = { STEADY: 'Steady state', RECOVERY: 'Recovery', TECHNICAL: 'Tecnica leggera' }[template.format] || template.format;

  return {
    mainMovements: movements,
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `${label} \u2014 ${durationMinutes}\u2019 continui`,
    scoreType: null,
    displayMovements: movements.map(({ movement }) => ({ name: movement.name, repsText: `${durationMinutes}'`, loadText: null })),
    targetRpe: template.target_rpe,
    capRpe: readinessScaling(context.readinessBand).capRPE,
    patternsHit: movements.flatMap(({ movement }) => movement.patterns),
  };
}

const METCON_BUILDERS = {
  FOR_TIME: buildForTime,
  AMRAP_ROUNDS: buildAmrapRounds,
  AMRAP_REPS: buildAmrapReps,
  EMOM: buildEmom,
  TABATA: buildTabata,
  DEATH_BY: buildDeathBy,
  STEADY: buildSteadyOrRecovery,
  RECOVERY: buildSteadyOrRecovery,
  TECHNICAL: buildSteadyOrRecovery,
};

function instantiateCandidate(template, context) {
  if (template.format === 'STRENGTH' || template.format === 'SKILL') {
    const time = allocateTime(context.availableMinutes);
    const minutes = Math.max(10, context.availableMinutes - time.warmup - time.cooldown);
    const built = template.format === 'STRENGTH'
      ? buildStrength(template, context, minutes)
      : buildSkill(template, context, minutes);
    if (!built) return null;
    return {
      template, built,
      estimatedMinutes: minutes,
      goalMatch: template.goals.includes(context.goal),
      patternsHit: built.patternsHit,
      mainMovements: [{ movement: built.movementRef }],
    };
  }

  const builder = METCON_BUILDERS[template.format];
  if (!builder) return null;
  const builderContext = { ...context, isRecoverySession: template.format === 'RECOVERY' };
  const built = builder(template, builderContext);
  if (!built) return null;
  return {
    template, built,
    estimatedMinutes: built.estimatedMinutes,
    goalMatch: built.goalMatch,
    patternsHit: built.patternsHit,
    mainMovements: built.mainMovements,
  };
}

export function generateWod(input) {
  const {
    goal, availableMinutes, level, equipment, limitations,
    recentPatterns, forceRecovery, priorityMovementIds, oneRMs, recentTemplateIds,
  } = input;

  const band = input.band || readinessBand(input.readinessScore);

  const context = {
    goal, availableMinutes, level, equipment, limitations,
    recentPatterns, readinessBand: band,
    priorityMovementIds: priorityMovementIds || [],
    oneRMs: oneRMs || {},
    recentTemplateIds: recentTemplateIds || [],
  };

  const isRecoveryTemplate = t => t.id === 'recovery_session' || t.id === 'recovery_technical';

  let pool = TEMPLATES.filter(t =>
    t.goals.includes(goal) &&
    availableMinutes >= t.time_domain[0] * 0.5 &&
    !isRecoveryTemplate(t) &&
    (!t.high_readiness_only || band.key === 'high')
  );

  if (forceRecovery || band.key === 'low') {
    pool = TEMPLATES.filter(isRecoveryTemplate);
  }
  if (pool.length === 0) {
    pool = TEMPLATES.filter(t => t.goals.includes('general') && !isRecoveryTemplate(t));
  }
  if (pool.length === 0) pool = TEMPLATES.filter(isRecoveryTemplate);

  const candidates = [];
  for (const template of pool) {
    const candidate = instantiateCandidate(template, context);
    if (!candidate) continue;
    const violations = validate(candidate, context);
    if (violations.length > 0) continue;
    candidate.scoreValue = score(candidate, context);
    candidates.push(candidate);
  }

  if (candidates.length === 0) {
    return fallbackSession(context);
  }

  candidates.sort((a, b) => b.scoreValue - a.scoreValue);
  // Pick randomly among the near-top candidates (within a small score margin)
  // instead of always the single top scorer — real variety, not just a tiebreak.
  const topScore = candidates[0].scoreValue;
  const contenders = candidates.filter(c => c.scoreValue >= topScore - 10);
  const best = contenders[Math.floor(Math.random() * contenders.length)];
  const time = allocateTime(availableMinutes);
  const warmup = buildWarmup(time.warmup, best.patternsHit, equipment);

  const reasons = [
    `Compatibile con ${availableMinutes} minuti disponibili`,
    `Readiness ${input.readinessScore ?? '-'}/100 (${band.label.toLowerCase()})`,
  ];
  const recentHit = best.patternsHit.some(p => recentPatterns.includes(p));
  reasons.push(recentHit
    ? 'Pattern in parte ripetuti rispetto allo storico recente, volume contenuto di conseguenza'
    : 'Variet\u00e0 rispetto ai pattern delle ultime sessioni');

  const isStrengthOrSkill = best.template.format === 'STRENGTH' || best.template.format === 'SKILL';

  return {
    templateLabel: best.template.label,
    templateId: best.template.id,
    format: best.template.format,
    stimulus: best.template.stimulus,
    warmup,
    primary: isStrengthOrSkill ? best.built : null,
    main: isStrengthOrSkill ? null : {
      structureText: best.built.structureText,
      scoreType: best.built.scoreType,
      movements: best.built.displayMovements,
      estimatedMinutes: best.built.estimatedMinutes,
      targetRpe: best.built.targetRpe,
      capRpe: best.built.capRpe,
    },
    cooldown: { minutes: time.cooldown, text: 'Camminata leggera + stretching mirato sui gruppi muscolari lavorati' },
    reasons,
    readiness: { score: input.readinessScore, band },
    patternsHit: best.patternsHit,
  };
}

function fallbackSession(context) {
  const warmup = buildWarmup(5, ['cyclical'], context.equipment);
  const minutes = Math.min(context.availableMinutes, 20);
  return {
    templateLabel: 'Recovery / mobilit\u00e0',
    format: 'RECOVERY',
    stimulus: 'recupero attivo a basso rischio',
    warmup,
    primary: null,
    main: {
      structureText: `Recovery \u2014 ${minutes}\u2019 continui`,
      scoreType: null,
      movements: [{ name: 'Camminata veloce o bike leggera', repsText: `${minutes}'`, loadText: null }],
      estimatedMinutes: minutes,
      targetRpe: [2, 4],
      capRpe: 4,
    },
    cooldown: { minutes: 5, text: 'Stretching generale' },
    reasons: ['Nessun template soddisfa i vincoli attuali in sicurezza (es. attrezzatura mancante per l\u2019obiettivo scelto): proposta una sessione di recupero a basso rischio'],
    readiness: { score: undefined, band: context.readinessBand },
    patternsHit: ['cyclical'],
  };
}

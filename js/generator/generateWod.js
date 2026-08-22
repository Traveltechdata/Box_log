import { TEMPLATES } from '../data/templates.js';
import { getMovement, MOVEMENTS } from '../data/movements.js';
import { pickMovement, readinessScaling, allocateTime } from './scaling.js';
import { validate, score } from './validation.js';
import { readinessBand } from './readiness.js';
import { buildStructuredWarmup } from '../data/warmups.js';

// Estimated seconds per rep, by pattern - rough, used only for FOR_TIME time-fit checks
// (AMRAP/EMOM/TABATA/DEATH_BY/STRENGTH/SKILL are time-capped by definition, no estimate needed).
const SEC_PER_REP = {
  squat: 3, hinge: 3, press: 3, push: 2.5, pull: 3, olympic: 4,
  core: 2.5, jump: 2, lunge: 3, carry: 8, cyclical: 1, mobility: 1,
};

// No WOD is ever shorter than 8' (not intense enough to mean anything) or
// longer than 25' (loses focus as a single WOD) — applies to every format.
export const WOD_MIN_MINUTES = 8;
export const WOD_MAX_MINUTES = 25;

const STRENGTH_SCHEMES = {
  high: { sets: 5, reps: 3, pct: 0.85 },
  normal: { sets: 5, reps: 5, pct: 0.75 },
  moderate: { sets: 4, reps: 5, pct: 0.65 },
};

function secPerRep(movement) {
  return SEC_PER_REP[movement.patterns[0]] || 3;
}

// Time-capped formats (AMRAP/EMOM/Tabata/Death By/Steady) should fill the time
// the athlete actually has, not just default to the template's baseline duration.
function fitDurationMinutes(template, context) {
  let target;
  if (context.noOverhead) {
    target = context.availableMinutes;
  } else {
    const time = allocateTime(context.availableMinutes);
    target = Math.max(template.time_domain[0], context.availableMinutes - time.warmup - time.cooldown);
  }
  const lo = Math.max(template.time_domain[0], WOD_MIN_MINUTES);
  const hi = Math.min(template.time_domain[1], WOD_MAX_MINUTES);
  return Math.max(lo, Math.min(hi, Math.round(target)));
}

function loadTextFor(movement, loadMult, gender) {
  if (movement.heightRx) {
    // Box height doesn't scale down with readiness the way a barbell load
    // does — it's a fixed piece of equipment, so show the standard Rx as-is.
    const { m, f } = movement.heightRx;
    if (gender === 'm') return `${m}"`;
    if (gender === 'f') return `${f}"`;
    return `${m}"/${f}"`;
  }
  if (!movement.loadRx) return null;
  const m = Math.round((movement.loadRx.m * loadMult) * 2) / 2; // nearest 0.5kg
  const f = Math.round((movement.loadRx.f * loadMult) * 2) / 2;
  if (gender === 'm') return `${m}kg`;
  if (gender === 'f') return `${f}kg`;
  return `${m}/${f}kg`;
}

function pickMetconMovement(slot, context, usedIds) {
  const picked = pickMovement(slot, context, usedIds);
  return picked; // { movement, chain }
}

// When the athlete picked their own movements (assisted "Genera tu" flow),
// use those directly in order instead of the algorithmic search/scoring pick.
function pickForSlot(slot, context, usedIds) {
  if (context.explicitMovements) {
    const next = context.explicitMovements.find(m => !usedIds.has(m.id));
    if (next) return { movement: next, chain: [next.id] };
    // User provided fewer movements than the format ideally uses — let the
    // algorithm complete the WOD with a sensible complementary movement
    // instead of failing the whole generation.
    return pickMetconMovement(slot, context, usedIds);
  }
  return pickMetconMovement(slot, context, usedIds);
}

// For continuous/steady-state work, prefer machines actually suited to sustained
// pacing (row/bike/ski erg/run) over high-skill, high-impact movements like jump
// rope, which the variety/fatigue tie-break could otherwise select.
function preferSustainedCardio(picked, context) {
  if (picked && picked.movement.sustainedCardio) return picked;
  const options = MOVEMENTS.filter(m => m.sustainedCardio && m.equipment.every(e => context.equipment.includes(e)));
  if (options.length === 0) return picked;
  const goalMatch = options.find(m => context.priorityMovementIds?.includes(m.id));
  const choice = goalMatch || options[Math.floor(Math.random() * options.length)];
  return { movement: choice, chain: [choice.id] };
}

function pickPreferredMovement(template, context) {
  const ids = template.preferredMovementIds || [];
  const isUsable = m => m && m.equipment.every(e => context.equipment.includes(e)) && !context.limitations.includes(m.id);

  const direct = ids.map(getMovement).filter(Boolean).filter(isUsable);
  if (direct.length > 0) {
    const goalMatch = direct.find(m => context.priorityMovementIds.includes(m.id));
    return { movement: goalMatch || direct[0], substituted: false };
  }

  // None of the ideal barbell/skill movements are usable (e.g. no barbell available).
  // Walk each preferred movement's substitution chain rather than giving up —
  // a real (if lighter) strength/skill stimulus beats collapsing to recovery.
  for (const id of ids) {
    const original = getMovement(id);
    if (!original) continue;
    let current = original;
    let guard = 0;
    while (guard++ < 6) {
      if (isUsable(current)) {
        return { movement: current, substituted: true, originalName: original.name };
      }
      const nextId = current.substitutions?.find(sid => !context.limitations.includes(sid));
      if (!nextId) break;
      current = getMovement(nextId);
      if (!current) break;
    }
  }
  return null;
}

// ---------------- warm-up ----------------
function buildWarmup(minutes, patterns, equipment) {
  return buildStructuredWarmup(minutes, patterns, equipment);
}

// ---------------- STRENGTH ----------------
function buildStrength(template, context, minutes) {
  const picked = pickPreferredMovement(template, context);
  if (!picked) return null;
  const { movement, substituted, originalName } = picked;

  const base = STRENGTH_SCHEMES[context.readinessBand.key] || STRENGTH_SCHEMES.normal;
  let { sets, reps, pct } = base;
  const isOlympic = movement.patterns.includes('olympic');
  if (isOlympic) {
    reps = Math.max(1, reps - 2);
    pct = Math.max(0.5, pct - 0.05);
  }

  let prescriptionText;
  let loadText;

  if (movement.isStrengthLift) {
    const oneRM = context.oneRMs?.[movement.id];
    if (oneRM) {
      const loadKg = Math.round((oneRM * pct) / 2.5) * 2.5;
      loadText = `${loadKg}kg`;
    }
    prescriptionText = loadText
      ? `${sets} x ${reps} @ ${Math.round(pct * 100)}% (${loadText})`
      : `${sets} x ${reps} @ ${Math.round(pct * 100)}% del tuo 1RM \u2014 inserisci il massimale in Profilo per vedere il carico in kg`;
  } else {
    // No barbell available for the ideal lift: real load, RPE-anchored instead of %1RM.
    prescriptionText = `${sets} x ${reps}, carico che ti porti a RPE 7-8 \u2014 aumenta ad ogni serie se il movimento resta pulito`;
  }

  if (substituted) {
    prescriptionText += ` (sostituito a ${originalName}: bilanciere/rack non disponibili in Profilo)`;
  }

  return {
    kind: 'strength',
    label: 'Forza',
    movement: { name: movement.name },
    movementRef: movement,
    sets, reps, pct: Math.round(pct * 100),
    loadText,
    minutes,
    prescriptionText,
    patternsHit: movement.patterns,
  };
}

// ---------------- SKILL ----------------
function buildSkill(template, context, minutes) {
  const picked = pickPreferredMovement(template, context);
  if (!picked) return null;
  const { movement, substituted, originalName } = picked;

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

  if (substituted) {
    prescriptionText += ` (sostituito a ${originalName}: attrezzatura ideale non disponibile in Profilo)`;
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
    const picked = pickForSlot(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const scheme = template.repScheme;
  let perMovementReps;
  let ladderRungs = null;
  const baseReps = Math.max(4, Math.round((scheme.reps || 12) * scalingInfo.volumeMult));

  if (scheme.type === 'ladder') {
    ladderRungs = scheme.reps.map(r => Math.max(3, Math.round(r * scalingInfo.volumeMult)));
    perMovementReps = ladderRungs.reduce((a, b) => a + b, 0);
  } else {
    const rounds = Math.max(2, Math.round(scheme.rounds * scalingInfo.volumeMult));
    perMovementReps = rounds * baseReps;
  }

  const secPerMovementRep = () => movements.reduce((acc, { movement }) => acc + secPerRep(movement), 0);
  let totalSeconds = secPerMovementRep() * perMovementReps;
  const minSec = WOD_MIN_MINUTES * 60, maxSec = WOD_MAX_MINUTES * 60;

  // Always land inside the global [8,25] min window by scaling volume, not
  // just estimating whatever the base scheme happens to produce.
  if (totalSeconds < minSec || totalSeconds > maxSec) {
    const factor = totalSeconds < minSec ? minSec / totalSeconds : maxSec / totalSeconds;
    if (ladderRungs) {
      ladderRungs = ladderRungs.map(r => Math.max(3, Math.round(r * factor)));
      perMovementReps = ladderRungs.reduce((a, b) => a + b, 0);
    } else {
      perMovementReps = Math.max(8, Math.round(perMovementReps * factor));
    }
    totalSeconds = secPerMovementRep() * perMovementReps;
  }

  const roundsForDisplay = ladderRungs ? null : Math.max(2, Math.round(perMovementReps / baseReps));
  const structureText = ladderRungs
    ? ladderRungs.join('-')
    : `${roundsForDisplay} round \u2014 ${baseReps} reps a movimento`;

  const perMovementRepsText = ladderRungs ? ladderRungs.join('-') : `${roundsForDisplay} x ${baseReps}`;
  const displayMovements = movements.map(({ movement }) => ({
    name: movement.name,
    repsText: perMovementRepsText,
    loadText: loadTextFor(movement, scalingInfo.loadMult, context.gender),
  }));

  const estimatedMinutes = Math.max(WOD_MIN_MINUTES, Math.min(WOD_MAX_MINUTES, Math.round(totalSeconds / 60)));

  return {
    mainMovements: movements,
    estimatedMinutes,
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
    const picked = pickForSlot(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const durationMinutes = fitDurationMinutes(template, context);

  const displayMovements = movements.map(({ movement }, i) => {
    const reps = Math.max(4, Math.round(baseReps * (1 - 0.2 * i) * scalingInfo.volumeMult));
    return { name: movement.name, repsText: `${reps}`, loadText: loadTextFor(movement, scalingInfo.loadMult, context.gender) };
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
  const requireCalorieCapable = template.repScheme.unitOverride === 'cal';
  let picked = pickForSlot(slot, context, usedIds);

  if (requireCalorieCapable && (!picked || !picked.movement.calorieCapable)) {
    const calorieOnly = MOVEMENTS.filter(m => m.calorieCapable && m.equipment.every(e => context.equipment.includes(e)));
    if (calorieOnly.length === 0) return null;
    const goalMatch = calorieOnly.find(m => context.priorityMovementIds?.includes(m.id));
    const choice = goalMatch || calorieOnly[Math.floor(Math.random() * calorieOnly.length)];
    picked = { movement: choice, chain: [choice.id] };
  }
  if (!picked) return null;

  const scalingInfo = readinessScaling(context.readinessBand);
  const durationMinutes = fitDurationMinutes(template, context);
  const unit = template.repScheme.unitOverride || (picked.movement.modality === 'monostructural' ? 'm' : 'reps');

  return {
    mainMovements: [{ movement: picked.movement, chain: picked.chain }],
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `AMRAP reps ${durationMinutes}\u2019 \u2014 massime ${unit === 'cal' ? 'calorie' : 'ripetizioni'} totali`,
    scoreType: unit === 'cal' ? 'Calorie totali' : 'Reps totali',
    displayMovements: [{ name: picked.movement.name, repsText: 'max', loadText: loadTextFor(picked.movement, scalingInfo.loadMult, context.gender) }],
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
    const picked = pickForSlot(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  const durationMinutes = fitDurationMinutes(template, context);
  const repsPerMinute = Math.max(2, Math.round(template.repScheme.repsPerMinute * scalingInfo.volumeMult));

  const displayMovements = movements.map(({ movement }) => ({
    name: movement.name,
    repsText: `${repsPerMinute}`,
    loadText: loadTextFor(movement, scalingInfo.loadMult, context.gender),
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
    const picked = pickForSlot(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }

  // Each movement gets its own full 8-round Tabata block back-to-back
  // (8 rounds x 20"/10" = 4 min per movement) so a 2-movement WOD totals 8 minutes.
  const displayMovements = movements.map(({ movement }) => ({
    name: movement.name,
    repsText: '8 round',
    loadText: loadTextFor(movement, scalingInfo.loadMult, context.gender),
  }));

  const structureText = movements.length > 1
    ? 'Tabata \u2014 8 round da 20"/10" sul primo movimento, poi 8 round da 20"/10" sul secondo (8 minuti totali)'
    : 'Tabata \u2014 8 round da 20"/10" sullo stesso movimento (4 minuti)';

  return {
    mainMovements: movements,
    estimatedMinutes: movements.length * 4,
    goalMatch: template.goals.includes(context.goal),
    structureText,
    scoreType: 'Reps nel round peggiore di ogni blocco (il più basso)',
    displayMovements,
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: movements.flatMap(({ movement }) => movement.patterns),
  };
}

function buildDeathBy(template, context) {
  const usedIds = new Set();
  const slot = template.movement_slots[0];
  const picked = pickForSlot(slot, context, usedIds);
  if (!picked) return null;
  const scalingInfo = readinessScaling(context.readinessBand);
  const durationMinutes = fitDurationMinutes(template, context);

  return {
    mainMovements: [{ movement: picked.movement, chain: picked.chain }],
    estimatedMinutes: durationMinutes,
    goalMatch: template.goals.includes(context.goal),
    structureText: `Death By \u2014 minuto 1: 1 rep, +1 rep ogni minuto (cap ${durationMinutes}\u2019)`,
    scoreType: 'Ultimo minuto completato per intero',
    displayMovements: [{ name: picked.movement.name, repsText: '1, +1/min', loadText: loadTextFor(picked.movement, scalingInfo.loadMult, context.gender) }],
    targetRpe: template.target_rpe,
    capRpe: scalingInfo.capRPE,
    patternsHit: picked.movement.patterns,
  };
}

function buildSteadyOrRecovery(template, context) {
  const usedIds = new Set();
  const movements = [];
  for (const slot of template.movement_slots) {
    let picked = pickForSlot(slot, context, usedIds);
    if (!picked) return null;
    if (template.format === 'STEADY' && slot.pattern === 'cyclical') {
      picked = preferSustainedCardio(picked, context);
    }
    usedIds.add(picked.movement.id);
    movements.push({ movement: picked.movement, chain: picked.chain });
  }
  const durationMinutes = fitDurationMinutes(template, context);
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
    recentPatterns, forceRecovery, priorityMovementIds, oneRMs, recentTemplateIds, gender,
    forceFormat, avoidPatterns, noOverhead,
  } = input;

  const band = input.band || readinessBand(input.readinessScore);

  const context = {
    goal, availableMinutes, level, equipment, limitations,
    recentPatterns, readinessBand: band,
    priorityMovementIds: priorityMovementIds || [],
    oneRMs: oneRMs || {},
    recentTemplateIds: recentTemplateIds || [],
    gender: gender || null,
    avoidPatterns: avoidPatterns || [],
    noOverhead: !!noOverhead,
  };

  const isRecoveryTemplate = t => t.id === 'recovery_session' || t.id === 'recovery_technical';
  // A template whose only movement slot is a pattern we're avoiding (e.g. a
  // squat-only Tabata right after a squat-focused Strength block) is dropped
  // outright when other templates can still fill the goal/time window.
  const isPureAvoidTemplate = t => (avoidPatterns || []).length > 0 &&
    t.movement_slots.length === 1 && (avoidPatterns || []).includes(t.movement_slots[0].pattern);

  let pool = TEMPLATES.filter(t =>
    t.goals.includes(goal) &&
    availableMinutes >= t.time_domain[0] * 0.5 &&
    !isRecoveryTemplate(t) &&
    (!t.high_readiness_only || band.key === 'high') &&
    (!forceFormat || t.format === forceFormat) &&
    !isPureAvoidTemplate(t)
  );

  if (pool.length === 0) {
    // Dropping the pure-avoid filter first is a smaller compromise than
    // dropping the format constraint below.
    pool = TEMPLATES.filter(t =>
      t.goals.includes(goal) &&
      availableMinutes >= t.time_domain[0] * 0.5 &&
      !isRecoveryTemplate(t) &&
      (!t.high_readiness_only || band.key === 'high') &&
      (!forceFormat || t.format === forceFormat)
    );
  }

  if (pool.length === 0 && forceFormat) {
    // The requested format doesn't exist for this goal/time window — drop the
    // constraint rather than fail the whole session.
    pool = TEMPLATES.filter(t =>
      t.goals.includes(goal) &&
      availableMinutes >= t.time_domain[0] * 0.5 &&
      !isRecoveryTemplate(t) &&
      (!t.high_readiness_only || band.key === 'high')
    );
  }

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
  const raise = pickGeneralRaiseFallback(context.equipment);
  return {
    templateLabel: 'Recovery / mobilit\u00e0',
    format: 'RECOVERY',
    stimulus: 'recupero attivo a basso rischio',
    warmup,
    primary: null,
    main: {
      structureText: `Recovery \u2014 ${minutes}\u2019 continui`,
      scoreType: null,
      movements: [{ name: raise, repsText: `${minutes}'`, loadText: null }],
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

// Recovery pieces should reach for a machine (row/bike/ski erg) before
// falling back to walking, which is the last resort when nothing else is available.
function pickGeneralRaiseFallback(equipment) {
  if (equipment.includes('rower')) return 'Vogatore Zona 2';
  if (equipment.includes('bike')) return 'Echo bike / Assault bike Zona 2';
  if (equipment.includes('ski_erg')) return 'Ski erg Zona 2';
  return 'Camminata veloce';
}

// ---------------- assisted generation: user picks format + 2-3 movements ----------------
// The athlete chooses the shape (For Time / AMRAP / EMOM / Total reps) and the
// movements; the engine fills in every number (reps, rounds, loads) the same
// way it would for an algorithmic pick, just skipping the movement search.
const DEFAULT_REP_SCHEME_FOR_FORMAT = {
  FOR_TIME: { type: 'ladder', reps: [21, 15, 9] },
  AMRAP_ROUNDS: { reps: 15 },
  EMOM: { repsPerMinute: 10 },
  AMRAP_REPS: {},
};

export function generateWodFromMovements(input) {
  const {
    format, movementIds, availableMinutes, level, equipment, limitations,
    readinessScore, gender, oneRMs,
  } = input;
  const band = input.band || readinessBand(readinessScore);
  const movements = (movementIds || []).map(getMovement).filter(Boolean);
  if (movements.length === 0) return null;

  const context = {
    goal: 'conditioning', availableMinutes, level, equipment, limitations,
    recentPatterns: [], readinessBand: band,
    priorityMovementIds: [], oneRMs: oneRMs || {}, recentTemplateIds: [],
    gender: gender || null, avoidPatterns: [],
    explicitMovements: movements,
    noOverhead: true,
  };

  const repScheme = { ...DEFAULT_REP_SCHEME_FOR_FORMAT[format] };
  if (format === 'AMRAP_REPS' && movements[0].calorieCapable) repScheme.unitOverride = 'cal';
  if (format === 'EMOM') {
    const isHeavy = movements.some(m => m.patterns.includes('olympic') || m.isStrengthLift || m.fatigue >= 4);
    repScheme.repsPerMinute = isHeavy ? 4 : 10;
  }

  const IDEAL_SLOT_COUNT = { FOR_TIME: 2, AMRAP_ROUNDS: 3, EMOM: 1, AMRAP_REPS: 1 };
  const slotCount = format === 'AMRAP_REPS'
    ? 1
    : Math.min(3, Math.max(movements.length, IDEAL_SLOT_COUNT[format] || movements.length));

  const FILLER_PATTERN_ROTATION = ['squat', 'pull', 'push', 'hinge', 'cyclical', 'core'];
  const usedPatterns = new Set(movements.flatMap(m => m.patterns));
  const fillerPatterns = FILLER_PATTERN_ROTATION.filter(p => !usedPatterns.has(p));
  const movementSlots = Array.from({ length: slotCount }, (_, i) => {
    if (i < movements.length) return { pattern: movements[i].patterns[0], modality: movements[i].modality };
    const fp = fillerPatterns[(i - movements.length) % Math.max(1, fillerPatterns.length)] || FILLER_PATTERN_ROTATION[i % FILLER_PATTERN_ROTATION.length];
    return { pattern: fp, modality: null }; // null modality = "any modality", resolved in pickMovement
  });

  const durationMinutes = Math.max(WOD_MIN_MINUTES, Math.min(WOD_MAX_MINUTES, Math.round(availableMinutes)));
  const template = {
    id: 'custom_' + format.toLowerCase(),
    label: 'WOD personalizzato',
    format,
    goals: ['conditioning'],
    time_domain: [WOD_MIN_MINUTES, WOD_MAX_MINUTES],
    duration: durationMinutes,
    movement_slots: movementSlots,
    repScheme,
    target_rpe: [7, 9],
  };

  const builder = METCON_BUILDERS[format];
  if (!builder) return null;
  const built = builder(template, context);
  if (!built) return null;

  const time = allocateTime(availableMinutes);
  const warmup = buildWarmup(time.warmup, built.patternsHit, equipment);

  return {
    templateLabel: 'WOD personalizzato',
    templateId: template.id,
    format,
    stimulus: 'Formato e movimenti scelti da te \u2014 numeri e carichi calcolati dal motore',
    warmup,
    primary: null,
    main: {
      structureText: built.structureText,
      scoreType: built.scoreType,
      movements: built.displayMovements,
      estimatedMinutes: built.estimatedMinutes,
      targetRpe: built.targetRpe,
      capRpe: built.capRpe,
    },
    cooldown: { minutes: time.cooldown, text: 'Camminata leggera + stretching mirato sui gruppi muscolari lavorati' },
    reasons: ['Formato e movimenti selezionati manualmente', `Compatibile con ${availableMinutes} minuti disponibili`],
    readiness: { score: readinessScore, band },
    patternsHit: built.patternsHit,
  };
}

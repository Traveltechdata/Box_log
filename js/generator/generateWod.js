import { TEMPLATES } from '../data/templates.js';
import { getMovement } from '../data/movements.js';
import { pickMovement, readinessScaling, allocateTime } from './scaling.js';
import { validate, score } from './validation.js';
import { readinessBand } from './readiness.js';

// Estimated seconds per rep, by pattern - rough, used only for time-fit checks.
const SEC_PER_REP = {
  squat: 3, hinge: 3, press: 3, push: 2.5, pull: 3, olympic: 4,
  core: 2.5, jump: 2, lunge: 3, carry: 8, cyclical: 1, mobility: 1,
};

function estimateMinutesForSlots(mainMovements, roundsOrReps) {
  const perRoundSeconds = mainMovements.reduce((acc, item) => {
    const sec = SEC_PER_REP[item.movement.patterns[0]] || 3;
    return acc + sec * item.reps;
  }, 0);
  return (perRoundSeconds * roundsOrReps) / 60;
}

function buildWarmup(minutes, goalPatterns) {
  const items = [
    `${Math.max(2, Math.round(minutes * 0.3))} min di cardio leggero (row/bike/corsa)`,
    'Mobilità articolare: anche, spalle, caviglie',
    `2-3 giri leggeri con i pattern della sessione (${[...new Set(goalPatterns)].join(', ')})`,
  ];
  return { minutes, items };
}

function buildSkillBlock(minutes, mainMovements, band) {
  if (minutes <= 0) return null;
  // Prefer a weightlifting/gymnastics movement for the technical focus;
  // a monostructural piece (running, rowing...) doesn't read well as "technique work".
  const focus = mainMovements.find(m => m.movement.modality !== 'monostructural') || mainMovements[0];
  return {
    minutes,
    text: `${Math.max(3, Math.round(minutes / 4))} serie tecniche di ${focus.movement.name}, RPE ${band.key === 'low' ? '3-4' : '5-6'}`,
  };
}

function repsForSlot(movement, band, volumeMult, format) {
  const base = format === 'Strength' ? 5 : (movement.modality === 'monostructural' ? 250 : 12);
  const scaled = Math.max(movement.modality === 'monostructural' ? 100 : 4, Math.round(base * volumeMult));
  return scaled;
}

function instantiateCandidate(template, baseContext) {
  const usedIds = new Set();
  const mainMovements = [];
  const context = { ...baseContext, isRecoverySession: template.format === 'Recovery' };
  const scalingInfo = readinessScaling(context.readinessBand);

  for (const slot of template.movement_slots) {
    const picked = pickMovement(slot, context, usedIds);
    if (!picked) return null;
    usedIds.add(picked.movement.id);
    const reps = repsForSlot(picked.movement, context.readinessBand, scalingInfo.volumeMult, template.format);
    mainMovements.push({ movement: picked.movement, reps, substitutionChain: picked.chain });
  }

  const rounds = template.format === 'AMRAP' || template.format === 'Intervals' || template.format === 'EMOM' || template.format === 'E2MOM'
    ? 1
    : Math.max(2, Math.round(3 * scalingInfo.volumeMult));

  const estimatedMinutes = template.format === 'Strength'
    ? Math.round(template.duration * scalingInfo.volumeMult)
    : Math.round(estimateMinutesForSlots(mainMovements, rounds === 1 ? 1 : rounds) || template.duration * scalingInfo.volumeMult);

  const candidate = {
    template,
    mainMovements,
    rounds,
    estimatedMinutes: Math.max(4, Math.min(estimatedMinutes, Math.round(template.duration * 1.4))),
    goalMatch: template.goals.includes(context.goal),
    scalingInfo,
  };
  return candidate;
}

export function generateWod(input) {
  const {
    goal, availableMinutes, level, equipment, limitations,
    recentPatterns, energy, sleep, stress, soreness, forceRecovery,
    priorityMovementIds,
  } = input;

  const band = input.band || readinessBand(input.readinessScore);

  const context = {
    goal, availableMinutes, level, equipment, limitations,
    recentPatterns, readinessBand: band, priorityMovementIds: priorityMovementIds || [],
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
    // Fallback: guaranteed-safe bodyweight recovery session.
    return fallbackSession(context);
  }

  candidates.sort((a, b) => b.scoreValue - a.scoreValue);
  const best = candidates[0];

  const time = allocateTime(availableMinutes);
  const goalPatterns = best.mainMovements.map(m => m.movement.patterns[0]);
  const warmup = buildWarmup(time.warmup, goalPatterns);
  const skill = time.skill > 0 ? buildSkillBlock(time.skill, best.mainMovements, band) : null;

  const reasons = [
    `Compatibile con ${availableMinutes} minuti disponibili`,
    `Readiness ${input.readinessScore ?? '-'}/100 (${band.label.toLowerCase()}) \u2192 ${best.scalingInfo.intensityNote}`,
  ];
  if (best.mainMovements.some(m => m.substitutionChain.length > 1)) {
    reasons.push('Alcuni movimenti sostituiti per attrezzatura o limitazioni indicate');
  }
  const recentHit = best.mainMovements.some(m => m.movement.patterns.some(p => recentPatterns.includes(p)));
  reasons.push(recentHit ? 'Pattern in parte ripetuti rispetto allo storico recente, volume contenuto di conseguenza' : 'Varietà rispetto ai pattern delle ultime sessioni');

  return {
    templateLabel: best.template.label,
    format: best.template.format,
    stimulus: best.template.stimulus,
    warmup,
    skill,
    main: {
      format: best.template.format,
      rounds: best.rounds,
      estimatedMinutes: best.estimatedMinutes,
      movements: best.mainMovements.map(m => ({
        name: m.movement.name,
        reps: m.reps,
        unit: m.movement.modality === 'monostructural' ? 'm' : 'reps',
      })),
      targetRpe: best.template.target_rpe,
      capRpe: best.scalingInfo.capRPE,
    },
    cooldown: { minutes: time.cooldown, text: 'Camminata leggera + stretching mirato sui gruppi muscolari lavorati' },
    reasons,
    readiness: { score: input.readinessScore, band },
    patternsHit: best.mainMovements.flatMap(m => m.movement.patterns),
  };
}

function fallbackSession(context) {
  return {
    templateLabel: 'Recovery / mobilit\u00e0',
    format: 'Recovery',
    stimulus: 'recupero attivo a basso rischio',
    warmup: { minutes: 5, items: ['Mobilit\u00e0 guidata di 5 minuti'] },
    skill: null,
    main: {
      format: 'Steady',
      rounds: 1,
      estimatedMinutes: Math.min(context.availableMinutes, 20),
      movements: [{ name: 'Camminata veloce o bike leggera', reps: Math.min(context.availableMinutes, 20), unit: 'min' }],
      targetRpe: [2, 4],
      capRpe: 4,
    },
    cooldown: { minutes: 5, text: 'Stretching generale' },
    reasons: ['Nessun template soddisfa i vincoli attuali in sicurezza: proposta una sessione di recupero a basso rischio'],
    readiness: { score: undefined, band: context.readinessBand },
    patternsHit: ['cyclical'],
  };
}

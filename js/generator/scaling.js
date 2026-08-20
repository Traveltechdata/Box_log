import { MOVEMENTS, getMovement } from '../data/movements.js';

// Pick the best movement for a slot given equipment, limitations, level and recent history.
export function pickMovement(slot, context, usedIds) {
  const { equipment, limitations, level, recentPatterns, priorityMovementIds = [] } = context;

  const candidates = MOVEMENTS.filter(m =>
    m.patterns.includes(slot.pattern) &&
    m.modality === slot.modality &&
    !usedIds.has(m.id) &&
    (!m.recoveryOnly || context.isRecoverySession)
  );

  const scored = candidates.map(m => {
    let score = 0;
    const hasEquipment = m.equipment.length === 0 || m.equipment.every(e => equipment.includes(e));
    if (!hasEquipment) score -= 100;
    if (limitations.includes(m.id)) score -= 100;
    // level fit: beginners penalized for high-skill movements
    const levelSkillCap = { beginner: 2, intermediate: 4, advanced: 5 }[level] ?? 3;
    if (m.skill > levelSkillCap) score -= (m.skill - levelSkillCap) * 15;
    // variety: penalize patterns hit hard in recent sessions
    const recentCount = recentPatterns.filter(p => p === slot.pattern).length;
    score -= recentCount * 5;
    // mild preference for lower fatigue/grip cost as a tiebreaker
    score -= (m.fatigue + m.grip) * 0.5;
    // boost movements tied to an active quarterly goal
    if (priorityMovementIds.includes(m.id)) score += 25;
    return { movement: m, score, hasEquipment };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.find(s => s.hasEquipment) || scored[0];
  if (!best) return null;

  return resolveSubstitution(best.movement, context);
}

// Walk the substitution chain until we find a movement compatible with
// equipment and limitations (safety and equipment always win over the original pick).
export function resolveSubstitution(movement, context) {
  const { equipment, limitations } = context;
  let current = movement;
  const chain = [current.id];
  let guard = 0;

  while (guard++ < 6) {
    const hasEquipment = current.equipment.length === 0 || current.equipment.every(e => equipment.includes(e));
    const forbidden = limitations.includes(current.id);
    if (hasEquipment && !forbidden) return { movement: current, chain };
    if (!current.substitutions || current.substitutions.length === 0) break;
    const nextId = current.substitutions.find(id => !limitations.includes(id)) || current.substitutions[0];
    const next = getMovement(nextId);
    if (!next) break;
    current = next;
    chain.push(current.id);
  }
  return { movement: current, chain };
}

// Readiness-based scaling notes + numeric multipliers applied to volume/intensity.
export function readinessScaling(band) {
  switch (band.key) {
    case 'high':
      return { volumeMult: 1.05, loadMult: 1.0, intensityNote: 'puoi lavorare vicino al massimale del giorno', capRPE: 9 };
    case 'normal':
      return { volumeMult: 1.0, loadMult: 1.0, intensityNote: 'carico e ritmo abituali', capRPE: 8 };
    case 'moderate':
      return { volumeMult: 0.85, loadMult: 0.85, intensityNote: 'riduci carico di ~15-20%, dai priorità alla tecnica', capRPE: 7 };
    case 'low':
    default:
      return { volumeMult: 0.6, loadMult: 0.7, intensityNote: 'lavoro leggero, tecnica o Zona 2, niente test', capRPE: 5 };
  }
}

// Allocates the session into warm-up / main-block / cooldown minutes.
// There is no separate "skill" slot anymore: for STRENGTH/SKILL templates the
// main block IS the strength/skill work; for everything else it's the metcon.
export function allocateTime(availableMinutes) {
  if (availableMinutes <= 15) {
    return { warmup: Math.max(4, Math.round(availableMinutes * 0.3)), main: 0, cooldown: 2 };
  }
  if (availableMinutes <= 30) {
    return { warmup: 7, main: 0, cooldown: 3 };
  }
  if (availableMinutes <= 45) {
    return { warmup: 8, main: 0, cooldown: 5 };
  }
  return { warmup: 10, main: 0, cooldown: 8 };
}

import { allocateTime } from './scaling.js';

// Blocking rules must return zero violations for a candidate to be usable.
export function validate(candidate, context) {
  const violations = [];

  const time = allocateTime(context.availableMinutes);
  const totalEstimate = time.warmup + candidate.estimatedMinutes + time.cooldown;
  if (totalEstimate > context.availableMinutes + 5) {
    violations.push('time_exceeded');
  }

  for (const item of candidate.mainMovements) {
    const hasEquipment = item.movement.equipment.length === 0 ||
      item.movement.equipment.every(e => context.equipment.includes(e));
    if (!hasEquipment) violations.push(`equipment_conflict:${item.movement.id}`);
    if (context.limitations.includes(item.movement.id)) violations.push(`limitation_conflict:${item.movement.id}`);
  }

  return violations;
}

// Soft scoring: higher is better. Penalizes repetition of recent dominant
// patterns and excessive grip/high-impact stacking, rewards goal/time/readiness fit.
export function score(candidate, context) {
  let s = 0;

  s += candidate.goalMatch ? 30 : 0;
  s += 15 - Math.min(15, Math.abs(candidate.estimatedMinutes - context.availableMinutes));

  const recentPatternHits = candidate.mainMovements.reduce((acc, item) => {
    return acc + item.movement.patterns.filter(p => context.recentPatterns.includes(p)).length;
  }, 0);
  s -= recentPatternHits * 6;

  // Strongly discourage repeating the exact same template used very recently —
  // "constantly varied" is a core CrossFit principle, not just a slogan.
  const recentTemplateIds = context.recentTemplateIds || [];
  const templateRecencyIndex = recentTemplateIds.indexOf(candidate.template?.id);
  if (templateRecencyIndex === 0) s -= 50;
  else if (templateRecencyIndex > 0) s -= 25;

  const gripLoad = candidate.mainMovements.reduce((acc, item) => acc + item.movement.grip, 0);
  if (gripLoad > 10) s -= (gripLoad - 10) * 2;

  const impactLoad = candidate.mainMovements.reduce((acc, item) => acc + item.movement.impact, 0);
  if (context.readinessBand.key === 'low' || context.readinessBand.key === 'moderate') {
    s -= impactLoad * 2;
  }

  return s;
}

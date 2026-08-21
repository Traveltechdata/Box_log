import { getSkill } from '../data/skills.js';

const DAY_MS = 1000 * 60 * 60 * 24;

// ---------------- creation ----------------
export function createStrengthPlan({ movementId, movementLabel, oneRM, targetFrequencyPerWeek = 2 }) {
  const trainingMax = Math.round((oneRM * 0.85) / 2.5) * 2.5; // conservative starting point
  const isUpperBody = ['strict_press', 'push_press', 'push_jerk'].includes(movementId);
  return {
    id: 'plan_' + Date.now(),
    area: 'crossfit',
    kind: 'strength',
    label: `Forza \u2014 ${movementLabel}`,
    movementId,
    movementLabel,
    targetFrequencyPerWeek,
    createdAt: new Date().toISOString(),
    trainingMax,
    incrementKg: isUpperBody ? 1.25 : 2.5,
    scheme: { sets: 3, reps: 5 },
    failStreak: 0,
    lastRetestDate: new Date().toISOString(),
    nextRetestDate: addDays(new Date(), 42).toISOString(),
    history: [],
    status: 'active',
  };
}

export function createSkillPlan({ skillId, startStepIndex = 0, targetFrequencyPerWeek = 2 }) {
  const skill = getSkill(skillId);
  return {
    id: 'plan_' + Date.now(),
    area: 'crossfit',
    kind: 'skill',
    label: `Skill \u2014 ${skill.label}`,
    skillId,
    targetFrequencyPerWeek,
    createdAt: new Date().toISOString(),
    stepIndex: startStepIndex,
    stepCleanCount: 0,
    history: [],
    status: 'active',
  };
}

export function createMetconPlan({ benchmarkLabel, benchmarkDescription, targetFrequencyPerWeek = 2 }) {
  return {
    id: 'plan_' + Date.now(),
    area: 'crossfit',
    kind: 'metcon',
    label: `Metcon \u2014 ${benchmarkLabel}`,
    benchmarkLabel,
    benchmarkDescription,
    targetFrequencyPerWeek,
    createdAt: new Date().toISOString(),
    cycleWeek: 1,
    cycleStartDate: new Date().toISOString(),
    history: [],
    status: 'active',
  };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------- strength plan step logic ----------------
export function strengthSessionPrescription(plan) {
  const { sets, reps } = plan.scheme;
  return {
    sets, reps,
    weightKg: plan.trainingMax,
    text: `${sets} x ${reps} @ ${plan.trainingMax}kg`,
  };
}

// Call after logging a strength session result.
export function applyStrengthResult(plan, { completedAllSets }) {
  const updated = { ...plan };
  if (completedAllSets) {
    updated.trainingMax = Math.round((plan.trainingMax + plan.incrementKg) / 1.25) * 1.25;
    updated.failStreak = 0;
  } else {
    updated.failStreak = (plan.failStreak || 0) + 1;
    if (updated.failStreak >= 2) {
      updated.trainingMax = Math.round((plan.trainingMax * 0.9) / 2.5) * 2.5;
      updated.failStreak = 0;
    }
  }
  return updated;
}

export function isRetestDue(plan) {
  if (plan.kind !== 'strength' || !plan.nextRetestDate) return false;
  return new Date() >= new Date(plan.nextRetestDate);
}

export function applyRetest(plan, newOneRM) {
  const trainingMax = Math.round((newOneRM * 0.85) / 2.5) * 2.5;
  return {
    ...plan,
    trainingMax,
    failStreak: 0,
    lastRetestDate: new Date().toISOString(),
    nextRetestDate: addDays(new Date(), 42).toISOString(),
  };
}

// ---------------- skill plan step logic ----------------
export function skillSessionPrescription(plan) {
  const skill = getSkill(plan.skillId);
  const step = skill.steps[plan.stepIndex];
  return { skill, step, isFinalStep: plan.stepIndex === skill.steps.length - 1 };
}

export function applySkillResult(plan, { clean }) {
  const skill = getSkill(plan.skillId);
  const step = skill.steps[plan.stepIndex];
  const updated = { ...plan };
  if (!clean) {
    updated.stepCleanCount = 0;
    return updated;
  }
  updated.stepCleanCount = (plan.stepCleanCount || 0) + 1;
  if (updated.stepCleanCount >= step.cleanStreakNeeded) {
    const isLast = plan.stepIndex === skill.steps.length - 1;
    if (isLast) {
      updated.status = 'completed';
      updated.completedAt = new Date().toISOString();
    } else {
      updated.stepIndex = plan.stepIndex + 1;
      updated.stepCleanCount = 0;
    }
  }
  return updated;
}

// ---------------- metcon plan step logic ----------------
// Week 1 and 6 are the fixed baseline/retest; weeks 2-5 escalate volume/intensity
// through a deterministic sequence of formats (not randomly picked).
const METCON_WEEK_FORMATS = {
  2: { format: 'AMRAP_ROUNDS', note: 'volume moderato, stesso stimolo del test' },
  3: { format: 'EMOM', note: 'densit\u00e0 di lavoro, ritmo controllato' },
  4: { format: 'FOR_TIME', note: 'intensit\u00e0 pi\u00f9 alta, stesso pattern di movimento' },
  5: { format: 'AMRAP_ROUNDS', note: 'ultimo carico prima del retest, vicino al massimo sostenibile' },
};

export function metconWeekPlan(plan) {
  if (plan.cycleWeek === 1 || plan.cycleWeek === 6) {
    return { isRetest: true, week: plan.cycleWeek };
  }
  return { isRetest: false, week: plan.cycleWeek, ...METCON_WEEK_FORMATS[plan.cycleWeek] };
}

export function advanceMetconWeek(plan) {
  const updated = { ...plan };
  if (plan.cycleWeek >= 6) {
    // cycle complete: start a new cycle referencing the same benchmark
    updated.cycleWeek = 1;
    updated.cycleStartDate = new Date().toISOString();
  } else {
    updated.cycleWeek = plan.cycleWeek + 1;
  }
  return updated;
}

// ---------------- rotation across active plans ----------------
// Returns the plan most "overdue" relative to its target weekly frequency.
export function pickDuePlan(plans, sessions) {
  const active = plans.filter(p => p.status === 'active');
  if (active.length === 0) return null;

  const scored = active.map(plan => {
    const planSessions = sessions
      .filter(s => s.planId === plan.id && s.status !== 'planned')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastDate = planSessions[0]?.date;
    const daysSince = lastDate ? (Date.now() - new Date(lastDate).getTime()) / DAY_MS : 999;
    const idealGapDays = 7 / (plan.targetFrequencyPerWeek || 2);
    const urgency = daysSince / idealGapDays;
    return { plan, urgency };
  });

  scored.sort((a, b) => b.urgency - a.urgency);
  return scored[0].plan;
}

// Pure logic for quarterly (or any date-bound) goals, e.g. "back squat 100kg by 20 Nov".

export function daysRemaining(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const ms = target.setHours(23, 59, 59, 999) - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function totalDays(startDate, targetDate) {
  const ms = new Date(targetDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Progress 0-100, direction-aware (increase: bigger is better, decrease: smaller is better — e.g. a 5km time).
export function progressPercent(goal) {
  const { startValue, currentValue, targetValue, direction } = goal;
  if (targetValue === startValue) return 100;
  let pct;
  if (direction === 'decrease') {
    pct = ((startValue - currentValue) / (startValue - targetValue)) * 100;
  } else {
    pct = ((currentValue - startValue) / (targetValue - startValue)) * 100;
  }
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function isAchieved(goal) {
  if (goal.direction === 'decrease') return goal.currentValue <= goal.targetValue;
  return goal.currentValue >= goal.targetValue;
}

// Status used for color-coding: on_track compares progress made vs time elapsed.
export function goalStatus(goal) {
  if (isAchieved(goal)) return 'achieved';
  const remaining = daysRemaining(goal.targetDate);
  if (remaining < 0) return 'expired';
  const elapsedPct = 100 - Math.round((remaining / totalDays(goal.startDate, goal.targetDate)) * 100);
  const progressPct = progressPercent(goal);
  if (progressPct + 15 >= elapsedPct) return 'on_track';
  return 'behind';
}

export function formatGoalValue(value, unit) {
  if (unit === 'kg' || unit === 'lb') return `${value} ${unit}`;
  if (unit === 'reps') return `${value} rip.`;
  if (unit === 's') return formatSeconds(value);
  return `${value} ${unit}`;
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

// Suggested quarter (13 weeks) target date from today.
export function quarterFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 91);
  return d.toISOString().slice(0, 10);
}

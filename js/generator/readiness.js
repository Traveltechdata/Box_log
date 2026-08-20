// Readiness score: 0-100, built from subjective daily inputs (no wearable required).
// Inputs are all on a 1-5 scale from the check-in form.
// energy: how the athlete feels overall (1 low - 5 high)
// sleep: sleep quality (1 poor - 5 great)
// stress: perceived stress (1 low - 5 high)  <- inverted in the formula
// soreness: average muscle soreness (1 none - 5 severe) <- inverted in the formula

export function computeReadiness({ energy, sleep, stress, soreness }) {
  const norm = v => ((v - 1) / 4) * 100; // 1-5 -> 0-100
  const energyScore = norm(energy);
  const sleepScore = norm(sleep);
  const stressScore = norm(6 - stress);   // invert: high stress -> low score
  const sorenessScore = norm(6 - soreness); // invert: high soreness -> low score

  const score = Math.round(
    energyScore * 0.40 +
    sleepScore * 0.25 +
    stressScore * 0.20 +
    sorenessScore * 0.15
  );

  return { score: Math.max(0, Math.min(100, score)), breakdown: { energyScore, sleepScore, stressScore, sorenessScore } };
}

export function readinessBand(score) {
  if (score >= 80) return { key: 'high', label: 'Alta', color: 'var(--band-high)' };
  if (score >= 60) return { key: 'normal', label: 'Normale', color: 'var(--band-normal)' };
  if (score >= 40) return { key: 'moderate', label: 'Moderata', color: 'var(--band-moderate)' };
  return { key: 'low', label: 'Bassa', color: 'var(--band-low)' };
}

// Simple internal training load: minutes x sRPE (session RPE 1-10).
export function trainingLoad(minutes, sRPE) {
  return Math.round(minutes * sRPE);
}

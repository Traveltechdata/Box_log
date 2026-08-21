const KEYS = {
  profile: 'cfwod.profile',
  sessions: 'cfwod.sessions',
  goals: 'cfwod.goals',
  reminders: 'cfwod.reminders',
  plans: 'cfwod.plans',
  activeSession: 'cfwod.activeSession',
};

// ---------------- profile ----------------
export function getProfile() {
  const raw = localStorage.getItem(KEYS.profile);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// ---------------- sessions ----------------
// session.status: 'done' | 'planned'
export function getSessions() {
  const raw = localStorage.getItem(KEYS.sessions);
  return raw ? JSON.parse(raw) : [];
}

function setSessions(sessions) {
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift({ status: 'done', id: 'd_' + Date.now(), ...session });
  setSessions(sessions);
}

export function updateLastSession(patch) {
  const sessions = getSessions();
  if (sessions.length === 0) return;
  sessions[0] = { ...sessions[0], ...patch };
  setSessions(sessions);
}

export function addPlannedSession(planned) {
  const sessions = getSessions();
  sessions.unshift({ status: 'planned', completed: false, id: 'p_' + Date.now(), ...planned });
  setSessions(sessions);
}

export function updateSessionById(id, patch) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return;
  sessions[idx] = { ...sessions[idx], ...patch };
  setSessions(sessions);
}

export function deleteSessionById(id) {
  setSessions(getSessions().filter(s => s.id !== id));
}

// Patterns hit in the last N *completed* sessions (used for variety/fatigue scoring).
export function recentPatterns(count = 2) {
  const sessions = getSessions()
    .filter(s => s.status !== 'planned' && s.completion !== 0)
    .slice(0, count);
  return sessions.flatMap(s => s.patternsHit || []);
}

// Template ids used in the last N sessions (any status) — steers the generator
// away from repeating the exact same WOD shape back-to-back.
export function recentTemplateIds(count = 3) {
  return getSessions()
    .slice(0, count)
    .map(s => s.templateId)
    .filter(Boolean);
}

export function sessionsInMonth(year, month) {
  // month: 0-11
  return getSessions().filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function completedSessionsSorted() {
  return getSessions()
    .filter(s => s.status !== 'planned' && s.completion > 0 && s.load != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ---------------- plans ----------------
export function getPlans() {
  const raw = localStorage.getItem(KEYS.plans);
  return raw ? JSON.parse(raw) : [];
}

function setPlans(plans) {
  localStorage.setItem(KEYS.plans, JSON.stringify(plans));
}

export function savePlan(plan) {
  const plans = getPlans();
  plans.unshift(plan);
  setPlans(plans);
  return plan;
}

export function updatePlan(id, patchOrPlan) {
  const plans = getPlans();
  const idx = plans.findIndex(p => p.id === id);
  if (idx === -1) return;
  plans[idx] = { ...plans[idx], ...patchOrPlan };
  setPlans(plans);
  return plans[idx];
}

export function deletePlan(id) {
  setPlans(getPlans().filter(p => p.id !== id));
}

export function getPlan(id) {
  return getPlans().find(p => p.id === id) || null;
}

// ---------------- active session (persists across screen changes / reloads) ----------------
// This is what actually fixes the "sliders reset" problem: once a session is
// started, its duration/readiness/content live here, not in transient UI state.
export function getActiveSession() {
  const raw = localStorage.getItem(KEYS.activeSession);
  return raw ? JSON.parse(raw) : null;
}

export function setActiveSession(session) {
  localStorage.setItem(KEYS.activeSession, JSON.stringify(session));
}

export function clearActiveSession() {
  localStorage.removeItem(KEYS.activeSession);
}

// ---------------- goals ----------------
// goal: { id, label, movementId|null, unit, direction: 'increase'|'decrease',
//         startValue, currentValue, targetValue, startDate, targetDate, achieved, notes }
export function getGoals() {
  const raw = localStorage.getItem(KEYS.goals);
  return raw ? JSON.parse(raw) : [];
}

function setGoals(goals) {
  localStorage.setItem(KEYS.goals, JSON.stringify(goals));
}

export function saveGoal(goal) {
  const goals = getGoals();
  goals.unshift({ id: 'g_' + Date.now(), achieved: false, ...goal });
  setGoals(goals);
}

export function updateGoal(id, patch) {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === id);
  if (idx === -1) return;
  goals[idx] = { ...goals[idx], ...patch };
  setGoals(goals);
}

export function deleteGoal(id) {
  setGoals(getGoals().filter(g => g.id !== id));
}

// ---------------- reminders ----------------
export function getReminderSettings() {
  const raw = localStorage.getItem(KEYS.reminders);
  return raw ? JSON.parse(raw) : { enabled: false, days: [1, 2, 3, 4, 5], time: '18:00', lastNotifiedDate: null };
}

export function saveReminderSettings(settings) {
  localStorage.setItem(KEYS.reminders, JSON.stringify(settings));
}

// ---------------- import / export ----------------
export function exportData() {
  const data = {
    profile: getProfile(),
    sessions: getSessions(),
    goals: getGoals(),
    plans: getPlans(),
    reminders: getReminderSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString) {
  const data = JSON.parse(jsonString);
  if (data.profile) localStorage.setItem(KEYS.profile, JSON.stringify(data.profile));
  if (data.sessions) localStorage.setItem(KEYS.sessions, JSON.stringify(data.sessions));
  if (data.goals) localStorage.setItem(KEYS.goals, JSON.stringify(data.goals));
  if (data.plans) localStorage.setItem(KEYS.plans, JSON.stringify(data.plans));
  if (data.reminders) localStorage.setItem(KEYS.reminders, JSON.stringify(data.reminders));
}

export function clearAll() {
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.sessions);
  localStorage.removeItem(KEYS.goals);
  localStorage.removeItem(KEYS.plans);
  localStorage.removeItem(KEYS.reminders);
  localStorage.removeItem(KEYS.activeSession);
}

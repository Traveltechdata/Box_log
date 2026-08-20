const KEYS = {
  profile: 'cfwod.profile',
  sessions: 'cfwod.sessions',
};

export function getProfile() {
  const raw = localStorage.getItem(KEYS.profile);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function getSessions() {
  const raw = localStorage.getItem(KEYS.sessions);
  return raw ? JSON.parse(raw) : [];
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift(session);
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}

export function updateLastSession(patch) {
  const sessions = getSessions();
  if (sessions.length === 0) return;
  sessions[0] = { ...sessions[0], ...patch };
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}

// Patterns hit in the last `days` sessions (used to steer variety + fatigue penalties).
export function recentPatterns(days = 2) {
  const sessions = getSessions().slice(0, days);
  const patterns = [];
  for (const s of sessions) {
    if (s.wod?.main?.movements) {
      // movement objects only store names post-generation; we also stash pattern hints.
    }
    if (s.patternsHit) patterns.push(...s.patternsHit);
  }
  return patterns;
}

export function exportData() {
  const data = { profile: getProfile(), sessions: getSessions(), exportedAt: new Date().toISOString() };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString) {
  const data = JSON.parse(jsonString);
  if (data.profile) localStorage.setItem(KEYS.profile, JSON.stringify(data.profile));
  if (data.sessions) localStorage.setItem(KEYS.sessions, JSON.stringify(data.sessions));
}

export function clearAll() {
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.sessions);
}

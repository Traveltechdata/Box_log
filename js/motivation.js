const DAY_MS = 1000 * 60 * 60 * 24;
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function completedDates(sessions) {
  return sessions
    .filter(s => s.status !== 'planned' && s.completed)
    .map(s => startOfDay(s.date).getTime())
    .sort((a, b) => b - a);
}

// Current streak = consecutive calendar days (allowing today to be "not yet trained")
// counted backwards from the most recent training day, counting distinct training days
// within a rolling window rather than requiring literally every single day.
// We use a simpler, honest definition: consecutive *days with at least one session*,
// walking back from the most recent one, allowing at most 1 rest day between sessions
// before the streak breaks (rest days are normal in CrossFit programming).
export function computeStreak(sessions) {
  const dates = [...new Set(completedDates(sessions))];
  if (dates.length === 0) return { streak: 0, lastDate: null };

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const gapDays = Math.round((dates[i] - dates[i + 1]) / DAY_MS);
    if (gapDays <= 2) streak++;
    else break;
  }
  return { streak, lastDate: new Date(dates[0]) };
}

export function daysSinceLast(sessions) {
  const dates = completedDates(sessions);
  if (dates.length === 0) return null;
  return Math.round((startOfDay(new Date()).getTime() - dates[0]) / DAY_MS);
}

export function sessionsInLastDays(sessions, days) {
  const cutoff = Date.now() - days * DAY_MS;
  return sessions.filter(s => s.status !== 'planned' && s.completed && new Date(s.date).getTime() >= cutoff).length;
}

export function motivationalMessage({ streak, gapDays }) {
  if (gapDays === null) {
    return 'Pronto per la prima sessione: genera il tuo WOD qui sotto.';
  }
  if (gapDays === 0) {
    return 'Allenamento di oggi già registrato. Ottimo lavoro.';
  }
  if (gapDays >= 7) {
    return `Sono passati ${gapDays} giorni dall'ultima sessione. Riprendi con calma, va benissimo anche una sessione leggera.`;
  }
  if (gapDays >= 4) {
    return `${gapDays} giorni di pausa. Oggi è un buon giorno per tornare in pedana.`;
  }
  if (streak >= 5) {
    return `${streak} sessioni di fila: ottima costanza, ricorda di ascoltare il recupero.`;
  }
  if (streak >= 2) {
    return `${streak} sessioni consecutive. Continua così.`;
  }
  return 'Bentornato: genera il WOD di oggi quando sei pronto.';
}

// ---------------- reminders ----------------
export function reminderDayLabel(dayIndex) {
  return DAY_LABELS[dayIndex];
}

export const REMINDER_DAYS = [
  { id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mer' },
  { id: 4, label: 'Gio' }, { id: 5, label: 'Ven' }, { id: 6, label: 'Sab' }, { id: 0, label: 'Dom' },
];

export function notificationsSupported() {
  return typeof Notification !== 'undefined';
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

// Checks whether, right now, a reminder should fire: today is a reminder day,
// we've reached the reminder time, the user hasn't trained today yet, and we
// haven't already notified today.
export function shouldFireReminder(settings, sessions) {
  if (!settings.enabled) return false;
  const now = new Date();
  const today = now.getDay();
  if (!settings.days.includes(today)) return false;

  const [h, m] = (settings.time || '18:00').split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (now < target) return false;

  const todayStr = startOfDay(now).toISOString().slice(0, 10);
  if (settings.lastNotifiedDate === todayStr) return false;

  const gap = daysSinceLast(sessions);
  if (gap === 0) return false; // already trained today

  return true;
}

export function fireLocalNotification() {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification('Box Log', {
      body: 'È ora di allenarsi. Genera il WOD di oggi quando vuoi.',
      icon: 'icons/icon-192.png',
      tag: 'box-log-reminder',
    });
    return true;
  } catch {
    return false;
  }
}

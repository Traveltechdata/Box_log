const MONTH_LABELS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];
const WEEKDAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

export function monthLabel(year, month) {
  return `${MONTH_LABELS[month]} ${year}`;
}

// Returns an array of week rows; each cell is { date, inMonth, sessions } or null for padding.
export function buildMonthGrid(year, month, sessions) {
  const firstOfMonth = new Date(year, month, 1);
  // ISO-ish week starting Monday: JS getDay() 0=Sun..6=Sat -> shift so Monday=0
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = {};
  sessions.forEach(s => {
    const key = new Date(s.date).toDateString();
    (byDate[key] = byDate[key] || []).push(s);
  });

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ date, sessions: byDate[date.toDateString()] || [] });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function weekdayHeaderHtml() {
  return WEEKDAY_LABELS.map(l => `<div class="cal-weekday">${l}</div>`).join('');
}

function dotColorFor(session) {
  if (session.status === 'planned') return 'var(--marker-yellow)';
  if (session.completed) return 'var(--marker-teal)';
  return 'var(--marker-red)';
}

export function renderMonthGridHtml(weeks, todayStr, selectedStr) {
  return weeks.map(week => `
    <div class="cal-week">
      ${week.map(cell => {
        if (!cell) return '<div class="cal-cell empty"></div>';
        const dStr = cell.date.toDateString();
        const isToday = dStr === todayStr;
        const isSelected = dStr === selectedStr;
        const dots = cell.sessions.slice(0, 3)
          .map(s => `<span class="cal-dot" style="background:${dotColorFor(s)}"></span>`).join('');
        return `<button type="button" class="cal-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" data-date="${cell.date.toISOString()}">
          <span class="cal-daynum">${cell.date.getDate()}</span>
          <span class="cal-dots">${dots}</span>
        </button>`;
      }).join('')}
    </div>
  `).join('');
}

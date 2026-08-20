import { generateWod } from './generator/generateWod.js';
import { computeReadiness, readinessBand, trainingLoad } from './generator/readiness.js';
import {
  getProfile, saveProfile, getSessions, saveSession, updateLastSession, updateSessionById,
  addPlannedSession, deleteSessionById, recentPatterns, recentTemplateIds, completedSessionsSorted, sessionsInMonth,
  getGoals, saveGoal, updateGoal, deleteGoal,
  getReminderSettings, saveReminderSettings,
  exportData, importData, clearAll,
} from './storage.js';
import { progressPercent, goalStatus, isAchieved, daysRemaining, quarterFromNow, formatGoalValue } from './goals.js';
import { computeStreak, daysSinceLast, motivationalMessage, REMINDER_DAYS, notificationsSupported, requestNotificationPermission, shouldFireReminder, fireLocalNotification } from './motivation.js';
import { monthLabel, buildMonthGrid, weekdayHeaderHtml, renderMonthGridHtml } from './ui/calendar.js';
import { trainingLoadChartSvg } from './ui/chart.js';

// ---------------- static option lists ----------------
const GOALS = [
  { id: 'conditioning', label: 'Conditioning' },
  { id: 'strength', label: 'Forza' },
  { id: 'weightlifting', label: 'Weightlifting' },
  { id: 'gymnastics', label: 'Ginnastica' },
  { id: 'aerobic', label: 'Aerobico' },
  { id: 'race_prep', label: 'Prep. gara' },
  { id: 'general', label: 'Mantenimento' },
];
const TIME_OPTIONS = [15, 25, 35, 45, 60];
const LEVELS = [
  { id: 'beginner', label: 'Principiante' },
  { id: 'intermediate', label: 'Intermedio' },
  { id: 'advanced', label: 'Avanzato' },
];
const EQUIPMENT = [
  { id: 'barbell', label: 'Bilanciere' },
  { id: 'rack', label: 'Rack' },
  { id: 'bench', label: 'Panca' },
  { id: 'dumbbell', label: 'Manubri' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'rower', label: 'Vogatore' },
  { id: 'bike', label: 'Bike/Assault bike' },
  { id: 'ski_erg', label: 'Ski erg' },
  { id: 'pullup_bar', label: 'Sbarra' },
  { id: 'rings', label: 'Anelli' },
  { id: 'box', label: 'Box' },
  { id: 'jump_rope', label: 'Corda' },
  { id: 'wall_ball', label: 'Wall ball' },
  { id: 'ghd', label: 'GHD' },
  { id: 'rope', label: 'Corda per rope climb' },
  { id: 'sled', label: 'Slitta' },
  { id: 'yoke', label: 'Yoke' },
  { id: 'sandbag', label: 'Sandbag' },
];
const LIMITATION_MOVEMENTS = [
  { id: 'box_jump', label: 'Box jump' },
  { id: 'burpee', label: 'Burpee (con salto)' },
  { id: 'double_under', label: 'Double-under' },
  { id: 'run', label: 'Corsa' },
  { id: 'pull_up', label: 'Pull-up strict' },
  { id: 'kipping_pullup', label: 'Kipping pull-up' },
  { id: 'ctb_pullup', label: 'Chest-to-bar' },
  { id: 'muscle_up', label: 'Muscle-up' },
  { id: 'bar_muscle_up', label: 'Bar muscle-up' },
  { id: 'hspu', label: 'Handstand push-up' },
  { id: 'handstand_walk', label: 'Handstand walk' },
  { id: 'toes_to_bar', label: 'Toes-to-bar' },
  { id: 'clean', label: 'Clean' },
  { id: 'snatch', label: 'Snatch' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'back_squat', label: 'Back squat' },
  { id: 'overhead_squat', label: 'Overhead squat' },
  { id: 'ghd_situp', label: 'GHD sit-up' },
  { id: 'rope_climb', label: 'Rope climb' },
];

const GOAL_MOVEMENTS = [
  { id: 'back_squat', label: 'Back squat' },
  { id: 'front_squat', label: 'Front squat' },
  { id: 'overhead_squat', label: 'Overhead squat' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'strict_press', label: 'Strict press' },
  { id: 'push_press', label: 'Push press' },
  { id: 'push_jerk', label: 'Push jerk' },
  { id: 'clean', label: 'Clean' },
  { id: 'power_clean', label: 'Power clean' },
  { id: 'snatch', label: 'Snatch' },
  { id: 'clean_and_jerk', label: 'Clean & jerk' },
  { id: 'pull_up', label: 'Pull-up strict (max reps)' },
  { id: 'ctb_pullup', label: 'Chest-to-bar (max reps)' },
  { id: 'double_under', label: 'Double-under (max consecutivi)' },
  { id: null, label: 'Altro (benchmark, tempo su distanza\u2026)' },
];
const ONE_RM_MOVEMENTS = [
  { id: 'back_squat', label: 'Back squat' },
  { id: 'front_squat', label: 'Front squat' },
  { id: 'overhead_squat', label: 'Overhead squat' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'strict_press', label: 'Strict press' },
  { id: 'push_press', label: 'Push press' },
  { id: 'push_jerk', label: 'Push jerk' },
  { id: 'clean', label: 'Clean' },
  { id: 'power_clean', label: 'Power clean' },
  { id: 'snatch', label: 'Snatch' },
  { id: 'power_snatch', label: 'Power snatch' },
  { id: 'clean_and_jerk', label: 'Clean & jerk' },
];

const GOAL_UNITS = [
  { id: 'kg', label: 'kg' },
  { id: 'lb', label: 'lb' },
  { id: 'reps', label: 'rip.' },
  { id: 's', label: 'sec (tempo)' },
];
const GOAL_DIRECTIONS = [
  { id: 'increase', label: 'Aumentare' },
  { id: 'decrease', label: 'Diminuire (es. tempo)' },
];

const WOD_BLOCK_COLORS = {
  warmup: 'var(--marker-teal)',
  skill: 'var(--marker-yellow)',
  main: 'var(--marker-red)',
  cooldown: 'var(--marker-teal)',
};

const GOAL_STATUS_META = {
  on_track: { label: 'In linea', color: 'var(--marker-teal)' },
  behind: { label: 'In ritardo', color: 'var(--marker-yellow)' },
  achieved: { label: 'Raggiunto', color: 'var(--marker-teal)' },
  expired: { label: 'Scaduto', color: 'var(--marker-red)' },
};

let state = {
  profile: null,
  selectedGoal: 'conditioning',
  selectedMinutes: 35,
  currentWod: null,
  historyMode: 'list',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedCalDate: null,
  goalMovementSel: 'back_squat',
  goalUnitSel: 'kg',
  goalDirectionSel: 'increase',
  goalDateSel: 'quarter',
  reminderDaysSel: [1, 2, 3, 4, 5],
};

// ---------------- helpers ----------------
const $ = sel => document.querySelector(sel);
const $all = sel => Array.from(document.querySelectorAll(sel));

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function renderChipGroup(container, options, selectedId, onSelect) {
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (opt.id === selectedId ? ' selected' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => onSelect(opt.id));
    container.appendChild(btn);
  });
}

function renderCheckGrid(container, options, selectedIds, onToggle) {
  container.innerHTML = '';
  options.forEach(opt => {
    const label = document.createElement('label');
    const checked = selectedIds.includes(opt.id);
    label.className = 'check-item' + (checked ? ' checked' : '');
    label.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} /> <span>${opt.label}</span>`;
    label.querySelector('input').addEventListener('change', (e) => {
      onToggle(opt.id, e.target.checked);
      label.classList.toggle('checked', e.target.checked);
    });
    container.appendChild(label);
  });
}

// ---------------- navigation ----------------
function switchView(viewId) {
  $all('.view').forEach(v => v.classList.toggle('active', v.id === viewId));
  $all('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  if (viewId === 'view-history') { renderMotivation(); renderHistoryPanel(); }
  if (viewId === 'view-goals') renderGoals();
}

$all('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ---------------- readiness dial (SVG) ----------------
function drawReadinessDial(score, band) {
  const svg = $('#readiness-dial');
  const cx = 90, cy = 95, r = 72;
  const startAngle = Math.PI;
  const endAngle = 0;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const angle = startAngle - pct * startAngle;

  const arcPoint = (a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const [sx, sy] = arcPoint(startAngle);
  const [ex, ey] = arcPoint(endAngle);
  const [px, py] = arcPoint(angle);
  const largeArc = pct > 0.5 ? 1 : 0;

  const bg = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const fg = `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${px} ${py}`;

  svg.innerHTML = `
    <path d="${bg}" stroke="rgba(244,241,232,0.12)" stroke-width="12" fill="none" stroke-linecap="round" />
    <path d="${fg}" stroke="${band.color}" stroke-width="12" fill="none" stroke-linecap="round"
      style="filter: drop-shadow(0 0 4px ${band.color}80);" />
  `;
}

// ---------------- readiness + form wiring ----------------
function currentCheckin() {
  return {
    energy: Number($('#in-energy').value),
    sleep: Number($('#in-sleep').value),
    stress: Number($('#in-stress').value),
    soreness: Number($('#in-soreness').value),
  };
}

function updateReadinessPreview() {
  const { score } = computeReadiness(currentCheckin());
  const band = readinessBand(score);
  $('#readiness-card').style.display = 'block';
  $('#readiness-score-num').textContent = score;
  $('#readiness-score-num').style.color = band.color;
  $('#readiness-label-txt').textContent = band.label;
  $('#readiness-sub-txt').textContent = readinessExplain(band);
  drawReadinessDial(score, band);
  return { score, band };
}

function readinessExplain(band) {
  switch (band.key) {
    case 'high': return 'Puoi affrontare un lavoro pieno, anche intenso.';
    case 'normal': return 'Allenamento normale, volume abituale.';
    case 'moderate': return 'Meglio tecnica e conditioning sostenibile, volume ridotto.';
    default: return 'Consigliata una sessione di recupero o tecnica leggera.';
  }
}

['in-energy', 'in-sleep', 'in-stress', 'in-soreness'].forEach(id => {
  $('#' + id).addEventListener('input', (e) => {
    $('#val-' + id.replace('in-', '')).textContent = e.target.value;
    updateReadinessPreview();
  });
});

// ---------------- active goal -> priority movements ----------------
function activePriorityMovementIds() {
  return getGoals()
    .filter(g => !g.achieved && g.movementId)
    .map(g => g.movementId);
}

// ---------------- WOD generation + rendering ----------------
function buildGenerationInput() {
  const profile = state.profile || defaultProfile();
  const checkin = currentCheckin();
  const { score } = computeReadiness(checkin);
  const band = readinessBand(score);
  return {
    goal: state.selectedGoal,
    availableMinutes: state.selectedMinutes,
    level: profile.level,
    equipment: profile.equipment,
    limitations: profile.limitations,
    recentPatterns: recentPatterns(2),
    recentTemplateIds: recentTemplateIds(3),
    readinessScore: score,
    band,
    priorityMovementIds: activePriorityMovementIds(),
    oneRMs: profile.oneRMs || {},
  };
}

const FORMAT_LABELS = {
  FOR_TIME: 'For Time', AMRAP_ROUNDS: 'AMRAP', AMRAP_REPS: 'AMRAP reps',
  EMOM: 'EMOM', TABATA: 'Tabata', DEATH_BY: 'Death By', STRENGTH: 'Forza',
  SKILL: 'Skill', STEADY: 'Steady state', RECOVERY: 'Recovery', TECHNICAL: 'Tecnica leggera',
};

function renderWodBlock(key, label, minutes, content) {
  return `
    <div class="wod-block">
      <div class="wod-block-label">
        <span class="swatch" style="background:${WOD_BLOCK_COLORS[key]}"></span>
        <span class="txt">${label}</span>
        ${minutes != null ? `<span class="mins">${minutes} min</span>` : ''}
      </div>
      ${content}
    </div>
  `;
}

function renderWarmupContent(warmup) {
  const items = [`<li><span>${warmup.raise.name}</span><span class="reps">${warmup.raise.minutes} min</span></li>`]
    .concat(warmup.drills.map(d => `<li><span>${d.name}</span><span class="reps">${d.prescription}</span></li>`));
  return `<ul class="wod-move-list">${items.join('')}</ul>`;
}

function renderPrimaryBlock(primary) {
  return `
    <div class="primary-block ${primary.kind}">
      <div class="primary-kind">${primary.label}</div>
      <div class="primary-movement">${primary.movement.name}</div>
      <div class="primary-prescription">${primary.prescriptionText}</div>
    </div>
  `;
}

function renderMainMetconContent(main) {
  const moveItems = main.movements.map(m =>
    `<li><span>${m.name}${m.loadText ? ` <span class="muted small">(${m.loadText})</span>` : ''}</span><span class="reps">${m.repsText}</span></li>`
  ).join('');
  const rpeLine = main.targetRpe
    ? `<span>Target RPE ${main.targetRpe[0]}\u2013${main.targetRpe[1]}</span><span>Cap RPE ${main.capRpe}</span>`
    : '';
  return `
    <div class="wod-structure">${main.structureText}</div>
    ${main.scoreType ? `<div class="wod-score-type">Punteggio: ${main.scoreType}</div>` : ''}
    <ul class="wod-move-list">${moveItems}</ul>
    <div class="wod-meta">${rpeLine}</div>
  `;
}

function renderWod(wod) {
  state.currentWod = wod;
  $('#wod-card').style.display = 'block';
  $('#wod-format-label').textContent = wod.templateLabel;
  $('#wod-title').textContent = FORMAT_LABELS[wod.format] || wod.format;
  $('#wod-stimulus').textContent = wod.stimulus;

  let html = '';
  html += renderWodBlock('warmup', 'Warm-up', wod.warmup.minutes, renderWarmupContent(wod.warmup));

  if (wod.primary) {
    html += renderPrimaryBlock(wod.primary);
  }

  if (wod.main) {
    html += renderWodBlock('main', 'WOD', wod.main.estimatedMinutes, renderMainMetconContent(wod.main));
  }

  html += renderWodBlock('cooldown', 'Cooldown', wod.cooldown.minutes, `<p>${wod.cooldown.text}</p>`);

  $('#wod-blocks').innerHTML = html;
  $('#wod-reasons').innerHTML = wod.reasons.map(r => `<li>${r}</li>`).join('');
}

$('#btn-generate').addEventListener('click', () => {
  const input = buildGenerationInput();
  const wod = generateWod(input);
  renderWod(wod);
  saveSession({
    date: new Date().toISOString(),
    goal: state.selectedGoal,
    availableMinutes: state.selectedMinutes,
    readinessScore: input.readinessScore,
    readinessBand: input.band.key,
    wod,
    templateId: wod.templateId,
    patternsHit: wod.patternsHit,
    completed: null,
    actualRpe: null,
  });
  $('#wod-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('#btn-regenerate').addEventListener('click', () => {
  const input = buildGenerationInput();
  const wod = generateWod(input);
  renderWod(wod);
  updateLastSession({
    date: new Date().toISOString(),
    goal: state.selectedGoal,
    availableMinutes: state.selectedMinutes,
    readinessScore: input.readinessScore,
    readinessBand: input.band.key,
    wod,
    templateId: wod.templateId,
    patternsHit: wod.patternsHit,
  });
  toast('Nuova versione generata');
});

$('#btn-complete').addEventListener('click', () => {
  const rpe = prompt('RPE percepito della sessione (1\u201310)?', '7');
  if (rpe === null) return;
  const parsedRpe = Math.max(1, Math.min(10, Number(rpe) || 7));
  const minutes = state.currentWod?.main?.estimatedMinutes || state.currentWod?.primary?.minutes || state.selectedMinutes;
  updateLastSession({ status: 'done', completed: true, actualRpe: parsedRpe, load: trainingLoad(minutes, parsedRpe) });
  toast('Sessione registrata \u2014 ben fatto');
});

// ---------------- motivation ----------------
function renderMotivation() {
  const sessions = getSessions();
  const { streak } = computeStreak(sessions);
  const gap = daysSinceLast(sessions);
  const msg = motivationalMessage({ streak, gapDays: gap });

  $('#motivation-card').style.display = 'block';
  $('#motivation-eyebrow').textContent = gap === null ? 'Inizia oggi' : (streak > 1 ? `Streak: ${streak} sessioni` : 'Costanza');
  $('#motivation-message').textContent = msg;

  const statsHtml = [];
  if (gap !== null) statsHtml.push(`<span>Ultima sessione: ${gap === 0 ? 'oggi' : gap + ' giorni fa'}</span>`);
  statsHtml.push(`<span>Ultimi 7gg: ${sessionsCountLastDays(sessions, 7)} sessioni</span>`);
  statsHtml.push(`<span>Ultimi 30gg: ${sessionsCountLastDays(sessions, 30)} sessioni</span>`);
  $('#motivation-stats').innerHTML = statsHtml.join('');
}

function sessionsCountLastDays(sessions, days) {
  const cutoff = Date.now() - days * 86400000;
  return sessions.filter(s => s.status !== 'planned' && s.completed && new Date(s.date).getTime() >= cutoff).length;
}

// ---------------- history: list mode + chart ----------------
function renderHistoryPanel() {
  renderLoadChart();
  renderHistoryList();
  renderCalendar();
}

function renderLoadChart() {
  const points = completedSessionsSorted().slice(-14).map(s => ({
    load: s.load,
    dateLabel: new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
  }));
  const chartEl = $('#load-chart');
  const emptyEl = $('#load-chart-empty');
  if (points.length === 0) {
    chartEl.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    chartEl.innerHTML = trainingLoadChartSvg(points);
  }
}

function renderHistoryList() {
  const sessions = getSessions();
  const list = $('#history-list');
  if (sessions.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>
      <div>Nessuna sessione ancora registrata.<br/>Genera il tuo primo WOD da "Oggi".</div>
    </div>`;
    return;
  }
  list.innerHTML = sessions.slice(0, 40).map(s => sessionItemHtml(s)).join('');
}

function metaLineHtml(s) {
  const parts = [`<span>${s.availableMinutes} min</span>`];
  if (s.readinessScore != null) parts.push(`<span>Readiness ${s.readinessScore}</span>`);
  if (s.actualRpe) parts.push(`<span>RPE ${s.actualRpe}</span>`);
  if (s.load) parts.push(`<span>Load ${s.load}</span>`);
  return parts.join('');
}

function sessionItemHtml(s) {
  const d = new Date(s.date);
  const dateStr = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
  const statusBadge = s.status === 'planned'
    ? `<span class="badge" style="border-color:var(--marker-yellow); color:var(--marker-yellow);">pianificato</span>`
    : (s.completed === true
      ? `<span class="badge" style="border-color:var(--marker-teal); color:var(--marker-teal);">svolto</span>`
      : `<span class="badge">generato</span>`);
  return `
    <div class="session-item">
      <div class="row1">
        <span class="date">${dateStr}</span>
        ${statusBadge}
      </div>
      <div class="title">${s.wod?.templateLabel || s.goal || '\u2014'}</div>
      <div class="stats">${metaLineHtml(s)}</div>
    </div>`;
}

$('#history-view-toggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  state.historyMode = btn.dataset.mode;
  $all('#history-view-toggle .toggle-btn').forEach(b => b.classList.toggle('active', b === btn));
  $('#history-list-mode').style.display = state.historyMode === 'list' ? 'block' : 'none';
  $('#history-calendar-mode').style.display = state.historyMode === 'calendar' ? 'block' : 'none';
  if (state.historyMode === 'calendar') renderCalendar();
});

// ---------------- calendar ----------------
function renderCalendar() {
  $('#cal-weekdays').innerHTML = weekdayHeaderHtml();
  $('#cal-month-label').textContent = monthLabel(state.calYear, state.calMonth);
  const sessions = sessionsInMonth(state.calYear, state.calMonth);
  const weeks = buildMonthGrid(state.calYear, state.calMonth, sessions);
  const todayStr = new Date().toDateString();
  const selectedStr = state.selectedCalDate ? new Date(state.selectedCalDate).toDateString() : null;
  $('#cal-grid').innerHTML = renderMonthGridHtml(weeks, todayStr, selectedStr);

  if (state.selectedCalDate) renderDayDetail(state.selectedCalDate);
}

$('#cal-prev').addEventListener('click', () => {
  state.calMonth -= 1;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear -= 1; }
  renderCalendar();
});
$('#cal-next').addEventListener('click', () => {
  state.calMonth += 1;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear += 1; }
  renderCalendar();
});

$('#cal-grid').addEventListener('click', (e) => {
  const cell = e.target.closest('.cal-cell:not(.empty)');
  if (!cell) return;
  state.selectedCalDate = cell.dataset.date;
  renderCalendar();
});

function renderDayDetail(isoDate) {
  const date = new Date(isoDate);
  const sessions = getSessions().filter(s => new Date(s.date).toDateString() === date.toDateString());
  const dateLabel = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const isFuture = date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) || sessions.length === 0;
  const wrap = $('#cal-day-detail');

  if (sessions.length > 0) {
    wrap.innerHTML = `
      <h3>${dateLabel}</h3>
      ${sessions.map(s => `
        <div class="card" style="margin-bottom:10px;">
          <div class="row1" style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <strong>${s.wod?.templateLabel || s.goal || 'Sessione'}</strong>
            ${s.status === 'planned' ? '<span class="badge" style="border-color:var(--marker-yellow); color:var(--marker-yellow);">pianificato</span>' : ''}
          </div>
          <div class="wod-meta">${metaLineHtml(s)}</div>
          ${s.notes ? `<p class="small muted" style="margin-top:8px;">${s.notes}</p>` : ''}
          <div class="btn-row">
            ${!s.completed ? `<button class="btn btn-secondary btn-mark-done" data-id="${s.id}">Segna svolto</button>` : ''}
            <button class="btn btn-ghost btn-delete-session" data-id="${s.id}">Elimina</button>
          </div>
        </div>
      `).join('')}
    `;
  } else {
    wrap.innerHTML = `
      <h3>${dateLabel}</h3>
      <p class="small muted">Nessuna sessione. ${isFuture ? 'Pianifica un allenamento per questo giorno:' : ''}</p>
      ${isFuture ? `
        <span class="field-label">Obiettivo</span>
        <div class="chip-group" id="plan-goal-chips"></div>
        <span class="field-label">Tempo</span>
        <div class="chip-group" id="plan-time-chips"></div>
        <textarea id="plan-notes" placeholder="Note (opzionale)"></textarea>
        <button class="btn btn-primary" id="btn-save-plan">Pianifica allenamento</button>
      ` : ''}
    `;
    if (isFuture) bindPlanForm(isoDate);
  }

  wrap.querySelectorAll('.btn-mark-done').forEach(btn => {
    btn.addEventListener('click', () => {
      const rpe = prompt('RPE percepito della sessione (1\u201310)?', '7');
      if (rpe === null) return;
      const parsedRpe = Math.max(1, Math.min(10, Number(rpe) || 7));
      const s = getSessions().find(x => x.id === btn.dataset.id);
      const minutes = s?.availableMinutes || 30;
      updateSessionById(btn.dataset.id, { completed: true, actualRpe: parsedRpe, load: trainingLoad(minutes, parsedRpe) });
      toast('Sessione registrata');
      renderCalendar();
      renderHistoryList();
    });
  });
  wrap.querySelectorAll('.btn-delete-session').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Eliminare questa sessione?')) return;
      deleteSessionById(btn.dataset.id);
      renderCalendar();
      renderHistoryList();
      toast('Sessione eliminata');
    });
  });
}

function bindPlanForm(isoDate) {
  let planGoal = 'conditioning';
  let planMinutes = 35;
  const bindPG = () => renderChipGroup($('#plan-goal-chips'), GOALS, planGoal, (id) => { planGoal = id; bindPG(); });
  bindPG();
  const timeOpts = TIME_OPTIONS.map(m => ({ id: String(m), label: `${m}'` }));
  const bindPT = () => renderChipGroup($('#plan-time-chips'), timeOpts, String(planMinutes), (id) => { planMinutes = Number(id); bindPT(); });
  bindPT();

  $('#btn-save-plan').addEventListener('click', () => {
    addPlannedSession({
      date: new Date(isoDate).toISOString(),
      goal: planGoal,
      availableMinutes: planMinutes,
      notes: $('#plan-notes').value,
    });
    toast('Allenamento pianificato');
    renderCalendar();
    renderHistoryList();
  });
}

$('#btn-export').addEventListener('click', () => {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `box-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$('#btn-import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    importData(text);
    state.profile = getProfile();
    toast('Dati importati');
    renderHistoryPanel();
    hydrateProfileForm();
    hydrateReminderForm();
  } catch (err) {
    toast('File non valido');
  }
  e.target.value = '';
});

// ---------------- goals ----------------
function goalDisplayLabel(goal) {
  if (goal.movementId) {
    const m = GOAL_MOVEMENTS.find(g => g.id === goal.movementId);
    return m ? m.label : goal.movementId;
  }
  return goal.label || 'Obiettivo';
}

function renderGoals() {
  const goals = getGoals();
  const list = $('#goals-list');
  if (goals.length === 0) {
    list.innerHTML = `<p class="small muted">Nessun obiettivo ancora. Aggiungine uno qui sotto \u2014 per esempio "Back squat 100kg entro 3 mesi".</p>`;
  } else {
    list.innerHTML = goals.map(g => {
      const pct = progressPercent(g);
      const status = goalStatus(g);
      const meta = GOAL_STATUS_META[status];
      const remaining = daysRemaining(g.targetDate);
      return `
        <div class="goal-item">
          <div class="row1">
            <span class="goal-title">${goalDisplayLabel(g)}</span>
            <span class="goal-status-badge" style="color:${meta.color}; border:1px solid ${meta.color};">${meta.label}</span>
          </div>
          <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%; background:${meta.color};"></div></div>
          <div class="goal-values">
            <span>${formatGoalValue(g.currentValue, g.unit)} \u2192 ${formatGoalValue(g.targetValue, g.unit)}</span>
            <span>${remaining >= 0 ? remaining + ' giorni' : 'scaduto'}</span>
          </div>
          <div class="goal-actions">
            <button class="btn btn-secondary btn-update-goal" data-id="${g.id}">Aggiorna valore</button>
            <button class="btn btn-ghost btn-delete-goal" data-id="${g.id}">Elimina</button>
          </div>
        </div>
      `;
    }).join('');
  }

  list.querySelectorAll('.btn-update-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = getGoals().find(g => g.id === btn.dataset.id);
      const val = prompt(`Nuovo valore attuale per "${goalDisplayLabel(goal)}" (${goal.unit})`, goal.currentValue);
      if (val === null) return;
      const num = Number(val);
      if (Number.isNaN(num)) { toast('Valore non valido'); return; }
      const patch = { currentValue: num };
      const updated = { ...goal, ...patch };
      if (isAchieved(updated)) patch.achieved = true;
      updateGoal(goal.id, patch);

      // Keep the 1RM in Profilo in sync when this goal tracks a barbell lift.
      if (goal.movementId && goal.unit === 'kg' && ONE_RM_MOVEMENTS.some(m => m.id === goal.movementId)) {
        const profile = state.profile || defaultProfile();
        profile.oneRMs = profile.oneRMs || {};
        profile.oneRMs[goal.movementId] = num;
        saveProfile(profile);
        state.profile = profile;
      }

      renderGoals();
      toast(patch.achieved ? 'Obiettivo raggiunto! Complimenti' : 'Valore aggiornato \u2014 sincronizzato anche il tuo 1RM');
    });
  });
  list.querySelectorAll('.btn-delete-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Eliminare questo obiettivo?')) return;
      deleteGoal(btn.dataset.id);
      renderGoals();
    });
  });
}

function bindGoalForm() {
  const movementOptions = GOAL_MOVEMENTS.map(m => `<option value="${m.id ?? 'custom'}">${m.label}</option>`).join('');
  $('#goal-movement').innerHTML = movementOptions;
  $('#goal-movement').addEventListener('change', (e) => {
    $('#goal-label-custom').style.display = e.target.value === 'custom' ? 'block' : 'none';
  });

  const bindUnit = () => renderChipGroup($('#goal-unit-chips'), GOAL_UNITS, state.goalUnitSel, (id) => { state.goalUnitSel = id; bindUnit(); });
  bindUnit();

  const bindDir = () => renderChipGroup($('#goal-direction-chips'), GOAL_DIRECTIONS, state.goalDirectionSel, (id) => { state.goalDirectionSel = id; bindDir(); });
  bindDir();

  const dateOptions = [
    { id: 'month', label: '1 mese' },
    { id: 'quarter', label: '3 mesi' },
    { id: 'half', label: '6 mesi' },
    { id: 'custom', label: 'Data personalizzata' },
  ];
  const bindDate = () => renderChipGroup($('#goal-date-chips'), dateOptions, state.goalDateSel, (id) => {
    state.goalDateSel = id;
    $('#goal-date-custom').style.display = id === 'custom' ? 'block' : 'none';
    bindDate();
  });
  bindDate();
  $('#goal-date-custom').style.display = 'none';

  $('#btn-add-goal').addEventListener('click', () => {
    const movementSel = $('#goal-movement').value;
    const movementId = movementSel === 'custom' ? null : movementSel;
    const label = movementId ? null : ($('#goal-label-custom').value || 'Obiettivo personalizzato');
    const startValue = Number($('#goal-start').value);
    const targetValue = Number($('#goal-target').value);
    if (Number.isNaN(startValue) || Number.isNaN(targetValue)) { toast('Inserisci valore attuale e obiettivo'); return; }

    let targetDate;
    const today = new Date();
    if (state.goalDateSel === 'month') { const d = new Date(today); d.setDate(d.getDate() + 30); targetDate = d.toISOString().slice(0, 10); }
    else if (state.goalDateSel === 'quarter') targetDate = quarterFromNow();
    else if (state.goalDateSel === 'half') { const d = new Date(today); d.setDate(d.getDate() + 182); targetDate = d.toISOString().slice(0, 10); }
    else targetDate = $('#goal-date-custom').value || quarterFromNow();

    saveGoal({
      movementId, label, unit: state.goalUnitSel, direction: state.goalDirectionSel,
      startValue, currentValue: startValue, targetValue,
      startDate: today.toISOString().slice(0, 10), targetDate,
    });

    $('#goal-start').value = '';
    $('#goal-target').value = '';
    $('#goal-label-custom').value = '';
    renderGoals();
    toast('Obiettivo aggiunto');
  });
}

// ---------------- profile ----------------
function defaultProfile() {
  return { level: 'intermediate', equipment: [], limitations: [], notes: '', oneRMs: {} };
}

function hydrateProfileForm() {
  const profile = state.profile || defaultProfile();
  const bindLevel = () => renderChipGroup($('#level-chips'), LEVELS, profile.level, (id) => {
    state.profile = state.profile || defaultProfile();
    state.profile.level = id;
    hydrateProfileForm();
  });
  bindLevel();
  renderCheckGrid($('#equipment-grid'), EQUIPMENT, profile.equipment, (id, checked) => {
    state.profile = state.profile || defaultProfile();
    const set = new Set(state.profile.equipment);
    checked ? set.add(id) : set.delete(id);
    state.profile.equipment = Array.from(set);
  });
  renderCheckGrid($('#limitations-grid'), LIMITATION_MOVEMENTS, profile.limitations, (id, checked) => {
    state.profile = state.profile || defaultProfile();
    const set = new Set(state.profile.limitations);
    checked ? set.add(id) : set.delete(id);
    state.profile.limitations = Array.from(set);
  });
  renderOneRmGrid(profile.oneRMs || {});
  $('#in-notes').value = profile.notes || '';
}

function renderOneRmGrid(oneRMs) {
  const grid = $('#onerm-grid');
  grid.innerHTML = ONE_RM_MOVEMENTS.map(m => `
    <div class="onerm-row">
      <label for="onerm-${m.id}">${m.label}</label>
      <div class="onerm-input-wrap">
        <input type="number" id="onerm-${m.id}" min="0" step="0.5" value="${oneRMs[m.id] ?? ''}" placeholder="\u2014" />
        <span class="unit">kg</span>
      </div>
    </div>
  `).join('');
  ONE_RM_MOVEMENTS.forEach(m => {
    $('#onerm-' + m.id).addEventListener('change', (e) => {
      state.profile = state.profile || defaultProfile();
      state.profile.oneRMs = state.profile.oneRMs || {};
      const val = Number(e.target.value);
      if (e.target.value === '' || Number.isNaN(val)) delete state.profile.oneRMs[m.id];
      else state.profile.oneRMs[m.id] = val;
    });
  });
}

$('#btn-save-profile').addEventListener('click', () => {
  const profile = state.profile || defaultProfile();
  profile.notes = $('#in-notes').value;
  saveProfile(profile);
  state.profile = profile;
  toast('Profilo salvato');
});

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Cancellare profilo e storico da questo dispositivo? L\'operazione non è reversibile.')) return;
  clearAll();
  state.profile = defaultProfile();
  hydrateProfileForm();
  hydrateReminderForm();
  renderHistoryPanel();
  toast('Dati azzerati');
});

$('#btn-help').addEventListener('click', () => {
  alert('Box Log genera un WOD in base a obiettivo, tempo disponibile e readiness del giorno. Tutti i dati restano sul tuo dispositivo. Usa "Obiettivi" per traguardi a medio termine, "Storico" per calendario e grafico del carico.');
});

// ---------------- reminders ----------------
function hydrateReminderForm() {
  const settings = getReminderSettings();
  $('#reminder-enabled').checked = settings.enabled;
  $('#reminder-time').value = settings.time || '18:00';
  state.reminderDaysSel = settings.days || [1, 2, 3, 4, 5];

  const bindDays = () => {
    $('#reminder-days-chips').innerHTML = '';
    REMINDER_DAYS.forEach(d => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (state.reminderDaysSel.includes(d.id) ? ' selected' : '');
      btn.textContent = d.label;
      btn.addEventListener('click', () => {
        const set = new Set(state.reminderDaysSel);
        set.has(d.id) ? set.delete(d.id) : set.add(d.id);
        state.reminderDaysSel = Array.from(set);
        bindDays();
      });
      $('#reminder-days-chips').appendChild(btn);
    });
  };
  bindDays();

  $('#reminder-support-note').textContent = notificationsSupported()
    ? 'Su Mac/desktop e Android riceverai una notifica; su iPhone (anche da app installata sulla Home) il promemoria comparirà come banner qui in app quando la apri, per un limite di Safari sulle notifiche push senza server.'
    : 'Le notifiche non sono supportate su questo browser: vedrai comunque il promemoria come banner in app.';
}

$('#btn-save-reminders').addEventListener('click', async () => {
  const enabled = $('#reminder-enabled').checked;
  if (enabled && notificationsSupported()) {
    const perm = await requestNotificationPermission();
    if (perm === 'denied') toast('Notifiche bloccate dal browser: userò il banner in app');
  }
  saveReminderSettings({
    enabled,
    days: state.reminderDaysSel,
    time: $('#reminder-time').value || '18:00',
    lastNotifiedDate: getReminderSettings().lastNotifiedDate || null,
  });
  toast('Promemoria salvati');
});

function checkReminder() {
  const settings = getReminderSettings();
  const sessions = getSessions();
  if (!shouldFireReminder(settings, sessions)) return;
  fireLocalNotification();
  saveReminderSettings({ ...settings, lastNotifiedDate: new Date().toISOString().slice(0, 10) });
  toast('Promemoria: è ora di allenarsi \u{1F4AA}');
}

// ---------------- init ----------------
function bindGoalChips() {
  renderChipGroup($('#goal-chips'), GOALS, state.selectedGoal, (id) => {
    state.selectedGoal = id;
    bindGoalChips();
  });
}
function bindTimeChips() {
  const options = TIME_OPTIONS.map(m => ({ id: String(m), label: `${m}'` }));
  renderChipGroup($('#time-chips'), options, String(state.selectedMinutes), (id) => {
    state.selectedMinutes = Number(id);
    bindTimeChips();
  });
}

function init() {
  state.profile = getProfile() || defaultProfile();

  bindGoalChips();
  bindTimeChips();
  hydrateProfileForm();
  hydrateReminderForm();
  bindGoalForm();
  updateReadinessPreview();

  checkReminder();
  setInterval(checkReminder, 5 * 60 * 1000);
}

init();

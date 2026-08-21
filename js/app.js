import { generateWod, generateWodFromMovements } from './generator/generateWod.js';
import { allocateTime } from './generator/scaling.js';
import { computeReadiness, readinessBand, trainingLoad } from './generator/readiness.js';
import { MOVEMENTS, getMovement } from './data/movements.js';
import { warmupDrillsForPatterns, pickGeneralRaise } from './data/warmups.js';
import { SKILLS, getSkill } from './data/skills.js';
import {
  createStrengthPlan, createSkillPlan, createMetconPlan,
  strengthSessionPrescription, applyStrengthResult, isRetestDue, applyRetest,
  skillSessionPrescription, applySkillResult,
  metconWeekPlan, advanceMetconWeek,
  pickDuePlan,
} from './generator/planEngine.js';
import {
  getProfile, saveProfile, getSessions, saveSession, recentPatterns, recentTemplateIds,
  completedSessionsSorted, sessionsInMonth,
  getPlans, savePlan, updatePlan, deletePlan,
  getActiveSession, setActiveSession, clearActiveSession,
  getReminderSettings, saveReminderSettings,
  exportData, importData, clearAll,
} from './storage.js';
import { computeStreak, daysSinceLast, motivationalMessage, REMINDER_DAYS, notificationsSupported, requestNotificationPermission, shouldFireReminder, fireLocalNotification } from './motivation.js';
import { monthLabel, buildMonthGrid, weekdayHeaderHtml, renderMonthGridHtml } from './ui/calendar.js';
import { trainingLoadChartSvg } from './ui/chart.js';

export const APP_VERSION = 'v7 - 21 ago 2026 (timer a fasi)';

const TIME_OPTIONS = [30, 45, 60, 75, 90];
const LEVELS = [
  { id: 'beginner', label: 'Principiante' },
  { id: 'intermediate', label: 'Intermedio' },
  { id: 'advanced', label: 'Avanzato' },
];
const GENDERS = [
  { id: 'm', label: 'Uomo' },
  { id: 'f', label: 'Donna' },
  { id: 'other', label: 'Preferisco non dirlo' },
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
  { id: 'battle_ropes', label: 'Battle ropes' },
];
const LIMITATION_MOVEMENTS = MOVEMENTS
  .filter(m => !m.recoveryOnly)
  .map(m => ({ id: m.id, label: m.name }))
  .sort((a, b) => a.label.localeCompare(b.label));
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
const MONO_ACTIVITIES = [
  { id: 'run_outdoor', label: 'Corsa outdoor' },
  { id: 'bike_road', label: 'Bici su strada' },
  { id: 'swim', label: 'Nuoto' },
  { id: 'row_indoor', label: 'Vogatore' },
  { id: 'bike_indoor', label: 'Bike indoor' },
];
const SKILL_PATTERNS = {
  muscle_up: ['pull', 'push'],
  ctb_pullup: ['pull'],
  toes_to_bar: ['core', 'pull'],
  pistol_squat: ['squat'],
  handstand_walk: ['press'],
  rope_climb: ['pull'],
};
const METCON_WEEK_FORMATS = { 2: 'AMRAP_ROUNDS', 3: 'EMOM', 4: 'FOR_TIME', 5: 'AMRAP_ROUNDS' };
const ASSISTED_FORMAT_TABS = [
  { id: 'FOR_TIME', label: 'For Time', minMoves: 2, maxMoves: 3 },
  { id: 'AMRAP_ROUNDS', label: 'AMRAP', minMoves: 2, maxMoves: 3 },
  { id: 'EMOM', label: 'EMOM', minMoves: 1, maxMoves: 2 },
  { id: 'AMRAP_REPS', label: 'Total reps', minMoves: 1, maxMoves: 1 },
];
const WOD_BLOCK_COLORS = { warmup: 'var(--marker-teal)', main: 'var(--marker-red)', cooldown: 'var(--marker-teal)' };
const FORMAT_LABELS = {
  FOR_TIME: 'For Time', AMRAP_ROUNDS: 'AMRAP', AMRAP_REPS: 'AMRAP reps',
  EMOM: 'EMOM', TABATA: 'Tabata', DEATH_BY: 'Death By', STEADY: 'Steady state', RECOVERY: 'Recovery',
};

let state = {
  profile: null,
  historyMode: 'list',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedCalDate: null,
  pendingSession: null,
  session: null,
  newPlanKind: 'strength',
  completionSel: 100,
  timerHandle: null,
};

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

function defaultProfile() {
  return { firstName: '', lastName: '', gender: null, age: null, weightKg: null, level: 'intermediate', equipment: [], limitations: [], notes: '', oneRMs: {} };
}

function switchView(viewId) {
  $all('.view').forEach(v => v.classList.toggle('active', v.id === viewId));
  $all('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  if (viewId === 'view-history') { renderMotivation(); renderHistoryPanel(); }
  if (viewId === 'view-plans') renderPlans();
  if (viewId === 'view-today') renderTodayRoot();
}
$all('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

function renderTodayRoot() {
  const active = getActiveSession();
  if (active) {
    state.session = active;
    showSessionState();
    renderActiveSessionContent();
  } else if (state.pendingSession) {
    showCheckinState();
  } else {
    showPresessionState();
  }
}

function showPresessionState() {
  $('#presession-wrap').style.display = 'block';
  $('#checkin-wrap').style.display = 'none';
  $('#session-wrap').style.display = 'none';
  $('#endsession-wrap').style.display = 'none';
  stopSessionTimer();
  renderDuePlanCard();
}
function showCheckinState() {
  $('#presession-wrap').style.display = 'none';
  $('#checkin-wrap').style.display = 'block';
  $('#session-wrap').style.display = 'none';
  $('#endsession-wrap').style.display = 'none';
  stopSessionTimer();
  bindTimeChips();
  updateReadinessPreview();
}
function showSessionState() {
  $('#presession-wrap').style.display = 'none';
  $('#checkin-wrap').style.display = 'none';
  $('#session-wrap').style.display = 'block';
  $('#endsession-wrap').style.display = 'none';
  renderPhaseUI();
}
function showEndSessionState() {
  $('#presession-wrap').style.display = 'none';
  $('#checkin-wrap').style.display = 'none';
  $('#session-wrap').style.display = 'none';
  $('#endsession-wrap').style.display = 'block';
  stopSessionTimer();
  bindCompletionChips();
  renderEndSessionExtra();
}

// ---------------- phase timer ----------------
function getSessionPhases(session) {
  const content = session.content;
  if (!content) return [];
  const warmupMinutes = allocateTime(session.availableMinutes).warmup;

  if (content.type === 'light') {
    return [{ key: 'light', label: 'Sessione leggera', minutes: session.availableMinutes, countUp: true }];
  }
  if (content.type === 'strength' || content.type === 'skill') {
    const kindLabel = content.type === 'strength' ? 'Forza' : 'Skill';
    return [
      { key: 'warmup', label: 'Warm-up', minutes: content.warmup.minutes, countUp: false },
      { key: 'central', label: kindLabel, minutes: content.centralMinutes, countUp: false },
      { key: 'wod', label: FORMAT_LABELS[content.wod.format] || 'WOD', minutes: content.wod.main.estimatedMinutes, countUp: content.wod.format === 'FOR_TIME' },
    ];
  }
  if (content.type === 'metcon_week') {
    return [
      { key: 'warmup', label: 'Warm-up', minutes: content.wod.warmup.minutes, countUp: false },
      { key: 'wod', label: FORMAT_LABELS[content.wod.format] || 'WOD', minutes: content.wod.main.estimatedMinutes, countUp: content.wod.format === 'FOR_TIME' },
    ];
  }
  if (content.type === 'metcon_retest') {
    return [
      { key: 'warmup', label: 'Warm-up', minutes: (content.warmup && content.warmup.minutes) || warmupMinutes, countUp: false },
      { key: 'wod', label: 'Retest', minutes: null, countUp: true },
    ];
  }
  if (content.type === 'monostructural') {
    return [{ key: 'activity', label: 'Attivit\u00e0', minutes: session.availableMinutes, countUp: true }];
  }
  if (content.type === 'manual') {
    const phases = [{ key: 'warmup', label: 'Warm-up', minutes: warmupMinutes, countUp: false }];
    if (content.focusType !== 'solo_wod') {
      phases.push({ key: 'central', label: content.focusType === 'strength' ? 'Forza' : 'Skill', minutes: null, countUp: true });
    }
    const wod = content.generatedWod;
    phases.push({ key: 'wod', label: 'WOD', minutes: wod ? wod.main.estimatedMinutes : null, countUp: wod ? wod.format === 'FOR_TIME' : true });
    return phases;
  }
  return [{ key: 'session', label: 'Sessione', minutes: session.availableMinutes, countUp: true }];
}

function renderPhaseUI() {
  const session = state.session;
  if (!session.timerStarted) {
    $('#phase-start-wrap').style.display = 'flex';
    $('#phase-timer-wrap').style.display = 'none';
    $('#session-timer').textContent = '0:00';
  } else {
    $('#phase-start-wrap').style.display = 'none';
    $('#phase-timer-wrap').style.display = 'block';
    updatePhaseTimerDisplay();
    startPhaseInterval();
  }
}

$('#btn-start-workout').addEventListener('click', () => {
  const session = state.session;
  session.timerStarted = true;
  session.phaseIndex = 0;
  session.phaseStartedAt = new Date().toISOString();
  session.overallStartedAt = new Date().toISOString();
  persistSession();
  renderPhaseUI();
});

$('#btn-next-phase').addEventListener('click', () => advancePhase(false));

function advancePhase(auto) {
  const session = state.session;
  const phases = getSessionPhases(session);
  if (session.phaseIndex < phases.length - 1) {
    session.phaseIndex += 1;
    session.phaseStartedAt = new Date().toISOString();
    persistSession();
    if (auto) toast(`Fase successiva: ${phases[session.phaseIndex].label}`);
    updatePhaseTimerDisplay();
  }
}

function updatePhaseTimerDisplay() {
  const session = state.session;
  if (!session || !session.timerStarted) return;
  const phases = getSessionPhases(session);
  const phase = phases[session.phaseIndex];
  if (!phase) return;

  const elapsedSec = Math.floor((Date.now() - new Date(session.phaseStartedAt).getTime()) / 1000);
  let displaySec, overtime = false;
  if (phase.countUp || !phase.minutes) {
    displaySec = elapsedSec;
  } else {
    const totalSec = phase.minutes * 60;
    displaySec = totalSec - elapsedSec;
    if (displaySec <= 0) { overtime = true; displaySec = Math.abs(displaySec); }
    if (overtime && session.phaseIndex < phases.length - 1) {
      advancePhase(true);
      return;
    }
  }
  const mm = Math.floor(displaySec / 60), ss = displaySec % 60;
  const valEl = $('#phase-timer-value');
  if (valEl) {
    valEl.textContent = `${overtime ? '+' : ''}${mm}:${String(ss).padStart(2, '0')}`;
    valEl.classList.toggle('overtime', overtime);
  }
  const nameEl = $('#phase-name');
  if (nameEl) nameEl.textContent = phase.label;
  const progEl = $('#phase-progress');
  if (progEl) progEl.textContent = `Fase ${session.phaseIndex + 1}/${phases.length}`;

  const overallSec = Math.floor((Date.now() - new Date(session.overallStartedAt || session.startedAt).getTime()) / 1000);
  const oMm = Math.floor(overallSec / 60), oSs = overallSec % 60;
  const overallEl = $('#session-timer');
  if (overallEl) overallEl.textContent = `${oMm}:${String(oSs).padStart(2, '0')}`;
}

function startPhaseInterval() {
  clearInterval(state.timerHandle);
  state.timerHandle = setInterval(updatePhaseTimerDisplay, 1000);
  updatePhaseTimerDisplay();
}
function stopSessionTimer() {
  clearInterval(state.timerHandle);
}

$('#btn-cancel-session').addEventListener('click', () => {
  if (!confirm('Annullare questa sessione? Non verrà salvata nello storico.')) return;
  stopSessionTimer();
  clearActiveSession();
  state.session = null;
  toast('Sessione annullata');
  showPresessionState();
});

function renderDuePlanCard() {
  const plans = getPlans().filter(p => p.status === 'active');
  const wrap = $('#due-plan-content');
  if (plans.length === 0) {
    wrap.innerHTML = '<p class="small muted">Nessun piano attivo. Vai su "Piani" per crearne uno - senza un piano puoi comunque allenarti in modalita Manuale o Monostrutturale.</p>';
    $('#btn-start-guided').disabled = true;
    $('#btn-start-guided').style.opacity = '0.5';
    return;
  }
  $('#btn-start-guided').disabled = false;
  $('#btn-start-guided').style.opacity = '1';
  const due = pickDuePlan(plans, getSessions());
  const others = plans.filter(p => p.id !== due.id);
  let html = planSummaryHtml(due);
  if (others.length > 0) {
    html += `<p class="small muted" style="margin-top:8px;">In rotazione anche: ${others.map(p => p.label).join(', ')}</p>`;
  }
  wrap.innerHTML = html;
}

function planSummaryHtml(plan) {
  if (plan.kind === 'strength') {
    return `<div class="due-plan-title">${plan.label}</div><div class="due-plan-detail">Prossimo step: ${plan.scheme.sets} x ${plan.scheme.reps} @ ${plan.trainingMax}kg</div>`;
  }
  if (plan.kind === 'skill') {
    const skill = getSkill(plan.skillId);
    const step = skill.steps[plan.stepIndex];
    return `<div class="due-plan-title">${plan.label}</div><div class="due-plan-detail">Step ${plan.stepIndex + 1}/${skill.steps.length}: ${step.label} - ${step.prescription}</div>`;
  }
  if (plan.kind === 'metcon') {
    const wp = metconWeekPlan(plan);
    return `<div class="due-plan-title">${plan.label}</div><div class="due-plan-detail">Settimana ${plan.cycleWeek}/6 ${wp.isRetest ? '- retest' : '- ' + wp.note}</div>`;
  }
  return '';
}

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
    case 'moderate': return 'Meglio tecnica e volume contenuto oggi.';
    default: return 'Consigliata tecnica leggera o mobilita.';
  }
}
function drawReadinessDial(score, band) {
  const svg = $('#readiness-dial');
  if (!svg) return;
  const cx = 90, cy = 95, r = 72;
  const startAngle = Math.PI, endAngle = 0;
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
    <path d="${fg}" stroke="${band.color}" stroke-width="12" fill="none" stroke-linecap="round" style="filter: drop-shadow(0 0 4px ${band.color}80);" />
  `;
}
['in-energy', 'in-sleep', 'in-stress', 'in-soreness'].forEach(id => {
  $('#' + id).addEventListener('input', (e) => {
    $('#val-' + id.replace('in-', '')).textContent = e.target.value;
    updateReadinessPreview();
  });
});

let selectedMinutes = 45;
function bindTimeChips() {
  const options = TIME_OPTIONS.map(m => ({ id: String(m), label: `${m}'` }));
  renderChipGroup($('#time-chips'), options, String(selectedMinutes), (id) => {
    selectedMinutes = Number(id);
    bindTimeChips();
  });
}

$('#btn-start-guided').addEventListener('click', () => {
  const plans = getPlans().filter(p => p.status === 'active');
  if (plans.length === 0) { toast('Crea prima un piano'); return; }
  const due = pickDuePlan(plans, getSessions());
  state.pendingSession = { kind: 'guided', planId: due.id };
  showCheckinState();
});
$('#btn-start-mono').addEventListener('click', () => {
  state.pendingSession = { kind: 'monostructural' };
  showCheckinState();
});
$('#btn-start-manual').addEventListener('click', () => {
  state.pendingSession = { kind: 'manual' };
  showCheckinState();
});
$('#btn-checkin-cancel').addEventListener('click', () => {
  state.pendingSession = null;
  showPresessionState();
});

$('#btn-checkin-confirm').addEventListener('click', () => {
  const { score, band } = updateReadinessPreview();
  const availableMinutes = selectedMinutes;
  const effectiveMinutes = availableMinutes < 30 ? availableMinutes : Math.max(30, Math.min(90, availableMinutes));
  const forceLightSession = availableMinutes < 30;

  const session = {
    kind: state.pendingSession.kind,
    planId: state.pendingSession.planId || null,
    startedAt: new Date().toISOString(),
    availableMinutes: effectiveMinutes,
    readinessScore: score,
    readinessBand: band.key,
    forceLightSession,
    draft: {},
    timerStarted: false,
    phaseIndex: 0,
    phaseStartedAt: null,
    overallStartedAt: null,
  };

  buildSessionContentData(session);
  setActiveSession(session);
  state.session = session;
  state.pendingSession = null;
  showSessionState();
  renderActiveSessionContent();
});

function buildSessionContentData(session) {
  const profile = state.profile || defaultProfile();

  if (session.forceLightSession) {
    session.content = { type: 'light', text: 'Tempo ridotto: oggi va bene anche solo mobilita o un movimento leggero (camminata, bike facile, stretching guidato) per restare in moto senza accumulare fatica.' };
    return;
  }

  if (session.kind === 'monostructural') {
    session.content = { type: 'monostructural' };
    return;
  }

  if (session.kind === 'manual') {
    session.content = {
      type: 'manual',
      focusType: 'solo_wod',
      focusMovementId: null,
      focusPrescription: '',
      focusSkillId: null,
      focusStepIndex: 0,
      wodMode: 'write',
      rows: [],
      formatLabel: '',
      notes: '',
      generatedWod: null,
      assistFormat: 'FOR_TIME',
      assistMovementIds: [],
    };
    return;
  }

  const plan = getPlan(session.planId);
  if (!plan) { session.content = { type: 'error', text: 'Piano non trovato.' }; return; }

  if (plan.kind === 'strength') {
    const movement = getMovement(plan.movementId);
    const rx = strengthSessionPrescription(plan);
    const split = splitSessionMinutes(session.availableMinutes, true);
    const warmup = buildWarmupFor(movement.patterns, profile.equipment);
    const wod = buildFocusAvoidingWod(split.wod, movement.patterns, session, profile);
    session.content = { type: 'strength', planId: plan.id, movement: movement.name, rx, warmup, wod, centralMinutes: split.central };
    session.draft.strengthCompleted = true;
    session.draft.weightMode = 'auto';
    session.draft.customSets = rx.sets;
    session.draft.customReps = rx.reps;
    session.draft.customWeight = rx.weightKg ?? null;
    return;
  }

  if (plan.kind === 'skill') {
    const { skill, step, isFinalStep } = skillSessionPrescription(plan);
    const patterns = SKILL_PATTERNS[plan.skillId] || [];
    const split = splitSessionMinutes(session.availableMinutes, true);
    const warmup = buildWarmupFor(patterns, profile.equipment);
    const wod = buildFocusAvoidingWod(split.wod, patterns, session, profile);
    session.content = { type: 'skill', planId: plan.id, skillLabel: skill.label, step, stepIndex: plan.stepIndex, totalSteps: skill.steps.length, isFinalStep, warmup, wod, centralMinutes: split.central };
    session.draft.skillClean = true;
    return;
  }

  if (plan.kind === 'metcon') {
    const wp = metconWeekPlan(plan);
    if (wp.isRetest) {
      const warmup = buildWarmupFor([], profile.equipment);
      session.content = { type: 'metcon_retest', planId: plan.id, week: wp.week, benchmarkLabel: plan.benchmarkLabel, benchmarkDescription: plan.benchmarkDescription, warmup };
      return;
    }
    const wod = generateWod({
      goal: 'conditioning',
      availableMinutes: session.availableMinutes,
      level: profile.level,
      equipment: profile.equipment,
      limitations: profile.limitations,
      recentPatterns: recentPatterns(2),
      recentTemplateIds: recentTemplateIds(3),
      readinessScore: session.readinessScore,
      band: readinessBand(session.readinessScore),
      oneRMs: profile.oneRMs || {},
      gender: profile.gender || null,
      priorityMovementIds: plan.keyMovementIds || [],
      forceFormat: METCON_WEEK_FORMATS[plan.cycleWeek],
    });
    session.content = { type: 'metcon_week', planId: plan.id, week: plan.cycleWeek, note: wp.note, wod };
    return;
  }
}

function buildWarmupFor(patterns, equipment) {
  const raise = pickGeneralRaise(equipment);
  const drills = warmupDrillsForPatterns(patterns);
  return { raise, drills };
}

// Splits the session into warmup / central (strength or skill) / wod / cooldown.
// hasCentral=false (e.g. a pure-conditioning day) gives the whole middle block to the WOD.
function splitSessionMinutes(availableMinutes, hasCentral) {
  const time = allocateTime(availableMinutes);
  if (!hasCentral) return { warmup: time.warmup, central: 0, wod: time.main, cooldown: time.cooldown };
  const central = Math.max(10, Math.min(time.main - 6, Math.round(time.main * 0.45)));
  const wod = Math.max(6, time.main - central);
  return { warmup: time.warmup, central, wod, cooldown: time.cooldown };
}

// Builds the closing WOD for a Strength/Skill-focused session. It softly avoids
// the pattern(s) just trained (passed in as extra "recent" patterns so the
// engine's own variety scoring naturally steers away from them) rather than a
// hard ban — a real coach would still allow it occasionally if nothing else fits.
function buildFocusAvoidingWod(wodMinutes, avoidPatterns, session, profile) {
  return generateWod({
    goal: 'conditioning',
    availableMinutes: wodMinutes,
    level: profile.level,
    equipment: profile.equipment,
    limitations: profile.limitations,
    recentPatterns: recentPatterns(2),
    recentTemplateIds: recentTemplateIds(3),
    readinessScore: session.readinessScore,
    band: readinessBand(session.readinessScore),
    oneRMs: profile.oneRMs || {},
    gender: profile.gender || null,
    avoidPatterns,
    noOverhead: true,
  });
}

function getPlan(id) {
  return getPlans().find(p => p.id === id) || null;
}

function renderActiveSessionContent() {
  const session = state.session;
  const content = session.content;
  $('#session-kind-badge').textContent = sessionKindLabel(session);
  $('#session-title').textContent = sessionTitle(session);
  $('#session-subtitle').textContent = `${session.availableMinutes} min - readiness ${session.readinessScore}/100`;

  const el = $('#session-content');
  if (!content) { el.innerHTML = ''; return; }

  if (content.type === 'light') {
    el.innerHTML = `<p>${content.text}</p>`;
  } else if (content.type === 'strength') {
    el.innerHTML = warmupHtml(content.warmup) + `
      <div class="primary-block strength">
        <div class="primary-kind">Forza</div>
        <div class="primary-movement">${content.movement}</div>
        <div class="chip-group" id="strength-mode-chips" style="margin:6px 0 10px;"></div>
        <div id="strength-prescription-area"></div>
      </div>
      <span class="field-label">Hai completato tutte le serie previste?</span>
      <div class="chip-group" id="strength-result-chips"></div>
    ` + renderWodMainOnly(content.wod);
    bindBoolChips('#strength-result-chips', 'strengthCompleted', true);
    bindStrengthModeChips();
  } else if (content.type === 'skill') {
    el.innerHTML = warmupHtml(content.warmup) + `
      <div class="primary-block skill">
        <div class="primary-kind">Skill - ${content.skillLabel}</div>
        <div class="primary-movement">Step ${content.stepIndex + 1}/${content.totalSteps}: ${content.step.label}</div>
        <div class="primary-prescription">${content.step.prescription}</div>
      </div>
      <span class="field-label">Eseguito pulito?</span>
      <div class="chip-group" id="skill-result-chips"></div>
    ` + renderWodMainOnly(content.wod);
    bindBoolChips('#skill-result-chips', 'skillClean', true);
  } else if (content.type === 'metcon_retest') {
    el.innerHTML = warmupHtml(content.warmup) + `
      <h3>Retest - settimana ${content.week}</h3>
      <p><strong>${content.benchmarkLabel}</strong></p>
      <p class="small muted">${content.benchmarkDescription || ''}</p>
      <span class="field-label">Risultato (tempo o round+reps)</span>
      <input type="text" id="metcon-result-input" placeholder="es. 12:34 oppure 5 round + 8 reps" />
    `;
  } else if (content.type === 'metcon_week') {
    el.innerHTML = `<p class="wod-score-type">Settimana ${content.week}/6 - ${content.note}</p>` + renderWodBlocksHtml(content.wod);
  } else if (content.type === 'monostructural') {
    el.innerHTML = `
      <span class="field-label">Attivita</span>
      <div class="chip-group" id="mono-activity-chips"></div>
      <span class="field-label">Distanza (km)</span>
      <input type="number" step="0.1" id="mono-distance" placeholder="es. 8.5" />
      <span class="field-label">Durata (min)</span>
      <input type="number" id="mono-duration" value="${session.availableMinutes}" />
    `;
    const bindActivity = (sel) => renderChipGroup($('#mono-activity-chips'), MONO_ACTIVITIES, sel, (id) => {
      session.draft.activity = id;
      persistSession();
      bindActivity(id);
    });
    bindActivity(session.draft.activity || null);
    $('#mono-distance').value = session.draft.distanceKm || '';
    $('#mono-distance').addEventListener('input', (e) => { session.draft.distanceKm = e.target.value; persistSession(); });
    $('#mono-duration').addEventListener('input', (e) => { session.draft.durationMin = e.target.value; persistSession(); });
  } else if (content.type === 'manual') {
    renderManualBuilder();
  } else if (content.type === 'error') {
    el.innerHTML = `<p class="small muted">${content.text}</p>`;
  }
}

function sessionKindLabel(session) {
  if (session.kind === 'monostructural') return 'Monostrutturale';
  if (session.kind === 'manual') return 'Manuale';
  const plan = getPlan(session.planId);
  return plan ? ({ strength: 'Forza', skill: 'Skill', metcon: 'Metcon' }[plan.kind]) : 'Guidata';
}
function sessionTitle(session) {
  if (session.content && session.content.type === 'light') return 'Sessione leggera';
  if (session.kind === 'monostructural') return 'Cardio monostrutturale';
  if (session.kind === 'manual') return 'Allenamento manuale';
  const plan = getPlan(session.planId);
  return plan ? plan.label : 'Sessione';
}

function warmupHtml(warmup) {
  const items = [`<li><span>${warmup.raise.name}</span><span class="reps">avvio</span></li>`]
    .concat(warmup.drills.map(d => `<li><span>${d.name}</span><span class="reps">${d.prescription}</span></li>`));
  return renderWodBlock('warmup', 'Warm-up', null, `<ul class="wod-move-list">${items.join('')}</ul>`);
}
function renderWodBlock(key, label, minutes, content) {
  return `<div class="wod-block"><div class="wod-block-label"><span class="swatch" style="background:${WOD_BLOCK_COLORS[key]}"></span><span class="txt">${label}</span>${minutes != null ? `<span class="mins">${minutes} min</span>` : ''}</div>${content}</div>`;
}
function renderWodBlocksHtml(wod) {
  return warmupHtml(wod.warmup) + renderWodMainOnly(wod);
}
function renderWodMainOnly(wod) {
  const moveItems = wod.main.movements.map(m =>
    `<li><span>${m.name}${m.loadText ? ` <span class="muted small">(${m.loadText})</span>` : ''}</span><span class="reps">${m.repsText}</span></li>`).join('');
  let html = renderWodBlock('main', FORMAT_LABELS[wod.format] || 'WOD', wod.main.estimatedMinutes, `
    <div class="wod-structure">${wod.main.structureText}</div>
    ${wod.main.scoreType ? `<div class="wod-score-type">Punteggio: ${wod.main.scoreType}</div>` : ''}
    <ul class="wod-move-list">${moveItems}</ul>
    <div class="wod-meta"><span>Target RPE ${wod.main.targetRpe[0]}-${wod.main.targetRpe[1]}</span><span>Cap RPE ${wod.main.capRpe}</span></div>
  `);
  html += renderWodBlock('cooldown', 'Cooldown', wod.cooldown.minutes, `<p>${wod.cooldown.text}</p>`);
  return html;
}

function bindStrengthModeChips() {
  const session = state.session;
  const content = session.content;
  const modeOptions = [{ id: 'auto', label: 'Calcolato' }, { id: 'custom', label: 'Personalizza' }];
  const bind = () => renderChipGroup($('#strength-mode-chips'), modeOptions, session.draft.weightMode, (id) => {
    session.draft.weightMode = id;
    persistSession();
    bind();
    renderStrengthPrescriptionArea();
  });
  bind();
  renderStrengthPrescriptionArea();
}

function renderStrengthPrescriptionArea() {
  const session = state.session;
  const content = session.content;
  const areaEl = $('#strength-prescription-area');
  if (session.draft.weightMode === 'auto') {
    areaEl.innerHTML = `
      <div class="primary-prescription">${content.rx.sets} x ${content.rx.reps} @ ${content.rx.weightKg}kg</div>
      <span class="field-label">Carico (kg) \u2014 modificalo se ti sembra sbagliato</span>
      <input type="number" id="strength-weight-input" step="0.5" value="${session.draft.customWeight ?? ''}" placeholder="es. 85" />
    `;
    $('#strength-weight-input').addEventListener('input', (e) => {
      session.draft.customWeight = Number(e.target.value) || null;
      persistSession();
    });
  } else {
    areaEl.innerHTML = `
      <div style="display:flex; gap:8px;">
        <div style="flex:1;">
          <span class="field-label">Serie</span>
          <input type="number" id="strength-sets-input" value="${session.draft.customSets}" />
        </div>
        <div style="flex:1;">
          <span class="field-label">Ripetizioni</span>
          <input type="number" id="strength-reps-input" value="${session.draft.customReps}" />
        </div>
        <div style="flex:1;">
          <span class="field-label">Carico (kg)</span>
          <input type="number" id="strength-weight-input" step="0.5" value="${session.draft.customWeight ?? ''}" placeholder="es. 85" />
        </div>
      </div>
    `;
    $('#strength-sets-input').addEventListener('input', (e) => { session.draft.customSets = Number(e.target.value) || content.rx.sets; persistSession(); });
    $('#strength-reps-input').addEventListener('input', (e) => { session.draft.customReps = Number(e.target.value) || content.rx.reps; persistSession(); });
    $('#strength-weight-input').addEventListener('input', (e) => { session.draft.customWeight = Number(e.target.value) || null; persistSession(); });
  }
}

function bindBoolChips(selector, draftKey, defaultVal) {
  const options = [{ id: 'yes', label: 'Si' }, { id: 'no', label: 'No' }];
  const bind = () => renderChipGroup($(selector), options, state.session.draft[draftKey] === undefined ? (defaultVal ? 'yes' : null) : (state.session.draft[draftKey] ? 'yes' : 'no'), (id) => {
    state.session.draft[draftKey] = id === 'yes';
    persistSession();
    bind();
  });
  bind();
}

function manualFocusPatterns(content) {
  if (content.focusType === 'strength' && content.focusMovementId) {
    return (getMovement(content.focusMovementId) || {}).patterns || [];
  }
  if (content.focusType === 'skill' && content.focusSkillId) {
    return SKILL_PATTERNS[content.focusSkillId] || [];
  }
  return [];
}
function manualWodPatterns(content) {
  if (content.generatedWod) return content.generatedWod.patternsHit || [];
  if (content.wodMode === 'write') {
    return content.rows.flatMap(r => (getMovement(r.movementId) || {}).patterns || []);
  }
  return [];
}

function renderManualBuilder() {
  const session = state.session;
  const content = session.content;
  const profile = state.profile || defaultProfile();
  const el = $('#session-content');

  const focusPatterns = manualFocusPatterns(content);
  const wodPatterns = manualWodPatterns(content);
  const warmupPatterns = focusPatterns.length ? focusPatterns : wodPatterns;
  const warmup = buildWarmupFor(warmupPatterns, profile.equipment);

  let html = warmupHtml(warmup);
  html += '<span class="field-label">Focus di oggi</span><div class="chip-group" id="manual-focus-chips"></div>';

  if (content.focusType === 'strength') {
    html += `
      <span class="field-label">Movimento</span>
      <select id="manual-focus-movement" class="select-input">${ONE_RM_MOVEMENTS.map(m => `<option value="${m.id}">${m.label}</option>`).join('')}</select>
      <span class="field-label">Prescrizione (serie x reps @ carico)</span>
      <input type="text" id="manual-focus-prescription" placeholder="es. 5x5 @ 90kg" value="${content.focusPrescription || ''}" />
    `;
  } else if (content.focusType === 'skill') {
    html += `
      <span class="field-label">Skill</span>
      <select id="manual-focus-skill" class="select-input">${SKILLS.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}</select>
      <span class="field-label">Step</span>
      <select id="manual-focus-step" class="select-input"></select>
    `;
  }

  html += '<hr class="chalk-rule" /><span class="field-label">WOD</span><div class="chip-group" id="manual-wodmode-chips"></div><div id="manual-wod-area"></div>';
  html += `<span class="field-label">Note</span><textarea id="manual-notes" placeholder="Note libere...">${content.notes || ''}</textarea>`;

  el.innerHTML = html;

  const focusOptions = [{ id: 'solo_wod', label: 'Solo WOD' }, { id: 'strength', label: 'Forza' }, { id: 'skill', label: 'Skill' }];
  renderChipGroup($('#manual-focus-chips'), focusOptions, content.focusType, (id) => {
    content.focusType = id;
    content.generatedWod = null;
    persistSession();
    renderManualBuilder();
  });

  if (content.focusType === 'strength') {
    if (!content.focusMovementId) { content.focusMovementId = ONE_RM_MOVEMENTS[0].id; persistSession(); }
    $('#manual-focus-movement').value = content.focusMovementId;
    $('#manual-focus-movement').addEventListener('change', (e) => { content.focusMovementId = e.target.value; content.generatedWod = null; persistSession(); renderManualBuilder(); });
    $('#manual-focus-prescription').addEventListener('input', (e) => { content.focusPrescription = e.target.value; persistSession(); });
  } else if (content.focusType === 'skill') {
    if (!content.focusSkillId) { content.focusSkillId = SKILLS[0].id; persistSession(); }
    $('#manual-focus-skill').value = content.focusSkillId;
    const fillSteps = () => {
      const skill = getSkill($('#manual-focus-skill').value);
      $('#manual-focus-step').innerHTML = skill.steps.map((s, i) => `<option value="${i}">${i + 1}. ${s.label}</option>`).join('');
      $('#manual-focus-step').value = content.focusStepIndex || 0;
    };
    fillSteps();
    $('#manual-focus-skill').addEventListener('change', (e) => { content.focusSkillId = e.target.value; content.focusStepIndex = 0; content.generatedWod = null; persistSession(); fillSteps(); renderManualBuilder(); });
    $('#manual-focus-step').addEventListener('change', (e) => { content.focusStepIndex = Number(e.target.value); persistSession(); });
  }

  const wodModeOptions = [{ id: 'generate', label: 'Genera tu' }, { id: 'write', label: 'Lo scrivo io' }];
  renderChipGroup($('#manual-wodmode-chips'), wodModeOptions, content.wodMode, (id) => {
    content.wodMode = id;
    content.generatedWod = null;
    persistSession();
    renderManualBuilder();
  });

  renderManualWodArea();
  $('#manual-notes').addEventListener('input', (e) => { content.notes = e.target.value; persistSession(); });
}

function renderManualWodArea() {
  const content = state.session.content;
  const areaEl = $('#manual-wod-area');

  if (content.wodMode === 'generate') {
    if (content.generatedWod) {
      areaEl.innerHTML = renderWodMainOnly(content.generatedWod) + '<button type="button" class="btn btn-secondary" id="btn-manual-regen">Rigenera</button>';
      $('#btn-manual-regen').addEventListener('click', () => { content.generatedWod = null; persistSession(); renderManualBuilder(); });
      return;
    }

    const formatDef = ASSISTED_FORMAT_TABS.find(f => f.id === content.assistFormat) || ASSISTED_FORMAT_TABS[0];
    // Keep the movement list the right length for the chosen format.
    while (content.assistMovementIds.length < formatDef.maxMoves) content.assistMovementIds.push(null);
    content.assistMovementIds = content.assistMovementIds.slice(0, formatDef.maxMoves);

    const profile = state.profile || defaultProfile();
    const usable = MOVEMENTS.filter(m => !m.recoveryOnly && m.equipment.every(e => profile.equipment.includes(e)));
    const options = usable.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    let slotsHtml = '';
    for (let i = 0; i < formatDef.maxMoves; i++) {
      const isRequired = i < formatDef.minMoves;
      slotsHtml += `
        <div class="assist-move-row">
          <select class="assist-move-select" data-i="${i}">
            <option value="">${isRequired ? '\u2014 scegli movimento \u2014' : '\u2014 (opzionale) \u2014'}</option>
            ${options}
          </select>
        </div>
      `;
    }

    areaEl.innerHTML = `
      <div class="tab-strip" id="assist-format-tabs"></div>
      <p class="small muted" style="margin:8px 0;">Scegli ${formatDef.minMoves}${formatDef.maxMoves > formatDef.minMoves ? `-${formatDef.maxMoves}` : ''} movimenti \u2014 il motore calcola reps, round e carichi.</p>
      ${slotsHtml}
      <button type="button" class="btn btn-primary" id="btn-assist-generate" style="margin-top:10px;">Genera WOD</button>
    `;

    const tabsEl = $('#assist-format-tabs');
    tabsEl.innerHTML = ASSISTED_FORMAT_TABS.map(f => `<button type="button" class="tab-strip-btn${f.id === content.assistFormat ? ' active' : ''}" data-format="${f.id}">${f.label}</button>`).join('');
    tabsEl.querySelectorAll('.tab-strip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.assistFormat = btn.dataset.format;
        persistSession();
        renderManualWodArea();
      });
    });

    areaEl.querySelectorAll('.assist-move-select').forEach(sel => {
      const i = Number(sel.dataset.i);
      sel.value = content.assistMovementIds[i] || '';
      sel.addEventListener('change', (e) => {
        content.assistMovementIds[i] = e.target.value || null;
        persistSession();
      });
    });

    $('#btn-assist-generate').addEventListener('click', () => {
      const chosen = content.assistMovementIds.filter(Boolean);
      if (chosen.length < formatDef.minMoves) {
        toast(`Scegli almeno ${formatDef.minMoves} movimento${formatDef.minMoves > 1 ? 'i' : ''}`);
        return;
      }
      generateAssistedWod(formatDef.id, chosen);
    });
    return;
  }

  areaEl.innerHTML = `
    <input type="text" id="manual-format" placeholder="es. AMRAP 15, For Time, 5x5..." value="${content.formatLabel || ''}" />
    <div id="manual-rows"></div>
    <button type="button" class="btn btn-secondary" id="btn-manual-add-row" style="margin-top:8px;">+ Aggiungi movimento</button>
  `;
  $('#manual-format').addEventListener('input', (e) => { content.formatLabel = e.target.value; persistSession(); });
  renderManualRows();
  $('#btn-manual-add-row').addEventListener('click', () => {
    content.rows.push({ movementId: MOVEMENTS[0].id, reps: '' });
    persistSession();
    renderManualRows();
  });
}

function generateAssistedWod(format, movementIds) {
  const session = state.session;
  const content = session.content;
  const profile = state.profile || defaultProfile();
  const hasCentral = content.focusType !== 'solo_wod';
  const split = splitSessionMinutes(session.availableMinutes, hasCentral);

  content.generatedWod = generateWodFromMovements({
    format, movementIds,
    availableMinutes: split.wod,
    level: profile.level, equipment: profile.equipment, limitations: profile.limitations,
    readinessScore: session.readinessScore, band: readinessBand(session.readinessScore),
    gender: profile.gender || null, oneRMs: profile.oneRMs || {},
  });
  if (!content.generatedWod) {
    toast('Attrezzatura non compatibile con questi movimenti');
    return;
  }
  persistSession();
  renderManualBuilder();
}

function renderManualRows() {
  const content = state.session.content;
  const rows = content.rows;
  const movementOptions = MOVEMENTS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  const rowsEl = $('#manual-rows');
  rowsEl.innerHTML = rows.map((row, i) => `
    <div class="manual-row" data-i="${i}">
      <select class="manual-row-movement">${movementOptions}</select>
      <input type="text" class="manual-row-reps" placeholder="reps/note" value="${row.reps || ''}" />
      <button type="button" class="btn-ghost manual-row-remove">x</button>
    </div>
  `).join('');
  rowsEl.querySelectorAll('.manual-row').forEach((rowEl) => {
    const i = Number(rowEl.dataset.i);
    const sel = rowEl.querySelector('.manual-row-movement');
    sel.value = rows[i].movementId || MOVEMENTS[0].id;
    sel.addEventListener('change', (e) => { rows[i].movementId = e.target.value; persistSession(); });
    rowEl.querySelector('.manual-row-reps').addEventListener('input', (e) => { rows[i].reps = e.target.value; persistSession(); });
    rowEl.querySelector('.manual-row-remove').addEventListener('click', () => { rows.splice(i, 1); persistSession(); renderManualRows(); });
  });
}

function persistSession() {
  setActiveSession(state.session);
}

$('#btn-end-session').addEventListener('click', () => {
  showEndSessionState();
});
$('#btn-endsession-cancel').addEventListener('click', () => {
  showSessionState();
});

function bindCompletionChips() {
  const options = [{ id: 100, label: '100%' }, { id: 50, label: '50%' }, { id: 0, label: 'Non eseguito' }];
  const bind = () => renderChipGroup($('#completion-chips'), options, state.completionSel, (id) => { state.completionSel = id; bind(); });
  bind();
}

function renderEndSessionExtra() {
  const content = state.session.content;
  const el = $('#endsession-extra');
  if (content && content.type === 'metcon_retest') {
    const val = ($('#metcon-result-input') && $('#metcon-result-input').value) || '';
    el.innerHTML = `<p class="small muted">Risultato registrato: <strong>${val || 'non inserito'}</strong></p>`;
  } else {
    el.innerHTML = '';
  }
}

$('#btn-endsession-save').addEventListener('click', () => {
  const session = state.session;
  const completion = state.completionSel;
  const rpe = Math.max(1, Math.min(10, Number($('#in-actual-rpe').value) || 7));
  const content = session.content;

  let title = sessionTitle(session);
  let patternsHit = [];
  let extraFields = {};

  if (content && content.type === 'strength' && completion > 0) {
    const plan = getPlan(content.planId);
    if (plan) {
      const updated = applyStrengthResult(plan, { completedAllSets: !!session.draft.strengthCompleted });
      updatePlan(plan.id, updated);
      patternsHit = ((getMovement(plan.movementId) || {}).patterns || []).concat(content.wod.patternsHit || []);
    }
    extraFields.planId = content.planId;
    extraFields.actualSets = session.draft.customSets;
    extraFields.actualReps = session.draft.customReps;
    extraFields.actualWeightKg = session.draft.customWeight;
    extraFields.weightMode = session.draft.weightMode;
  } else if (content && content.type === 'skill' && completion > 0) {
    const plan = getPlan(content.planId);
    if (plan) {
      const updated = applySkillResult(plan, { clean: !!session.draft.skillClean });
      updatePlan(plan.id, updated);
      if (updated.status === 'completed' && plan.status !== 'completed') {
        toast(`Skill completata: ${content.skillLabel}!`);
      }
    }
    patternsHit = content.wod.patternsHit || [];
    extraFields.planId = content.planId;
  } else if (content && content.type === 'metcon_retest') {
    const plan = getPlan(content.planId);
    const resultText = ($('#metcon-result-input') && $('#metcon-result-input').value) || '';
    if (plan) {
      const history = (plan.history || []).concat([{ date: new Date().toISOString(), week: content.week, result: resultText }]);
      const updated = advanceMetconWeek(Object.assign({}, plan, { history }));
      updatePlan(plan.id, updated);
    }
    extraFields.planId = content.planId;
    extraFields.result = resultText;
    title = `${content.benchmarkLabel} (retest sett. ${content.week})`;
  } else if (content && content.type === 'metcon_week') {
    const plan = getPlan(content.planId);
    if (plan && completion > 0) {
      const updated = advanceMetconWeek(plan);
      updatePlan(plan.id, updated);
    }
    patternsHit = content.wod.patternsHit || [];
    extraFields.planId = content.planId;
    title = content.wod.templateLabel;
  } else if (content && content.type === 'monostructural') {
    extraFields.activity = session.draft.activity;
    extraFields.distanceKm = Number(session.draft.distanceKm) || null;
    extraFields.durationMin = Number(session.draft.durationMin) || session.availableMinutes;
    title = (MONO_ACTIVITIES.find(a => a.id === session.draft.activity) || {}).label || 'Monostrutturale';
  } else if (content && content.type === 'manual') {
    extraFields.focusType = content.focusType;
    extraFields.focusMovementId = content.focusMovementId;
    extraFields.focusPrescription = content.focusPrescription;
    extraFields.focusSkillId = content.focusSkillId;
    extraFields.wodMode = content.wodMode;
    extraFields.manualRows = content.rows;
    extraFields.formatLabel = content.formatLabel;
    extraFields.notes = content.notes;
    patternsHit = manualFocusPatterns(content).concat(manualWodPatterns(content));
  }

  const minutes = session.availableMinutes;
  saveSession(Object.assign({
    date: session.startedAt,
    sessionKind: session.kind,
    title,
    availableMinutes: minutes,
    readinessScore: session.readinessScore,
    completion,
    actualRpe: rpe,
    load: completion > 0 ? trainingLoad(minutes, rpe) : 0,
    patternsHit,
  }, extraFields));

  clearActiveSession();
  state.session = null;
  state.completionSel = 100;
  toast(completion === 100 ? 'Sessione salvata - ottimo lavoro' : (completion === 50 ? 'Sessione parziale salvata' : 'Segnato come non eseguito'));
  showPresessionState();
});

const PLAN_KINDS = [
  { id: 'strength', label: 'Forza' },
  { id: 'skill', label: 'Skill' },
  { id: 'metcon', label: 'Metcon' },
];

function renderPlans() {
  const plans = getPlans();
  const list = $('#plans-list');
  if (plans.length === 0) {
    list.innerHTML = '<p class="small muted">Nessun piano ancora. Creane uno qui sotto per iniziare un percorso verso un obiettivo.</p>';
  } else {
    list.innerHTML = plans.map(planCardHtml).join('');
    list.querySelectorAll('.btn-delete-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Eliminare questo piano? Lo storico delle sessioni resta comunque salvato.')) return;
        deletePlan(btn.dataset.id);
        renderPlans();
      });
    });
    list.querySelectorAll('.btn-retest-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = getPlan(btn.dataset.id);
        const val = prompt(`Nuovo 1RM per ${plan.movementLabel} (kg)`, Math.round(plan.trainingMax / 0.85));
        if (val === null) return;
        const num = Number(val);
        if (Number.isNaN(num)) { toast('Valore non valido'); return; }
        updatePlan(plan.id, applyRetest(plan, num));
        renderPlans();
        toast('Massimale aggiornato, piano ricalibrato');
      });
    });
  }
}

function planCardHtml(plan) {
  const badge = plan.status === 'completed' ? '<span class="badge" style="border-color:var(--marker-teal); color:var(--marker-teal);">raggiunto</span>' : '';
  let detail = '';
  let retestBtn = '';
  if (plan.kind === 'strength') {
    detail = `Training max: <strong>${plan.trainingMax}kg</strong> - schema ${plan.scheme.sets}x${plan.scheme.reps}`;
    if (isRetestDue(plan)) {
      detail += '<div class="plan-retest-due">Retest 1RM dovuto</div>';
      retestBtn = `<button class="btn btn-secondary btn-retest-plan" data-id="${plan.id}">Registra nuovo 1RM</button>`;
    }
  } else if (plan.kind === 'skill') {
    const skill = getSkill(plan.skillId);
    detail = plan.status === 'completed'
      ? 'Scala completata'
      : `Step ${plan.stepIndex + 1}/${skill.steps.length}: ${skill.steps[plan.stepIndex].label}`;
  } else if (plan.kind === 'metcon') {
    detail = `${plan.benchmarkLabel} - settimana ${plan.cycleWeek}/6`;
  }
  return `
    <div class="plan-item">
      <div class="row1"><span class="plan-title">${plan.label}</span>${badge}</div>
      <div class="plan-detail">${detail}</div>
      <div class="btn-row">${retestBtn}<button class="btn btn-ghost btn-delete-plan" data-id="${plan.id}">Elimina</button></div>
    </div>
  `;
}

function bindNewPlanKindChips() {
  renderChipGroup($('#new-plan-kind-chips'), PLAN_KINDS, state.newPlanKind, (id) => {
    state.newPlanKind = id;
    bindNewPlanKindChips();
    renderNewPlanForm();
  });
}

function renderNewPlanForm() {
  const el = $('#new-plan-form');
  if (state.newPlanKind === 'strength') {
    el.innerHTML = `
      <span class="field-label">Movimento</span>
      <select id="np-movement" class="select-input">${ONE_RM_MOVEMENTS.map(m => `<option value="${m.id}">${m.label}</option>`).join('')}</select>
      <span class="field-label">1RM attuale (kg) - misuralo o stimalo prima di iniziare</span>
      <input type="number" id="np-onerm" placeholder="es. 100" />
      <button class="btn btn-primary" id="btn-create-plan" style="margin-top:10px;">Crea piano forza</button>
    `;
    $('#btn-create-plan').addEventListener('click', () => {
      const movementId = $('#np-movement').value;
      const oneRM = Number($('#np-onerm').value);
      if (!oneRM) { toast('Inserisci il 1RM attuale'); return; }
      const movementLabel = ONE_RM_MOVEMENTS.find(m => m.id === movementId).label;
      const plan = createStrengthPlan({ movementId, movementLabel, oneRM });
      savePlan(plan);
      const profile = state.profile || defaultProfile();
      profile.oneRMs = profile.oneRMs || {};
      profile.oneRMs[movementId] = oneRM;
      saveProfile(profile);
      toast('Piano forza creato');
      renderPlans();
    });
  } else if (state.newPlanKind === 'skill') {
    const activeSkillIds = getPlans().filter(p => p.kind === 'skill' && p.status === 'active').map(p => p.skillId);
    const available = SKILLS.filter(s => !activeSkillIds.includes(s.id));
    if (available.length === 0) {
      el.innerHTML = '<p class="small muted">Hai gia un piano attivo per tutte le skill disponibili.</p>';
      return;
    }
    el.innerHTML = `
      <span class="field-label">Skill</span>
      <select id="np-skill" class="select-input">${available.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}</select>
      <span class="field-label">Da che step parti? (autovalutazione onesta)</span>
      <select id="np-step" class="select-input"></select>
      <button class="btn btn-primary" id="btn-create-plan" style="margin-top:10px;">Crea piano skill</button>
    `;
    const fillSteps = () => {
      const skill = getSkill($('#np-skill').value);
      $('#np-step').innerHTML = skill.steps.map((s, i) => `<option value="${i}">${i + 1}. ${s.label}</option>`).join('');
    };
    fillSteps();
    $('#np-skill').addEventListener('change', fillSteps);
    $('#btn-create-plan').addEventListener('click', () => {
      const skillId = $('#np-skill').value;
      const startStepIndex = Number($('#np-step').value);
      savePlan(createSkillPlan({ skillId, startStepIndex }));
      toast('Piano skill creato');
      renderPlans();
    });
  } else if (state.newPlanKind === 'metcon') {
    el.innerHTML = `
      <span class="field-label">Nome benchmark</span>
      <input type="text" id="np-benchlabel" placeholder="es. AMRAP 12 baseline" />
      <span class="field-label">Descrizione (movimenti, schema)</span>
      <textarea id="np-benchdesc" placeholder="es. AMRAP 12: 15 wall ball, 10 pull-up, 5 burpee"></textarea>
      <p class="small muted">La prima e l'ultima settimana (1 e 6) sono il test su questo benchmark esatto; le settimane 2-5 costruiscono volume/intensita verso il retest.</p>
      <button class="btn btn-primary" id="btn-create-plan" style="margin-top:10px;">Crea piano metcon</button>
    `;
    $('#btn-create-plan').addEventListener('click', () => {
      const benchmarkLabel = $('#np-benchlabel').value.trim();
      const benchmarkDescription = $('#np-benchdesc').value.trim();
      if (!benchmarkLabel) { toast('Dai un nome al benchmark'); return; }
      savePlan(createMetconPlan({ benchmarkLabel, benchmarkDescription }));
      toast('Piano metcon creato - settimana 1 sara il test baseline');
      renderPlans();
    });
  }
}

function renderMotivation() {
  const sessions = getSessions();
  const streakInfo = computeStreak(sessions);
  const gap = daysSinceLast(sessions);
  $('#motivation-card').style.display = 'block';
  $('#motivation-eyebrow').textContent = gap === null ? 'Inizia oggi' : (streakInfo.streak > 1 ? `Streak: ${streakInfo.streak} sessioni` : 'Costanza');
  $('#motivation-message').textContent = motivationalMessage({ streak: streakInfo.streak, gapDays: gap });
  const stats = [];
  if (gap !== null) stats.push(`<span>Ultima: ${gap === 0 ? 'oggi' : gap + ' giorni fa'}</span>`);
  stats.push(`<span>Ultimi 7gg: ${sessionsCountLastDays(sessions, 7)}</span>`);
  stats.push(`<span>Ultimi 30gg: ${sessionsCountLastDays(sessions, 30)}</span>`);
  $('#motivation-stats').innerHTML = stats.join('');
}
function sessionsCountLastDays(sessions, days) {
  const cutoff = Date.now() - days * 86400000;
  return sessions.filter(s => s.completion > 0 && new Date(s.date).getTime() >= cutoff).length;
}

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
  if (points.length === 0) { chartEl.innerHTML = ''; emptyEl.style.display = 'block'; }
  else { emptyEl.style.display = 'none'; chartEl.innerHTML = trainingLoadChartSvg(points); }
}
function renderHistoryList() {
  const sessions = getSessions();
  const list = $('#history-list');
  if (sessions.length === 0) {
    list.innerHTML = '<div class="empty-state"><div>Nessuna sessione ancora registrata.</div></div>';
    return;
  }
  list.innerHTML = sessions.slice(0, 40).map(sessionItemHtml).join('');
}
function completionBadge(s) {
  if (s.completion === 100) return '<span class="badge" style="border-color:var(--marker-teal); color:var(--marker-teal);">100%</span>';
  if (s.completion === 50) return '<span class="badge" style="border-color:var(--marker-yellow); color:var(--marker-yellow);">50%</span>';
  return '<span class="badge" style="border-color:var(--marker-red); color:var(--marker-red);">non eseguito</span>';
}
function metaLineHtml(s) {
  const parts = [`<span>${s.availableMinutes} min</span>`];
  if (s.readinessScore != null) parts.push(`<span>Readiness ${s.readinessScore}</span>`);
  if (s.actualRpe) parts.push(`<span>RPE ${s.actualRpe}</span>`);
  if (s.load) parts.push(`<span>Load ${s.load}</span>`);
  if (s.distanceKm) parts.push(`<span>${s.distanceKm} km</span>`);
  return parts.join('');
}
function sessionItemHtml(s) {
  const d = new Date(s.date);
  const dateStr = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
  return `
    <div class="session-item">
      <div class="row1"><span class="date">${dateStr}</span>${completionBadge(s)}</div>
      <div class="title">${s.title || '-'}</div>
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
$('#cal-prev').addEventListener('click', () => { state.calMonth -= 1; if (state.calMonth < 0) { state.calMonth = 11; state.calYear -= 1; } renderCalendar(); });
$('#cal-next').addEventListener('click', () => { state.calMonth += 1; if (state.calMonth > 11) { state.calMonth = 0; state.calYear += 1; } renderCalendar(); });
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
  const wrap = $('#cal-day-detail');
  if (sessions.length === 0) {
    wrap.innerHTML = `<h3>${dateLabel}</h3><p class="small muted">Nessuna sessione.</p>`;
    return;
  }
  wrap.innerHTML = `<h3>${dateLabel}</h3>` + sessions.map(s => `
    <div class="card" style="margin-bottom:10px;">
      <div class="row1" style="display:flex; justify-content:space-between; margin-bottom:6px;"><strong>${s.title}</strong>${completionBadge(s)}</div>
      <div class="wod-meta">${metaLineHtml(s)}</div>
    </div>
  `).join('');
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
  } catch (err) { toast('File non valido'); }
  e.target.value = '';
});

function hydrateProfileForm() {
  const profile = state.profile || defaultProfile();
  $('#in-firstname').value = profile.firstName || '';
  $('#in-lastname').value = profile.lastName || '';
  $('#in-age').value = profile.age || '';
  $('#in-weight').value = profile.weightKg || '';
  const bindGender = () => renderChipGroup($('#gender-chips'), GENDERS, profile.gender, (id) => {
    state.profile = state.profile || defaultProfile();
    state.profile.gender = id;
    bindGender();
  });
  bindGender();
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
  renderProfileSummary(profile);
}

function renderOneRmGrid(oneRMs) {
  const grid = $('#onerm-grid');
  grid.innerHTML = ONE_RM_MOVEMENTS.map(m => `
    <div class="onerm-row">
      <label for="onerm-${m.id}">${m.label}</label>
      <div class="onerm-input-wrap"><input type="number" id="onerm-${m.id}" min="0" step="0.5" value="${oneRMs[m.id] != null ? oneRMs[m.id] : ''}" placeholder="-" /><span class="unit">kg</span></div>
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

function renderProfileSummary(profile) {
  const wrap = $('#profile-summary');
  const hasAnything = profile.firstName || profile.equipment.length > 0 || Object.keys(profile.oneRMs || {}).length > 0;
  if (!hasAnything) {
    wrap.innerHTML = '<div class="summary-empty">Ancora nessun dato salvato. Compila i campi e tocca "Salva profilo".</div>';
    return;
  }
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '-';
  const genderLabel = (GENDERS.find(g => g.id === profile.gender) || {}).label || '-';
  const levelLabel = (LEVELS.find(l => l.id === profile.level) || {}).label || '-';
  const equipmentTags = profile.equipment.length > 0
    ? `<div class="summary-tags">${profile.equipment.map(id => `<span class="summary-tag">${(EQUIPMENT.find(e => e.id === id) || {}).label || id}</span>`).join('')}</div>`
    : '<span class="v muted">nessuna</span>';
  const oneRMs = profile.oneRMs || {};
  const recordRows = ONE_RM_MOVEMENTS.filter(m => oneRMs[m.id] != null)
    .map(m => `<div class="summary-row"><span class="k">${m.label}</span><span class="v">${oneRMs[m.id]}kg</span></div>`).join('');
  wrap.innerHTML = `
    <div class="summary-row"><span class="k">Nome</span><span class="v">${fullName}</span></div>
    <div class="summary-row"><span class="k">Eta / Peso</span><span class="v">${profile.age || '-'} anni / ${profile.weightKg || '-'} kg</span></div>
    <div class="summary-row"><span class="k">Genere</span><span class="v">${genderLabel}</span></div>
    <div class="summary-row"><span class="k">Livello</span><span class="v">${levelLabel}</span></div>
    <div class="summary-row"><span class="k">Attrezzatura (${profile.equipment.length})</span>${equipmentTags}</div>
    ${recordRows ? `<hr class="chalk-rule" /><h3>I tuoi record (1RM)</h3><div class="summary-records">${recordRows}</div>` : ''}
  `;
}

$('#btn-save-profile').addEventListener('click', () => {
  const profile = state.profile || defaultProfile();
  profile.firstName = $('#in-firstname').value.trim();
  profile.lastName = $('#in-lastname').value.trim();
  profile.age = Number($('#in-age').value) || null;
  profile.weightKg = Number($('#in-weight').value) || null;
  profile.notes = $('#in-notes').value;
  saveProfile(profile);
  state.profile = profile;
  renderProfileSummary(profile);
  toast('Profilo salvato');
});
$('#btn-reset').addEventListener('click', () => {
  if (!confirm("Cancellare tutti i dati da questo dispositivo? Non e' reversibile.")) return;
  clearAll();
  state.profile = defaultProfile();
  hydrateProfileForm();
  hydrateReminderForm();
  renderHistoryPanel();
  renderPlans();
  toast('Dati azzerati');
});
$('#btn-help').addEventListener('click', () => {
  alert('Box Log ti segue verso un obiettivo: crea un piano (Forza/Skill/Metcon) in "Piani", poi da "Oggi" premi "Sessione guidata" - l\'app propone lo step dovuto e ricorda dove sei arrivato.');
});

function hydrateReminderForm() {
  const settings = getReminderSettings();
  $('#reminder-enabled').checked = settings.enabled;
  $('#reminder-time').value = settings.time || '18:00';
  let selDays = settings.days || [1, 2, 3, 4, 5];
  const bindDays = () => {
    $('#reminder-days-chips').innerHTML = '';
    REMINDER_DAYS.forEach(d => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (selDays.includes(d.id) ? ' selected' : '');
      btn.textContent = d.label;
      btn.addEventListener('click', () => {
        const set = new Set(selDays);
        set.has(d.id) ? set.delete(d.id) : set.add(d.id);
        selDays = Array.from(set);
        bindDays();
      });
      $('#reminder-days-chips').appendChild(btn);
    });
  };
  bindDays();
  $('#reminder-support-note').textContent = notificationsSupported()
    ? 'Su desktop/Android riceverai una notifica; su iPhone il promemoria comparira come banner in app quando la apri.'
    : 'Notifiche non supportate qui: vedrai il promemoria come banner in app.';
  $('#btn-save-reminders').onclick = async () => {
    const enabled = $('#reminder-enabled').checked;
    if (enabled && notificationsSupported()) await requestNotificationPermission();
    saveReminderSettings({ enabled, days: selDays, time: $('#reminder-time').value || '18:00', lastNotifiedDate: getReminderSettings().lastNotifiedDate || null });
    toast('Promemoria salvati');
  };
}
function checkReminder() {
  const settings = getReminderSettings();
  const sessions = getSessions();
  if (!shouldFireReminder(settings, sessions)) return;
  fireLocalNotification();
  saveReminderSettings(Object.assign({}, settings, { lastNotifiedDate: new Date().toISOString().slice(0, 10) }));
  toast('Promemoria: e\' ora di allenarsi');
}

function init() {
  state.profile = getProfile() || defaultProfile();
  $('#version-badge').textContent = APP_VERSION;

  hydrateProfileForm();
  hydrateReminderForm();
  bindNewPlanKindChips();
  renderNewPlanForm();
  renderTodayRoot();

  checkReminder();
  setInterval(checkReminder, 5 * 60 * 1000);
}

init();

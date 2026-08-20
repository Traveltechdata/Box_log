import { generateWod } from './generator/generateWod.js';
import { computeReadiness, readinessBand, trainingLoad } from './generator/readiness.js';
import { getProfile, saveProfile, getSessions, saveSession, updateLastSession, exportData, importData, clearAll } from './storage.js';

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
  { id: 'hspu', label: 'Handstand push-up' },
  { id: 'toes_to_bar', label: 'Toes-to-bar' },
  { id: 'clean', label: 'Clean' },
  { id: 'snatch', label: 'Snatch' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'back_squat', label: 'Back squat' },
  { id: 'ghd_situp', label: 'GHD sit-up' },
];

const WOD_BLOCK_COLORS = {
  warmup: 'var(--marker-teal)',
  skill: 'var(--marker-yellow)',
  main: 'var(--marker-red)',
  cooldown: 'var(--marker-teal)',
};

let state = {
  profile: null,
  selectedGoal: 'conditioning',
  selectedMinutes: 35,
  selectedLevel: 'intermediate',
  currentWod: null,
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
  if (viewId === 'view-history') renderHistory();
}

$all('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ---------------- readiness dial (SVG) ----------------
function drawReadinessDial(score, band) {
  const svg = $('#readiness-dial');
  const cx = 90, cy = 95, r = 72;
  const startAngle = Math.PI; // 180deg
  const endAngle = 0; // 0deg (semi-circle top)
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

// ---------------- WOD generation + rendering ----------------
function recentPatternsFromHistory() {
  const sessions = getSessions().slice(0, 2);
  return sessions.flatMap(s => s.patternsHit || []);
}

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
    recentPatterns: recentPatternsFromHistory(),
    readinessScore: score,
    band,
  };
}

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

function renderWod(wod) {
  state.currentWod = wod;
  $('#wod-card').style.display = 'block';
  $('#wod-format-label').textContent = wod.templateLabel;
  $('#wod-title').textContent = wod.format + (wod.main.rounds > 1 && wod.format !== 'AMRAP' ? ` \u00d7 ${wod.main.rounds}` : '');
  $('#wod-stimulus').textContent = wod.stimulus;

  let html = '';
  html += renderWodBlock('warmup', 'Warm-up', wod.warmup.minutes,
    `<ul class="wod-move-list">${wod.warmup.items.map(i => `<li><span>${i}</span></li>`).join('')}</ul>`);

  if (wod.skill) {
    html += renderWodBlock('skill', 'Skill / Forza', wod.skill.minutes, `<p>${wod.skill.text}</p>`);
  }

  const moveItems = wod.main.movements.map(m =>
    `<li><span>${m.name}</span><span class="reps">${m.reps} ${m.unit}</span></li>`).join('');
  html += renderWodBlock('main', 'WOD', wod.main.estimatedMinutes,
    `<ul class="wod-move-list">${moveItems}</ul>
     <div class="wod-meta">
       <span>Target RPE ${wod.main.targetRpe[0]}\u2013${wod.main.targetRpe[1]}</span>
       <span>Cap RPE ${wod.main.capRpe}</span>
     </div>`);

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
    patternsHit: wod.patternsHit,
  });
  toast('Nuova versione generata');
});

$('#btn-complete').addEventListener('click', () => {
  const rpe = prompt('RPE percepito della sessione (1\u201310)?', '7');
  if (rpe === null) return;
  const parsedRpe = Math.max(1, Math.min(10, Number(rpe) || 7));
  const minutes = state.currentWod?.main?.estimatedMinutes || state.selectedMinutes;
  updateLastSession({ completed: true, actualRpe: parsedRpe, load: trainingLoad(minutes, parsedRpe) });
  toast('Sessione registrata \u2014 ben fatto');
});

// ---------------- history ----------------
function renderHistory() {
  const sessions = getSessions();
  const list = $('#history-list');
  if (sessions.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>
      <div>Nessuna sessione ancora registrata.<br/>Genera il tuo primo WOD da "Oggi".</div>
    </div>`;
    return;
  }
  list.innerHTML = sessions.map(s => {
    const d = new Date(s.date);
    const dateStr = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    const statusBadge = s.completed === true
      ? `<span class="badge" style="border-color:var(--marker-teal); color:var(--marker-teal);">svolto</span>`
      : `<span class="badge">pianificato</span>`;
    return `
      <div class="session-item">
        <div class="row1">
          <span class="date">${dateStr}</span>
          ${statusBadge}
        </div>
        <div class="title">${s.wod?.templateLabel || '\u2014'}</div>
        <div class="stats">
          <span>${s.availableMinutes} min</span>
          <span>Readiness ${s.readinessScore ?? '\u2013'}</span>
          ${s.actualRpe ? `<span>RPE ${s.actualRpe}</span>` : ''}
          ${s.load ? `<span>Load ${s.load}</span>` : ''}
        </div>
      </div>`;
  }).join('');
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
    renderHistory();
    hydrateProfileForm();
  } catch (err) {
    toast('File non valido');
  }
  e.target.value = '';
});

// ---------------- profile ----------------
function defaultProfile() {
  return { level: 'intermediate', equipment: [], limitations: [], notes: '' };
}

function hydrateProfileForm() {
  const profile = state.profile || defaultProfile();
  renderChipGroup($('#level-chips'), LEVELS, profile.level, (id) => {
    state.profile = state.profile || defaultProfile();
    state.profile.level = id;
    hydrateProfileForm();
  });
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
  $('#in-notes').value = profile.notes || '';
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
  renderHistory();
  toast('Dati azzerati');
});

$('#btn-help').addEventListener('click', () => {
  alert('Box Log genera un WOD in base a obiettivo, tempo disponibile e readiness del giorno. Tutti i dati restano sul tuo dispositivo. Modifica il profilo in "Profilo" per personalizzare attrezzatura e limitazioni.');
});

// ---------------- init ----------------
function init() {
  state.profile = getProfile() || defaultProfile();

  bindGoalChips();
  bindTimeChips();
  hydrateProfileForm();
  updateReadinessPreview();
}

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

init();

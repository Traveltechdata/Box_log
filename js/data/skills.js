// Each skill is an ordered ladder of steps. Advancement is criterion-based:
// a step is "clean" when the athlete hits the prescription with good form.
// cleanStreakNeeded = how many separate clean sessions at this step before
// moving on (never on the first attempt — consistency matters more than a fluke).

export const SKILLS = [
  {
    id: 'muscle_up',
    label: 'Muscle-up (anelli)',
    equipment: ['rings'],
    steps: [
      { id: 'mu_1', label: 'Ring row stretto', prescription: '3 x 12', cleanStreakNeeded: 2 },
      { id: 'mu_2', label: 'Strict pull-up + Ring dip (separati)', prescription: '3 x 5 pull-up + 3 x 8 dip', cleanStreakNeeded: 2 },
      { id: 'mu_3', label: 'Transizione a terra / anelli bassi', prescription: '3 x 5 transizioni', cleanStreakNeeded: 2 },
      { id: 'mu_4', label: 'Kipping muscle-up con banda', prescription: '3 x 3', cleanStreakNeeded: 2 },
      { id: 'mu_5', label: 'Kipping muscle-up libero', prescription: '1 ripetizione pulita', cleanStreakNeeded: 1 },
    ],
  },
  {
    id: 'ctb_pullup',
    label: 'Chest-to-bar pull-up',
    equipment: ['pullup_bar'],
    steps: [
      { id: 'ctb_1', label: 'Strict pull-up', prescription: '3 x 5', cleanStreakNeeded: 2 },
      { id: 'ctb_2', label: 'Kipping pull-up', prescription: '3 x 8', cleanStreakNeeded: 2 },
      { id: 'ctb_3', label: 'Kip swing + drill C2B (touch and go)', prescription: '3 x 5', cleanStreakNeeded: 2 },
      { id: 'ctb_4', label: 'C2B kipping, ripetizioni singole', prescription: '3 x 3', cleanStreakNeeded: 2 },
      { id: 'ctb_5', label: 'C2B kipping consecutivi', prescription: '3 x 8', cleanStreakNeeded: 1 },
    ],
  },
  {
    id: 'toes_to_bar',
    label: 'Toes-to-bar',
    equipment: ['pullup_bar'],
    steps: [
      { id: 't2b_1', label: 'Hanging knee raise', prescription: '3 x 10', cleanStreakNeeded: 2 },
      { id: 't2b_2', label: 'Hanging leg raise (gambe tese)', prescription: '3 x 8', cleanStreakNeeded: 2 },
      { id: 't2b_3', label: 'Kip swing da appeso', prescription: '3 x 10', cleanStreakNeeded: 2 },
      { id: 't2b_4', label: 'T2B singole controllate', prescription: '3 x 5', cleanStreakNeeded: 2 },
      { id: 't2b_5', label: 'T2B consecutivi', prescription: '3 x 10', cleanStreakNeeded: 1 },
    ],
  },
  {
    id: 'pistol_squat',
    label: 'Pistol squat',
    equipment: [],
    steps: [
      { id: 'ps_1', label: 'Pistol su box alto', prescription: '3 x 8 per gamba', cleanStreakNeeded: 2 },
      { id: 'ps_2', label: 'Pistol assistito (TRX/anello)', prescription: '3 x 8 per gamba', cleanStreakNeeded: 2 },
      { id: 'ps_3', label: 'Pistol con contrappeso leggero', prescription: '3 x 5 per gamba', cleanStreakNeeded: 2 },
      { id: 'ps_4', label: 'Pistol libero, singole', prescription: '3 x 3 per gamba', cleanStreakNeeded: 2 },
      { id: 'ps_5', label: 'Pistol libero consecutivi', prescription: '3 x 5 per gamba', cleanStreakNeeded: 1 },
    ],
  },
  {
    id: 'handstand_walk',
    label: 'Handstand walk',
    equipment: [],
    steps: [
      { id: 'hw_1', label: 'Wall walk', prescription: '3 x 3', cleanStreakNeeded: 2 },
      { id: 'hw_2', label: 'Handstand hold al muro', prescription: '3 x 30"', cleanStreakNeeded: 2 },
      { id: 'hw_3', label: 'Weight shift in verticale', prescription: '3 x 10 spostamenti', cleanStreakNeeded: 2 },
      { id: 'hw_4', label: 'Kick-up libero + hold', prescription: '3 x 10"', cleanStreakNeeded: 2 },
      { id: 'hw_5', label: 'Handstand walk libero', prescription: '3 x 5m', cleanStreakNeeded: 1 },
    ],
  },
  {
    id: 'rope_climb',
    label: 'Rope climb',
    equipment: ['rope'],
    steps: [
      { id: 'rc_1', label: 'Rope pull da seduto', prescription: '3 x 5', cleanStreakNeeded: 2 },
      { id: 'rc_2', label: 'L-sit hold su corda', prescription: '3 x 15"', cleanStreakNeeded: 2 },
      { id: 'rc_3', label: 'Salita con gambe fino a metà corda', prescription: '3 x 1', cleanStreakNeeded: 2 },
      { id: 'rc_4', label: 'Salita completa con gambe', prescription: '3 x 1', cleanStreakNeeded: 2 },
      { id: 'rc_5', label: 'Salita legless (parziale/completa)', prescription: '1 salita', cleanStreakNeeded: 1 },
    ],
  },
];

export function getSkill(id) {
  return SKILLS.find(s => s.id === id);
}

export function getSkillStep(skillId, stepIndex) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  return skill.steps[stepIndex] || null;
}

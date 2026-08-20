// Movement database.
// pattern: primary movement pattern (squat, hinge, push, pull, press, core, cyclical, jump, lunge, carry, olympic)
// modality: weightlifting | gymnastics | monostructural | bodyweight
// skill/fatigue/grip/impact: 1 (low) – 5 (high)
// equipment: [] means bodyweight, no equipment required
// substitutions: ordered list of movement ids, easier/lower-risk first

export const MOVEMENTS = [
  // ---- Cyclical / monostructural ----
  { id: 'run', name: 'Corsa', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 1, impact: 4, equipment: [], substitutions: ['row', 'bike'] },
  { id: 'row', name: 'Vogatore (row)', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 2, impact: 1, equipment: ['rower'], substitutions: ['bike', 'run'] },
  { id: 'bike', name: 'Bike/Assault bike', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 1, impact: 1, equipment: ['bike'], substitutions: ['row', 'run'] },
  { id: 'ski_erg', name: 'Ski erg', patterns: ['cyclical'], modality: 'monostructural', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['ski_erg'], substitutions: ['row', 'bike'] },
  { id: 'double_under', name: 'Double-under', patterns: ['cyclical', 'jump'], modality: 'monostructural', skill: 3, fatigue: 2, grip: 2, impact: 3, equipment: ['jump_rope'], substitutions: ['single_under', 'row'] },
  { id: 'single_under', name: 'Single-under (corda singola)', patterns: ['cyclical', 'jump'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 2, equipment: ['jump_rope'], substitutions: [] },

  // ---- Squat pattern ----
  { id: 'air_squat', name: 'Air squat', patterns: ['squat'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'back_squat', name: 'Back squat', patterns: ['squat'], modality: 'weightlifting', skill: 3, fatigue: 4, grip: 2, impact: 1, equipment: ['barbell', 'rack'], substitutions: ['front_squat', 'goblet_squat', 'air_squat'] },
  { id: 'front_squat', name: 'Front squat', patterns: ['squat'], modality: 'weightlifting', skill: 4, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell', 'rack'], substitutions: ['goblet_squat', 'air_squat'] },
  { id: 'goblet_squat', name: 'Goblet squat', patterns: ['squat'], modality: 'weightlifting', skill: 2, fatigue: 2, grip: 2, impact: 1, equipment: ['kettlebell', 'dumbbell'], substitutions: ['air_squat'] },
  { id: 'thruster', name: 'Thruster', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 3, fatigue: 5, grip: 3, impact: 1, equipment: ['barbell'], substitutions: ['dumbbell_thruster', 'goblet_squat'] },
  { id: 'overhead_squat', name: 'Overhead squat', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 2, impact: 1, equipment: ['barbell'], substitutions: ['front_squat', 'goblet_squat'] },
  { id: 'pistol_squat', name: 'Pistol squat (monopodalico)', patterns: ['squat'], modality: 'gymnastics', skill: 5, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: ['box_step_up', 'air_squat'] },
  { id: 'dumbbell_thruster', name: 'Dumbbell thruster', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 2, fatigue: 4, grip: 3, impact: 1, equipment: ['dumbbell'], substitutions: ['goblet_squat'] },
  { id: 'wall_ball', name: 'Wall ball', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 2, fatigue: 4, grip: 2, impact: 1, equipment: ['wall_ball'], substitutions: ['goblet_squat', 'air_squat'] },
  { id: 'box_step_up', name: 'Box step-up', patterns: ['squat', 'lunge'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: ['box'], substitutions: [] },
  { id: 'box_jump', name: 'Box jump', patterns: ['squat', 'jump'], modality: 'bodyweight', skill: 2, fatigue: 3, grip: 1, impact: 4, equipment: ['box'], substitutions: ['box_step_up'] },
  { id: 'lunge', name: 'Walking lunge', patterns: ['lunge'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: [] },

  // ---- Hinge pattern ----
  { id: 'deadlift', name: 'Deadlift', patterns: ['hinge'], modality: 'weightlifting', skill: 3, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], substitutions: ['kb_deadlift', 'good_morning'] },
  { id: 'kb_deadlift', name: 'Kettlebell deadlift', patterns: ['hinge'], modality: 'weightlifting', skill: 1, fatigue: 2, grip: 2, impact: 1, equipment: ['kettlebell'], substitutions: [] },
  { id: 'kb_swing', name: 'Kettlebell swing', patterns: ['hinge'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 3, impact: 1, equipment: ['kettlebell'], substitutions: ['kb_deadlift'] },
  { id: 'sdhp', name: 'Sumo deadlift high pull', patterns: ['hinge', 'pull'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 3, impact: 1, equipment: ['barbell'], substitutions: ['kb_swing'] },
  { id: 'med_ball_clean', name: 'Medicine ball clean', patterns: ['hinge', 'squat'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['wall_ball'], substitutions: ['kb_deadlift'] },
  { id: 'good_morning', name: 'Good morning', patterns: ['hinge'], modality: 'weightlifting', skill: 3, fatigue: 2, grip: 1, impact: 1, equipment: ['barbell'], substitutions: [] },
  { id: 'ghd_situp', name: 'GHD sit-up', patterns: ['core', 'hinge'], modality: 'gymnastics', skill: 3, fatigue: 3, grip: 1, impact: 1, equipment: ['ghd'], substitutions: ['situp'] },

  // ---- Push / press ----
  { id: 'push_press', name: 'Push press', patterns: ['press'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell'], substitutions: ['strict_press', 'dumbbell_press'] },
  { id: 'strict_press', name: 'Strict press (shoulder press)', patterns: ['press'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell'], substitutions: ['dumbbell_press'] },
  { id: 'push_jerk', name: 'Push jerk', patterns: ['press'], modality: 'weightlifting', skill: 4, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell'], substitutions: ['push_press', 'strict_press'] },
  { id: 'dumbbell_press', name: 'Dumbbell shoulder press', patterns: ['press'], modality: 'weightlifting', skill: 2, fatigue: 2, grip: 2, impact: 1, equipment: ['dumbbell'], substitutions: [] },
  { id: 'push_up', name: 'Push-up', patterns: ['push'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'bench_press', name: 'Bench press', patterns: ['push'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell', 'bench'], substitutions: ['push_up'] },
  { id: 'hspu', name: 'Handstand push-up', patterns: ['press'], modality: 'gymnastics', skill: 5, fatigue: 4, grip: 1, impact: 1, equipment: [], substitutions: ['pike_pushup', 'dumbbell_press'] },
  { id: 'pike_pushup', name: 'Pike push-up', patterns: ['press'], modality: 'gymnastics', skill: 3, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: ['push_up'] },
  { id: 'burpee', name: 'Burpee', patterns: ['push', 'jump'], modality: 'bodyweight', skill: 1, fatigue: 4, grip: 1, impact: 3, equipment: [], substitutions: ['burpee_no_jump'] },
  { id: 'burpee_no_jump', name: 'Burpee senza salto', patterns: ['push'], modality: 'bodyweight', skill: 1, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: [] },

  // ---- Pull ----
  { id: 'pull_up', name: 'Pull-up (strict)', patterns: ['pull'], modality: 'gymnastics', skill: 3, fatigue: 3, grip: 4, impact: 1, equipment: ['pullup_bar'], substitutions: ['ring_row', 'jumping_pullup'] },
  { id: 'kipping_pullup', name: 'Kipping pull-up', patterns: ['pull'], modality: 'gymnastics', skill: 4, fatigue: 3, grip: 4, impact: 1, equipment: ['pullup_bar'], substitutions: ['pull_up', 'ring_row'] },
  { id: 'ctb_pullup', name: 'Chest-to-bar pull-up', patterns: ['pull'], modality: 'gymnastics', skill: 5, fatigue: 4, grip: 5, impact: 1, equipment: ['pullup_bar'], substitutions: ['kipping_pullup', 'pull_up', 'ring_row'] },
  { id: 'ring_row', name: 'Ring row', patterns: ['pull'], modality: 'gymnastics', skill: 1, fatigue: 2, grip: 2, impact: 1, equipment: ['rings'], substitutions: [] },
  { id: 'jumping_pullup', name: 'Jumping pull-up', patterns: ['pull'], modality: 'gymnastics', skill: 1, fatigue: 2, grip: 2, impact: 1, equipment: ['pullup_bar'], substitutions: ['ring_row'] },
  { id: 'muscle_up', name: 'Muscle-up (anelli)', patterns: ['pull', 'push'], modality: 'gymnastics', skill: 5, fatigue: 5, grip: 5, impact: 1, equipment: ['rings'], substitutions: ['ctb_pullup', 'kipping_pullup', 'ring_row'] },
  { id: 'bar_muscle_up', name: 'Bar muscle-up', patterns: ['pull', 'push'], modality: 'gymnastics', skill: 5, fatigue: 5, grip: 5, impact: 1, equipment: ['pullup_bar'], substitutions: ['ctb_pullup', 'kipping_pullup', 'ring_row'] },
  { id: 'rope_climb', name: 'Rope climb', patterns: ['pull'], modality: 'gymnastics', skill: 4, fatigue: 4, grip: 5, impact: 1, equipment: ['rope'], substitutions: ['ring_row'] },
  { id: 'ring_dip', name: 'Ring dip', patterns: ['push'], modality: 'gymnastics', skill: 4, fatigue: 3, grip: 2, impact: 1, equipment: ['rings'], substitutions: ['push_up'] },
  { id: 'handstand_walk', name: 'Handstand walk', patterns: ['press'], modality: 'gymnastics', skill: 5, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: ['hspu', 'pike_pushup'] },
  { id: 'wall_walk', name: 'Wall walk', patterns: ['press'], modality: 'gymnastics', skill: 4, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: ['pike_pushup'] },
  { id: 'l_sit', name: 'L-sit', patterns: ['core'], modality: 'gymnastics', skill: 4, fatigue: 2, grip: 3, impact: 1, equipment: [], substitutions: ['hanging_knee_raise'] },
  { id: 'barbell_row', name: 'Barbell row', patterns: ['pull'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 3, impact: 1, equipment: ['barbell'], substitutions: ['ring_row'] },
  { id: 'toes_to_bar', name: 'Toes-to-bar', patterns: ['core', 'pull'], modality: 'gymnastics', skill: 4, fatigue: 3, grip: 4, impact: 1, equipment: ['pullup_bar'], substitutions: ['hanging_knee_raise', 'situp'] },
  { id: 'hanging_knee_raise', name: 'Hanging knee raise', patterns: ['core'], modality: 'gymnastics', skill: 2, fatigue: 2, grip: 3, impact: 1, equipment: ['pullup_bar'], substitutions: ['situp'] },

  // ---- Olympic lifts ----
  { id: 'clean', name: 'Clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell'], substitutions: ['kb_swing', 'kb_deadlift'] },
  { id: 'power_clean', name: 'Power clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 4, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell'], substitutions: ['kb_swing'] },
  { id: 'snatch', name: 'Snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], substitutions: ['power_snatch', 'kb_swing'] },
  { id: 'power_snatch', name: 'Power snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], substitutions: ['kb_swing'] },
  { id: 'clean_and_jerk', name: 'Clean & jerk', patterns: ['olympic', 'press'], modality: 'weightlifting', skill: 5, fatigue: 5, grip: 3, impact: 1, equipment: ['barbell'], substitutions: ['power_clean'] },

  // ---- Core ----
  { id: 'situp', name: 'Sit-up', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'plank', name: 'Plank', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'russian_twist', name: 'Russian twist', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },

  // ---- Carry ----
  { id: 'farmers_carry', name: "Farmer's carry", patterns: ['carry'], modality: 'weightlifting', skill: 1, fatigue: 2, grip: 4, impact: 1, equipment: ['kettlebell', 'dumbbell'], substitutions: [] },
  { id: 'yoke_carry', name: 'Yoke carry', patterns: ['carry'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['yoke'], substitutions: ['farmers_carry'] },
  { id: 'sandbag_carry', name: 'Sandbag carry', patterns: ['carry'], modality: 'weightlifting', skill: 1, fatigue: 3, grip: 3, impact: 1, equipment: ['sandbag'], substitutions: ['farmers_carry'] },
  { id: 'sled_push', name: 'Sled push', patterns: ['carry', 'squat'], modality: 'weightlifting', skill: 1, fatigue: 4, grip: 2, impact: 1, equipment: ['sled'], substitutions: [] },
  { id: 'sled_pull', name: 'Sled pull', patterns: ['carry', 'pull'], modality: 'weightlifting', skill: 1, fatigue: 4, grip: 3, impact: 1, equipment: ['sled'], substitutions: [] },

  // ---- Dumbbell / kettlebell odd-object variety ----
  { id: 'db_snatch', name: 'Dumbbell snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 3, impact: 1, equipment: ['dumbbell'], substitutions: ['kb_swing'] },
  { id: 'db_clean', name: 'Dumbbell clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 3, impact: 1, equipment: ['dumbbell'], substitutions: ['kb_deadlift'] },
  { id: 'devil_press', name: 'Devil press', patterns: ['olympic', 'push'], modality: 'weightlifting', skill: 3, fatigue: 5, grip: 3, impact: 2, equipment: ['dumbbell'], substitutions: ['burpee'] },
  { id: 'kb_clean', name: 'Kettlebell clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 3, impact: 1, equipment: ['kettlebell'], substitutions: ['kb_deadlift'] },

  // ---- Recovery / mobility (used in low-readiness sessions) ----
  { id: 'mobility_flow', name: 'Mobilità guidata', patterns: ['mobility'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], recoveryOnly: true, substitutions: [] },
  { id: 'zone2_bike', name: 'Bike Zona 2', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: ['bike'], recoveryOnly: true, substitutions: ['zone2_row', 'zone2_walk'] },
  { id: 'zone2_row', name: 'Row Zona 2', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: ['rower'], recoveryOnly: true, substitutions: ['zone2_walk'] },
  { id: 'zone2_walk', name: 'Camminata veloce', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], recoveryOnly: true, substitutions: [] },
];

export function getMovement(id) {
  return MOVEMENTS.find(m => m.id === id);
}

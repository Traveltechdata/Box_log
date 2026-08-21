// Movement database.
// pattern: primary movement pattern (squat, hinge, push, pull, press, core, cyclical, jump, lunge, carry, olympic)
// modality: weightlifting | gymnastics | monostructural | bodyweight
// skill/fatigue/grip/impact: 1 (low) – 5 (high)
// equipment: [] means bodyweight, no equipment required
// substitutions: ordered list of movement ids, easier/lower-risk first

export const MOVEMENTS = [
  // ---- Cyclical / monostructural ----
  { id: 'run', name: 'Corsa', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 1, impact: 4, equipment: [], distanceCapable: true, sustainedCardio: true, substitutions: ['row', 'bike'] },
  { id: 'row', name: 'Vogatore (row)', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 2, impact: 1, equipment: ['rower'], calorieCapable: true, sustainedCardio: true, substitutions: ['bike', 'run'] },
  { id: 'bike', name: 'Bike/Assault bike', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 1, impact: 1, equipment: ['bike'], calorieCapable: true, sustainedCardio: true, substitutions: ['row', 'run'] },
  { id: 'ski_erg', name: 'Ski erg', patterns: ['cyclical'], modality: 'monostructural', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['ski_erg'], calorieCapable: true, sustainedCardio: true, substitutions: ['row', 'bike'] },
  { id: 'double_under', name: 'Double-under', patterns: ['cyclical', 'jump'], modality: 'monostructural', skill: 3, fatigue: 2, grip: 2, impact: 3, equipment: ['jump_rope'], substitutions: ['single_under', 'row'] },
  { id: 'single_under', name: 'Single-under (corda singola)', patterns: ['cyclical', 'jump'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 2, equipment: ['jump_rope'], substitutions: [] },

  // ---- Squat pattern ----
  { id: 'air_squat', name: 'Air squat', patterns: ['squat'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'back_squat', name: 'Back squat', patterns: ['squat'], modality: 'weightlifting', skill: 3, fatigue: 4, grip: 2, impact: 1, equipment: ['barbell', 'rack'], isStrengthLift: true, substitutions: ['front_squat', 'goblet_squat', 'air_squat'] },
  { id: 'front_squat', name: 'Front squat', patterns: ['squat'], modality: 'weightlifting', skill: 4, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell', 'rack'], isStrengthLift: true, substitutions: ['goblet_squat', 'air_squat'] },
  { id: 'goblet_squat', name: 'Goblet squat', patterns: ['squat'], modality: 'weightlifting', skill: 2, fatigue: 2, grip: 2, impact: 1, equipment: ['kettlebell', 'dumbbell'], substitutions: ['air_squat'] },
  { id: 'thruster', name: 'Thruster', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 3, fatigue: 5, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 43, f: 29 }, substitutions: ['dumbbell_thruster', 'goblet_squat'] },
  { id: 'overhead_squat', name: 'Overhead squat', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 2, impact: 1, equipment: ['barbell'], isStrengthLift: true, substitutions: ['front_squat', 'goblet_squat'] },
  { id: 'pistol_squat', name: 'Pistol squat (monopodalico)', patterns: ['squat'], modality: 'gymnastics', skill: 5, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: ['box_step_up', 'air_squat'] },
  { id: 'dumbbell_thruster', name: 'Dumbbell thruster', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 2, fatigue: 4, grip: 3, impact: 1, equipment: ['dumbbell'], loadRx: { m: 22.5, f: 15 }, substitutions: ['goblet_squat'] },
  { id: 'wall_ball', name: 'Wall ball', patterns: ['squat', 'press'], modality: 'weightlifting', skill: 2, fatigue: 4, grip: 2, impact: 1, equipment: ['wall_ball'], loadRx: { m: 9, f: 6 }, substitutions: ['goblet_squat', 'air_squat'] },
  { id: 'box_step_up', name: 'Box step-up', patterns: ['squat', 'lunge'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: ['box'], substitutions: [] },
  { id: 'box_jump', name: 'Box jump', patterns: ['squat', 'jump'], modality: 'bodyweight', skill: 2, fatigue: 3, grip: 1, impact: 4, equipment: ['box'], substitutions: ['box_step_up'] },
  { id: 'lunge', name: 'Walking lunge', patterns: ['lunge'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: [] },

  // ---- Hinge pattern ----
  { id: 'deadlift', name: 'Deadlift', patterns: ['hinge'], modality: 'weightlifting', skill: 3, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], loadRx: { m: 102, f: 70 }, isStrengthLift: true, substitutions: ['kb_deadlift', 'good_morning'] },
  { id: 'kb_deadlift', name: 'Kettlebell deadlift', patterns: ['hinge'], modality: 'weightlifting', skill: 1, fatigue: 2, grip: 2, impact: 1, equipment: ['kettlebell'], loadRx: { m: 24, f: 16 }, substitutions: [] },
  { id: 'kb_swing', name: 'Kettlebell swing', patterns: ['hinge'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 3, impact: 1, equipment: ['kettlebell'], loadRx: { m: 24, f: 16 }, substitutions: ['kb_deadlift'] },
  { id: 'sdhp', name: 'Sumo deadlift high pull', patterns: ['hinge', 'pull'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 34, f: 24 }, substitutions: ['kb_swing'] },
  { id: 'med_ball_clean', name: 'Medicine ball clean', patterns: ['hinge', 'squat'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['wall_ball'], loadRx: { m: 9, f: 6 }, substitutions: ['kb_deadlift'] },
  { id: 'good_morning', name: 'Good morning', patterns: ['hinge'], modality: 'weightlifting', skill: 3, fatigue: 2, grip: 1, impact: 1, equipment: ['barbell'], loadRx: { m: 20, f: 15 }, substitutions: [] },
  { id: 'ghd_situp', name: 'GHD sit-up', patterns: ['core', 'hinge'], modality: 'gymnastics', skill: 3, fatigue: 3, grip: 1, impact: 1, equipment: ['ghd'], substitutions: ['situp'] },

  // ---- Push / press ----
  { id: 'push_press', name: 'Push press', patterns: ['press'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell'], loadRx: { m: 43, f: 29 }, isStrengthLift: true, substitutions: ['strict_press', 'dumbbell_press'] },
  { id: 'strict_press', name: 'Strict press (shoulder press)', patterns: ['press'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell'], loadRx: { m: 34, f: 24 }, isStrengthLift: true, substitutions: ['dumbbell_press'] },
  { id: 'push_jerk', name: 'Push jerk', patterns: ['press'], modality: 'weightlifting', skill: 4, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell'], loadRx: { m: 52, f: 38 }, isStrengthLift: true, substitutions: ['push_press', 'strict_press'] },
  { id: 'dumbbell_press', name: 'Dumbbell shoulder press', patterns: ['press'], modality: 'weightlifting', skill: 2, fatigue: 2, grip: 2, impact: 1, equipment: ['dumbbell'], loadRx: { m: 22.5, f: 15 }, substitutions: [] },
  { id: 'push_up', name: 'Push-up', patterns: ['push'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'bench_press', name: 'Bench press', patterns: ['push'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['barbell', 'bench'], loadRx: { m: 60, f: 40 }, substitutions: ['push_up'] },
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
  { id: 'barbell_row', name: 'Barbell row', patterns: ['pull'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 40, f: 27 }, substitutions: ['ring_row'] },
  { id: 'toes_to_bar', name: 'Toes-to-bar', patterns: ['core', 'pull'], modality: 'gymnastics', skill: 4, fatigue: 3, grip: 4, impact: 1, equipment: ['pullup_bar'], substitutions: ['hanging_knee_raise', 'situp'] },
  { id: 'hanging_knee_raise', name: 'Hanging knee raise', patterns: ['core'], modality: 'gymnastics', skill: 2, fatigue: 2, grip: 3, impact: 1, equipment: ['pullup_bar'], substitutions: ['situp'] },

  // ---- Olympic lifts ----
  { id: 'clean', name: 'Clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 61, f: 43 }, isStrengthLift: true, substitutions: ['kb_swing', 'kb_deadlift'] },
  { id: 'power_clean', name: 'Power clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 4, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 61, f: 43 }, isStrengthLift: true, substitutions: ['kb_swing'] },
  { id: 'snatch', name: 'Snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], loadRx: { m: 43, f: 30 }, isStrengthLift: true, substitutions: ['power_snatch', 'kb_swing'] },
  { id: 'power_snatch', name: 'Power snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 5, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], loadRx: { m: 43, f: 30 }, isStrengthLift: true, substitutions: ['kb_swing'] },
  { id: 'clean_and_jerk', name: 'Clean & jerk', patterns: ['olympic', 'press'], modality: 'weightlifting', skill: 5, fatigue: 5, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 52, f: 38 }, isStrengthLift: true, substitutions: ['power_clean'] },

  // ---- Core ----
  { id: 'situp', name: 'Sit-up', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'plank', name: 'Plank', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'russian_twist', name: 'Russian twist', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },

  // ---- Carry ----
  { id: 'farmers_carry', name: "Farmer's carry", patterns: ['carry'], modality: 'weightlifting', skill: 1, fatigue: 2, grip: 4, impact: 1, equipment: ['kettlebell', 'dumbbell'], loadRx: { m: 24, f: 16 }, substitutions: [] },
  { id: 'yoke_carry', name: 'Yoke carry', patterns: ['carry'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 2, impact: 1, equipment: ['yoke'], loadRx: { m: 100, f: 70 }, substitutions: ['farmers_carry'] },
  { id: 'sandbag_carry', name: 'Sandbag carry', patterns: ['carry'], modality: 'weightlifting', skill: 1, fatigue: 3, grip: 3, impact: 1, equipment: ['sandbag'], loadRx: { m: 30, f: 20 }, substitutions: ['farmers_carry'] },
  { id: 'sled_push', name: 'Sled push', patterns: ['carry', 'squat'], modality: 'weightlifting', skill: 1, fatigue: 4, grip: 2, impact: 1, equipment: ['sled'], substitutions: [] },
  { id: 'sled_pull', name: 'Sled pull', patterns: ['carry', 'pull'], modality: 'weightlifting', skill: 1, fatigue: 4, grip: 3, impact: 1, equipment: ['sled'], substitutions: [] },

  // ---- Dumbbell / kettlebell odd-object variety ----
  { id: 'db_snatch', name: 'Dumbbell snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 3, impact: 1, equipment: ['dumbbell'], loadRx: { m: 22.5, f: 15 }, substitutions: ['kb_swing'] },
  { id: 'db_clean', name: 'Dumbbell clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 3, impact: 1, equipment: ['dumbbell'], loadRx: { m: 22.5, f: 15 }, substitutions: ['kb_deadlift'] },
  { id: 'devil_press', name: 'Devil press', patterns: ['olympic', 'push'], modality: 'weightlifting', skill: 3, fatigue: 5, grip: 3, impact: 2, equipment: ['dumbbell'], loadRx: { m: 22.5, f: 15 }, substitutions: ['burpee'] },
  { id: 'kb_clean', name: 'Kettlebell clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 3, impact: 1, equipment: ['kettlebell'], loadRx: { m: 24, f: 16 }, substitutions: ['kb_deadlift'] },

  // ---- Recovery / mobility (used in low-readiness sessions) ----
  { id: 'mobility_flow', name: 'Mobilità guidata', patterns: ['mobility'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], recoveryOnly: true, substitutions: [] },
  { id: 'zone2_bike', name: 'Bike Zona 2', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: ['bike'], recoveryOnly: true, substitutions: ['zone2_row', 'zone2_walk'] },
  { id: 'zone2_row', name: 'Row Zona 2', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: ['rower'], recoveryOnly: true, substitutions: ['zone2_walk'] },
  { id: 'zone2_walk', name: 'Camminata veloce', patterns: ['cyclical'], modality: 'monostructural', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], recoveryOnly: true, substitutions: [] },

  // ---- Olympic variants (hang / squat style) ----
  { id: 'hang_power_clean', name: 'Hang power clean', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 4, fatigue: 4, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 52, f: 36 }, substitutions: ['power_clean', 'kb_swing'] },
  { id: 'hang_squat_clean', name: 'Hang squat clean', patterns: ['olympic', 'squat'], modality: 'weightlifting', skill: 5, fatigue: 5, grip: 3, impact: 1, equipment: ['barbell'], loadRx: { m: 61, f: 43 }, substitutions: ['hang_power_clean', 'power_clean'] },
  { id: 'hang_power_snatch', name: 'Hang power snatch', patterns: ['olympic', 'hinge'], modality: 'weightlifting', skill: 4, fatigue: 4, grip: 4, impact: 1, equipment: ['barbell'], loadRx: { m: 38, f: 27 }, substitutions: ['power_snatch', 'kb_swing'] },
  { id: 'hang_squat_snatch', name: 'Hang squat snatch', patterns: ['olympic', 'squat'], modality: 'weightlifting', skill: 5, fatigue: 5, grip: 4, impact: 1, equipment: ['barbell'], loadRx: { m: 43, f: 30 }, substitutions: ['hang_power_snatch', 'power_snatch'] },

  // ---- Bodyweight / accessory ----
  { id: 'push_up_plus', name: 'Push-up (deficit/plyo)', patterns: ['push'], modality: 'bodyweight', skill: 3, fatigue: 3, grip: 1, impact: 1, equipment: [], substitutions: ['push_up'] },
  { id: 'ring_push_up', name: 'Ring push-up', patterns: ['push'], modality: 'gymnastics', skill: 3, fatigue: 3, grip: 2, impact: 1, equipment: ['rings'], substitutions: ['push_up'] },
  { id: 'bulgarian_split_squat', name: 'Bulgarian split squat', patterns: ['lunge', 'squat'], modality: 'weightlifting', skill: 2, fatigue: 3, grip: 1, impact: 1, equipment: ['dumbbell'], loadRx: { m: 20, f: 14 }, substitutions: ['lunge'] },
  { id: 'step_down', name: 'Box step-down', patterns: ['lunge'], modality: 'bodyweight', skill: 1, fatigue: 2, grip: 1, impact: 1, equipment: ['box'], substitutions: [] },
  { id: 'broad_jump', name: 'Broad jump', patterns: ['jump', 'squat'], modality: 'bodyweight', skill: 2, fatigue: 3, grip: 1, impact: 3, equipment: [], substitutions: ['box_step_up'] },
  { id: 'turkish_get_up', name: 'Turkish get-up', patterns: ['press', 'core'], modality: 'weightlifting', skill: 4, fatigue: 3, grip: 3, impact: 1, equipment: ['kettlebell'], loadRx: { m: 16, f: 12 }, substitutions: ['plank'] },
  { id: 'renegade_row', name: 'Renegade row', patterns: ['pull', 'core'], modality: 'weightlifting', skill: 3, fatigue: 3, grip: 4, impact: 1, equipment: ['dumbbell'], loadRx: { m: 20, f: 14 }, substitutions: ['barbell_row'] },
  { id: 'man_maker', name: 'Man maker', patterns: ['push', 'pull', 'squat'], modality: 'weightlifting', skill: 3, fatigue: 5, grip: 3, impact: 2, equipment: ['dumbbell'], loadRx: { m: 20, f: 14 }, substitutions: ['burpee'] },
  { id: 'single_leg_rdl', name: 'Single-leg RDL', patterns: ['hinge', 'lunge'], modality: 'weightlifting', skill: 3, fatigue: 2, grip: 2, impact: 1, equipment: ['dumbbell'], loadRx: { m: 16, f: 12 }, substitutions: ['good_morning'] },
  { id: 'ghd_back_extension', name: 'GHD back extension', patterns: ['hinge', 'core'], modality: 'gymnastics', skill: 2, fatigue: 2, grip: 1, impact: 1, equipment: ['ghd'], substitutions: ['good_morning'] },
  { id: 'deadbug', name: 'Dead bug', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: [] },
  { id: 'side_plank', name: 'Side plank', patterns: ['core'], modality: 'bodyweight', skill: 1, fatigue: 1, grip: 1, impact: 1, equipment: [], substitutions: ['plank'] },
  { id: 'v_up', name: 'V-up', patterns: ['core'], modality: 'bodyweight', skill: 2, fatigue: 2, grip: 1, impact: 1, equipment: [], substitutions: ['situp'] },
  { id: 'battle_ropes', name: 'Battle ropes', patterns: ['cyclical', 'push'], modality: 'monostructural', skill: 1, fatigue: 3, grip: 3, impact: 1, equipment: ['battle_ropes'], substitutions: ['burpee'] },
];

export function getMovement(id) {
  return MOVEMENTS.find(m => m.id === id);
}


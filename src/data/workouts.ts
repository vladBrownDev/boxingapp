import { Combo, ComboLevel, getComboById } from './combos';

export interface Workout {
  id: string;
  name: string;
  level: ComboLevel;
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  /** Combo ids, cycled through across rounds. */
  comboIds: string[];
}

export const WORKOUTS: Workout[] = [
  {
    id: 'workout-beginner-basics',
    name: 'Beginner Basics',
    level: 'Beginner',
    rounds: 6,
    workSeconds: 120,
    restSeconds: 60,
    comboIds: ['combo-1-2', 'combo-1-2-3', 'combo-double-jab-cross', 'combo-body-1-2'],
  },
  {
    id: 'workout-body-shot-focus',
    name: 'Body Shot Focus',
    level: 'Intermediate',
    rounds: 8,
    workSeconds: 150,
    restSeconds: 45,
    comboIds: ['combo-body-1-2', 'combo-body-head-mix', 'combo-hook-uppercut-cross'],
  },
  {
    id: 'workout-defense-and-counter',
    name: 'Defense & Counter',
    level: 'Advanced',
    rounds: 10,
    workSeconds: 180,
    restSeconds: 45,
    comboIds: ['combo-slip-counter', 'combo-slip-jab', 'combo-duck-uppercut', 'combo-weave-counter'],
  },
  {
    id: 'workout-full-combo-grind',
    name: 'Full Combo Grind',
    level: 'Advanced',
    rounds: 12,
    workSeconds: 180,
    restSeconds: 30,
    comboIds: ['combo-five-punch', 'combo-pivot-escape', 'combo-weave-counter', 'combo-duck-uppercut'],
  },
];

/** Resolves a workout's combo ids to their full Combo objects, in order. */
export function getWorkoutCombos(workout: Workout): Combo[] {
  return workout.comboIds
    .map(getComboById)
    .filter((combo): combo is Combo => combo !== undefined);
}

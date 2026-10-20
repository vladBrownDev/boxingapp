import { TFunction } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { Combo, ComboLevel, getComboById } from './combos';
import { PUNCH_BY_CODE, PunchCode } from './punchNotation';

export interface Workout {
  id: string;
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
    level: 'Beginner',
    rounds: 6,
    workSeconds: 120,
    restSeconds: 60,
    comboIds: ['combo-1-2', 'combo-1-2-3', 'combo-double-jab-cross', 'combo-body-1-2'],
  },
  {
    id: 'workout-body-shot-focus',
    level: 'Intermediate',
    rounds: 8,
    workSeconds: 150,
    restSeconds: 45,
    comboIds: ['combo-body-1-2', 'combo-body-head-mix', 'combo-hook-uppercut-cross'],
  },
  {
    id: 'workout-defense-and-counter',
    level: 'Advanced',
    rounds: 10,
    workSeconds: 180,
    restSeconds: 45,
    comboIds: ['combo-slip-counter', 'combo-slip-jab', 'combo-duck-uppercut', 'combo-weave-counter'],
  },
  {
    id: 'workout-full-combo-grind',
    level: 'Advanced',
    rounds: 12,
    workSeconds: 180,
    restSeconds: 30,
    comboIds: ['combo-five-punch', 'combo-pivot-escape', 'combo-weave-counter', 'combo-duck-uppercut'],
  },
];

export function getWorkoutById(id: string): Workout | undefined {
  return WORKOUTS.find(workout => workout.id === id);
}

export function getWorkoutName(t: TFunction, workout: Workout): string {
  return t(`${workout.id}.name` as TranslationKey);
}

/** Resolves a workout's combo ids to their full Combo objects, in order. */
export function getWorkoutCombos(workout: Workout): Combo[] {
  return workout.comboIds
    .map(getComboById)
    .filter((combo): combo is Combo => combo !== undefined);
}

export function getWorkoutDurationMinutes(workout: Workout): number {
  const totalSeconds =
    workout.rounds * workout.workSeconds + (workout.rounds - 1) * workout.restSeconds;
  return Math.round(totalSeconds / 60);
}

/** Every distinct punch code thrown across a workout's combos. */
function getWorkoutPunchCodes(workout: Workout): PunchCode[] {
  const codes = new Set<PunchCode>();
  for (const combo of getWorkoutCombos(workout)) {
    for (const step of combo.sequence) {
      for (const move of step.split('+')) {
        const punch = (PUNCH_BY_CODE as Record<string, { code: PunchCode } | undefined>)[move];
        if (punch) {
          codes.add(punch.code);
        }
      }
    }
  }
  return Array.from(codes);
}

export interface SuggestedWorkout {
  workout: Workout;
  /** The least-trained punches (globally) that this workout would exercise. */
  focusPunchCodes: PunchCode[];
}

/** Picks the workout whose combos best cover the punches the user has thrown in the
 * fewest rounds, so training stays balanced instead of favoring the same few punches. */
export function getSuggestedWorkout(
  punchBreakdown: { code: PunchCode; roundsUsed: number }[],
): SuggestedWorkout | undefined {
  const roundsByCode = new Map(punchBreakdown.map(p => [p.code, p.roundsUsed]));

  let best: { workout: Workout; score: number; codes: PunchCode[] } | undefined;
  for (const workout of WORKOUTS) {
    const codes = getWorkoutPunchCodes(workout);
    if (codes.length === 0) {
      continue;
    }
    const score =
      codes.reduce((sum, code) => sum + (roundsByCode.get(code) ?? 0), 0) / codes.length;
    if (!best || score < best.score) {
      best = { workout, score, codes };
    }
  }
  if (!best) {
    return undefined;
  }

  const focusPunchCodes = best.codes
    .slice()
    .sort((a, b) => (roundsByCode.get(a) ?? 0) - (roundsByCode.get(b) ?? 0))
    .slice(0, 2);

  return { workout: best.workout, focusPunchCodes };
}

import { TFunction } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { Combo, ComboLevel, getComboById } from './combos';
import { PUNCH_BY_CODE, PunchCode } from './punchNotation';

/** One timed block of a workout: either throwing a combo, or resting. Segments run in
 * order, so two combo segments can follow each other with no rest in between. */
export type WorkoutSegment =
  | { type: 'combo'; comboId: string; seconds: number }
  | { type: 'rest'; seconds: number };

export interface Workout {
  id: string;
  level: ComboLevel;
  segments: WorkoutSegment[];
}

export const DEFAULT_COMBO_SECONDS = 120;
export const DEFAULT_REST_SECONDS = 60;

export function combo(comboId: string, seconds = DEFAULT_COMBO_SECONDS): WorkoutSegment {
  return { type: 'combo', comboId, seconds };
}

export function rest(seconds = DEFAULT_REST_SECONDS): WorkoutSegment {
  return { type: 'rest', seconds };
}

/** Classic layout: `rounds` combo segments cycling through `comboIds`, a rest between each. */
function roundsWithRest(rounds: number, comboIds: string[]): WorkoutSegment[] {
  const segments: WorkoutSegment[] = [];
  for (let i = 0; i < rounds; i++) {
    if (i > 0) {
      segments.push(rest());
    }
    segments.push(combo(comboIds[i % comboIds.length]));
  }
  return segments;
}

export const WORKOUTS: Workout[] = [
  {
    id: 'workout-beginner-basics',
    level: 'Beginner',
    segments: roundsWithRest(6, ['combo-1-2', 'combo-1-2-3', 'combo-double-jab-cross', 'combo-body-1-2']),
  },
  {
    id: 'workout-body-shot-focus',
    level: 'Intermediate',
    segments: roundsWithRest(8, ['combo-body-1-2', 'combo-body-head-mix', 'combo-hook-uppercut-cross']),
  },
  {
    id: 'workout-defense-and-counter',
    level: 'Advanced',
    segments: roundsWithRest(10, ['combo-slip-counter', 'combo-slip-jab', 'combo-step-back-escape']),
  },
  {
    id: 'workout-full-combo-grind',
    level: 'Advanced',
    segments: roundsWithRest(12, ['combo-five-punch', 'combo-step-back-escape', 'combo-slip-jab']),
  },
];

export function getWorkoutById(id: string): Workout | undefined {
  return WORKOUTS.find(workout => workout.id === id);
}

export function getWorkoutName(t: TFunction, workout: Workout): string {
  return t(`${workout.id}.name` as TranslationKey);
}

/** Number of combo segments, i.e. what the UI calls "rounds". */
export function countRounds(segments: WorkoutSegment[]): number {
  return segments.filter(s => s.type === 'combo').length;
}

export function getSegmentsTotalSeconds(segments: WorkoutSegment[]): number {
  return segments.reduce((sum, s) => sum + s.seconds, 0);
}

/** Distinct combos used by the workout, in order of first appearance. */
export function getWorkoutCombos(workout: Workout): Combo[] {
  const ids = new Set<string>();
  for (const segment of workout.segments) {
    if (segment.type === 'combo') {
      ids.add(segment.comboId);
    }
  }
  return Array.from(ids)
    .map(getComboById)
    .filter((c): c is Combo => c !== undefined);
}

export function getWorkoutDurationMinutes(workout: Workout): number {
  return Math.round(getSegmentsTotalSeconds(workout.segments) / 60);
}

/** Every distinct punch code thrown across a workout's combos. */
function getWorkoutPunchCodes(workout: Workout): PunchCode[] {
  const codes = new Set<PunchCode>();
  for (const workoutCombo of getWorkoutCombos(workout)) {
    for (const step of workoutCombo.sequence) {
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

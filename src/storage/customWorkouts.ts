import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSegmentCombo, Workout, WorkoutSegment } from '../data/workouts';

const CUSTOM_WORKOUTS_KEY = '@punchfactory/custom_workouts';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function isValidSegment(segment: unknown): segment is WorkoutSegment {
  const s = segment as { type?: unknown; seconds?: unknown; comboId?: unknown; custom?: any };
  if (typeof s?.seconds !== 'number' || s.seconds <= 0) {
    return false;
  }
  if (s.type === 'rest') {
    return true;
  }
  if (s.type !== 'combo') {
    return false;
  }
  if (s.custom) {
    return (
      typeof s.custom.id === 'string' &&
      typeof s.custom.name === 'string' &&
      Array.isArray(s.custom.sequence) &&
      s.custom.sequence.length > 0 &&
      s.custom.sequence.every((step: unknown) => typeof step === 'string')
    );
  }
  return typeof s.comboId === 'string';
}

function isValidWorkout(workout: unknown): workout is Workout {
  const w = workout as Partial<Workout>;
  return (
    typeof w?.id === 'string' &&
    typeof w.name === 'string' &&
    LEVELS.includes(w.level as string) &&
    Array.isArray(w.segments) &&
    w.segments.every(isValidSegment)
  );
}

/** Drops segments pointing at combos that no longer exist (e.g. removed in an app update). */
function withKnownCombos(workout: Workout): Workout {
  return {
    ...workout,
    isCustom: true,
    segments: workout.segments.filter(s => s.type === 'rest' || getSegmentCombo(s)),
  };
}

export async function loadCustomWorkouts(): Promise<Workout[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_WORKOUTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return parsed.filter(isValidWorkout).map(withKnownCombos);
  } catch {
    return [];
  }
}

async function writeCustomWorkouts(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_WORKOUTS_KEY, JSON.stringify(workouts));
}

/** Inserts a new workout (at the top) or replaces the one with the same id. */
export async function saveCustomWorkout(workout: Workout): Promise<Workout> {
  const saved: Workout = { ...workout, isCustom: true };
  const workouts = await loadCustomWorkouts();
  const index = workouts.findIndex(w => w.id === saved.id);
  if (index >= 0) {
    workouts[index] = saved;
  } else {
    workouts.unshift(saved);
  }
  await writeCustomWorkouts(workouts);
  return saved;
}

export async function deleteCustomWorkout(id: string): Promise<void> {
  const workouts = await loadCustomWorkouts();
  await writeCustomWorkouts(workouts.filter(w => w.id !== id));
}

export function newCustomWorkoutId(): string {
  return `custom-${Date.now()}`;
}

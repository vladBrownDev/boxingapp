import AsyncStorage from '@react-native-async-storage/async-storage';

const TRAINING_DAYS_KEY = '@punchfactory/training_days';

/** Weekdays as Date.getDay() values (0 = Sunday). */
export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
/** Pre-selected on the onboarding screen: a common 3-sessions-a-week boxing split. */
export const SUGGESTED_TRAINING_DAYS = [1, 3, 5];

/** Returns the user's training weekdays, or null if they haven't picked them yet. */
export async function loadTrainingDays(): Promise<number[] | null> {
  try {
    const raw = await AsyncStorage.getItem(TRAINING_DAYS_KEY);
    const days = raw ? (JSON.parse(raw) as number[]) : null;
    return days && days.length > 0 ? days : null;
  } catch {
    return null;
  }
}

export async function saveTrainingDays(days: number[]): Promise<void> {
  await AsyncStorage.setItem(TRAINING_DAYS_KEY, JSON.stringify([...days].sort((a, b) => a - b)));
}

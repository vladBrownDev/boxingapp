import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@punchfactory/favorite_workouts';

export async function loadFavorites(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(workoutId: string): Promise<string[]> {
  const favorites = await loadFavorites();
  const next = favorites.includes(workoutId)
    ? favorites.filter(id => id !== workoutId)
    : [...favorites, workoutId];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

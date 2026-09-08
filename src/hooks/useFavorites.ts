import { useCallback, useEffect, useState } from 'react';
import { loadFavorites, toggleFavorite as toggleFavoriteStorage } from '../storage/favoritesStorage';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites().then(setFavoriteIds);
  }, []);

  const toggleFavorite = useCallback(async (workoutId: string) => {
    const next = await toggleFavoriteStorage(workoutId);
    setFavoriteIds(next);
  }, []);

  return { favoriteIds, toggleFavorite };
}

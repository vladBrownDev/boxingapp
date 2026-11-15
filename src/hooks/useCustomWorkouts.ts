import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Workout } from '../data/workouts';
import { loadCustomWorkouts } from '../storage/customWorkouts';

/** The user's own workouts, reloaded every time the screen regains focus so that
 * changes made in the workout editor show up on return. */
export function useCustomWorkouts(): Workout[] {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadCustomWorkouts().then(loaded => {
        if (!cancelled) {
          setWorkouts(loaded);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return workouts;
}

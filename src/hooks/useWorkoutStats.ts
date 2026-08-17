import { useCallback, useEffect, useState } from 'react';
import {
  TodayStats,
  WeekStats,
  WorkoutSession,
  addSession,
  getTodayStats,
  getWeekStats,
  loadSessions,
} from '../storage/workoutStorage';

export function useWorkoutStats() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  const logSession = useCallback(async (session: WorkoutSession) => {
    await addSession(session);
    loadSessions().then(setSessions);
  }, []);

  const todayStats: TodayStats = getTodayStats(sessions);
  const weekStats: WeekStats = getWeekStats(sessions);

  return { sessions, todayStats, weekStats, logSession };
}

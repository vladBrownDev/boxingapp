import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  AllTimeStats,
  PunchBreakdownEntry,
  TodayStats,
  WeekStats,
  WorkoutBreakdownEntry,
  WorkoutSession,
  addSession,
  getAllTimeStats,
  getPunchBreakdown,
  getTodayStats,
  getWeekStats,
  getWorkoutBreakdown,
  loadSessions,
} from '../storage/workoutStorage';

export function useWorkoutStats() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSessions().then(setSessions);
    }, []),
  );

  const logSession = useCallback(async (session: WorkoutSession) => {
    await addSession(session);
    loadSessions().then(setSessions);
  }, []);

  const todayStats: TodayStats = getTodayStats(sessions);
  const weekStats: WeekStats = getWeekStats(sessions);
  const allTimeStats: AllTimeStats = getAllTimeStats(sessions);
  const workoutBreakdown: WorkoutBreakdownEntry[] = getWorkoutBreakdown(sessions);
  const punchBreakdown: PunchBreakdownEntry[] = getPunchBreakdown(sessions);

  return {
    sessions,
    todayStats,
    weekStats,
    allTimeStats,
    workoutBreakdown,
    punchBreakdown,
    logSession,
  };
}

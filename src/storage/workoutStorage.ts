import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = '@punchfactory/workout_sessions';

export interface WorkoutSession {
  id: string;
  timestamp: number;
  comboName: string;
  rounds: number;
  workTime: number;    // seconds per round
  restTime: number;    // seconds per round
  totalDuration: number; // total seconds
}

export async function loadSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as WorkoutSession[]) : [];
  } catch {
    return [];
  }
}

export async function addSession(session: WorkoutSession): Promise<void> {
  const sessions = await loadSessions();
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...sessions]));
}

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface TodayStats {
  sessions: number;
  minutes: number;
}

export interface WeekStats {
  sessions: number;
  minutes: number;
  rounds: number;
}

export function getTodayStats(sessions: WorkoutSession[]): TodayStats {
  const today = startOfDay();
  const todaySessions = sessions.filter(s => s.timestamp >= today);
  return {
    sessions: todaySessions.length,
    minutes: Math.round(
      todaySessions.reduce((sum, s) => sum + s.totalDuration, 0) / 60,
    ),
  };
}

export function getWeekStats(sessions: WorkoutSession[]): WeekStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = sessions.filter(s => s.timestamp >= weekAgo);
  return {
    sessions: weekSessions.length,
    minutes: Math.round(
      weekSessions.reduce((sum, s) => sum + s.totalDuration, 0) / 60,
    ),
    rounds: weekSessions.reduce((sum, s) => sum + s.rounds, 0),
  };
}

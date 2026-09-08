import AsyncStorage from '@react-native-async-storage/async-storage';
import { ComboLevel, getComboById } from '../data/combos';
import { PUNCH_BY_CODE, PUNCHES, PunchCode } from '../data/punchNotation';

const SESSIONS_KEY = '@punchfactory/workout_sessions';

export interface WorkoutSession {
  id: string;
  timestamp: number;
  workoutId: string;
  workoutName: string;
  level: ComboLevel;
  rounds: number;          // planned rounds
  roundsCompleted: number; // rounds actually finished before exit/completion
  workTime: number;        // seconds per round
  restTime: number;        // seconds per round
  totalDuration: number;   // planned total seconds
  activeDuration: number;  // actual seconds trained
  comboIds: string[];      // combos cycled through, one per completed round
  completed: boolean;      // false if the session was exited before the last round
}

/** Rejects sessions persisted under an older schema (e.g. pre-workoutId records). */
function isValidSession(session: unknown): session is WorkoutSession {
  const s = session as Partial<WorkoutSession>;
  return (
    typeof s?.id === 'string' &&
    typeof s?.workoutId === 'string' &&
    typeof s?.workoutName === 'string' &&
    typeof s?.roundsCompleted === 'number' &&
    typeof s?.activeDuration === 'number'
  );
}

export async function loadSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return parsed.filter(isValidSession);
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
      todaySessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
    ),
  };
}

export function getWeekStats(sessions: WorkoutSession[]): WeekStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = sessions.filter(s => s.timestamp >= weekAgo);
  return {
    sessions: weekSessions.length,
    minutes: Math.round(
      weekSessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
    ),
    rounds: weekSessions.reduce((sum, s) => sum + s.roundsCompleted, 0),
  };
}

export type StatsPeriod = 'day' | 'week' | 'month';

export interface PeriodStats {
  sessions: number;
  minutes: number;
  rounds: number;
}

/** Narrows sessions down to the given rolling window (today, last 7 days, or last 30
 * days). */
export function filterSessionsByPeriod(
  sessions: WorkoutSession[],
  period: StatsPeriod,
): WorkoutSession[] {
  const since =
    period === 'day'
      ? startOfDay()
      : period === 'week'
      ? Date.now() - 7 * 24 * 60 * 60 * 1000
      : Date.now() - 30 * 24 * 60 * 60 * 1000;
  return sessions.filter(s => s.timestamp >= since);
}

/** Aggregates sessions trained in the given rolling window (today, last 7 days, or last
 * 30 days). */
export function getPeriodStats(sessions: WorkoutSession[], period: StatsPeriod): PeriodStats {
  const periodSessions = filterSessionsByPeriod(sessions, period);
  return {
    sessions: periodSessions.length,
    minutes: Math.round(
      periodSessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
    ),
    rounds: periodSessions.reduce((sum, s) => sum + s.roundsCompleted, 0),
  };
}

export interface AllTimeStats {
  totalSessions: number;
  totalMinutes: number;
  totalRounds: number;
  completedSessions: number;
  currentStreak: number;
}

export interface WorkoutBreakdownEntry {
  workoutId: string;
  workoutName: string;
  sessions: number;
  minutes: number;
}

/** Counts consecutive days (ending today or yesterday) with at least one session. */
function getCurrentStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const trainedDays = new Set(
    sessions.map(s => Math.floor(s.timestamp / dayMs)),
  );
  const today = Math.floor(startOfDay() / dayMs);

  let streak = 0;
  let day = today;
  if (!trainedDays.has(day)) {
    day -= 1;
    if (!trainedDays.has(day)) {
      return 0;
    }
  }
  while (trainedDays.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

export function getAllTimeStats(sessions: WorkoutSession[]): AllTimeStats {
  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(
      sessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
    ),
    totalRounds: sessions.reduce((sum, s) => sum + s.roundsCompleted, 0),
    completedSessions: sessions.filter(s => s.completed).length,
    currentStreak: getCurrentStreak(sessions),
  };
}

/** Aggregates sessions per workout, sorted by most trained. */
export function getWorkoutBreakdown(sessions: WorkoutSession[]): WorkoutBreakdownEntry[] {
  const byWorkout = new Map<string, WorkoutBreakdownEntry>();
  for (const session of sessions) {
    const entry = byWorkout.get(session.workoutId) ?? {
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      sessions: 0,
      minutes: 0,
    };
    entry.sessions += 1;
    entry.minutes += Math.round(session.activeDuration / 60);
    byWorkout.set(session.workoutId, entry);
  }
  return Array.from(byWorkout.values()).sort((a, b) => b.sessions - a.sessions);
}

export interface PunchBreakdownEntry {
  code: PunchCode;
  label: string;
  roundsUsed: number;
}

/** Counts how many completed rounds each punch has appeared in, from the combos cycled
 * through on every completed round of every session (a punch repeated within one round,
 * e.g. a double jab, still counts as a single round). Every punch is included even at
 * zero, so the least-trained ones can be found to steer future workout recommendations. */
export function getPunchBreakdown(sessions: WorkoutSession[]): PunchBreakdownEntry[] {
  const roundCounts = new Map<PunchCode, number>(PUNCHES.map(p => [p.code, 0]));

  for (const session of sessions) {
    for (const comboId of session.comboIds) {
      const combo = getComboById(comboId);
      if (!combo) {
        continue;
      }
      const punchesInRound = new Set<PunchCode>();
      for (const step of combo.sequence) {
        for (const move of step.split('+')) {
          const punch = (PUNCH_BY_CODE as Record<string, { code: PunchCode } | undefined>)[move];
          if (punch) {
            punchesInRound.add(punch.code);
          }
        }
      }
      for (const code of punchesInRound) {
        roundCounts.set(code, (roundCounts.get(code) ?? 0) + 1);
      }
    }
  }

  return PUNCHES.map(p => ({ code: p.code, label: p.label, roundsUsed: roundCounts.get(p.code) ?? 0 }))
    .sort((a, b) => a.roundsUsed - b.roundsUsed);
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Formats a timestamp's clock time, e.g. "7:05pm". */
function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours24 = date.getHours();
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}${hours24 < 12 ? 'am' : 'pm'}`;
}

/** Formats a session timestamp as a calendar date and time, e.g. "Sep 3, 2026 \u00b7 7:05pm". */
export function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} \u00b7 ${formatClockTime(timestamp)}`;
}

/** Formats a session timestamp for display, e.g. "Today at 7:05pm", "Yesterday", "3 days ago". */
export function formatSessionTime(timestamp: number): string {
  const today = startOfDay();
  const yesterday = today - 24 * 60 * 60 * 1000;

  if (timestamp >= today) {
    return `Today at ${formatClockTime(timestamp)}`;
  }
  if (timestamp >= yesterday) {
    return 'Yesterday';
  }
  const days = Math.floor((today - timestamp) / (24 * 60 * 60 * 1000));
  if (days < 7) {
    return `${days} days ago`;
  }
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

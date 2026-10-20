import AsyncStorage from '@react-native-async-storage/async-storage';
import { ComboLevel, getComboById } from '../data/combos';
import { TFunction } from '../i18n/LanguageContext';
import { Locale, MONTHS } from '../i18n/translations';
import { PUNCH_BY_CODE, PUNCHES, PunchCode } from '../data/punchNotation';
import { ALL_WEEKDAYS } from './trainingSchedule';

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

/**
 * Counts days trained in a row, measured against the user's training schedule: a missed
 * training day breaks the streak, an untrained rest day doesn't, and a workout on a rest
 * day still counts. Today never breaks it, since there's still time to train.
 */
export function getCurrentStreak(
  sessions: WorkoutSession[],
  trainingDays: number[] = ALL_WEEKDAYS,
): number {
  if (sessions.length === 0) {
    return 0;
  }
  // Key days by local calendar date, so sessions bucket by the user's midnight, not UTC's.
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const trainedDays = new Set(sessions.map(s => dayKey(new Date(s.timestamp))));
  const firstSession = Math.min(...sessions.map(s => s.timestamp));

  let streak = 0;
  const day = new Date(startOfDay());
  if (!trainedDays.has(dayKey(day))) {
    day.setDate(day.getDate() - 1);
  }
  while (day.getTime() + 24 * 60 * 60 * 1000 > firstSession) {
    if (trainedDays.has(dayKey(day))) {
      streak += 1;
    } else if (trainingDays.includes(day.getDay())) {
      break;
    }
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function getAllTimeStats(
  sessions: WorkoutSession[],
  trainingDays: number[] = ALL_WEEKDAYS,
): AllTimeStats {
  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(
      sessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
    ),
    totalRounds: sessions.reduce((sum, s) => sum + s.roundsCompleted, 0),
    completedSessions: sessions.filter(s => s.completed).length,
    currentStreak: getCurrentStreak(sessions, trainingDays),
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

  return PUNCHES.map(p => ({ code: p.code, roundsUsed: roundCounts.get(p.code) ?? 0 }))
    .sort((a, b) => a.roundsUsed - b.roundsUsed);
}

/** Formats a timestamp's clock time, e.g. "7:05pm". */
export function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours24 = date.getHours();
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}${hours24 < 12 ? 'am' : 'pm'}`;
}

/** Formats a session timestamp as a calendar date and time, e.g. "Sep 3, 2026 \u00b7 7:05pm". */
export function formatSessionDate(timestamp: number, locale: Locale): string {
  const date = new Date(timestamp);
  return `${MONTHS[locale][date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} \u00b7 ${formatClockTime(timestamp)}`;
}

/** Formats a session timestamp for display, e.g. "Today at 7:05pm", "Yesterday", "3 days ago". */
export function formatSessionTime(timestamp: number, t: TFunction): string {
  const today = startOfDay();
  const yesterday = today - 24 * 60 * 60 * 1000;

  if (timestamp >= today) {
    return t('time.todayAt', { time: formatClockTime(timestamp) });
  }
  if (timestamp >= yesterday) {
    return t('time.yesterday');
  }
  const days = Math.floor((today - timestamp) / (24 * 60 * 60 * 1000));
  if (days < 7) {
    return t(days === 1 ? 'time.daysAgo_one' : 'time.daysAgo_other', { count: days });
  }
  const weeks = Math.floor(days / 7);
  return t(weeks === 1 ? 'time.weeksAgo_one' : 'time.weeksAgo_other', { count: weeks });
}

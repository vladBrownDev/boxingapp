import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';
import { TFunction } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { loadNotificationSettings } from '../storage/notificationSettings';
import { ALL_WEEKDAYS, loadTrainingDays } from '../storage/trainingSchedule';
import { getCurrentStreak, loadSessions } from '../storage/workoutStorage';

const CHANNEL_ID = 'workout-reminders';
const DAY_MS = 24 * 60 * 60 * 1000;

/** How many days ahead reminders are queued. The queue is rebuilt on every app open
 * and every logged session, so this only matters for users who stop opening the app;
 * it's long enough to reach the last comeback nudge even on a once-a-week schedule. */
const SCHEDULE_WINDOW_DAYS = 28;
/** Minimum days since the last workout before each comeback nudge. */
const COMEBACK_MIN_IDLE_DAYS = [3, 7];

const DAILY_MESSAGES: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'notif.daily1.title', body: 'notif.daily1.body' },
  { title: 'notif.daily2.title', body: 'notif.daily2.body' },
  { title: 'notif.daily3.title', body: 'notif.daily3.body' },
  { title: 'notif.daily4.title', body: 'notif.daily4.body' },
];
const COMEBACK_MESSAGES: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'notif.comeback1.title', body: 'notif.comeback1.body' },
  { title: 'notif.comeback2.title', body: 'notif.comeback2.body' },
];

interface Message {
  title: string;
  body: string;
}

/** Key training days derived from the last workout; all are day-start timestamps. */
interface InactivityPlan {
  /** First training day after the last workout: skip it and the streak resets. */
  riskDay: number;
  /** Later training days that get a comeback nudge instead of the usual reminder. */
  comebackDays: number[];
}

function localDayStart(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole local days between two day starts; rounding absorbs DST's 23/25-hour days. */
function daysBetween(fromDayStart: number, toDayStart: number): number {
  return Math.round((toDayStart - fromDayStart) / DAY_MS);
}

/** First training day strictly after `afterDayStart` that satisfies `accept`. */
function nextTrainingDay(
  afterDayStart: number,
  trainingDays: number[],
  accept: (dayStart: number) => boolean = () => true,
): number {
  const d = new Date(afterDayStart);
  for (;;) {
    d.setDate(d.getDate() + 1);
    if (trainingDays.includes(d.getDay()) && accept(d.getTime())) {
      return d.getTime();
    }
  }
}

function planInactivity(lastTrainedDay: number, trainingDays: number[]): InactivityPlan {
  const riskDay = nextTrainingDay(lastTrainedDay, trainingDays);
  const comebackDays: number[] = [];
  let previous = riskDay;
  for (const minIdle of COMEBACK_MIN_IDLE_DAYS) {
    previous = nextTrainingDay(
      previous,
      trainingDays,
      day => daysBetween(lastTrainedDay, day) >= minIdle,
    );
    comebackDays.push(previous);
  }
  return { riskDay, comebackDays };
}

/**
 * Picks the message for a training day. Priority: comeback nudge > streak at risk > daily
 * reminder. Returns null after the last comeback nudge, so inactive users stop hearing from us.
 */
function messageForDay(
  t: TFunction,
  dayStart: number,
  plan: InactivityPlan | null,
  streak: number,
): Message | null {
  if (plan) {
    const lastComeback = plan.comebackDays[plan.comebackDays.length - 1];
    if (dayStart > lastComeback) {
      return null;
    }
    const comebackIndex = plan.comebackDays.indexOf(dayStart);
    if (comebackIndex !== -1) {
      const comeback = COMEBACK_MESSAGES[comebackIndex];
      return { title: t(comeback.title), body: t(comeback.body) };
    }
    if (dayStart === plan.riskDay && streak >= 2) {
      return {
        title: t('notif.streak.title', { count: streak }),
        body: t('notif.streak.body', { count: streak }),
      };
    }
  }
  const variant = DAILY_MESSAGES[Math.floor(dayStart / DAY_MS) % DAILY_MESSAGES.length];
  return { title: t(variant.title), body: t(variant.body) };
}

async function isPermissionGranted(): Promise<boolean> {
  const { authorizationStatus } = await notifee.getNotificationSettings();
  return authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

/** Shows the OS permission dialog (Android 13+ / iOS); resolves true if notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  const { authorizationStatus } = await notifee.requestPermission();
  return authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export function openSystemNotificationSettings(): Promise<void> {
  return notifee.openNotificationSettings();
}

async function rebuildSchedule(t: TFunction): Promise<void> {
  await notifee.cancelTriggerNotifications();

  const settings = await loadNotificationSettings();
  if (!settings.remindersEnabled || !(await isPermissionGranted())) {
    return;
  }

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: t('notif.channelName'),
    importance: AndroidImportance.DEFAULT,
  });

  const sessions = await loadSessions();
  const now = Date.now();
  const today = localDayStart(now);
  const lastTrainedDay = sessions.length
    ? localDayStart(Math.max(...sessions.map(s => s.timestamp)))
    : null;
  const trainingDays = (await loadTrainingDays()) ?? ALL_WEEKDAYS;
  const streak = getCurrentStreak(sessions, trainingDays);
  const plan = lastTrainedDay === null ? null : planInactivity(lastTrainedDay, trainingDays);

  for (let offset = 0; offset < SCHEDULE_WINDOW_DAYS; offset++) {
    const fireAt = new Date(today);
    fireAt.setDate(fireAt.getDate() + offset);
    fireAt.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);
    const dayStart = localDayStart(fireAt.getTime());

    if (fireAt.getTime() <= now || dayStart === lastTrainedDay) {
      continue;
    }
    // Reminders only go out on training days.
    if (!trainingDays.includes(fireAt.getDay())) {
      continue;
    }
    const message = messageForDay(t, dayStart, plan, streak);
    if (!message) {
      break;
    }

    await notifee.createTriggerNotification(
      {
        id: `reminder-${offset}`,
        title: message.title,
        body: message.body,
        android: {
          channelId: CHANNEL_ID,
          smallIcon: 'ic_stat_notification',
          color: '#D42020',
          pressAction: { id: 'default' },
        },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: fireAt.getTime(),
        // Inexact but Doze-safe, and needs no SCHEDULE_EXACT_ALARM permission.
        alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE },
      },
    );
  }
}

let queue: Promise<void> = Promise.resolve();

/**
 * Cancels and re-queues all reminders from current settings, sessions and language.
 * Calls are serialized so overlapping triggers (app start + locale load) can't interleave.
 */
export function rescheduleNotifications(t: TFunction): Promise<void> {
  queue = queue.then(() => rebuildSchedule(t)).catch(() => {});
  return queue;
}

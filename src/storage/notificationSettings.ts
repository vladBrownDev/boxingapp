import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@punchfactory/notification_settings';

export interface NotificationSettings {
  remindersEnabled: boolean;
  reminderHour: number;   // 0-23, local time
  reminderMinute: number; // 0-59
  promptSeen: boolean;    // the "Stay Motivated" prompt was answered (Allow or Skip)
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  remindersEnabled: false,
  reminderHour: 17,
  reminderMinute: 30,
  promptSeen: false,
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...(JSON.parse(raw) as Partial<NotificationSettings>) }
      : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function saveNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const next = { ...(await loadNotificationSettings()), ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

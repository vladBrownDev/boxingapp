import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';
import { rescheduleNotifications } from './reminders';

/** Keeps queued reminders fresh: on launch, on language change, and whenever the app returns
 * to the foreground (a new day may have started, or permission may have changed in settings). */
export default function NotificationSync() {
  const { t } = useTranslation();

  useEffect(() => {
    rescheduleNotifications(t);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        rescheduleNotifications(t);
      }
    });
    return () => subscription.remove();
  }, [t]);

  return null;
}

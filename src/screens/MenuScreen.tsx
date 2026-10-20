import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNav, { NavTab } from '../components/BottomNav';
import WeekdayPicker from '../components/WeekdayPicker';
import { useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import {
  openSystemNotificationSettings,
  requestNotificationPermission,
  rescheduleNotifications,
} from '../notifications/reminders';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  NotificationSettings,
  saveNotificationSettings,
} from '../storage/notificationSettings';
import { ALL_WEEKDAYS, loadTrainingDays, saveTrainingDays } from '../storage/trainingSchedule';
import { formatClockTime } from '../storage/workoutStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PICKER_ITEM_HEIGHT = 44;

function formatReminderTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return formatClockTime(d.getTime());
}

export default function MenuScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('menu');
  const { t, locale, setLocale, languages } = useTranslation();
  const currentLanguage = languages.find(l => l.code === locale) ?? languages[0];
  const [pickerVisible, setPickerVisible] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [draftHour, setDraftHour] = useState(DEFAULT_NOTIFICATION_SETTINGS.reminderHour);
  const [draftMinute, setDraftMinute] = useState(DEFAULT_NOTIFICATION_SETTINGS.reminderMinute);

  const [trainingDays, setTrainingDays] = useState<number[]>(ALL_WEEKDAYS);

  useEffect(() => {
    loadNotificationSettings().then(setNotifSettings);
    loadTrainingDays().then(days => setTrainingDays(days ?? ALL_WEEKDAYS));
  }, []);

  const updateTrainingDays = async (days: number[]) => {
    setTrainingDays(days);
    await saveTrainingDays(days);
    rescheduleNotifications(t);
  };

  const updateNotifSettings = async (patch: Partial<NotificationSettings>) => {
    setNotifSettings(await saveNotificationSettings(patch));
    rescheduleNotifications(t);
  };

  const handleRemindersToggle = async (enabled: boolean) => {
    if (enabled && !(await requestNotificationPermission())) {
      Alert.alert(t('menu.notifBlockedTitle'), t('menu.notifBlockedBody'), [
        { text: t('menu.cancel'), style: 'cancel' },
        { text: t('menu.openSettings'), onPress: () => openSystemNotificationSettings() },
      ]);
      return;
    }
    updateNotifSettings({ remindersEnabled: enabled });
  };

  const openTimePicker = () => {
    setDraftHour(notifSettings.reminderHour);
    // Snap to the picker's 5-minute grid.
    setDraftMinute(Math.round(notifSettings.reminderMinute / 5) * 5 % 60);
    setTimePickerVisible(true);
  };

  const saveReminderTime = () => {
    setTimePickerVisible(false);
    updateNotifSettings({ reminderHour: draftHour, reminderMinute: draftMinute });
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (tab === 'browse') {
      navigation.navigate('WorkoutList');
      return;
    }
    if (tab === 'progress') {
      navigation.navigate('Stats');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.logoText}>
          PUNCH<Text style={styles.logoAccent}>FACTORY</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.pageTitle}>{t('menu.title')}</Text>
          <Text style={styles.pageSubtitle}>{t('menu.subtitle')}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('menu.preferences')}</Text>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.8}
          onPress={() => setPickerVisible(true)}>
          <Text style={styles.rowLabel}>{t('menu.language')}</Text>
          <View style={styles.rowValue}>
            <Text style={styles.rowValueText}>{currentLanguage.label}</Text>
            <View style={styles.chevron} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{t('menu.training')}</Text>
        <View style={[styles.group, styles.daysSection]}>
          <Text style={styles.rowLabel}>{t('menu.trainingDays')}</Text>
          <WeekdayPicker selected={trainingDays} onChange={updateTrainingDays} />
        </View>
        <Text style={styles.hint}>{t('menu.trainingDaysHint')}</Text>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{t('menu.notifications')}</Text>
        <View style={styles.group}>
          <View style={styles.groupRow}>
            <Text style={styles.rowLabel}>{t('menu.reminders')}</Text>
            <Switch
              value={notifSettings.remindersEnabled}
              onValueChange={handleRemindersToggle}
              trackColor={{ false: '#2A2A32', true: '#D42020' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#2A2A32"
            />
          </View>
          <View style={styles.groupDivider} />
          <TouchableOpacity
            style={[styles.groupRow, !notifSettings.remindersEnabled && styles.rowDisabled]}
            activeOpacity={0.8}
            disabled={!notifSettings.remindersEnabled}
            onPress={openTimePicker}>
            <Text style={styles.rowLabel}>{t('menu.reminderTime')}</Text>
            <View style={styles.rowValue}>
              <Text style={styles.rowValueText}>
                {formatReminderTime(notifSettings.reminderHour, notifSettings.reminderMinute)}
              </Text>
              <View style={styles.chevron} />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>{t('menu.remindersHint')}</Text>

        <View style={styles.scrollPad} />
      </ScrollView>

      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTimePickerVisible(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>{t('menu.reminderTime')}</Text>
            <Text style={styles.timePreview}>{formatReminderTime(draftHour, draftMinute)}</Text>
            <View style={styles.timeColumns}>
              {[
                { values: HOURS, selected: draftHour, onSelect: setDraftHour },
                { values: MINUTES, selected: draftMinute, onSelect: setDraftMinute },
              ].map((column, columnIndex) => (
                <ScrollView
                  key={columnIndex}
                  style={styles.timeColumn}
                  showsVerticalScrollIndicator={false}
                  contentOffset={{
                    x: 0,
                    y: Math.max(0, column.values.indexOf(column.selected) - 2) * PICKER_ITEM_HEIGHT,
                  }}>
                  {column.values.map(value => {
                    const isSelected = value === column.selected;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.timeItem, isSelected && styles.timeItemActive]}
                        activeOpacity={0.7}
                        onPress={() => column.onSelect(value)}>
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          {value.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ))}
            </View>
            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={saveReminderTime}>
              <Text style={styles.saveButtonText}>{t('menu.save')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>{t('menu.language')}</Text>
            {languages.map(item => {
              const isSelected = item.code === locale;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    setLocale(item.code);
                    setPickerVisible(false);
                  }}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <BottomNav active={activeTab} onPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141416',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C24',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  logoAccent: {
    color: '#D42020',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  scrollPad: { height: 16 },

  heroSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#8B8B9E',
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8B9E',
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  group: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  groupDivider: {
    height: 1,
    backgroundColor: '#141416',
    marginLeft: 16,
  },
  daysSection: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  hint: {
    fontSize: 12,
    color: '#8B8B9E',
    marginTop: 8,
    marginHorizontal: 4,
    lineHeight: 17,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
    color: '#FFFFFF',
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValueText: {
    fontSize: 14,
    color: '#8B8B9E',
  },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#8B8B9E',
    transform: [{ rotate: '-45deg' }],
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#141416',
  },
  optionText: {
    fontSize: 15,
    color: '#8B8B9E',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timePreview: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  timeColumns: {
    flexDirection: 'row',
    gap: 12,
    height: PICKER_ITEM_HEIGHT * 5,
  },
  timeColumn: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 12,
  },
  timeItem: {
    height: PICKER_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeItemActive: {
    backgroundColor: '#2A2A32',
    borderLeftWidth: 3,
    borderLeftColor: '#D42020',
  },
  saveButton: {
    backgroundColor: '#D42020',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  checkmark: {
    fontSize: 16,
    color: '#D42020',
    fontWeight: '700',
  },
});

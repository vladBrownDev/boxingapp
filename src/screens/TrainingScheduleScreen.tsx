import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import WeekdayPicker from '../components/WeekdayPicker';
import { useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { rescheduleNotifications } from '../notifications/reminders';
import { saveTrainingDays, SUGGESTED_TRAINING_DAYS } from '../storage/trainingSchedule';

type Props = NativeStackScreenProps<RootStackParamList, 'TrainingSchedule'>;

/** First-run step: asks which weekdays the user trains on. Streaks and reminders follow it. */
export default function TrainingScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [days, setDays] = useState<number[]>(SUGGESTED_TRAINING_DAYS);

  const handleContinue = async () => {
    await saveTrainingDays(days);
    rescheduleNotifications(t);
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.headline}>{t('schedule.headline')}</Text>
        <Text style={styles.description}>{t('schedule.description')}</Text>

        <View style={styles.card}>
          <WeekdayPicker selected={days} onChange={setDays} size={42} />
          <Text style={styles.count}>
            {t(days.length === 1 ? 'schedule.perWeek_one' : 'schedule.perWeek_other', {
              count: days.length,
            })}
          </Text>
        </View>

        <Text style={styles.hint}>{t('schedule.hint')}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleContinue}>
        <Text style={styles.primaryButtonText}>{t('schedule.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141416',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    color: '#8B8B9E',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#1C1C24',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#8B8B9E',
    lineHeight: 19,
    marginTop: 14,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#D42020',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

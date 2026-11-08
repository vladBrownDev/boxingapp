import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';
import { FIRST_WEEKDAY, WEEKDAYS_SHORT } from '../i18n/translations';
import { WorkoutSession } from '../storage/workoutStorage';
import { colors, radius, type } from '../theme';

interface Props {
  sessions: WorkoutSession[];
  trainingDays: number[];
  streak: number;
}

type DayState = 'trained' | 'planned' | 'missed' | 'rest';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The current calendar week against the training schedule, as its own section:
 * one bell per day, solid red where a round was trained, a red ring on a
 * training day still to come, a faded red ring on a training day that was
 * skipped, and nothing on a rest day.
 */
export default function WeekStrip({ sessions, trainingDays, streak }: Props) {
  const { t, locale } = useTranslation();

  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const offset = (today.getDay() - FIRST_WEEKDAY[locale] + 7) % 7;
    const weekStart = today.getTime() - offset * DAY_MS;

    const days = Array.from({ length: 7 }, (_, i) => {
      const start = weekStart + i * DAY_MS;
      const date = new Date(start);
      const daySessions = sessions.filter(
        s => s.timestamp >= start && s.timestamp < start + DAY_MS,
      );
      const isTrainingDay = trainingDays.includes(date.getDay());
      const isPast = start < today.getTime();
      const state: DayState =
        daySessions.length > 0
          ? 'trained'
          : !isTrainingDay
          ? 'rest'
          : isPast
          ? 'missed'
          : 'planned';
      return {
        weekday: date.getDay(),
        state,
        isToday: start === today.getTime(),
        isTrainingDay,
        daySessions,
      };
    });

    const weekSessions = days.flatMap(d => d.daySessions);
    return {
      days,
      planned: days.filter(d => d.isTrainingDay).length,
      done: days.filter(d => d.isTrainingDay && d.state === 'trained').length,
      minutes: Math.round(
        weekSessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
      ),
    };
  }, [sessions, trainingDays, locale]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('dashboard.statsTitle')}</Text>
        <Text style={styles.headerMeta}>
          {t('dashboard.weekMinutes', { minutes: week.minutes })}
          {streak > 0
            ? `  ·  ${t(
                streak === 1
                  ? 'dashboard.streak_one'
                  : 'dashboard.streak_other',
                { count: streak },
              )}`
            : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.days}>
          {week.days.map(day => (
            <View key={day.weekday} style={styles.day}>
              <View
                style={[
                  styles.bell,
                  day.state === 'trained' && styles.bellTrained,
                  day.state === 'planned' && styles.bellPlanned,
                  day.state === 'missed' && styles.bellMissed,
                ]}
              />
              <Text
                style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}
              >
                {WEEKDAYS_SHORT[locale][day.weekday]}
              </Text>
              <View
                style={[styles.todayMark, day.isToday && styles.todayMarkOn]}
              />
            </View>
          ))}
        </View>

        <Text style={styles.finding}>
          {t('dashboard.weekDone', { done: week.done, planned: week.planned })}
        </Text>
      </View>
    </View>
  );
}

const BELL = 30;

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    ...type.section,
  },
  headerMeta: {
    ...type.meta,
    flexShrink: 1,
    textAlign: 'right',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 6,
    minWidth: BELL + 6,
  },
  bell: {
    width: BELL,
    height: BELL,
    borderRadius: BELL / 2,
  },
  bellTrained: {
    backgroundColor: colors.red,
  },
  bellPlanned: {
    borderWidth: 2,
    borderColor: colors.red,
  },
  bellMissed: {
    borderWidth: 2,
    borderColor: colors.red,
    opacity: 0.35,
  },
  dayLabel: {
    fontSize: 12,
    color: colors.faint,
  },
  dayLabelToday: {
    color: colors.text,
    fontWeight: '600',
  },
  todayMark: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  todayMarkOn: {
    backgroundColor: colors.text,
  },
  finding: {
    fontSize: 14,
    color: colors.muted,
  },
});

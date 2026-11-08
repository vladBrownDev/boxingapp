import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNav, { NavTab } from '../components/BottomNav';
import { getPunchLabel } from '../data/punchNotation';
import { getWorkoutById, getWorkoutName } from '../data/workouts';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation/types';
import {
  filterSessionsByPeriod,
  formatSessionTime,
  getPeriodStats,
  getPunchBreakdown,
  getWorkoutBreakdown,
  StatsPeriod,
} from '../storage/workoutStorage';
import { colors, radius, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const PERIOD_OPTIONS: { key: StatsPeriod; labelKey: TranslationKey; rangeKey: TranslationKey }[] = [
  { key: 'day', labelKey: 'stats.period.day', rangeKey: 'stats.range.day' },
  { key: 'week', labelKey: 'stats.period.week', rangeKey: 'stats.range.week' },
  { key: 'month', labelKey: 'stats.period.month', rangeKey: 'stats.range.month' },
];

export default function StatsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('progress');
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const { t } = useTranslation();
  const { sessions, allTimeStats } = useWorkoutStats();

  const periodSessions = useMemo(
    () => filterSessionsByPeriod(sessions, period),
    [sessions, period],
  );
  const periodStats = useMemo(() => getPeriodStats(sessions, period), [sessions, period]);
  const workoutBreakdown = useMemo(() => getWorkoutBreakdown(periodSessions), [periodSessions]);
  const punchBreakdown = useMemo(() => getPunchBreakdown(periodSessions), [periodSessions]);
  const maxPunchRounds = Math.max(1, ...punchBreakdown.map(entry => entry.roundsUsed));
  const activePeriodOption = PERIOD_OPTIONS.find(option => option.key === period)!;
  const activeRangeLabel = t(activePeriodOption.rangeKey);

  const recentSessions = sessions.slice(0, 8);

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (tab === 'browse') {
      navigation.navigate('WorkoutList');
      return;
    }
    if (tab === 'menu') {
      navigation.navigate('Menu');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <Text style={styles.pageTitle} accessibilityRole="header">{t('stats.pageTitle')}</Text>
          <Text style={styles.pageSubtitle}>{t('stats.pageSubtitle')}</Text>
        </View>

        {/* Period Stats */}
        <View style={styles.section}>
          <View style={styles.periodSwitcher}>
            {PERIOD_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodOption,
                  period === option.key && styles.periodOptionActive,
                ]}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: period === option.key }}
                onPress={() => setPeriod(option.key)}>
                <Text
                  style={[
                    styles.periodOptionText,
                    period === option.key && styles.periodOptionTextActive,
                  ]}>
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statsRow}>
            {[
              { label: t('stats.sessions'), value: periodStats.sessions },
              { label: t('stats.minutes'), value: periodStats.minutes },
              { label: t('stats.rounds'), value: periodStats.rounds },
            ].map((stat, index) => (
              <View key={stat.label} style={[styles.statCell, index > 0 && styles.statCellRule]}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Workout Breakdown */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('stats.workoutBreakdownTitle', { range: activeRangeLabel })}
            </Text>
            {workoutBreakdown.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('stats.noWorkoutsPeriod')}</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {workoutBreakdown.map((entry, index) => {
                  const workout = getWorkoutById(entry.workoutId);
                  return (
                    <View key={entry.workoutId} style={[styles.listRow, index > 0 && styles.listRowRule]}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>
                          {workout ? getWorkoutName(t, workout) : entry.workoutName}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {t(
                            entry.sessions === 1 ? 'stats.sessionMinutes_one' : 'stats.sessionMinutes_other',
                            { count: entry.sessions, minutes: entry.minutes },
                          )}
                        </Text>
                      </View>
                      <Text style={styles.rowFigure}>{entry.sessions}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Punch Breakdown: least-trained first, the bar is rounds used against the most-used punch */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('stats.punchBreakdownTitle', { range: activeRangeLabel })}
            </Text>
            <View style={styles.listCard}>
              {punchBreakdown.map((entry, index) => (
                <View key={entry.code} style={[styles.punchRow, index > 0 && styles.listRowRule]}>
                  <View style={styles.punchLine}>
                    <Text style={styles.punchName}>{getPunchLabel(t, entry.code)}</Text>
                    <Text style={entry.roundsUsed === 0 ? styles.punchZero : styles.rowFigure}>
                      {entry.roundsUsed}
                    </Text>
                  </View>
                  <View style={styles.punchTrack}>
                    {entry.roundsUsed > 0 && (
                      <View
                        style={[styles.punchBar, { width: `${(entry.roundsUsed / maxPunchRounds) * 100}%` }]}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.recentSessionsTitle')}</Text>
          {recentSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('stats.noSessionsYet')}</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {recentSessions.map((session, index) => {
                const workout = getWorkoutById(session.workoutId);
                return (
                  <View key={session.id} style={[styles.listRow, index > 0 && styles.listRowRule]}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>
                        {workout ? getWorkoutName(t, workout) : session.workoutName}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {formatSessionTime(session.timestamp, t)} ·{' '}
                        {t(
                          session.roundsCompleted === 1 ? 'stats.sessionRounds_one' : 'stats.sessionRounds_other',
                          { count: session.roundsCompleted },
                        )}
                      </Text>
                    </View>
                    {!session.completed && (
                      <View style={styles.partialBadge}>
                        <Text style={styles.partialBadgeText}>{t('stats.partial')}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* All-Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.allTimeTitle')}</Text>
          <View style={styles.allTimeCard}>
            {[
              [
                { label: t('stats.totalSessions'), value: allTimeStats.totalSessions },
                { label: t('stats.totalMinutes'), value: allTimeStats.totalMinutes },
              ],
              [
                { label: t('stats.roundsThrown'), value: allTimeStats.totalRounds },
                { label: t('stats.dayStreak'), value: allTimeStats.currentStreak },
              ],
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.allTimeRow, rowIndex > 0 && styles.listRowRule]}>
                {row.map((stat, index) => (
                  <View key={stat.label} style={[styles.statCell, index > 0 && styles.statCellRule]}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.scrollPad} />
      </ScrollView>

      <BottomNav active={activeTab} onPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 3,
  },
  logoAccent: {
    color: colors.red,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  scrollPad: { height: 24 },

  // Hero
  heroSection: {
    paddingTop: 20,
    gap: 4,
  },
  pageTitle: {
    ...type.title,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.muted,
  },

  // Sections
  section: {
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    ...type.section,
  },

  // Period switcher: the selection is a lighter pill, not a colour
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.control + 2,
    padding: 4,
    gap: 4,
  },
  periodOption: {
    flex: 1,
    height: 36,
    borderRadius: radius.control - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOptionActive: {
    backgroundColor: colors.raised,
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.faint,
  },
  periodOptionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },

  // KPI strip: one surface split by hairlines, label over value
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  statCellRule: {
    borderLeftWidth: 1,
    borderLeftColor: colors.rule,
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // All-time: the same strip, two by two
  allTimeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
  },
  allTimeRow: {
    flexDirection: 'row',
  },

  // Lists: one surface, rows split by a hairline
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
  },
  listRow: {
    minHeight: 60,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listRowRule: {
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowMeta: {
    ...type.meta,
  },
  rowFigure: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },

  // Punch breakdown rows
  punchRow: {
    paddingVertical: 12,
    gap: 8,
  },
  punchLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  punchName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  punchZero: {
    fontSize: 15,
    color: colors.faint,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  punchTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.raised,
    overflow: 'hidden',
  },
  punchBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.red,
  },

  // Recent sessions
  partialBadge: {
    flex: 0,
    backgroundColor: colors.raised,
    borderRadius: radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  partialBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
});

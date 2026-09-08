import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNav, { NavTab } from '../components/BottomNav';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { RootStackParamList } from '../navigation/types';
import {
  filterSessionsByPeriod,
  formatSessionTime,
  getPeriodStats,
  getPunchBreakdown,
  getWorkoutBreakdown,
  StatsPeriod,
} from '../storage/workoutStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const PERIOD_OPTIONS: { key: StatsPeriod; label: string; rangeLabel: string }[] = [
  { key: 'day', label: 'Day', rangeLabel: 'TODAY' },
  { key: 'week', label: 'Week', rangeLabel: 'THIS WEEK' },
  { key: 'month', label: 'Month', rangeLabel: 'THIS MONTH' },
];

export default function StatsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('progress');
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const { sessions, allTimeStats } = useWorkoutStats();

  const periodSessions = useMemo(
    () => filterSessionsByPeriod(sessions, period),
    [sessions, period],
  );
  const periodStats = useMemo(() => getPeriodStats(sessions, period), [sessions, period]);
  const workoutBreakdown = useMemo(() => getWorkoutBreakdown(periodSessions), [periodSessions]);
  const punchBreakdown = useMemo(() => getPunchBreakdown(periodSessions), [periodSessions]);
  const activePeriodOption = PERIOD_OPTIONS.find(option => option.key === period)!;

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
          <Text style={styles.pageTitle}>Progress</Text>
          <Text style={styles.pageSubtitle}>Your training history at a glance</Text>
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
                onPress={() => setPeriod(option.key)}>
                <Text
                  style={[
                    styles.periodOptionText,
                    period === option.key && styles.periodOptionTextActive,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionTitle}>🗓️  {activePeriodOption.rangeLabel}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{periodStats.sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{periodStats.minutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{periodStats.rounds}</Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
          </View>
        </View>

        {/* Workout Breakdown */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📋  WORKOUT BREAKDOWN · {activePeriodOption.rangeLabel}
            </Text>
            {workoutBreakdown.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No workouts trained in this period.</Text>
              </View>
            ) : (
              workoutBreakdown.map(entry => (
                <View key={entry.workoutId} style={styles.breakdownCard}>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownName}>{entry.workoutName}</Text>
                    <Text style={styles.breakdownMeta}>
                      {entry.sessions} {entry.sessions === 1 ? 'session' : 'sessions'} · {entry.minutes} min
                    </Text>
                  </View>
                  <Text style={styles.breakdownCount}>{entry.sessions}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Punch Breakdown */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🥊  PUNCH BREAKDOWN · {activePeriodOption.rangeLabel}
            </Text>
            {punchBreakdown.map(entry => (
              <View key={entry.code} style={styles.breakdownCard}>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownName}>{entry.label}</Text>
                  <Text style={styles.breakdownMeta}>
                    {entry.roundsUsed === 0
                      ? 'Not trained in this period'
                      : `Used in ${entry.roundsUsed} ${entry.roundsUsed === 1 ? 'round' : 'rounds'}`}
                  </Text>
                </View>
                <Text style={styles.breakdownCount}>{entry.roundsUsed}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕒  RECENT SESSIONS</Text>
          {recentSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No sessions logged yet. Finish a workout to see it here.
              </Text>
            </View>
          ) : (
            recentSessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.workoutName}</Text>
                  <Text style={styles.sessionMeta}>
                    {formatSessionTime(session.timestamp)} · {session.roundsCompleted} rounds
                    {!session.completed ? ' · exited early' : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.completedBadge,
                    !session.completed && styles.incompleteBadge,
                  ]}>
                  <Text
                    style={[
                      styles.completedBadgeText,
                      !session.completed && styles.incompleteBadgeText,
                    ]}>
                    {session.completed ? 'Done' : 'Partial'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
        {/* All-Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆  ALL-TIME</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <Text style={styles.gridValue}>{allTimeStats.totalSessions}</Text>
              <Text style={styles.gridLabel}>Total Sessions</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridValue}>{allTimeStats.totalMinutes}</Text>
              <Text style={styles.gridLabel}>Total Minutes</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <Text style={styles.gridValue}>{allTimeStats.totalRounds}</Text>
              <Text style={styles.gridLabel}>Rounds Thrown</Text>
            </View>
            <View style={[styles.gridCard, styles.streakCard]}>
              <Text style={[styles.gridValue, styles.streakValue]}>
                {allTimeStats.currentStreak}🔥
              </Text>
              <Text style={styles.gridLabel}>Day Streak</Text>
            </View>
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
    backgroundColor: '#141416',
  },

  // Header
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

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  scrollPad: { height: 16 },

  // Hero
  heroSection: {
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#8B8B9E',
    fontWeight: '500',
  },

  // Sections
  section: {
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8B9E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Period switcher
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  periodOptionActive: {
    backgroundColor: '#D42020',
  },
  periodOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B8B9E',
  },
  periodOptionTextActive: {
    color: '#FFFFFF',
  },

  // Period stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2A2A34',
    marginVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#8B8B9E',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // All-time grid
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  gridValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gridLabel: {
    fontSize: 12,
    color: '#8B8B9E',
    fontWeight: '500',
    textAlign: 'center',
  },
  streakCard: {
    borderWidth: 1,
    borderColor: '#D42020',
  },
  streakValue: {
    color: '#E83535',
  },

  // Workout breakdown
  breakdownCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownInfo: {
    flex: 1,
    gap: 3,
  },
  breakdownName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breakdownMeta: {
    fontSize: 12,
    color: '#8B8B9E',
  },
  breakdownCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D42020',
    marginLeft: 12,
  },

  // Recent sessions
  sessionCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
    gap: 3,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionMeta: {
    fontSize: 12,
    color: '#8B8B9E',
  },
  completedBadge: {
    backgroundColor: '#0F2A18',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3DBE5C',
  },
  incompleteBadge: {
    backgroundColor: '#2A1010',
  },
  incompleteBadgeText: {
    color: '#E83535',
  },

  // Empty state
  emptyCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8B8B9E',
    textAlign: 'center',
    lineHeight: 18,
  },
});

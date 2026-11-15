import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNav, { NavTab } from '../components/BottomNav';
import HeartIcon from '../components/HeartIcon';
import WeekStrip from '../components/WeekStrip';
import { getPunchLabel } from '../data/punchNotation';
import { countRounds, getSuggestedWorkout, getWorkoutDurationMinutes, getWorkoutName, WORKOUTS } from '../data/workouts';
import { useCustomWorkouts } from '../hooks/useCustomWorkouts';
import { useFavorites } from '../hooks/useFavorites';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation/types';
import { formatSessionDate } from '../storage/workoutStorage';
import { colors, radius, type } from '../theme';

function getGreetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 17) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const { t, locale } = useTranslation();
  const greeting = t(useMemo(getGreetingKey, []));
  const { sessions, trainingDays, allTimeStats, punchBreakdown } = useWorkoutStats();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const customWorkouts = useCustomWorkouts();

  const suggested = useMemo(() => getSuggestedWorkout(punchBreakdown), [punchBreakdown]);

  const recentWorkouts = useMemo(
    () =>
      sessions.slice(0, 5).map(session => {
        const workout = [...WORKOUTS, ...customWorkouts].find(w => w.id === session.workoutId);
        return {
          session,
          workout,
          isFavorite: favoriteIds.includes(session.workoutId),
        };
      }),
    [sessions, favoriteIds, customWorkouts],
  );

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'browse') {
      navigation.navigate('WorkoutList');
      return;
    }
    if (tab === 'progress') {
      navigation.navigate('Stats');
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

        {/* Greeting + START CTA */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting} accessibilityRole="header">{greeting}</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('WorkoutList')}
            activeOpacity={0.85}>
            <Text style={styles.startButtonText}>{t('dashboard.startWorkout')}</Text>
          </TouchableOpacity>
        </View>

        {/* This week against the training schedule */}
        <View style={styles.section}>
          <WeekStrip
            sessions={sessions}
            trainingDays={trainingDays}
            streak={allTimeStats.currentStreak}
          />
        </View>

        {/* Suggested Workout */}
        {sessions.length > 0 && suggested && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dashboard.suggestedTitle')}</Text>
            <View style={styles.suggestedCard}>
              <View style={styles.suggestedTop}>
                <Text style={styles.suggestedName}>{getWorkoutName(t, suggested.workout)}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{t(`level.${suggested.workout.level}` as TranslationKey)}</Text>
                </View>
              </View>
              <Text style={styles.suggestedMeta}>
                {t('dashboard.suggestedMeta', {
                  minutes: getWorkoutDurationMinutes(suggested.workout),
                  rounds: countRounds(suggested.workout.segments),
                })}
              </Text>
              {suggested.focusPunchCodes.length > 0 && (
                <Text style={styles.suggestedFocus}>
                  {t('dashboard.suggestedFocus', {
                    punches: suggested.focusPunchCodes.map(code => getPunchLabel(t, code)).join(', '),
                  })}
                </Text>
              )}
              <TouchableOpacity
                style={styles.suggestedBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('WorkoutSetup', { workout: suggested.workout })}>
                <Text style={styles.suggestedBtnText}>{t('dashboard.start')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentTitle')}</Text>
          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('dashboard.emptyRecent')}</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {recentWorkouts.map(({ session, workout, isFavorite }, index) => (
                <View key={session.id} style={[styles.workoutRow, index > 0 && styles.workoutRowRule]}>
                  <TouchableOpacity
                    style={styles.workoutInfo}
                    activeOpacity={0.7}
                    disabled={!workout}
                    onPress={() => workout && navigation.navigate('WorkoutSetup', { workout })}>
                    <Text style={styles.workoutName}>
                      {workout ? getWorkoutName(t, workout) : session.workoutName}
                    </Text>
                    <Text style={styles.workoutMeta}>
                      {workout
                        ? t('dashboard.workoutMeta', {
                          minutes: getWorkoutDurationMinutes(workout),
                          rounds: countRounds(workout.segments),
                        })
                        : t(
                          session.roundsCompleted === 1
                            ? 'dashboard.roundsFallback_one'
                            : 'dashboard.roundsFallback_other',
                          { count: session.roundsCompleted },
                        )}
                      {'  ·  '}
                      {formatSessionDate(session.timestamp, locale)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => toggleFavorite(session.workoutId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isFavorite }}
                    activeOpacity={0.7}>
                    <HeartIcon filled={isFavorite} color={isFavorite ? colors.red : colors.faint} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Premium Banner */}
        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.85}>
          <View style={styles.premiumLeft}>
            <Text style={styles.premiumTitle}>{t('dashboard.premiumTitle')}</Text>
            <Text style={styles.premiumDesc}>{t('dashboard.premiumDesc')}</Text>
          </View>
          <View style={styles.chevron} />
        </TouchableOpacity>

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
    gap: 16,
  },
  greeting: {
    ...type.title,
  },
  startButton: {
    backgroundColor: colors.red,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },

  // Sections
  section: {
    marginTop: 32,
    gap: 12,
  },
  sectionTitle: {
    ...type.section,
  },

  // Suggested workout
  suggestedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 8,
  },
  suggestedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  suggestedName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  levelBadge: {
    flex: 0,
    backgroundColor: colors.raised,
    borderRadius: radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  suggestedMeta: {
    ...type.meta,
  },
  suggestedFocus: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  suggestedBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: colors.inverse,
    borderRadius: 18,
  },
  suggestedBtnText: {
    color: colors.inverseText,
    fontSize: 14,
    fontWeight: '600',
  },

  // Recent workouts: one surface, rows split by a hairline
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
  },
  workoutRow: {
    minHeight: 64,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutRowRule: {
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  workoutInfo: {
    flex: 1,
    gap: 4,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  workoutMeta: {
    ...type.meta,
  },
  heartButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
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

  // Premium banner
  premiumBanner: {
    marginTop: 32,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  premiumLeft: {
    flex: 1,
    gap: 4,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  premiumDesc: {
    ...type.meta,
  },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.faint,
    transform: [{ rotate: '-45deg' }],
  },
});

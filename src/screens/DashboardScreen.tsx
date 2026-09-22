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
import { getSuggestedWorkout, getWorkoutDurationMinutes, WORKOUTS } from '../data/workouts';
import { useFavorites } from '../hooks/useFavorites';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation/types';
import { formatSessionDate } from '../storage/workoutStorage';

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
  const { sessions, weekStats, punchBreakdown } = useWorkoutStats();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const suggested = useMemo(() => getSuggestedWorkout(punchBreakdown), [punchBreakdown]);

  const recentWorkouts = useMemo(
    () =>
      sessions.slice(0, 5).map(session => {
        const workout = WORKOUTS.find(w => w.id === session.workoutId);
        return {
          session,
          workout,
          isFavorite: favoriteIds.includes(session.workoutId),
        };
      }),
    [sessions, favoriteIds],
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
          <Text style={styles.greeting}>{greeting}</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('WorkoutList')}
            activeOpacity={0.85}>
            <View style={styles.startButtonInner}>
              <Text style={styles.startButtonIcon}>▶</Text>
              <Text style={styles.startButtonText}>{t('dashboard.startWorkout')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* This Week's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊  {t('dashboard.statsTitle')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weekStats.sessions}</Text>
              <Text style={styles.statLabel}>{t('dashboard.sessions')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weekStats.minutes}</Text>
              <Text style={styles.statLabel}>{t('dashboard.minutes')}</Text>
            </View>
          </View>
        </View>

        {/* Suggested Workout */}
        {sessions.length > 0 && suggested && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯  {t('dashboard.suggestedTitle')}</Text>
            <View style={styles.suggestedCard}>
              <View style={styles.suggestedTop}>
                <Text style={styles.suggestedName}>{suggested.workout.name}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{t(`level.${suggested.workout.level}` as TranslationKey)}</Text>
                </View>
              </View>
              <Text style={styles.suggestedMeta}>
                {t('dashboard.suggestedMeta', {
                  minutes: getWorkoutDurationMinutes(suggested.workout),
                  rounds: suggested.workout.rounds,
                })}
              </Text>
              {suggested.focusPunchLabels.length > 0 && (
                <Text style={styles.suggestedFocus}>
                  {t('dashboard.suggestedFocus', { punches: suggested.focusPunchLabels.join(', ') })}
                </Text>
              )}
              <TouchableOpacity
                style={styles.suggestedBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('WorkoutSetup', { workout: suggested.workout })}>
                <Text style={styles.suggestedBtnText}>▶  {t('dashboard.start')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋  {t('dashboard.recentTitle')}</Text>
          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('dashboard.emptyRecent')}</Text>
            </View>
          ) : (
            recentWorkouts.map(({ session, workout, isFavorite }) => (
              <View key={session.id} style={styles.workoutCard}>
                <TouchableOpacity
                  style={styles.workoutInfo}
                  activeOpacity={0.7}
                  disabled={!workout}
                  onPress={() => workout && navigation.navigate('WorkoutSetup', { workout })}>
                  <Text style={styles.workoutName}>{session.workoutName}</Text>
                  <Text style={styles.workoutMeta}>
                    {workout
                      ? t('dashboard.workoutMeta', {
                          minutes: getWorkoutDurationMinutes(workout),
                          rounds: workout.rounds,
                        })
                      : t(
                          session.roundsCompleted === 1
                            ? 'dashboard.roundsFallback_one'
                            : 'dashboard.roundsFallback_other',
                          { count: session.roundsCompleted },
                        )}
                  </Text>
                  <Text style={styles.workoutLast}>{formatSessionDate(session.timestamp, locale)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleFavorite(session.workoutId)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}>
                  <Text style={styles.heartIcon}>
                    {isFavorite ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Premium Banner */}
        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.85}>
          <View style={styles.premiumLeft}>
            <Text style={styles.premiumCrown}>👑</Text>
            <View>
              <Text style={styles.premiumTitle}>{t('dashboard.premiumTitle')}</Text>
              <Text style={styles.premiumDesc}>{t('dashboard.premiumDesc')}</Text>
            </View>
          </View>
          <Text style={styles.premiumArrow}>›</Text>
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
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  scrollPad: { height: 16 },

  // Hero
  heroSection: {
    paddingTop: 24,
    paddingBottom: 8,
    gap: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#8B8B9E',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#D42020',
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#D42020',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
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

  // Stats
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
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B8B9E',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Suggested workout
  suggestedCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#D42020',
    gap: 10,
  },
  suggestedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: '#2A1010',
    borderWidth: 1,
    borderColor: '#D42020',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    color: '#D42020',
    fontSize: 11,
    fontWeight: '600',
  },
  suggestedMeta: {
    fontSize: 13,
    color: '#8B8B9E',
  },
  suggestedFocus: {
    fontSize: 13,
    color: '#8B8B9E',
    lineHeight: 18,
  },
  suggestedBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#D42020',
    borderRadius: 8,
  },
  suggestedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Workout cards
  workoutCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutInfo: {
    flex: 1,
    gap: 3,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workoutMeta: {
    fontSize: 13,
    color: '#8B8B9E',
  },
  workoutLast: {
    fontSize: 12,
    color: '#555566',
  },
  heartIcon: {
    fontSize: 22,
    marginLeft: 12,
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

  // Premium banner
  premiumBanner: {
    marginTop: 28,
    backgroundColor: '#1A0A00',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A1A00',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  premiumCrown: {
    fontSize: 28,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFB347',
    marginBottom: 2,
  },
  premiumDesc: {
    fontSize: 12,
    color: '#8B6A3E',
  },
  premiumArrow: {
    fontSize: 24,
    color: '#FFB347',
    fontWeight: '300',
  },
});

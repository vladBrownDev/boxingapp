import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav, { NavTab } from '../components/BottomNav';
import { useWorkoutStats } from '../hooks/useWorkoutStats';

interface WorkoutItem {
  id: string;
  name: string;
  duration: number;
  rounds: number;
  lastSession: string;
  isFavorite: boolean;
}

const FEATURED_COMBO = {
  name: '1-2-Cross',
  level: 'Intermediate',
  description: 'Classic jab-cross combination. Perfect for building hand speed and timing.',
};

const INITIAL_WORKOUTS: WorkoutItem[] = [
  { id: '1', name: 'Beginner Box', duration: 3, rounds: 12, lastSession: '2 days ago', isFavorite: true },
  { id: '2', name: 'HIIT Combos', duration: 5, rounds: 8, lastSession: 'Today at 7am', isFavorite: true },
  { id: '3', name: 'Jab-Cross-Hook', duration: 3, rounds: 10, lastSession: 'Yesterday', isFavorite: false },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 17) return 'Good afternoon!';
  return 'Ready for evening training?';
}

interface Props {
  onStartWorkout: () => void;
}

export default function DashboardScreen({ onStartWorkout }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [workouts, setWorkouts] = useState<WorkoutItem[]>(INITIAL_WORKOUTS);
  const greeting = useMemo(getGreeting, []);
  const { todayStats } = useWorkoutStats();

  const toggleFavorite = (id: string) => {
    setWorkouts(prev =>
      prev.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w),
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.logoText}>
          PUNCH<Text style={styles.logoAccent}>FACTORY</Text>
        </Text>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
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
            onPress={onStartWorkout}
            activeOpacity={0.85}>
            <View style={styles.startButtonInner}>
              <Text style={styles.startButtonIcon}>▶</Text>
              <Text style={styles.startButtonText}>START WORKOUT</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊  TODAY'S STATS</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{todayStats.sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{todayStats.minutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Featured Combo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐  FEATURED COMBO</Text>
          <View style={styles.featuredCard}>
            <View style={styles.featuredTop}>
              <Text style={styles.featuredName}>{FEATURED_COMBO.name}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{FEATURED_COMBO.level}</Text>
              </View>
            </View>
            <Text style={styles.featuredDesc}>{FEATURED_COMBO.description}</Text>
            <TouchableOpacity style={styles.tryNowBtn} activeOpacity={0.8}>
              <Text style={styles.tryNowText}>▶  Try Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋  YOUR WORKOUTS</Text>
          {workouts.map(workout => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutMeta}>
                  {workout.duration} min × {workout.rounds} rounds
                </Text>
                <Text style={styles.workoutLast}>Last: {workout.lastSession}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(workout.id)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}>
                <Text style={styles.heartIcon}>
                  {workout.isFavorite ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Premium Banner */}
        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.85}>
          <View style={styles.premiumLeft}>
            <Text style={styles.premiumCrown}>👑</Text>
            <View>
              <Text style={styles.premiumTitle}>Unlock Premium</Text>
              <Text style={styles.premiumDesc}>
                100+ combos · Advanced stats · Custom builder
              </Text>
            </View>
          </View>
          <Text style={styles.premiumArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.scrollPad} />
      </ScrollView>

      <BottomNav active={activeTab} onPress={setActiveTab} />
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

  // Featured combo
  featuredCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#D42020',
    gap: 10,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredName: {
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
  featuredDesc: {
    fontSize: 14,
    color: '#8B8B9E',
    lineHeight: 20,
  },
  tryNowBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#D42020',
    borderRadius: 8,
  },
  tryNowText: {
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

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWorkoutCombos, Workout, WORKOUTS } from '../data/workouts';

interface Props {
  onSelectWorkout: (workout: Workout) => void;
  onBack: () => void;
}

const LEVEL_COLORS: Record<Workout['level'], string> = {
  Beginner: '#3DBE5C',
  Intermediate: '#E8A735',
  Advanced: '#E83535',
};

function formatMinutes(workout: Workout): string {
  const totalSeconds =
    workout.rounds * workout.workSeconds + (workout.rounds - 1) * workout.restSeconds;
  return `${Math.round(totalSeconds / 60)} min`;
}

export default function WorkoutListScreen({ onSelectWorkout, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workouts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {WORKOUTS.map(workout => {
          const combos = getWorkoutCombos(workout);
          return (
            <TouchableOpacity
              key={workout.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onSelectWorkout(workout)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{workout.name}</Text>
                <View
                  style={[
                    styles.levelBadge,
                    { borderColor: LEVEL_COLORS[workout.level] },
                  ]}>
                  <Text style={[styles.levelText, { color: LEVEL_COLORS[workout.level] }]}>
                    {workout.level}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {workout.rounds} rounds · {formatMinutes(workout)}
              </Text>
              <Text style={styles.cardCombos} numberOfLines={1}>
                {combos.map(c => c.name).join(' · ')}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.scrollPad} />
      </ScrollView>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C24',
  },
  backArrow: {
    fontSize: 32,
    color: '#FFFFFF',
    width: 40,
    textAlign: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },
  scrollPad: { height: 16 },
  card: {
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 13,
    color: '#8B8B9E',
  },
  cardCombos: {
    fontSize: 12,
    color: '#555566',
  },
});

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getComboName } from '../data/combos';
import { describeMove } from '../data/punchNotation';
import { getWorkoutCombos, getWorkoutName } from '../data/workouts';
import { useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';

export interface WorkoutRunConfig {
  workSeconds: number;
  restSeconds: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSetup'>;

const WORK_STEP = 10;
const WORK_MIN = 30;
const WORK_MAX = 300;

const REST_STEP = 10;
const REST_MIN = 10;
const REST_MAX = 120;

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function WorkoutSetupScreen({ navigation, route }: Props) {
  const { workout } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [workSeconds, setWorkSeconds] = useState(workout.workSeconds);
  const [restSeconds, setRestSeconds] = useState(workout.restSeconds);
  const combos = getWorkoutCombos(workout);

  const totalSeconds = workout.rounds * workSeconds + (workout.rounds - 1) * restSeconds;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getWorkoutName(t, workout)}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {t('workoutSetup.summary', { rounds: workout.rounds, duration: formatDuration(totalSeconds) })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workoutSetup.roundDuration')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.7}
              onPress={() => setWorkSeconds(v => clamp(v - WORK_STEP, WORK_MIN, WORK_MAX))}>
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formatDuration(workSeconds)}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.7}
              onPress={() => setWorkSeconds(v => clamp(v + WORK_STEP, WORK_MIN, WORK_MAX))}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workoutSetup.restDuration')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.7}
              onPress={() => setRestSeconds(v => clamp(v - REST_STEP, REST_MIN, REST_MAX))}>
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formatDuration(restSeconds)}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.7}
              onPress={() => setRestSeconds(v => clamp(v + REST_STEP, REST_MIN, REST_MAX))}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workoutSetup.combosTitle')}</Text>
          {combos.map(combo => (
            <View key={combo.id} style={styles.comboCard}>
              <Text style={styles.comboName}>{getComboName(t, combo)}</Text>
              <Text style={styles.comboSequence}>
                {combo.sequence.map(step => describeMove(t, step)).join('  •  ')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.scrollPad} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('WorkoutPlayer', {
              workout,
              config: { workSeconds, restSeconds },
            })
          }>
          <Text style={styles.startButtonText}>{t('workoutSetup.startWorkout')}</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: { padding: 20 },
  scrollPad: { height: 16 },
  summaryRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#8B8B9E',
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8B9E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 24,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 90,
    textAlign: 'center',
  },
  comboCard: {
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  comboName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  comboSequence: {
    fontSize: 13,
    color: '#E83535',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
  },
  startButton: {
    backgroundColor: '#D42020',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

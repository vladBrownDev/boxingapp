import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getComboName } from '../data/combos';
import { describeMove } from '../data/punchNotation';
import {
  countRounds,
  getSegmentsTotalSeconds,
  getWorkoutCombos,
  getWorkoutName,
  WorkoutSegment,
} from '../data/workouts';
import { useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, type } from '../theme';

export interface WorkoutRunConfig {
  /** The workout's segments with the user's duration adjustments applied. */
  segments: WorkoutSegment[];
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

/** Shifts every combo / rest segment by the stepper offsets, so workouts whose segments
 * have different lengths keep their shape while getting longer or shorter overall. */
function adjustSegments(
  segments: WorkoutSegment[],
  workDelta: number,
  restDelta: number,
): WorkoutSegment[] {
  return segments.map(segment =>
    segment.type === 'combo'
      ? { ...segment, seconds: clamp(segment.seconds + workDelta, WORK_MIN, WORK_MAX) }
      : { ...segment, seconds: clamp(segment.seconds + restDelta, REST_MIN, REST_MAX) },
  );
}

export default function WorkoutSetupScreen({ navigation, route }: Props) {
  const { workout } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [workDelta, setWorkDelta] = useState(0);
  const [restDelta, setRestDelta] = useState(0);
  const combos = getWorkoutCombos(workout);

  const segments = useMemo(
    () => adjustSegments(workout.segments, workDelta, restDelta),
    [workout.segments, workDelta, restDelta],
  );
  // The steppers show (and step) the first segment of each type; the same offset is
  // applied to every other segment of that type.
  const firstWork = workout.segments.find(s => s.type === 'combo');
  const firstRest = workout.segments.find(s => s.type === 'rest');
  const stepWork = (dir: 1 | -1) => {
    if (firstWork) {
      setWorkDelta(d => clamp(firstWork.seconds + d + dir * WORK_STEP, WORK_MIN, WORK_MAX) - firstWork.seconds);
    }
  };
  const stepRest = (dir: 1 | -1) => {
    if (firstRest) {
      setRestDelta(d => clamp(firstRest.seconds + d + dir * REST_STEP, REST_MIN, REST_MAX) - firstRest.seconds);
    }
  };
  const workSeconds = segments.find(s => s.type === 'combo')?.seconds ?? 0;
  const restSeconds = segments.find(s => s.type === 'rest')?.seconds ?? 0;

  const rounds = countRounds(segments);
  const totalSeconds = getSegmentsTotalSeconds(segments);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>{getWorkoutName(t, workout)}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {t('workoutSetup.summary', { rounds, duration: formatDuration(totalSeconds) })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workoutSetup.roundDuration')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.7}
              onPress={() => stepWork(-1)}>
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formatDuration(workSeconds)}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.7}
              onPress={() => stepWork(1)}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {firstRest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('workoutSetup.restDuration')}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => stepRest(-1)}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{formatDuration(restSeconds)}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => stepRest(1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workoutSetup.combosTitle')}</Text>
          {combos.map(combo => (
            <View key={combo.id} style={styles.comboCard}>
              <Text style={styles.comboName}>{getComboName(t, combo)}</Text>
              <Text style={styles.comboSequence}>
                {combo.sequence.map(step => describeMove(t, step)).join('  ·  ')}
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
              config: { segments },
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
    backgroundColor: colors.ground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  backArrow: {
    fontSize: 32,
    color: colors.text,
    width: 40,
    textAlign: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    ...type.section,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 12,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '500',
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
    minWidth: 100,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  comboCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 6,
  },
  comboName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  comboSequence: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  startButton: {
    backgroundColor: colors.red,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});

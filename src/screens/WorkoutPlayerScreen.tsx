import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Combo } from '../data/combos';
import { describeMove } from '../data/punchNotation';
import { getWorkoutCombos, Workout } from '../data/workouts';
import { RootStackParamList } from '../navigation/types';
import { addSession, WorkoutSession } from '../storage/workoutStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutPlayer'>;

type Phase = 'work' | 'rest' | 'done';

interface PlayerState {
  phase: Phase;
  roundIndex: number;
  secondsLeft: number;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Builds the session record for whatever progress has been made so far, whether the
 * workout finished normally or the player exited mid-round. */
function buildSession(
  workout: Workout,
  combos: Combo[],
  workSeconds: number,
  restSeconds: number,
  state: PlayerState,
): WorkoutSession {
  const roundsCompleted =
    state.phase === 'done'
      ? workout.rounds
      : state.phase === 'work'
      ? state.roundIndex
      : state.roundIndex + 1;

  let activeDuration = state.roundIndex * (workSeconds + restSeconds);
  if (state.phase === 'work') {
    activeDuration += workSeconds - state.secondsLeft;
  } else if (state.phase === 'rest') {
    activeDuration += workSeconds + (restSeconds - state.secondsLeft);
  } else {
    activeDuration = workout.rounds * workSeconds + (workout.rounds - 1) * restSeconds;
  }

  const comboIds = Array.from(
    { length: roundsCompleted },
    (_, i) => combos[i % combos.length].id,
  );

  return {
    id: String(Date.now()),
    timestamp: Date.now(),
    workoutId: workout.id,
    workoutName: workout.name,
    level: workout.level,
    rounds: workout.rounds,
    roundsCompleted,
    workTime: workSeconds,
    restTime: restSeconds,
    totalDuration: workout.rounds * workSeconds + (workout.rounds - 1) * restSeconds,
    activeDuration,
    comboIds,
    completed: state.phase === 'done',
  };
}

export default function WorkoutPlayerScreen({ navigation, route }: Props) {
  const { workout, config } = route.params;
  const insets = useSafeAreaInsets();
  const combos = useMemo(() => getWorkoutCombos(workout), [workout]);
  const { workSeconds, restSeconds } = config;

  const [state, setState] = useState<PlayerState>({
    phase: 'work',
    roundIndex: 0,
    secondsLeft: workSeconds,
  });
  const [isPaused, setIsPaused] = useState(false);
  const hasLoggedRef = useRef(false);

  const logSession = useCallback(
    (current: PlayerState) => {
      if (hasLoggedRef.current) {
        return;
      }
      hasLoggedRef.current = true;
      addSession(buildSession(workout, combos, workSeconds, restSeconds, current));
    },
    [workout, combos, workSeconds, restSeconds],
  );

  const exitToDashboard = () => {
    logSession(state);
    navigation.popToTop();
  };

  useEffect(() => {
    if (isPaused || state.phase === 'done') {
      return;
    }
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.phase === 'done') {
          return prev;
        }
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        if (prev.phase === 'work') {
          if (prev.roundIndex >= workout.rounds - 1) {
            return { phase: 'done', roundIndex: prev.roundIndex, secondsLeft: 0 };
          }
          return { phase: 'rest', roundIndex: prev.roundIndex, secondsLeft: restSeconds };
        }
        return { phase: 'work', roundIndex: prev.roundIndex + 1, secondsLeft: workSeconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, state.phase, workSeconds, restSeconds, workout.rounds]);

  useEffect(() => {
    if (state.phase === 'done') {
      logSession(state);
    }
  }, [state, logSession]);

  if (state.phase === 'done') {
    return (
      <View style={[styles.container, styles.doneContainer]}>
        <Text style={styles.doneTitle}>Workout Complete!</Text>
        <Text style={styles.doneSubtitle}>
          {workout.rounds} rounds · {workout.name}
        </Text>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={exitToDashboard}>
          <Text style={styles.primaryButtonText}>DONE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeComboIndex =
    state.phase === 'work' ? state.roundIndex : state.roundIndex + 1;
  const activeCombo = combos[activeComboIndex % combos.length];
  const isWork = state.phase === 'work';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={exitToDashboard} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.roundIndicator}>
          Round {state.roundIndex + 1} / {workout.rounds}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.timerSection}>
        <Text style={[styles.phaseLabel, isWork ? styles.phaseLabelWork : styles.phaseLabelRest]}>
          {isWork ? 'WORK' : 'REST'}
        </Text>
        <Text style={styles.timerText}>{formatTime(state.secondsLeft)}</Text>
      </View>

      <View style={styles.comboSection}>
        <Text style={styles.comboSectionLabel}>
          {isWork ? 'CURRENT COMBO' : 'NEXT UP'}
        </Text>
        <Text style={styles.comboName}>{activeCombo.name}</Text>
        <View style={styles.chipsRow}>
          {activeCombo.sequence.map((step, index) => (
            <View key={`${step}-${index}`} style={styles.chip}>
              <Text style={styles.chipCode}>{step}</Text>
              <Text style={styles.chipLabel}>{describeMove(step)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.pauseButton}
          activeOpacity={0.85}
          onPress={() => setIsPaused(p => !p)}>
          <Text style={styles.pauseButtonText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C24',
  },
  exitText: {
    fontSize: 15,
    color: '#8B8B9E',
    fontWeight: '600',
    width: 60,
  },
  roundIndicator: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  timerSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  phaseLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 12,
  },
  phaseLabelWork: {
    color: '#D42020',
  },
  phaseLabelRest: {
    color: '#8B8B9E',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  comboSection: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 12,
  },
  comboSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8B9E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  comboName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  chip: {
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 72,
  },
  chipCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E83535',
  },
  chipLabel: {
    fontSize: 10,
    color: '#8B8B9E',
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  pauseButton: {
    backgroundColor: '#2A2A32',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  doneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: 15,
    color: '#8B8B9E',
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#D42020',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

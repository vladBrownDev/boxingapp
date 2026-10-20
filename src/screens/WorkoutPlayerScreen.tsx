import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { playBell } from '../audio/bell';
import NotificationPrompt from '../components/NotificationPrompt';
import PunchIllustration from '../components/PunchIllustration';
import { Combo, getComboName } from '../data/combos';
import { describeMove, getStepPunch } from '../data/punchNotation';
import { getWorkoutCombos, getWorkoutName, Workout } from '../data/workouts';
import { TFunction, useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { requestNotificationPermission, rescheduleNotifications } from '../notifications/reminders';
import { loadNotificationSettings, saveNotificationSettings } from '../storage/notificationSettings';
import { addSession, WorkoutSession } from '../storage/workoutStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutPlayer'>;

type Phase = 'ready' | 'work' | 'rest' | 'done';

interface PlayerState {
  phase: Phase;
  roundIndex: number;
  secondsLeft: number;
}

/** Countdown before round 1 so the user has time to put their gloves on. */
const PREP_SECONDS = 10;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Builds the session record for whatever progress has been made so far, whether the
 * workout finished normally or the player exited mid-round. */
function buildSession(
  t: TFunction,
  workout: Workout,
  combos: Combo[],
  workSeconds: number,
  restSeconds: number,
  state: PlayerState,
): WorkoutSession {
  const roundsCompleted =
    state.phase === 'done'
      ? workout.rounds
      : state.phase === 'ready'
      ? 0
      : state.phase === 'work'
      ? state.roundIndex
      : state.roundIndex + 1;

  let activeDuration = state.roundIndex * (workSeconds + restSeconds);
  if (state.phase === 'work') {
    activeDuration += workSeconds - state.secondsLeft;
  } else if (state.phase === 'rest') {
    activeDuration += workSeconds + (restSeconds - state.secondsLeft);
  } else if (state.phase === 'done') {
    activeDuration = workout.rounds * workSeconds + (workout.rounds - 1) * restSeconds;
  } else {
    activeDuration = 0;
  }

  const comboIds = Array.from(
    { length: roundsCompleted },
    (_, i) => combos[i % combos.length].id,
  );

  return {
    id: String(Date.now()),
    timestamp: Date.now(),
    workoutId: workout.id,
    workoutName: getWorkoutName(t, workout),
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
  const { t } = useTranslation();
  const combos = useMemo(() => getWorkoutCombos(workout), [workout]);
  const { workSeconds, restSeconds } = config;

  const [state, setState] = useState<PlayerState>({
    phase: 'ready',
    roundIndex: 0,
    secondsLeft: PREP_SECONDS,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const hasLoggedRef = useRef(false);

  const logSession = useCallback(
    (current: PlayerState) => {
      if (hasLoggedRef.current) {
        return;
      }
      hasLoggedRef.current = true;
      addSession(buildSession(t, workout, combos, workSeconds, restSeconds, current)).then(() =>
        rescheduleNotifications(t),
      );
    },
    [t, workout, combos, workSeconds, restSeconds],
  );

  const exitToDashboard = () => {
    logSession(state);
    navigation.popToTop();
  };

  useEffect(() => {
    // Every phase change past the initial prep countdown is a work-boundary:
    // entering 'work' is a round start, leaving it (into 'rest' or 'done') is
    // a round end. Skip the mount into 'ready' — that's just prep starting.
    if (state.phase !== 'ready') {
      playBell();
    }
  }, [state.phase]);

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
        if (prev.phase === 'ready') {
          return { phase: 'work', roundIndex: 0, secondsLeft: workSeconds };
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

  // Keep the screen on while the timer is running; let it sleep again once paused or finished.
  const isActive = !isPaused && state.phase !== 'done';
  useEffect(() => {
    if (!isActive) {
      return;
    }
    activateKeepAwake();
    return deactivateKeepAwake;
  }, [isActive]);

  useEffect(() => {
    if (state.phase === 'done') {
      logSession(state);
    }
  }, [state, logSession]);

  // Ask about reminders right after a finished workout, until the prompt has been answered once.
  const isDone = state.phase === 'done';
  useEffect(() => {
    if (!isDone) {
      return;
    }
    loadNotificationSettings().then(settings => {
      if (!settings.promptSeen && !settings.remindersEnabled) {
        setShowNotificationPrompt(true);
      }
    });
  }, [isDone]);

  const handleAllowNotifications = async () => {
    setShowNotificationPrompt(false);
    const granted = await requestNotificationPermission();
    await saveNotificationSettings({ promptSeen: true, remindersEnabled: granted });
    rescheduleNotifications(t);
  };

  const handleSkipNotifications = () => {
    setShowNotificationPrompt(false);
    saveNotificationSettings({ promptSeen: true });
  };

  if (state.phase === 'done') {
    return (
      <View style={[styles.container, styles.doneContainer]}>
        <Text style={styles.doneTitle}>{t('player.doneTitle')}</Text>
        <Text style={styles.doneSubtitle}>
          {t('player.doneSubtitle', { rounds: workout.rounds, name: getWorkoutName(t, workout) })}
        </Text>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={exitToDashboard}>
          <Text style={styles.primaryButtonText}>{t('player.doneBtn')}</Text>
        </TouchableOpacity>
        <NotificationPrompt
          visible={showNotificationPrompt}
          onAllow={handleAllowNotifications}
          onSkip={handleSkipNotifications}
        />
      </View>
    );
  }

  const activeComboIndex =
    state.phase === 'work' ? state.roundIndex : state.phase === 'ready' ? 0 : state.roundIndex + 1;
  const activeCombo = combos[activeComboIndex % combos.length];
  const isWork = state.phase === 'work';
  const phaseLabelKey = state.phase === 'work' ? 'player.work' : state.phase === 'ready' ? 'player.ready' : 'player.rest';
  const phaseLabelStyle =
    state.phase === 'work' ? styles.phaseLabelWork : state.phase === 'ready' ? styles.phaseLabelReady : styles.phaseLabelRest;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={exitToDashboard} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.exitText}>{t('player.exit')}</Text>
        </TouchableOpacity>
        <Text style={styles.roundIndicator}>
          {t('player.round', { current: state.roundIndex + 1, total: workout.rounds })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.timerSection}>
        <Text style={[styles.phaseLabel, phaseLabelStyle]}>{t(phaseLabelKey)}</Text>
        <Text style={styles.timerText}>{formatTime(state.secondsLeft)}</Text>
        {state.phase === 'ready' && (
          <Text style={styles.readyHint}>{t('player.readyHint')}</Text>
        )}
      </View>

      <View style={styles.comboSection}>
        <Text style={styles.comboSectionLabel}>
          {isWork ? t('player.currentCombo') : t('player.nextUp')}
        </Text>
        <Text style={styles.comboName}>{getComboName(t, activeCombo)}</Text>
        <View style={styles.chipsRow}>
          {activeCombo.sequence.map((step, index) => {
            const punch = getStepPunch(step);
            return (
              <View key={`${step}-${index}`} style={styles.chip}>
                <View style={styles.chipBadge}>
                  <Text style={styles.chipBadgeText}>{index + 1}</Text>
                </View>
                {punch ? <PunchIllustration punch={punch} size={108} /> : <View style={styles.chipArtEmpty} />}
                <Text style={styles.chipLabel} numberOfLines={2}>
                  {describeMove(t, step)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.pauseButton}
          activeOpacity={0.85}
          onPress={() => setIsPaused(p => !p)}>
          <Text style={styles.pauseButtonText}>{isPaused ? t('player.resume') : t('player.pause')}</Text>
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
  phaseLabelReady: {
    color: '#FFFFFF',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  readyHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8B9E',
    marginTop: 12,
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
    gap: 16,
  },
  chip: {
    position: 'relative',
    alignItems: 'center',
    backgroundColor: '#1C1C24',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    width: 136,
  },
  chipArtEmpty: {
    width: 108,
    height: 108,
    borderRadius: 14,
    backgroundColor: '#2A2A32',
  },
  chipBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D42020',
    borderWidth: 2,
    borderColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  chipBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
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

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
import { pickRandomTip } from '../data/tips';
import { getWorkoutCombos, getWorkoutName, Workout } from '../data/workouts';
import { TFunction, useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { requestNotificationPermission, rescheduleNotifications } from '../notifications/reminders';
import { loadNotificationSettings, saveNotificationSettings } from '../storage/notificationSettings';
import { addSession, WorkoutSession } from '../storage/workoutStorage';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutPlayer'>;

type Phase = 'ready' | 'work' | 'rest' | 'done';

interface PlayerState {
  phase: Phase;
  roundIndex: number;
  secondsLeft: number;
}

/** Countdown before round 1 so the user has time to put their gloves on. */
const PREP_SECONDS = 10;

/** How much the "+15 sec" button extends the current rest. */
const REST_EXTENSION_SECONDS = 15;

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
    // Clamped: rest extended via the "+15 sec" button can leave more than restSeconds on the clock.
    activeDuration += workSeconds + Math.max(0, restSeconds - state.secondsLeft);
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
  const [tipKey, setTipKey] = useState(() => pickRandomTip());
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

  // Fresh tip for every rest period (the prep countdown gets the one picked on mount).
  useEffect(() => {
    if (state.phase === 'rest') {
      setTipKey(prev => pickRandomTip(prev));
    }
  }, [state.phase, state.roundIndex]);

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

  const extendRest = () => {
    setState(prev =>
      prev.phase === 'rest' ? { ...prev, secondsLeft: prev.secondsLeft + REST_EXTENSION_SECONDS } : prev,
    );
  };

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

      {state.phase !== 'work' && (
        <Text style={styles.tipText}>
          <Text style={styles.tipLabel}>{t('player.tip')}: </Text>
          {t(tipKey)}
        </Text>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {state.phase === 'rest' && (
          <TouchableOpacity style={styles.extendRestButton} activeOpacity={0.85} onPress={extendRest}>
            <Text style={styles.extendRestButtonText}>{t('player.addRest')}</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: colors.ground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  exitText: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '500',
    width: 60,
  },
  roundIndicator: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  headerSpacer: {
    width: 60,
  },
  timerSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  phaseLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  phaseLabelWork: {
    color: colors.redText,
  },
  phaseLabelRest: {
    color: colors.muted,
  },
  phaseLabelReady: {
    color: colors.text,
  },
  // Read from a few metres away mid-round, so it is far larger than any other figure in the app.
  timerText: {
    fontSize: 96,
    lineHeight: 108,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  readyHint: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 4,
  },
  tipLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  tipText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  comboSection: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 6,
  },
  comboSectionLabel: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  comboName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 14,
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
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    padding: 14,
    gap: 8,
    width: 136,
  },
  chipArtEmpty: {
    width: 108,
    height: 108,
    borderRadius: radius.card,
    backgroundColor: colors.raised,
  },
  // Step order within the combo: data, not decoration, so it stays neutral.
  chipBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.raised,
    borderWidth: 2,
    borderColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  chipBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  extendRestButton: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendRestButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  // Pause is the one control during a round: primary by inversion.
  pauseButton: {
    flex: 1,
    backgroundColor: colors.inverse,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    color: colors.inverseText,
    fontSize: 17,
    fontWeight: '700',
  },
  doneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.inverse,
    borderRadius: radius.card,
    height: 56,
    paddingHorizontal: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.inverseText,
    fontSize: 17,
    fontWeight: '700',
  },
});

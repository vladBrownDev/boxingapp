import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { playBell } from '../audio/bell';
import NotificationPrompt from '../components/NotificationPrompt';
import PunchIllustration from '../components/PunchIllustration';
import { ComboInfo, getComboName } from '../data/combos';
import { describeMove, getStepPunch } from '../data/punchNotation';
import { pickRandomTip } from '../data/tips';
import {
  countRounds,
  getSegmentCombo,
  getSegmentsTotalSeconds,
  getWorkoutName,
  Workout,
  WorkoutSegment,
} from '../data/workouts';
import { TFunction, useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { requestNotificationPermission, rescheduleNotifications } from '../notifications/reminders';
import { loadNotificationSettings, saveNotificationSettings } from '../storage/notificationSettings';
import { addSession, WorkoutSession } from '../storage/workoutStorage';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutPlayer'>;

/** 'ready' is the prep countdown, 'segment' is running `segments[segmentIndex]`. */
type Phase = 'ready' | 'segment' | 'done';

interface PlayerState {
  phase: Phase;
  segmentIndex: number;
  secondsLeft: number;
}

/** Countdown before the first segment so the user has time to put their gloves on. */
const PREP_SECONDS = 10;

/** How much the "+15 sec" button extends the current rest. */
const REST_EXTENSION_SECONDS = 15;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** First combo segment at or after `fromIndex`. */
function findNextCombo(segments: WorkoutSegment[], fromIndex: number): ComboInfo | undefined {
  for (let i = fromIndex; i < segments.length; i++) {
    const segment = segments[i];
    if (segment.type === 'combo') {
      return getSegmentCombo(segment);
    }
  }
  return undefined;
}

/** Builds the session record for whatever progress has been made so far, whether the
 * workout finished normally or the player exited mid-segment. */
function buildSession(
  t: TFunction,
  workout: Workout,
  segments: WorkoutSegment[],
  state: PlayerState,
): WorkoutSession {
  const finishedCount =
    state.phase === 'done' ? segments.length : state.phase === 'ready' ? 0 : state.segmentIndex;
  const finished = segments.slice(0, finishedCount);

  let activeDuration = getSegmentsTotalSeconds(finished);
  const current = state.phase === 'segment' ? segments[state.segmentIndex] : undefined;
  if (current) {
    // Clamped: rest extended via the "+15 sec" button can leave more than its length on the clock.
    activeDuration += Math.max(0, current.seconds - state.secondsLeft);
  }

  const finishedCombos = finished.flatMap(s => {
    const resolved = s.type === 'combo' ? getSegmentCombo(s) : undefined;
    return resolved ? [resolved] : [];
  });
  const firstWork = segments.find(s => s.type === 'combo');
  const firstRest = segments.find(s => s.type === 'rest');

  return {
    id: String(Date.now()),
    timestamp: Date.now(),
    workoutId: workout.id,
    workoutName: getWorkoutName(t, workout),
    level: workout.level,
    rounds: countRounds(segments),
    roundsCompleted: finishedCombos.length,
    workTime: firstWork?.seconds ?? 0,
    restTime: firstRest?.seconds ?? 0,
    totalDuration: getSegmentsTotalSeconds(segments),
    activeDuration,
    comboIds: finishedCombos.map(c => c.id),
    comboSequences: finishedCombos.map(c => c.sequence),
    completed: state.phase === 'done',
  };
}

export default function WorkoutPlayerScreen({ navigation, route }: Props) {
  const { workout, config } = route.params;
  const { segments } = config;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const totalRounds = useMemo(() => countRounds(segments), [segments]);

  const [state, setState] = useState<PlayerState>({
    phase: 'ready',
    segmentIndex: 0,
    secondsLeft: PREP_SECONDS,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [tipKey, setTipKey] = useState(() => pickRandomTip());
  const hasLoggedRef = useRef(false);

  const currentSegment = state.phase === 'segment' ? segments[state.segmentIndex] : undefined;
  const isWork = currentSegment?.type === 'combo';
  const isRest = currentSegment?.type === 'rest';

  const logSession = useCallback(
    (current: PlayerState) => {
      if (hasLoggedRef.current) {
        return;
      }
      hasLoggedRef.current = true;
      addSession(buildSession(t, workout, segments, current)).then(() =>
        rescheduleNotifications(t),
      );
    },
    [t, workout, segments],
  );

  const exitToDashboard = () => {
    logSession(state);
    navigation.popToTop();
  };

  useEffect(() => {
    // Every segment boundary past the initial prep countdown rings the bell, including
    // combo → combo, so the switch to a new combo is audible. Skip the mount into 'ready'.
    if (state.phase !== 'ready') {
      playBell();
    }
  }, [state.phase, state.segmentIndex]);

  // Fresh tip for every rest segment (the prep countdown gets the one picked on mount).
  useEffect(() => {
    if (isRest) {
      setTipKey(prev => pickRandomTip(prev));
    }
  }, [isRest, state.segmentIndex]);

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
        const nextIndex = prev.phase === 'ready' ? 0 : prev.segmentIndex + 1;
        if (nextIndex >= segments.length) {
          return { phase: 'done', segmentIndex: prev.segmentIndex, secondsLeft: 0 };
        }
        return { phase: 'segment', segmentIndex: nextIndex, secondsLeft: segments[nextIndex].seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, state.phase, segments]);

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
      prev.phase === 'segment' && segments[prev.segmentIndex].type === 'rest'
        ? { ...prev, secondsLeft: prev.secondsLeft + REST_EXTENSION_SECONDS }
        : prev,
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
          {t('player.doneSubtitle', { rounds: totalRounds, name: getWorkoutName(t, workout) })}
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

  // During work: the combo being thrown. During prep / rest: the next combo coming up
  // (none if only rest is left).
  const activeCombo = findNextCombo(segments, state.phase === 'ready' ? 0 : state.segmentIndex);
  // Header round: the combo being thrown, or during rest the one just finished.
  const combosSoFar = countRounds(segments.slice(0, state.phase === 'ready' ? 0 : state.segmentIndex + 1));
  const currentRound = Math.min(totalRounds, Math.max(1, combosSoFar));
  const phaseLabelKey = isWork ? 'player.work' : isRest ? 'player.rest' : 'player.ready';
  const phaseLabelStyle = isWork ? styles.phaseLabelWork : isRest ? styles.phaseLabelRest : styles.phaseLabelReady;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={exitToDashboard} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.exitText}>{t('player.exit')}</Text>
        </TouchableOpacity>
        <Text style={styles.roundIndicator}>
          {t('player.round', { current: currentRound, total: totalRounds })}
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

      {activeCombo ? (
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
      ) : (
        <View style={styles.comboSection} />
      )}

      {!isWork && (
        <Text style={styles.tipText}>
          <Text style={styles.tipLabel}>{t('player.tip')}: </Text>
          {t(tipKey)}
        </Text>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isRest && (
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ComboBuilder, { ComboDraft } from '../components/ComboBuilder';
import { ComboLevel, getComboName } from '../data/combos';
import { describeMove, stepForStance } from '../data/punchNotation';
import {
  ComboSegment,
  countRounds,
  DEFAULT_COMBO_SECONDS,
  getSegmentCombo,
  getSegmentsTotalSeconds,
  rest,
  SEGMENT_LIMITS,
  Workout,
  WorkoutSegment,
} from '../data/workouts';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation/types';
import { useStance } from '../stance/StanceContext';
import { deleteCustomWorkout, newCustomWorkoutId, saveCustomWorkout } from '../storage/customWorkouts';
import { colors, radius, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutEditor'>;

const LEVELS: ComboLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const NAME_MAX_LENGTH = 40;

/** Segment plus a stable key, so rows keep their identity while being reordered. */
type EditorSegment = WorkoutSegment & { key: string };

/** What the combo builder is open for: a new combo segment, or editing an existing one. */
type BuilderTarget = { kind: 'add' } | { kind: 'edit'; key: string };

/** Where to go once the editor is allowed to close (set after save / delete). */
type ExitAction =
  | { kind: 'saved'; workout: Workout }
  | { kind: 'deleted' };

let idCounter = 0;
function newComboId(): string {
  idCounter += 1;
  return `custom-combo-${Date.now()}-${idCounter}`;
}

let keyCounter = 0;
function withKey(segment: WorkoutSegment): EditorSegment {
  keyCounter += 1;
  return { ...segment, key: `seg-${keyCounter}` };
}

function stripKey({ key: _key, ...segment }: EditorSegment): WorkoutSegment {
  return segment as WorkoutSegment;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function WorkoutEditorScreen({ navigation, route }: Props) {
  const original = route.params?.workout;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { stance } = useStance();

  const [name, setName] = useState(original?.name ?? '');
  const [level, setLevel] = useState<ComboLevel>(original?.level ?? 'Beginner');
  const [segments, setSegments] = useState<EditorSegment[]>(() =>
    (original?.segments ?? []).map(withKey),
  );
  const [builderTarget, setBuilderTarget] = useState<BuilderTarget | null>(null);
  const [builderDraft, setBuilderDraft] = useState<ComboDraft | null>(null);
  const [exitAction, setExitAction] = useState<ExitAction | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const plainSegments = useMemo(() => segments.map(stripKey), [segments]);
  const rounds = countRounds(plainSegments);
  const totalSeconds = getSegmentsTotalSeconds(plainSegments);
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && rounds > 0;

  const isDirty = useMemo(() => {
    const initial = {
      name: original?.name ?? '',
      level: original?.level ?? 'Beginner',
      segments: original?.segments ?? [],
    };
    return JSON.stringify(initial) !== JSON.stringify({ name, level, segments: plainSegments });
  }, [original, name, level, plainSegments]);

  // Confirm before throwing away edits (back button, swipe, hardware back) — but not once
  // the editor is leaving on purpose after a save or delete.
  usePreventRemove(isDirty && !exitAction, ({ data }) => {
    Alert.alert(t('editor.discardTitle'), t('editor.discardMessage'), [
      { text: t('editor.keepEditing'), style: 'cancel' },
      {
        text: t('editor.discard'),
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  // Navigate only after the render that lifts the prevent-remove guard.
  useEffect(() => {
    if (!exitAction) {
      return;
    }
    if (exitAction.kind === 'deleted') {
      navigation.popTo('WorkoutList');
    } else if (original) {
      // Came from the workout's setup screen: return there with the updated workout.
      navigation.popTo('WorkoutSetup', { workout: exitAction.workout });
    } else {
      // Brand-new workout: go straight to its setup screen, ready to start.
      navigation.replace('WorkoutSetup', { workout: exitAction.workout });
    }
  }, [exitAction, navigation, original]);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    const saved = await saveCustomWorkout({
      id: original?.id ?? newCustomWorkoutId(),
      name: trimmedName,
      level,
      segments: plainSegments,
      isCustom: true,
    });
    setExitAction({ kind: 'saved', workout: saved });
  };

  const handleDelete = () => {
    if (!original) {
      return;
    }
    Alert.alert(t('editor.deleteTitle'), t('editor.deleteMessage'), [
      { text: t('editor.cancel'), style: 'cancel' },
      {
        text: t('editor.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCustomWorkout(original.id);
          setExitAction({ kind: 'deleted' });
        },
      },
    ]);
  };

  const addRest = () => {
    setSegments(prev => [...prev, withKey(rest())]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const openNewCombo = () => {
    setBuilderTarget({ kind: 'add' });
    setBuilderDraft({ name: t('builder.defaultName', { n: rounds + 1 }), sequence: [] });
  };

  const openEditCombo = (segment: EditorSegment & ComboSegment) => {
    const current = getSegmentCombo(segment);
    setBuilderTarget({ kind: 'edit', key: segment.key });
    setBuilderDraft({
      name: current ? getComboName(t, current) : '',
      sequence: current?.sequence ?? [],
    });
  };

  const closeBuilder = () => {
    setBuilderTarget(null);
    setBuilderDraft(null);
  };

  const handleSaveCombo = ({ name: comboName, sequence }: ComboDraft) => {
    const target = builderTarget;
    closeBuilder();
    if (!target) {
      return;
    }
    if (target.kind === 'add') {
      setSegments(prev => [
        ...prev,
        withKey({
          type: 'combo',
          custom: { id: newComboId(), name: comboName, sequence },
          seconds: DEFAULT_COMBO_SECONDS,
        }),
      ]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } else {
      setSegments(prev =>
        prev.map(s =>
          s.key === target.key && s.type === 'combo'
            ? {
                type: 'combo',
                key: s.key,
                seconds: s.seconds,
                // A built-in combo being edited becomes the user's own copy.
                custom: { id: 'custom' in s ? s.custom.id : newComboId(), name: comboName, sequence },
              }
            : s,
        ),
      );
    }
  };

  const changeDuration = (key: string, direction: 1 | -1) => {
    setSegments(prev =>
      prev.map(s => {
        if (s.key !== key) {
          return s;
        }
        const limits = SEGMENT_LIMITS[s.type];
        return { ...s, seconds: clamp(s.seconds + direction * limits.step, limits.min, limits.max) };
      }),
    );
  };

  const move = (index: number, direction: 1 | -1) => {
    setSegments(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = prev.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (key: string) => {
    setSegments(prev => prev.filter(s => s.key !== key));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {original ? t('editor.editTitle') : t('editor.newTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('editor.name')}</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder={t('editor.namePlaceholder')}
            placeholderTextColor={colors.faint}
            maxLength={NAME_MAX_LENGTH}
            returnKeyType="done"
            selectionColor={colors.text}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('editor.level')}</Text>
          <View style={styles.levelRow}>
            {LEVELS.map(option => {
              const isSelected = option === level;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.levelOption, isSelected && styles.levelOptionActive]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setLevel(option)}>
                  <Text style={[styles.levelOptionText, isSelected && styles.levelOptionTextActive]}>
                    {t(`level.${option}` as TranslationKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.segmentsHeader}>
            <Text style={styles.sectionTitle}>{t('editor.segments')}</Text>
            {segments.length > 0 && (
              <Text style={styles.summaryText}>
                {t('workoutSetup.summary', { rounds, duration: formatDuration(totalSeconds) })}
              </Text>
            )}
          </View>

          {segments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('editor.empty')}</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {segments.map((segment, index) => {
                const segmentCombo = segment.type === 'combo' ? getSegmentCombo(segment) : undefined;
                const limits = SEGMENT_LIMITS[segment.type];
                return (
                  <View key={segment.key} style={[styles.segmentRow, index > 0 && styles.segmentRowRule]}>
                    <View style={styles.segmentTop}>
                      <Text style={styles.segmentIndex}>{index + 1}</Text>
                      {segment.type === 'combo' ? (
                        <TouchableOpacity
                          style={styles.segmentInfo}
                          activeOpacity={0.7}
                          accessibilityHint={t('editor.changeCombo')}
                          onPress={() => openEditCombo(segment)}>
                          <Text style={styles.segmentName} numberOfLines={1}>
                            {segmentCombo ? getComboName(t, segmentCombo) : '—'}
                            <Text style={styles.segmentChevron}>  ›</Text>
                          </Text>
                          {segmentCombo && (
                            <Text style={styles.segmentMeta} numberOfLines={1}>
                              {segmentCombo.sequence.map(step => describeMove(t, stepForStance(step, stance))).join(' · ')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.segmentInfo}>
                          <Text style={[styles.segmentName, styles.segmentNameRest]}>{t('player.rest')}</Text>
                        </View>
                      )}
                      <View style={styles.rowActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          disabled={index === 0}
                          accessibilityLabel={t('editor.moveUp')}
                          onPress={() => move(index, -1)}>
                          <Text style={[styles.iconButtonText, index === 0 && styles.iconButtonDisabled]}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          disabled={index === segments.length - 1}
                          accessibilityLabel={t('editor.moveDown')}
                          onPress={() => move(index, 1)}>
                          <Text
                            style={[
                              styles.iconButtonText,
                              index === segments.length - 1 && styles.iconButtonDisabled,
                            ]}>
                            ↓
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          accessibilityLabel={t('editor.remove')}
                          onPress={() => remove(segment.key)}>
                          <Text style={styles.iconButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.durationRow}>
                      <TouchableOpacity
                        style={styles.durationBtn}
                        activeOpacity={0.7}
                        disabled={segment.seconds <= limits.min}
                        onPress={() => changeDuration(segment.key, -1)}>
                        <Text style={[styles.durationBtnText, segment.seconds <= limits.min && styles.iconButtonDisabled]}>
                          −
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.durationValue}>{formatDuration(segment.seconds)}</Text>
                      <TouchableOpacity
                        style={styles.durationBtn}
                        activeOpacity={0.7}
                        disabled={segment.seconds >= limits.max}
                        onPress={() => changeDuration(segment.key, 1)}>
                        <Text style={[styles.durationBtnText, segment.seconds >= limits.max && styles.iconButtonDisabled]}>
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.addRow}>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.8}
              onPress={openNewCombo}>
              <Text style={styles.addButtonText}>{t('editor.addCombo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={addRest}>
              <Text style={styles.addButtonText}>{t('editor.addRest')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {original && (
          <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>{t('editor.delete')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.scrollPad} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!canSave && <Text style={styles.saveHint}>{t('editor.saveHint')}</Text>}
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canSave}
          onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('editor.save')}</Text>
        </TouchableOpacity>
      </View>

      <ComboBuilder
        draft={builderDraft}
        isEditing={builderTarget?.kind === 'edit'}
        onSave={handleSaveCombo}
        onCancel={closeBuilder}
      />
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
  scrollContent: { padding: 20, paddingTop: 0 },
  scrollPad: { height: 16 },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    ...type.section,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  levelRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 4,
    gap: 4,
  },
  levelOption: {
    flex: 1,
    height: 40,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Selection by brightness, never red.
  levelOptionActive: {
    backgroundColor: colors.inverse,
  },
  levelOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  levelOptionTextActive: {
    color: colors.inverseText,
    fontWeight: '600',
  },
  segmentsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
  },
  segmentRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  segmentRowRule: {
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  segmentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentIndex: {
    width: 20,
    fontSize: 13,
    color: colors.faint,
    fontVariant: ['tabular-nums'],
  },
  segmentInfo: {
    flex: 1,
    gap: 2,
  },
  segmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  segmentNameRest: {
    color: colors.muted,
  },
  segmentChevron: {
    color: colors.faint,
    fontWeight: '400',
  },
  segmentMeta: {
    ...type.meta,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 30,
  },
  durationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBtnText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 52,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  addRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    marginTop: 32,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  saveHint: {
    ...type.meta,
    textAlign: 'center',
  },
  // Not the "start" action, so primary by inversion rather than red.
  saveButton: {
    backgroundColor: colors.inverse,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.35,
  },
  saveButtonText: {
    color: colors.inverseText,
    fontSize: 17,
    fontWeight: '700',
  },
});

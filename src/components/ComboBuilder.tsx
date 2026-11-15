import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  describeMove,
  getMoveLabel,
  getPunchVariants,
  getStepPunch,
  MoveCode,
  PunchSide,
  PunchTarget,
  PunchType,
  stepForStance,
} from '../data/punchNotation';
import { useTranslation } from '../i18n/LanguageContext';
import { useStance } from '../stance/StanceContext';
import { colors, radius, type } from '../theme';
import PunchIllustration from './PunchIllustration';

export interface ComboDraft {
  name: string;
  sequence: string[];
}

interface Props {
  /** null hides the builder; a draft opens it, pre-filled. */
  draft: ComboDraft | null;
  isEditing: boolean;
  onSave: (combo: ComboDraft) => void;
  onCancel: () => void;
}

const MAX_STEPS = 10;
const NAME_MAX_LENGTH = 30;

const SIDES: PunchSide[] = ['L', 'R'];
const PUNCH_TYPES: PunchType[] = ['J', 'C', 'H', 'U'];
const DEFENSE_MOVES: MoveCode[] = ['SL', 'SR', 'SB', 'WL', 'WR'];

/** A step can join at most one punch with defensive moves, without repeating a move. */
function canJoin(step: string, code: MoveCode): boolean {
  const parts = step.split('+');
  if (parts.includes(code)) {
    return false;
  }
  const addsPunch = getStepPunch(code) !== undefined;
  return !(addsPunch && getStepPunch(step) !== undefined);
}

export default function ComboBuilder({ draft, isEditing, onSave, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // The builder shows moves for the user's stance but stores them in orthodox notation,
  // like every other combo, so a combo built as a southpaw mirrors correctly if they switch.
  const { stance } = useStance();
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);
  const [target, setTarget] = useState<PunchTarget>('head');
  const [joinWithLast, setJoinWithLast] = useState(false);

  // Reset to the incoming draft each time the builder opens.
  useEffect(() => {
    if (draft) {
      setName(draft.name);
      setSequence(draft.sequence);
      setTarget('head');
      setJoinWithLast(false);
    }
  }, [draft]);

  const lastStep = sequence[sequence.length - 1];
  const isFull = sequence.length >= MAX_STEPS;
  const canSave = sequence.length > 0 && name.trim().length > 0;

  const addMove = (displayCode: MoveCode) => {
    const code = stepForStance(displayCode, stance) as MoveCode;
    if (joinWithLast && lastStep !== undefined) {
      if (canJoin(lastStep, code)) {
        setSequence(prev => [...prev.slice(0, -1), `${lastStep}+${code}`]);
      }
      setJoinWithLast(false);
      return;
    }
    if (!isFull) {
      setSequence(prev => [...prev, code]);
    }
  };

  const isMoveDisabled = (displayCode: MoveCode) => {
    const code = stepForStance(displayCode, stance) as MoveCode;
    return joinWithLast && lastStep !== undefined ? !canJoin(lastStep, code) : isFull;
  };

  const removeStep = (index: number) => {
    setSequence(prev => prev.filter((_, i) => i !== index));
    setJoinWithLast(false);
  };

  return (
    <Modal visible={draft !== null} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title} accessibilityRole="header">
            {isEditing ? t('builder.editTitle') : t('builder.newTitle')}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder={t('builder.namePlaceholder')}
              placeholderTextColor={colors.faint}
              maxLength={NAME_MAX_LENGTH}
              returnKeyType="done"
              selectionColor={colors.text}
              accessibilityLabel={t('editor.name')}
            />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('builder.yourCombo')}</Text>
                <Text style={styles.counter}>
                  {sequence.length} / {MAX_STEPS}
                </Text>
              </View>
              {sequence.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('builder.empty')}</Text>
                </View>
              ) : (
                <View style={styles.sequenceCard}>
                  {sequence.map((step, index) => (
                    <View key={`${step}-${index}`} style={styles.stepChip}>
                      <Text style={styles.stepIndex}>{index + 1}</Text>
                      <Text style={styles.stepLabel}>{describeMove(t, stepForStance(step, stance))}</Text>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
                        accessibilityLabel={t('builder.removeMove')}
                        onPress={() => removeStep(index)}>
                        <Text style={styles.stepRemove}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {lastStep !== undefined && (
                <TouchableOpacity
                  style={[styles.joinToggle, joinWithLast && styles.joinToggleActive]}
                  activeOpacity={0.8}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: joinWithLast }}
                  onPress={() => setJoinWithLast(v => !v)}>
                  <Text style={[styles.joinToggleText, joinWithLast && styles.joinToggleTextActive]}>
                    {t('builder.together')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('builder.punches')}</Text>
                <View style={styles.targetToggle}>
                  {(['head', 'body'] as PunchTarget[]).map(option => {
                    const isSelected = option === target;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.targetOption, isSelected && styles.targetOptionActive]}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setTarget(option)}>
                        <Text style={[styles.targetText, isSelected && styles.targetTextActive]}>
                          {t(option === 'head' ? 'builder.head' : 'builder.body')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.punchGrid}>
                {SIDES.map(side => (
                  <View key={side} style={styles.punchColumn}>
                    {PUNCH_TYPES.map(punchType => {
                      const punch = getPunchVariants(side, punchType)[target];
                      const disabled = isMoveDisabled(punch.code);
                      return (
                        <TouchableOpacity
                          key={punch.code}
                          style={[styles.punchButton, disabled && styles.disabled]}
                          activeOpacity={0.7}
                          disabled={disabled}
                          onPress={() => addMove(punch.code)}>
                          <PunchIllustration punch={punch} size={44} />
                          <Text style={styles.punchLabel} numberOfLines={2}>
                            {getMoveLabel(t, punch.code)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('builder.defense')}</Text>
              <View style={styles.defenseRow}>
                {DEFENSE_MOVES.map(code => {
                  const disabled = isMoveDisabled(code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.defenseButton, disabled && styles.disabled]}
                      activeOpacity={0.7}
                      disabled={disabled}
                      onPress={() => addMove(code)}>
                      <Text style={styles.defenseLabel}>{getMoveLabel(t, code)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{t('editor.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              activeOpacity={0.85}
              disabled={!canSave}
              onPress={() => onSave({ name: name.trim(), sequence })}>
              <Text style={styles.saveButtonText}>{t('builder.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 24 },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    ...type.section,
  },
  counter: {
    ...type.meta,
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
  sequenceCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 12,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.raised,
    borderRadius: radius.control,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 8,
  },
  stepIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.faint,
    fontVariant: ['tabular-nums'],
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  stepRemove: {
    fontSize: 16,
    color: colors.muted,
  },
  joinToggle: {
    alignSelf: 'flex-start',
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  // Selection by brightness, never red.
  joinToggleActive: {
    backgroundColor: colors.inverse,
  },
  joinToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  joinToggleTextActive: {
    color: colors.inverseText,
    fontWeight: '600',
  },
  targetToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    padding: 3,
    gap: 3,
  },
  targetOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.chip,
  },
  targetOptionActive: {
    backgroundColor: colors.inverse,
  },
  targetText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  targetTextActive: {
    color: colors.inverseText,
    fontWeight: '600',
  },
  punchGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  punchColumn: {
    flex: 1,
    gap: 10,
  },
  punchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    padding: 8,
  },
  punchLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 17,
  },
  defenseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  defenseButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  defenseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  disabled: {
    opacity: 0.35,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
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

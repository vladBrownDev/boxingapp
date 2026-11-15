import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Stance } from '../data/punchNotation';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation/types';
import { useStance } from '../stance/StanceContext';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Stance'>;

const OPTIONS: { stance: Stance; title: TranslationKey; description: TranslationKey }[] = [
  { stance: 'orthodox', title: 'stance.orthodox', description: 'stance.orthodoxDesc' },
  { stance: 'southpaw', title: 'stance.southpaw', description: 'stance.southpawDesc' },
];

/** First-run step, shown once before anything else: orthodox or southpaw. Every combo
 * in the app is mirrored for southpaws, so this has to be known before the first workout. */
export default function StanceScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { stance: currentStance, setStance } = useStance();
  const [selected, setSelected] = useState<Stance>(currentStance);

  const handleContinue = async () => {
    await setStance(selected);
    navigation.reset({ index: 0, routes: [{ name: route.params.next }] });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.headline} accessibilityRole="header">{t('stance.headline')}</Text>
        <Text style={styles.description}>{t('stance.description')}</Text>

        <View style={styles.options}>
          {OPTIONS.map(option => {
            const isSelected = option.stance === selected;
            return (
              <TouchableOpacity
                key={option.stance}
                style={[styles.option, isSelected && styles.optionActive]}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => setSelected(option.stance)}>
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{t(option.title)}</Text>
                  <Text style={styles.optionDescription}>{t(option.description)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>{t('stance.hint')}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleContinue}>
        <Text style={styles.primaryButtonText}>{t('stance.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    color: colors.faint,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  // Selection by brightness (lighter surface + white ring), never red.
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.surface,
    padding: 16,
  },
  optionActive: {
    backgroundColor: colors.raised,
    borderColor: colors.inverse,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioActive: {
    borderColor: colors.inverse,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.inverse,
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: colors.faint,
    lineHeight: 19,
    marginTop: 14,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: colors.inverse,
    borderRadius: radius.card,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.inverseText,
    fontSize: 17,
    fontWeight: '700',
  },
});

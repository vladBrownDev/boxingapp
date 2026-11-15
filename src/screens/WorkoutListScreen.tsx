import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNav, { NavTab } from '../components/BottomNav';
import { getComboName } from '../data/combos';
import { countRounds, getWorkoutCombos, getWorkoutDurationMinutes, getWorkoutName, WORKOUTS } from '../data/workouts';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutList'>;

export default function WorkoutListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('browse');
  const { t } = useTranslation();

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (tab === 'progress') {
      navigation.navigate('Stats');
      return;
    }
    if (tab === 'menu') {
      navigation.navigate('Menu');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">{t('workoutList.headerTitle')}</Text>
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
              onPress={() => navigation.navigate('WorkoutSetup', { workout })}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{getWorkoutName(t, workout)}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>
                    {t(`level.${workout.level}` as TranslationKey)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {t('workoutList.meta', {
                  rounds: countRounds(workout.segments),
                  minutes: getWorkoutDurationMinutes(workout),
                })}
              </Text>
              <Text style={styles.cardCombos} numberOfLines={1}>
                {combos.map(c => getComboName(t, c)).join(' · ')}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.scrollPad} />
      </ScrollView>

      <BottomNav active={activeTab} onPress={handleTabPress} />
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
  scrollContent: { padding: 20, gap: 12 },
  scrollPad: { height: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  levelBadge: {
    flex: 0,
    backgroundColor: colors.raised,
    borderRadius: radius.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  cardMeta: {
    fontSize: 14,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  cardCombos: {
    ...type.meta,
  },
});

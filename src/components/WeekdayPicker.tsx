import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';
import { FIRST_WEEKDAY, WEEKDAYS_SHORT } from '../i18n/translations';
import { colors } from '../theme';

interface Props {
  selected: number[]; // Date.getDay() values (0 = Sunday)
  onChange: (days: number[]) => void;
  /** Smallest number of days that can remain selected. */
  minSelected?: number;
  size?: number;
}

/** Row of weekday toggles, ordered by the locale's first day of the week. */
export default function WeekdayPicker({ selected, onChange, minSelected = 1, size = 40 }: Props) {
  const { locale } = useTranslation();
  const order = Array.from({ length: 7 }, (_, i) => (FIRST_WEEKDAY[locale] + i) % 7);

  const toggle = (day: number) => {
    if (selected.includes(day)) {
      if (selected.length > minSelected) {
        onChange(selected.filter(d => d !== day));
      }
    } else {
      onChange([...selected, day].sort((a, b) => a - b));
    }
  };

  return (
    <View style={styles.row}>
      {order.map(day => {
        const isSelected = selected.includes(day);
        return (
          <TouchableOpacity
            key={day}
            style={[
              styles.chip,
              { width: size, height: size, borderRadius: size / 2 },
              isSelected && styles.chipActive,
            ]}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            onPress={() => toggle(day)}>
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
              {WEEKDAYS_SHORT[locale][day]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.inverse,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.inverseText,
    fontWeight: '600',
  },
});

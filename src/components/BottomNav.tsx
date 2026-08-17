import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NavTab = 'home' | 'browse' | 'progress' | 'menu';

interface Props {
  active: NavTab;
  onPress: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; icon: string }[] = [
  { key: 'home',     label: 'Home',     icon: '🏠' },
  { key: 'browse',   label: 'Browse',   icon: '🥊' },
  { key: 'progress', label: 'Progress', icon: '📊' },
  { key: 'menu',     label: 'Menu',     icon: '☰' },
];

export default function BottomNav({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.border} />
      <View style={styles.row}>
        {TABS.map(tab => {
          const isActive = tab.key === active;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onPress(tab.key)}
              activeOpacity={0.7}>
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E0E10',
    paddingTop: 8,
  },
  border: {
    height: 1,
    backgroundColor: '#1C1C24',
  },
  row: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 3,
  },
  icon: {
    fontSize: 20,
    opacity: 0.4,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: '#555566',
    fontWeight: '500',
  },
  labelActive: {
    color: '#D42020',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D42020',
    marginTop: 2,
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIcon from '../media/home.svg';
import WorkoutsIcon from '../media/workouts.svg';
import StatsIcon from '../media/stats.svg';
import MenuIcon from '../media/menu.svg';

export type NavTab = 'home' | 'browse' | 'progress' | 'menu';

const ACTIVE_COLOR = '#FFFFFF';
const INACTIVE_COLOR = '#D42020';

const TABS: { key: NavTab; label: string; Icon: React.FC<{ width: number; height: number; color: string }> }[] = [
  { key: 'home',     label: 'Home',     Icon: HomeIcon },
  { key: 'browse',   label: 'Browse',   Icon: WorkoutsIcon },
  { key: 'progress', label: 'Progress', Icon: StatsIcon },
  { key: 'menu',     label: 'Menu',     Icon: MenuIcon },
];

interface Props {
  active: NavTab;
  onPress: (tab: NavTab) => void;
}

export default function BottomNav({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.border} />
      <View style={styles.row}>
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <TouchableOpacity
              key={key}
              style={styles.tab}
              onPress={() => onPress(key)}
              activeOpacity={0.7}>
              <Icon width={22} height={22} color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR} />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {label}
              </Text>
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
  label: {
    fontSize: 11,
    color: INACTIVE_COLOR,
    fontWeight: '500',
  },
  labelActive: {
    color: ACTIVE_COLOR,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNav, { NavTab } from '../components/BottomNav';
import { useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

export default function MenuScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavTab>('menu');
  const { t, locale, setLocale, languages } = useTranslation();
  const currentLanguage = languages.find(l => l.code === locale) ?? languages[0];
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (tab === 'browse') {
      navigation.navigate('WorkoutList');
      return;
    }
    if (tab === 'progress') {
      navigation.navigate('Stats');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.logoText}>
          PUNCH<Text style={styles.logoAccent}>FACTORY</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.pageTitle}>{t('menu.title')}</Text>
          <Text style={styles.pageSubtitle}>{t('menu.subtitle')}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('menu.preferences')}</Text>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.8}
          onPress={() => setPickerVisible(true)}>
          <Text style={styles.rowLabel}>{t('menu.language')}</Text>
          <View style={styles.rowValue}>
            <Text style={styles.rowValueText}>{currentLanguage.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.scrollPad} />
      </ScrollView>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>{t('menu.language')}</Text>
            {languages.map(item => {
              const isSelected = item.code === locale;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    setLocale(item.code);
                    setPickerVisible(false);
                  }}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <BottomNav active={activeTab} onPress={handleTabPress} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C24',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  logoAccent: {
    color: '#D42020',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  scrollPad: { height: 16 },

  heroSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#8B8B9E',
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8B9E',
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C24',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValueText: {
    fontSize: 14,
    color: '#8B8B9E',
  },
  chevron: {
    fontSize: 18,
    color: '#8B8B9E',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#141416',
  },
  optionText: {
    fontSize: 15,
    color: '#8B8B9E',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 16,
    color: '#D42020',
    fontWeight: '700',
  },
});

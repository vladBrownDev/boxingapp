import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GloveIcon from '../media/glove.svg';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export default function NotificationPrompt({ visible, onAllow, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <GloveIcon width={36} height={36} color="#E83535" />
          </View>
          <Text style={styles.headline}>{t('notifPrompt.headline')}</Text>
          <Text style={styles.description}>{t('notifPrompt.description')}</Text>
          <TouchableOpacity style={styles.allowButton} activeOpacity={0.85} onPress={onAllow}>
            <Text style={styles.allowText}>{t('notifPrompt.allow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} activeOpacity={0.7} onPress={onSkip}>
            <Text style={styles.skipText}>{t('notifPrompt.skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#1C1C24',
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#8B8B9E',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },
  allowButton: {
    alignSelf: 'stretch',
    backgroundColor: '#D42020',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  allowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  skipText: {
    color: '#8B8B9E',
    fontSize: 15,
    fontWeight: '600',
  },
});

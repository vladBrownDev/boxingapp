import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { loginAsGuest } from '../storage/authStorage';
import { loadTrainingDays } from '../storage/trainingSchedule';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const continueIntoApp = async () => {
    const trainingDays = await loadTrainingDays();
    navigation.reset({ index: 0, routes: [{ name: trainingDays ? 'Dashboard' : 'TrainingSchedule' }] });
  };

  const handleStartFree = async () => {
    await loginAsGuest();
    continueIntoApp();
  };
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}>

        {/* Logo image */}
        <View style={styles.logoSection}>
          <Image
            source={require('../media/logo-no-bg-sm.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Hero Text */}
        <View style={styles.heroSection}>
          <Text style={styles.headline} accessibilityRole="header">{t('welcome.headline')}</Text>
          <Text style={styles.subheading}>{t('welcome.subheading')}</Text>
        </View>

        {/* What's inside */}
        <Text style={styles.features}>
          {[t('welcome.pill.combos'), t('welcome.pill.timer'), t('welcome.pill.progress')].join('  ·  ')}
        </Text>

        <View style={styles.spacer} />

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartFree}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>{t('welcome.startFree')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={continueIntoApp}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>
              {t('welcome.haveAccount')}
              <Text style={styles.signInLink}>{t('welcome.signIn')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141416',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 300,
    height: 300,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headline: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 14,
  },
  subheading: {
    fontSize: 15,
    color: '#8B8B9E',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    fontSize: 14,
    color: '#A3A3B2',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  ctaSection: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#D42020',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#8B8B9E',
    fontSize: 14,
  },
  signInLink: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

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

interface Props {
  onStartFree: () => void;
  onSignIn: () => void;
}

export default function WelcomeScreen({ onStartFree, onSignIn }: Props) {
  const insets = useSafeAreaInsets();
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
      {/* Corner accents */}
      <View style={styles.cornerAccentTL} />
      <View style={styles.cornerAccentBR} />

      {/* Subtle horizontal lines */}
      <View style={[styles.line, styles.line1]} />
      <View style={[styles.line, styles.line2]} />
      <View style={[styles.line, styles.line3]} />

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
            source={require('../media/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Hero Text */}
        <View style={styles.heroSection}>
          <Text style={styles.headline}>
            Professional Boxing{'\n'}Training in Your Pocket
          </Text>
          <Text style={styles.subheading}>
            Learn combos. Train anytime.{'\n'}No sign-up needed.
          </Text>
        </View>

        {/* Feature pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>100+ Combos</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Smart Timer</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Track Progress</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStartFree}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Start Training Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSignIn}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
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
  cornerAccentTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#D42020',
    opacity: 0.35,
  },
  cornerAccentBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#D42020',
    opacity: 0.35,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D42020',
    opacity: 0.06,
  },
  line1: { top: '32%' },
  line2: { top: '47%' },
  line3: { top: '62%' },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 200,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
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
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1C1C24',
  },
  pillText: {
    color: '#8B8B9E',
    fontSize: 13,
    fontWeight: '500',
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
    shadowColor: '#D42020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#555566',
    fontSize: 14,
  },
  signInLink: {
    color: '#E83535',
    fontWeight: '600',
  },
});

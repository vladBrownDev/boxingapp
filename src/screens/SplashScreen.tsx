import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loadAuthState } from '../storage/authStorage';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: width - 80,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setTimeout(async () => {
        const authState = await loadAuthState();
        navigation.reset({
          index: 0,
          routes: [{ name: authState.isLoggedIn ? 'Dashboard' : 'Welcome' }],
        });
      }, 200);
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}>
          <Image
            source={require('../media/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Forge Your Boxing Skills
        </Animated.Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141416',
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 220,
    height: 220,
  },
  tagline: {
    fontSize: 16,
    color: '#8B8B9E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  progressContainer: {
    paddingHorizontal: 40,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#1C1C24',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#D42020',
    borderRadius: 2,
  },
});

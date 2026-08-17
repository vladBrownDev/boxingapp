import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

type Screen = 'splash' | 'welcome' | 'dashboard';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#141416" />
      {screen === 'splash' && (
        <SplashScreen onFinish={() => setScreen('welcome')} />
      )}
      {screen === 'welcome' && (
        <WelcomeScreen
          onStartFree={() => setScreen('dashboard')}
          onSignIn={() => setScreen('dashboard')}
        />
      )}
      {screen === 'dashboard' && (
        <DashboardScreen onStartWorkout={() => {}} />
      )}
    </SafeAreaProvider>
  );
}

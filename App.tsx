import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkoutListScreen from './src/screens/WorkoutListScreen';
import WorkoutPlayerScreen from './src/screens/WorkoutPlayerScreen';
import WorkoutSetupScreen, { WorkoutRunConfig } from './src/screens/WorkoutSetupScreen';
import { loadAuthState, loginAsGuest } from './src/storage/authStorage';
import { Workout } from './src/data/workouts';

type Screen =
  | 'splash'
  | 'welcome'
  | 'dashboard'
  | 'workoutList'
  | 'workoutSetup'
  | 'workoutPlayer';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [runConfig, setRunConfig] = useState<WorkoutRunConfig | null>(null);

  const handleSplashFinish = async () => {
    const authState = await loadAuthState();
    setScreen(authState.isLoggedIn ? 'dashboard' : 'welcome');
  };

  const handleStartFree = async () => {
    await loginAsGuest();
    setScreen('dashboard');
  };

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setScreen('workoutSetup');
  };

  const handleStartRun = (config: WorkoutRunConfig) => {
    setRunConfig(config);
    setScreen('workoutPlayer');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#141416" />
      {screen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
      {screen === 'welcome' && (
        <WelcomeScreen
          onStartFree={handleStartFree}
          onSignIn={() => setScreen('dashboard')}
        />
      )}
      {screen === 'dashboard' && (
        <DashboardScreen onStartWorkout={() => setScreen('workoutList')} />
      )}
      {screen === 'workoutList' && (
        <WorkoutListScreen
          onSelectWorkout={handleSelectWorkout}
          onBack={() => setScreen('dashboard')}
        />
      )}
      {screen === 'workoutSetup' && selectedWorkout && (
        <WorkoutSetupScreen
          workout={selectedWorkout}
          onBack={() => setScreen('workoutList')}
          onStart={handleStartRun}
        />
      )}
      {screen === 'workoutPlayer' && selectedWorkout && runConfig && (
        <WorkoutPlayerScreen
          workout={selectedWorkout}
          config={runConfig}
          onExit={() => setScreen('dashboard')}
          onComplete={() => setScreen('dashboard')}
        />
      )}
    </SafeAreaProvider>
  );
}

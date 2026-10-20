import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import MenuScreen from './src/screens/MenuScreen';
import SplashScreen from './src/screens/SplashScreen';
import StatsScreen from './src/screens/StatsScreen';
import TrainingScheduleScreen from './src/screens/TrainingScheduleScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkoutListScreen from './src/screens/WorkoutListScreen';
import WorkoutPlayerScreen from './src/screens/WorkoutPlayerScreen';
import WorkoutSetupScreen from './src/screens/WorkoutSetupScreen';
import { LanguageProvider } from './src/i18n/LanguageContext';
import NotificationSync from './src/notifications/NotificationSync';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NotificationSync />
        <StatusBar barStyle="light-content" backgroundColor="#141416" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="TrainingSchedule" component={TrainingScheduleScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
            <Stack.Screen name="WorkoutSetup" component={WorkoutSetupScreen} />
            <Stack.Screen name="WorkoutPlayer" component={WorkoutPlayerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

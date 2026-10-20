import { Workout } from '../data/workouts';
import { WorkoutRunConfig } from '../screens/WorkoutSetupScreen';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  TrainingSchedule: undefined;
  Dashboard: undefined;
  Stats: undefined;
  Menu: undefined;
  WorkoutList: undefined;
  WorkoutSetup: { workout: Workout };
  WorkoutPlayer: { workout: Workout; config: WorkoutRunConfig };
};

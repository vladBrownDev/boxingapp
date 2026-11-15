import { Workout } from '../data/workouts';
import { WorkoutRunConfig } from '../screens/WorkoutSetupScreen';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  /** First-run stance question; continues to `next` afterwards. */
  Stance: { next: 'Welcome' | 'TrainingSchedule' | 'Dashboard' };
  TrainingSchedule: undefined;
  Dashboard: undefined;
  Stats: undefined;
  Menu: undefined;
  WorkoutList: undefined;
  WorkoutSetup: { workout: Workout };
  /** No workout = create a new one; with a custom workout = edit it. */
  WorkoutEditor: { workout?: Workout } | undefined;
  WorkoutPlayer: { workout: Workout; config: WorkoutRunConfig };
};

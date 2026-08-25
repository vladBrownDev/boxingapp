import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@punchfactory/auth';

export interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
}

const DEFAULT_AUTH_STATE: AuthState = { isLoggedIn: false, isGuest: false };

export async function loadAuthState(): Promise<AuthState> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : DEFAULT_AUTH_STATE;
  } catch {
    return DEFAULT_AUTH_STATE;
  }
}

export async function loginAsGuest(): Promise<void> {
  const state: AuthState = { isLoggedIn: true, isGuest: true };
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

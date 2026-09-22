import { NativeModules, Platform } from 'react-native';
import { Locale, translations } from './translations';

/** Reads the device's language tag straight from the native locale settings, without
 * pulling in a native-linked dependency (react-native-localize etc.) — both
 * NativeModules.SettingsManager (iOS) and NativeModules.I18nManager (Android) are core
 * modules bundled with React Native itself. */
function getDeviceLanguageTag(): string {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const appleLocale: string | undefined =
        settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
      return appleLocale ?? 'en';
    }
    return NativeModules.I18nManager?.localeIdentifier ?? 'en';
  } catch {
    return 'en';
  }
}

/** Maps the device's language tag (e.g. "es-MX", "fr_FR") to a supported app locale,
 * falling back to English for anything we don't have translations for. */
export function getDeviceLocale(): Locale {
  const languageCode = getDeviceLanguageTag().split(/[-_]/)[0].toLowerCase();
  return languageCode in translations ? (languageCode as Locale) : 'en';
}

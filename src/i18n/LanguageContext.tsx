import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceLocale } from './deviceLocale';
import { DEFAULT_LOCALE, Locale, LOCALES, TranslationKey, translations } from './translations';

const STORAGE_KEY = '@punchfactory/language';

type TranslateParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey, params?: TranslateParams) => string;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
  languages: typeof LOCALES;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Defaults to the phone's language on first launch; overridden below as soon as a
  // previously saved choice (from the menu's language picker) is found.
  const [locale, setLocaleState] = useState<Locale>(getDeviceLocale);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && saved in translations) {
        setLocaleState(saved as Locale);
      }
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback<TFunction>(
    (key, params) => interpolate(translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, languages: LOCALES }),
    [locale, setLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}

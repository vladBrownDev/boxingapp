import { TranslationKey } from '../i18n/translations';

/** Training tips shown during the prep countdown and rest periods. */
export const TIP_KEYS: TranslationKey[] = ['tip.mixItUp'];

/** Picks a random tip, avoiding an immediate repeat of `previous` when there's a choice. */
export function pickRandomTip(previous?: TranslationKey): TranslationKey {
  const pool = TIP_KEYS.length > 1 ? TIP_KEYS.filter(key => key !== previous) : TIP_KEYS;
  return pool[Math.floor(Math.random() * pool.length)];
}

import { TFunction } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

export type ComboLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/** What screens need to show and run a combo, whether built-in or user-built. */
export interface ComboInfo {
  id: string;
  /** Sequence of move codes from punchNotation.ts, in throwing order. */
  sequence: string[];
  /** User-given name. Only set on custom combos; built-in names come from translations. */
  name?: string;
}

export interface Combo extends ComboInfo {
  level: ComboLevel;
}

export const COMBOS: Combo[] = [
  {
    id: 'combo-1-2',
    level: 'Beginner',
    sequence: ['LHJ', 'RHC'],
  },
  {
    id: 'combo-1-2-3',
    level: 'Beginner',
    sequence: ['LHJ', 'RHC', 'LHH'],
  },
  {
    id: 'combo-double-jab-cross',
    level: 'Beginner',
    sequence: ['LHJ', 'LHJ', 'RHC'],
  },
  {
    id: 'combo-body-1-2',
    level: 'Beginner',
    sequence: ['LBJ', 'RBC'],
  },
  {
    id: 'combo-slip-counter',
    level: 'Intermediate',
    sequence: ['SR', 'LHH'],
  },
  {
    id: 'combo-slip-jab',
    level: 'Intermediate',
    sequence: ['SL+LHJ', 'RHC'],
  },
  {
    id: 'combo-hook-uppercut-cross',
    level: 'Intermediate',
    sequence: ['LHH', 'RHU', 'RHC'],
  },
  {
    id: 'combo-body-head-mix',
    level: 'Intermediate',
    sequence: ['LBJ', 'RBC', 'LHH', 'RHC'],
  },
  {
    id: 'combo-step-back-escape',
    level: 'Advanced',
    sequence: ['LHJ', 'RHC', 'LHH', 'SB'],
  },
  {
    id: 'combo-five-punch',
    level: 'Advanced',
    sequence: ['LHJ', 'RHC', 'LHH', 'LBH', 'RHU'],
  },
];

export function getComboById(id: string): Combo | undefined {
  return COMBOS.find(combo => combo.id === id);
}

export function getComboName(t: TFunction, combo: ComboInfo): string {
  return combo.name ?? t(`${combo.id}.name` as TranslationKey);
}

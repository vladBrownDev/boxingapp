import { TFunction } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

export type ComboLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Combo {
  id: string;
  level: ComboLevel;
  /** Sequence of move codes from punchNotation.ts, in throwing order. */
  sequence: string[];
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
    id: 'combo-duck-uppercut',
    level: 'Advanced',
    sequence: ['DK', 'RHU'],
  },
  {
    id: 'combo-pivot-escape',
    level: 'Advanced',
    sequence: ['LHJ', 'RHC', 'LHH', 'PVR'],
  },
  {
    id: 'combo-five-punch',
    level: 'Advanced',
    sequence: ['LHJ', 'RHC', 'LHH', 'LBH', 'RHU'],
  },
  {
    id: 'combo-weave-counter',
    level: 'Advanced',
    sequence: ['WL', 'LHH', 'RHC'],
  },
];

export function getComboById(id: string): Combo | undefined {
  return COMBOS.find(combo => combo.id === id);
}

export function getComboName(t: TFunction, combo: Combo): string {
  return t(`${combo.id}.name` as TranslationKey);
}

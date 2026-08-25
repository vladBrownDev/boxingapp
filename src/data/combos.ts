export type ComboLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Combo {
  id: string;
  name: string;
  level: ComboLevel;
  /** Sequence of move codes from punchNotation.ts, in throwing order. */
  sequence: string[];
  description: string;
}

export const COMBOS: Combo[] = [
  {
    id: 'combo-1-2',
    name: '1-2',
    level: 'Beginner',
    sequence: ['LHJ', 'RHC'],
    description: 'Jab-cross, the foundation of boxing.',
  },
  {
    id: 'combo-1-2-3',
    name: '1-2-3',
    level: 'Beginner',
    sequence: ['LHJ', 'RHC', 'LHH'],
    description: 'Jab, cross, lead hook.',
  },
  {
    id: 'combo-double-jab-cross',
    name: 'Double Jab Cross',
    level: 'Beginner',
    sequence: ['LHJ', 'LHJ', 'RHC'],
    description: 'Two jabs to set range and blind the guard, then a cross.',
  },
  {
    id: 'combo-body-1-2',
    name: 'Jab-Cross to Body',
    level: 'Beginner',
    sequence: ['LBJ', 'RBC'],
    description: 'Body jab into body cross.',
  },
  {
    id: 'combo-slip-counter',
    name: 'Slip Right, Counter Hook',
    level: 'Intermediate',
    sequence: ['SR', 'LHH'],
    description: "Slip right to evade the opponent's cross, counter with a left hook.",
  },
  {
    id: 'combo-slip-jab',
    name: 'Slip & Jab',
    level: 'Intermediate',
    sequence: ['SL+LHJ', 'RHC'],
    description: 'Slip left while throwing a jab at the same time, then follow with a cross.',
  },
  {
    id: 'combo-hook-uppercut-cross',
    name: 'Hook-Uppercut-Cross',
    level: 'Intermediate',
    sequence: ['LHH', 'RHU', 'RHC'],
    description: 'Lead hook, rear uppercut, cross — mixes angles on the way in.',
  },
  {
    id: 'combo-body-head-mix',
    name: 'Body-Head Combo',
    level: 'Intermediate',
    sequence: ['LBJ', 'RBC', 'LHH', 'RHC'],
    description: "Mix body shots into a head combo to lower the opponent's guard.",
  },
  {
    id: 'combo-duck-uppercut',
    name: 'Duck Under, Counter Uppercut',
    level: 'Advanced',
    sequence: ['DK', 'RHU'],
    description: 'Duck under the incoming hook and counter with a rear uppercut.',
  },
  {
    id: 'combo-pivot-escape',
    name: 'Pivot Escape Combo',
    level: 'Advanced',
    sequence: ['LHJ', 'RHC', 'LHH', 'PVR'],
    description: 'Standard 1-2-3 finished with a pivot to reset the angle and exit.',
  },
  {
    id: 'combo-five-punch',
    name: 'Five-Punch Combo',
    level: 'Advanced',
    sequence: ['LHJ', 'RHC', 'LHH', 'LBH', 'RHU'],
    description: 'Full combo mixing head and body, closing with a hook-uppercut.',
  },
  {
    id: 'combo-weave-counter',
    name: 'Weave & Counter',
    level: 'Advanced',
    sequence: ['WL', 'LHH', 'RHC'],
    description: 'Weave left under a hook, counter with lead hook into cross.',
  },
];

export function getComboById(id: string): Combo | undefined {
  return COMBOS.find(combo => combo.id === id);
}

/**
 * Combo notation legend.
 *
 * Punch codes: [Side][Level][Type] — always 3 letters, level is never omitted.
 *   Side:  L = Left hand   R = Right hand
 *   Level: H = Head        B = Body
 *   Type:  J = Jab   C = Cross   H = Hook   U = Uppercut
 *
 * Examples: RHC = Right Head Cross, RBH = Right Body Hook, LBJ = Left Body Jab
 * (Note Level "H" for Head and Type "H" for Hook are different letters in the
 * same slot — read the code positionally: side, then level, then type.)
 *
 * Every punch (side + type) exists as two explicit variants — a head version
 * and a body version — defined below via PunchDefinition, so each one carries
 * its own code and (later) its own reference image. Labels are localized on
 * demand via getPunchLabel/getDefenseLabel, keyed by code.
 *
 * Defense/movement codes are plain 2-3 letter codes that always start with a
 * letter other than L/R, so they can't collide with punch codes.
 *
 * Simultaneous actions (e.g. throwing a punch while slipping) are written as
 * two codes joined by "+": "SL+LHJ" = slip left while throwing a left head jab.
 */

import { TFunction } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

export type PunchCode =
  | 'LHJ' | 'LBJ' | 'LHC' | 'LBC' | 'LHH' | 'LBH' | 'LHU' | 'LBU'
  | 'RHJ' | 'RBJ' | 'RHC' | 'RBC' | 'RHH' | 'RBH' | 'RHU' | 'RBU';

export type PunchSide = 'L' | 'R';
export type PunchType = 'J' | 'C' | 'H' | 'U';
/** Where the punch is aimed — the head (face/guard level) or the body (ribs/liver level). */
export type PunchTarget = 'head' | 'body';

export interface PunchDefinition {
  code: PunchCode;
  side: PunchSide;
  type: PunchType;
  target: PunchTarget;
}

const TARGET_LEVEL_LETTER: Record<PunchTarget, string> = { head: 'H', body: 'B' };

function definePunch(side: PunchSide, type: PunchType, target: PunchTarget): PunchDefinition {
  const code = `${side}${TARGET_LEVEL_LETTER[target]}${type}` as PunchCode;
  return { code, side, type, target };
}

const SIDES: PunchSide[] = ['L', 'R'];
const TYPES: PunchType[] = ['J', 'C', 'H', 'U'];
const TARGETS: PunchTarget[] = ['head', 'body'];

/** Every punch variant — 2 sides x 4 types x 2 targets (head/body) = 16 definitions. */
export const PUNCHES: PunchDefinition[] = SIDES.flatMap(side =>
  TYPES.flatMap(type => TARGETS.map(target => definePunch(side, type, target))),
);

export const PUNCH_BY_CODE: Record<PunchCode, PunchDefinition> = Object.fromEntries(
  PUNCHES.map(punch => [punch.code, punch]),
) as Record<PunchCode, PunchDefinition>;

export function getPunchLabel(t: TFunction, code: PunchCode): string {
  return t(`punch.${code}` as TranslationKey);
}

/** Returns the head and body variant of the same punch (same side + type). */
export function getPunchVariants(
  side: PunchSide,
  type: PunchType,
): { head: PunchDefinition; body: PunchDefinition } {
  return {
    head: PUNCH_BY_CODE[`${side}H${type}` as PunchCode],
    body: PUNCH_BY_CODE[`${side}B${type}` as PunchCode],
  };
}

export type DefenseCode =
  | 'SL' | 'SR'   // Slip Left / Slip Right
  | 'DK'          // Duck
  | 'WL' | 'WR'   // Weave Left / Weave Right (roll under, moving side to side)
  | 'PL' | 'PR'   // Parry Left / Parry Right
  | 'BL'          // Block (guard up)
  | 'CU'          // Cover Up
  | 'PVL' | 'PVR' // Pivot Left / Pivot Right
  | 'SB' | 'SI'   // Step Back / Step In
  | 'STL' | 'STR'; // Step Left / Step Right (lateral footwork, not a slip)

export type MoveCode = PunchCode | DefenseCode;

const DEFENSE_CODES: DefenseCode[] = [
  'SL', 'SR', 'DK', 'WL', 'WR', 'PL', 'PR', 'BL', 'CU', 'PVL', 'PVR', 'SB', 'SI', 'STL', 'STR',
];

function isDefenseCode(code: string): code is DefenseCode {
  return (DEFENSE_CODES as string[]).includes(code);
}

export function getDefenseLabel(t: TFunction, code: DefenseCode): string {
  return t(`defense.${code}` as TranslationKey);
}

export function getMoveLabel(t: TFunction, code: MoveCode): string {
  return isDefenseCode(code) ? getDefenseLabel(t, code) : getPunchLabel(t, code);
}

function isMoveCode(code: string): code is MoveCode {
  return code in PUNCH_BY_CODE || isDefenseCode(code);
}

/** Resolves a single step, including "+"-joined simultaneous moves, to a readable label. */
export function describeMove(t: TFunction, step: string): string {
  return step
    .split('+')
    .map(code => (isMoveCode(code) ? getMoveLabel(t, code) : code))
    .join(' + ');
}

/** Finds the punch (ignoring any defense moves) within a single, possibly "+"-joined, step. */
export function getStepPunch(step: string): PunchDefinition | undefined {
  for (const code of step.split('+')) {
    const punch = PUNCH_BY_CODE[code as PunchCode];
    if (punch) {
      return punch;
    }
  }
  return undefined;
}

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
 * its own code, label, and (later) its own reference image.
 *
 * Defense/movement codes are plain 2-3 letter codes that always start with a
 * letter other than L/R, so they can't collide with punch codes.
 *
 * Simultaneous actions (e.g. throwing a punch while slipping) are written as
 * two codes joined by "+": "SL+LHJ" = slip left while throwing a left head jab.
 */

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
  label: string;
}

const SIDE_NAMES: Record<PunchSide, string> = { L: 'Left', R: 'Right' };
const PUNCH_TYPE_NAMES: Record<PunchType, string> = {
  J: 'Jab',
  C: 'Cross',
  H: 'Hook',
  U: 'Uppercut',
};
const TARGET_LEVEL_LETTER: Record<PunchTarget, string> = { head: 'H', body: 'B' };
const TARGET_NAMES: Record<PunchTarget, string> = { head: 'Head', body: 'Body' };

function definePunch(side: PunchSide, type: PunchType, target: PunchTarget): PunchDefinition {
  const code = `${side}${TARGET_LEVEL_LETTER[target]}${type}` as PunchCode;
  const label = `${SIDE_NAMES[side]} ${TARGET_NAMES[target]} ${PUNCH_TYPE_NAMES[type]}`;
  return { code, side, type, target, label };
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

export const PUNCH_LABELS: Record<PunchCode, string> = Object.fromEntries(
  PUNCHES.map(punch => [punch.code, punch.label]),
) as Record<PunchCode, string>;

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

export const DEFENSE_LABELS: Record<DefenseCode, string> = {
  SL: 'Slip Left',
  SR: 'Slip Right',
  DK: 'Duck',
  WL: 'Weave Left',
  WR: 'Weave Right',
  PL: 'Parry Left',
  PR: 'Parry Right',
  BL: 'Block',
  CU: 'Cover Up',
  PVL: 'Pivot Left',
  PVR: 'Pivot Right',
  SB: 'Step Back',
  SI: 'Step In',
  STL: 'Step Left',
  STR: 'Step Right',
};

export const MOVE_LABELS: Record<MoveCode, string> = {
  ...PUNCH_LABELS,
  ...DEFENSE_LABELS,
};

/** Resolves a single step, including "+"-joined simultaneous moves, to a readable label. */
export function describeMove(step: string): string {
  return step
    .split('+')
    .map(code => MOVE_LABELS[code as MoveCode] ?? code)
    .join(' + ');
}

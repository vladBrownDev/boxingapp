/**
 * Shared colour and type tokens.
 *
 * Elevation is lightness alone (ground → surface → raised), with no borders or
 * shadows on cards. Red is the bell: it marks rounds actually trained, the
 * work phase, and the one "start" action per screen. Selections and other
 * controls use brightness or a white fill, never red.
 */
export const colors = {
  ground: '#141416',
  /** Cards. Punch art in src/media/punches/ is normalised to this exact colour. */
  surface: '#1C1C24',
  /** Controls and nested panels on a surface. */
  raised: '#2A2A32',
  /** Hairline between rows inside one surface. */
  rule: '#24242C',
  /** Bottom bar sits one step below the ground. */
  sunken: '#0E0E10',

  text: '#FFFFFF',
  /** Secondary text: descriptions, meta lines. 7:1 on surface. */
  muted: '#A3A3B2',
  /** Tertiary text: dates, inactive nav. Still 4.5:1 on surface. */
  faint: '#8B8B9E',

  red: '#D42020',
  /** Red as text on dark grounds (passes 4.5:1 where #D42020 doesn't). */
  redText: '#F04A4A',
  /** Pale tint behind red marks. */
  redTint: '#3A1518',

  /** Inverted control: white fill, ground-coloured label. */
  inverse: '#FFFFFF',
  inverseText: '#141416',
};

export const radius = {
  card: 14,
  control: 10,
  chip: 6,
};

export const type = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  section: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
};

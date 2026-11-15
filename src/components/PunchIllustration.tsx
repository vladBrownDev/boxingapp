import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { PunchCode, punchCodeForStance, PunchDefinition } from '../data/punchNotation';
import { useStance } from '../stance/StanceContext';

/**
 * Drawn reference art for each punch (src/media/punches/, square 384px,
 * background normalised to the #1C1C24 card colour so it blends into chips).
 */
const PUNCH_IMAGES: Record<PunchCode, ImageSourcePropType> = {
  LHJ: require('../media/punches/LHJ.png'),
  LBJ: require('../media/punches/LBJ.png'),
  LHC: require('../media/punches/LHC.png'),
  LBC: require('../media/punches/LBC.png'),
  LHH: require('../media/punches/LHH.png'),
  LBH: require('../media/punches/LBH.png'),
  LHU: require('../media/punches/LHU.png'),
  LBU: require('../media/punches/LBU.png'),
  RHJ: require('../media/punches/RHJ.png'),
  RBJ: require('../media/punches/RBJ.png'),
  RHC: require('../media/punches/RHC.png'),
  RBC: require('../media/punches/RBC.png'),
  RHH: require('../media/punches/RHH.png'),
  RBH: require('../media/punches/RBH.png'),
  RHU: require('../media/punches/RHU.png'),
  RBU: require('../media/punches/RBU.png'),
};

interface Props {
  /** The punch as the user throws it in their own stance (e.g. RHJ is a southpaw's jab). */
  punch: PunchDefinition;
  size?: number;
}

/** The art is drawn for an orthodox boxer. For a southpaw, the same punch is the orthodox
 * one with hands swapped, so we show that drawing flipped horizontally: a southpaw's
 * Right Head Jab is the orthodox Left Head Jab, mirrored. */
export default function PunchIllustration({ punch, size = 64 }: Props) {
  const { stance } = useStance();
  const isMirrored = stance === 'southpaw';
  const artCode = punchCodeForStance(punch.code, stance);
  return (
    <Image
      source={PUNCH_IMAGES[artCode]}
      style={[
        styles.image,
        { width: size, height: size, borderRadius: size * 0.14 },
        isMirrored && styles.mirrored,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#1C1C24',
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
});

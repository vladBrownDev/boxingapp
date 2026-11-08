import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { PunchCode, PunchDefinition } from '../data/punchNotation';

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
  punch: PunchDefinition;
  size?: number;
}

export default function PunchIllustration({ punch, size = 64 }: Props) {
  return (
    <Image
      source={PUNCH_IMAGES[punch.code]}
      style={[styles.image, { width: size, height: size, borderRadius: size * 0.14 }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#1C1C24',
  },
});

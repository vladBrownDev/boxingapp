import React from 'react';
import { StyleSheet, View } from 'react-native';
import GloveIcon from '../media/glove.svg';
import { PunchDefinition } from '../data/punchNotation';

/**
 * Placeholder art for a punch: a generic glove icon, mirrored to match the
 * punch's side. Swap the icon/rendering here once real reference photos
 * exist — callers only pass a PunchDefinition, not an image asset.
 */
interface Props {
  punch: PunchDefinition;
  size?: number;
}

export default function PunchIllustration({ punch, size = 64 }: Props) {
  const iconSize = Math.round(size * 0.56);
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.14 }]}>
      <View style={punch.side === 'R' && styles.mirrored}>
        <GloveIcon width={iconSize} height={iconSize} color="#E83535" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
});

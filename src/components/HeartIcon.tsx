import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  filled: boolean;
  size?: number;
  color: string;
}

/** Favourite toggle mark: an outline when off, solid when on. */
export default function HeartIcon({ filled, size = 22, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 20.5s-7.5-4.6-7.5-10.2C4.5 7.4 6.7 5.5 9 5.5c1.4 0 2.4.7 3 1.6.6-.9 1.6-1.6 3-1.6 2.3 0 4.5 1.9 4.5 4.8 0 5.6-7.5 10.2-7.5 10.2z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

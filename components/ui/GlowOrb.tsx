/**
 * GlowOrb — soft radial glow blob used behind cards/panels to create the
 * "cinematic ambient light" look (e.g. behind the History overview card,
 * Coach AI hero card).
 *
 * Uses react-native-svg's RadialGradient (true circular falloff, color →
 * transparent at ~70%) instead of a diagonal LinearGradient corner-fade —
 * the linear version looked like a hard-edged gradient patch on device
 * instead of a soft round glow. RadialGradient renders identically to the
 * CSS reference (`radial-gradient(circle, color, transparent 70%)`) and is
 * still a single cheap SVG draw, no runtime blur cost.
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';

interface GlowOrbProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  opacity?: number;
  /** fraction (0-1) of the radius where the color fades to transparent, default 0.7 to match CSS reference */
  falloff?: number;
}

let idCounter = 0;

export const GlowOrb: React.FC<GlowOrbProps> = ({
  size = 180,
  color = 'rgba(0,255,157,0.35)',
  style,
  opacity = 0.5,
  falloff = 0.7,
}) => {
  const gradId = React.useRef(`glowOrb${idCounter++}`).current;

  return (
    <Svg
      width={size}
      height={size}
      style={[{ position: 'absolute' }, style]}
      pointerEvents="none"
    >
      <Defs>
        <SvgRadialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset={`${falloff * 100}%`} stopColor={color} stopOpacity={0} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} fill={`url(#${gradId})`} />
    </Svg>
  );
};

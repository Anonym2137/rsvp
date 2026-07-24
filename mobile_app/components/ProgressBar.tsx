/**
 * ProgressBar — simple progress indicator.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  value: number; // 0-100
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

export default function ProgressBar({ value, height = 6, trackColor, fillColor }: Props) {
  const { colors } = useTheme();
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor ?? colors.surface3,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            width: `${clampedValue}%`,
            backgroundColor: fillColor ?? colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

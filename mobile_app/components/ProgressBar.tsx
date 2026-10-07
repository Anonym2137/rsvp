import React from 'react';
import { Progress, ProgressFilledTrack } from './ui/progress';
import { useTheme } from '../hooks/useTheme';

interface Props { value: number; height?: number; trackColor?: string; fillColor?: string }
export default function ProgressBar({ value, height = 8, trackColor, fillColor }: Props) {
  const { colors } = useTheme();
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <Progress value={clamped} style={{ height, borderRadius: height / 2, backgroundColor: trackColor ?? colors.surface3 }}>
    <ProgressFilledTrack style={{ height, borderRadius: height / 2, backgroundColor: fillColor ?? colors.accentEmerald }} />
  </Progress>;
}

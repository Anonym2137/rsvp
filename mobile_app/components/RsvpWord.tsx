/**
 * RsvpWord — displays a single word with the ORP letter highlighted.
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { FormattedWord } from '../types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  word: FormattedWord;
  fontSize?: number;
}

export default function RsvpWord({ word, fontSize = 28 }: Props) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.base, { fontSize, color: colors.foreground }]}>
      {word.part1}
      <Text style={{ color: colors.accentEmerald, fontWeight: '900' }}>
        {word.focus}
      </Text>
      {word.part2}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Inter',
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});

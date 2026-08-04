/**
 * StarRating — tappable 1–5 star control.
 */
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  max?: number;
}

export default function StarRating({ value, onChange, size = 34, max = 5 }: Props) {
  const { colors } = useTheme();
  const [hover, setHover] = React.useState(0);

  const active = hover || value;
  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= active;
        return (
          <Pressable
            key={idx}
            onPress={() => onChange(idx)}
            onPressIn={() => setHover(idx)}
            onPressOut={() => setHover(0)}
            hitSlop={6}
          >
            <Star
              size={size}
              color={filled ? '#fbbf24' : colors.border}
              fill={filled ? '#fbbf24' : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
});

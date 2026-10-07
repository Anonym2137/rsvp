import { useTranslation } from 'react-i18next';
import { Action } from './DesignSystem';
/**
 * StarRating — tappable 1–5 star control.
 */
import React from 'react';
import { View,  StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  max?: number;
}

export default function StarRating({ value, onChange, size = 34, max = 5 }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hover, setHover] = React.useState(0);

  const active = hover || value;
  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= active;
        return (
          <Action
            key={idx}
            accessibilityLabel={t('accessibility.rating', { value: idx, max })}
            accessibilityState={{ selected: idx === value }}
            onPress={() => onChange(idx)}
            onPressIn={() => setHover(idx)}
            onPressOut={() => setHover(0)}
            hitSlop={6}
          >
            <Star
              size={size}
              color={filled ? colors.accentAmber : colors.border}
              fill={filled ? colors.accentAmber : 'transparent'}
              strokeWidth={2}
            />
          </Action>
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

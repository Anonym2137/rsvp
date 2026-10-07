import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { BookOpen, LoaderCircle, Sparkles } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

const sources = {
  book: require('../assets/animations/book.json'),
  loading: require('../assets/animations/loading.json'),
  completion: require('../assets/animations/completion.json'),
};
export default function StateAnimation({ kind, visible = true, size = 112 }: {
  kind: keyof typeof sources; visible?: boolean; size?: number;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const ref = useRef<LottieView>(null);
  // Start static until the accessibility preference has been read.
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const state = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted = false; motion.remove(); state.remove(); };
  }, []);
  const playing = visible && focused && active && !reduced && !failed;
  useEffect(() => {
    if (playing) ref.current?.play(); else ref.current?.pause();
  }, [playing]);
  if (!visible) return null;
  const Icon = kind === 'book' ? BookOpen : kind === 'completion' ? Sparkles : LoaderCircle;
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {reduced || failed ? <Icon size={size * .55} color={colors.primary} /> :
        <LottieView ref={ref} source={sources[kind]} autoPlay={playing} loop={kind !== 'completion'}
          onAnimationFailure={() => setFailed(true)} onAnimationLoaded={() => { if (playing) ref.current?.play(); }}
          style={{ width: size, height: size }} webStyle={{ width: size, height: size }} />}
    </View>
  );
}

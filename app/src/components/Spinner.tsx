import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BRAND } from '@/theme/ThemeProvider';

interface Props {
  size?: number;
  thickness?: number;
}

export function Spinner({ size = 28, thickness = 3 }: Props) {
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
  }, [rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: BRAND.tealLight,
          borderTopColor: BRAND.tealDark,
          borderRightColor: BRAND.teal,
        },
        style,
      ]}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { BRAND } from '@/theme/ThemeProvider';

type Props = Omit<ComponentProps<typeof LinearGradient>, 'colors'> & {
  variant?: 'primary' | 'soft';
};

export function TealGradient({ variant = 'primary', start, end, ...rest }: Props) {
  const colors =
    variant === 'soft'
      ? ([BRAND.tealLight, BRAND.teal] as const)
      : ([BRAND.tealLight, BRAND.tealDark] as const);
  return (
    <LinearGradient
      colors={colors as unknown as [string, string]}
      start={start ?? { x: 0, y: 0 }}
      end={end ?? { x: 1, y: 1 }}
      {...rest}
    />
  );
}

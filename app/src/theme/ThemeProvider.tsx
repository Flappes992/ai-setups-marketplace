import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

interface Palette {
  bg: string;
  bgSecondary: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentText: string;
  like: string;
  save: string;
}

export const BRAND = {
  teal: '#2DD4BF',
  tealLight: '#5EEAD4',
  tealDark: '#14B8A6',
  tileDark: '#181B22',
  like: '#ef4444',
} as const;

const lightPalette: Palette = {
  bg: '#fff',
  bgSecondary: '#f7f7f7',
  surface: '#f5f5f5',
  text: '#111',
  textSecondary: '#666',
  border: '#eee',
  accent: BRAND.teal,
  accentLight: BRAND.tealLight,
  accentDark: BRAND.tealDark,
  accentText: '#0b3b35',
  like: BRAND.like,
  save: BRAND.teal,
};

const darkPalette: Palette = {
  bg: '#0b0b0b',
  bgSecondary: '#111',
  surface: '#1a1a1a',
  text: '#fff',
  textSecondary: '#aaa',
  border: '#262626',
  accent: BRAND.teal,
  accentLight: BRAND.tealLight,
  accentDark: BRAND.tealDark,
  accentText: '#0b3b35',
  like: BRAND.like,
  save: BRAND.teal,
};

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  palette: Palette;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  isDark: false,
  palette: lightPalette,
});

const STORAGE_KEY = 'setiq.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sysScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && sysScheme === 'dark');
  const palette = isDark ? darkPalette : lightPalette;

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, palette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

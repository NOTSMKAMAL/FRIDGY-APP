// app/theme/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePref = 'light' | 'dark' | 'system';
type Palette = {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  tint: string;
  border: string;
  iconBg: string;
  danger: string;
};

const light: Palette = {
  bg: '#FFFFFF',
  card: '#F5F5F5',
  text: '#111111',
  subtext: '#666666',
  tint: '#007AFF',
  border: '#E6E6E6',
  iconBg: '#E8E8E8',
  danger: '#FF3B30',
};

const dark: Palette = {
  bg: '#181818',
  card: '#2A2A2A',
  text: '#FFFFFF',
  subtext: '#AAAAAA',
  tint: '#0A84FF',
  border: '#3A3A3A',
  iconBg: '#3A3A3A',
  danger: '#FF453A',
};

const THEME_KEY = 'fridgy:theme';

type Ctx = {
  themePref: ThemePref;
  setThemePref: (t: ThemePref) => void;
  colorScheme: Exclude<ColorSchemeName, 'no-preference'>; // 'light' | 'dark'
  palette: Palette;
  isDark: boolean;
  setDarkEnabled: (enabled: boolean) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [system, setSystem] = useState<Exclude<ColorSchemeName, 'no-preference'>>(
    (Appearance.getColorScheme() as any) || 'light'
  );

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') setThemePref(saved);
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem((colorScheme as any) || 'light');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(THEME_KEY, themePref).catch(() => {});
  }, [themePref]);

  const colorScheme = themePref === 'system' ? system : themePref;
  const palette = colorScheme === 'dark' ? dark : light;

  const value = useMemo<Ctx>(
    () => ({
      themePref,
      setThemePref,
      colorScheme,
      palette,
      isDark: colorScheme === 'dark',
      setDarkEnabled: (enabled: boolean) => setThemePref(enabled ? 'dark' : 'light'),
    }),
    [themePref, colorScheme, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
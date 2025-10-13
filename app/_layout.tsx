// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import './globals.css';
import { ThemeProvider, useTheme } from './theme/themeContext';

function ThemedStack() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,                 // keep your current behavior
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
import { createContext, useContext, ReactNode } from 'react';
import { View, useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { useUserSettingsContext } from './UserSettingsContext';

export const DARK_COLORS = {
  surface: '#0f0f0f',
  surfaceElevated: '#1a1a1a',
  surfaceCard: '#242424',
  accent: '#e8c97e',
  accentMuted: '#b89a5a',
  textPrimary: '#f5f5f5',
  textSecondary: '#a0a0a0',
  textMuted: '#606060',
  border: '#2a2a2a',
  danger: '#e05c5c',
  success: '#5ce07a',
};

export const LIGHT_COLORS = {
  surface: '#f8f7f4',
  surfaceElevated: '#ffffff',
  surfaceCard: '#f0ede8',
  accent: '#e8c97e',
  accentMuted: '#b89a5a',
  textPrimary: '#141414',
  textSecondary: '#5a5a5a',
  textMuted: '#9a9a9a',
  border: '#e0ddd8',
  danger: '#c94444',
  success: '#3ab85c',
};

export type ThemeColors = typeof DARK_COLORS;

// CSS variable maps for each theme — always applied from initial render so
// react-native-css-interop doesn't treat first-time variable injection as a remount.
const DARK_VARS = vars({
  '--color-surface': DARK_COLORS.surface,
  '--color-surface-elevated': DARK_COLORS.surfaceElevated,
  '--color-surface-card': DARK_COLORS.surfaceCard,
  '--color-accent': DARK_COLORS.accent,
  '--color-accent-muted': DARK_COLORS.accentMuted,
  '--color-text-primary': DARK_COLORS.textPrimary,
  '--color-text-secondary': DARK_COLORS.textSecondary,
  '--color-text-muted': DARK_COLORS.textMuted,
  '--color-border': DARK_COLORS.border,
  '--color-danger': DARK_COLORS.danger,
  '--color-success': DARK_COLORS.success,
});

const LIGHT_VARS = vars({
  '--color-surface': LIGHT_COLORS.surface,
  '--color-surface-elevated': LIGHT_COLORS.surfaceElevated,
  '--color-surface-card': LIGHT_COLORS.surfaceCard,
  '--color-accent': LIGHT_COLORS.accent,
  '--color-accent-muted': LIGHT_COLORS.accentMuted,
  '--color-text-primary': LIGHT_COLORS.textPrimary,
  '--color-text-secondary': LIGHT_COLORS.textSecondary,
  '--color-text-muted': LIGHT_COLORS.textMuted,
  '--color-border': LIGHT_COLORS.border,
  '--color-danger': LIGHT_COLORS.danger,
  '--color-success': LIGHT_COLORS.success,
});

interface ThemeContextValue {
  resolvedTheme: 'dark' | 'light';
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  resolvedTheme: 'dark',
  colors: DARK_COLORS,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserSettingsContext();
  const systemScheme = useColorScheme(); // from react-native — no NativeWind dependency

  const userTheme = settings?.theme ?? 'dark';
  const resolvedTheme: 'dark' | 'light' =
    userTheme === 'system'
      ? (systemScheme ?? 'dark')
      : (userTheme as 'dark' | 'light');

  const colors = resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ resolvedTheme, colors }}>
      <View className="flex-1" style={resolvedTheme === 'light' ? LIGHT_VARS : DARK_VARS}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}

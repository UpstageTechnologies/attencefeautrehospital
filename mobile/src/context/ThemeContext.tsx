import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export type AppTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  headerBackground: string;
  headerText: string;
  headerSubtitle: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarShadow: string;
  primary: string;
  primaryLight: string;
  accent: string;
  divider: string;
  inputBackground: string;
  inputBorder: string;
  modalOverlay: string;
  badgeBackground: string;
  badgeText: string;
}

const lightThemeColors: ThemeColors = {
  background: '#F8FAFC',          // Crisp off-white surface
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  headerBackground: '#F8FAFC',    // Seamless with page
  headerText: '#0F172A',
  headerSubtitle: '#64748B',
  tabBarBackground: '#0F172A',    // Floating dark obsidian pill
  tabBarBorder: 'rgba(255, 255, 255, 0.12)',
  tabBarShadow: 'rgba(0, 0, 0, 0.25)',
  primary: '#2563EB',             // Vibrant Medical Royal Blue
  primaryLight: '#EFF6FF',
  accent: '#38BDF8',
  divider: '#F1F5F9',
  inputBackground: '#F1F5F9',
  inputBorder: '#E2E8F0',
  modalOverlay: 'rgba(15, 23, 42, 0.55)',
  badgeBackground: '#EFF6FF',
  badgeText: '#2563EB',
};

const darkThemeColors: ThemeColors = {
  background: '#090D16',          // Deep Midnight Slate
  surface: '#0F172A',
  card: '#131C2E',
  cardBorder: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  headerBackground: '#090D16',
  headerText: '#F8FAFC',
  headerSubtitle: '#94A3B8',
  tabBarBackground: '#0F172A',
  tabBarBorder: 'rgba(255, 255, 255, 0.18)',
  tabBarShadow: '#000000',
  primary: '#38BDF8',
  primaryLight: 'rgba(56, 189, 248, 0.15)',
  accent: '#00FFCC',
  divider: '#1E293B',
  inputBackground: '#131C2E',
  inputBorder: '#1E293B',
  modalOverlay: 'rgba(0, 0, 0, 0.8)',
  badgeBackground: 'rgba(56, 189, 248, 0.18)',
  badgeText: '#38BDF8',
};

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (newTheme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<AppTheme>(systemScheme === 'dark' ? 'dark' : 'light');

  const isDark = theme === 'dark';
  const currentColors = isDark ? darkThemeColors : lightThemeColors;

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: currentColors,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

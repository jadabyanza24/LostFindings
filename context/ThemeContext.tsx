import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;
  card: string;
  primary: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  
  // Backward compatibility mapping
  bg: string;
  text: string;
  muted: string;
  accent: string;
  green: string;
  red: string;
  blue: string;
  yellow: string;
  accentText: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F9F5', // Soft sage-tinted white (calming)
  surface: '#FFFFFF',
  surface2: '#E8F0E8', // Calming sage-tinted surface
  card: '#FFFFFF',
  primary: '#2E7D32', // Calming green
  secondary: '#2196F3',
  textPrimary: '#1B5E20', // Dark forest green (calming text)
  textSecondary: '#557A56', // Soft sage green
  border: '#E1EBE1', // Sage-tinted light borders
  success: '#2E7D32',
  warning: '#F9A825',
  error: '#C62828',

  // Legacy mappings
  bg: '#F5F9F5',
  text: '#1B5E20',
  muted: '#557A56',
  accent: '#2E7D32',
  green: '#2E7D32',
  red: '#C62828',
  blue: '#2196F3',
  yellow: '#F9A825',
  accentText: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surface2: '#2A2A2A',
  card: '#242424',
  primary: '#81C784', // Soft mint green for dark mode readability
  secondary: '#64B5F6',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  border: '#333333',
  success: '#81C784',
  warning: '#FBC02D',
  error: '#E53935',

  // Legacy mappings
  bg: '#121212',
  text: '#FFFFFF',
  muted: '#B3B3B3',
  accent: '#81C784',
  green: '#81C784',
  red: '#E53935',
  blue: '#64B5F6',
  yellow: '#FBC02D',
  accentText: '#121212',
};

export type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    // Load persisted theme
    AsyncStorage.getItem('themePreference').then((val) => {
      if (val === 'light' || val === 'dark') {
        setThemeState(val);
      }
    });
  }, []);

  const setTheme = async (type: ThemeType) => {
    setThemeState(type);
    await AsyncStorage.setItem('themePreference', type);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

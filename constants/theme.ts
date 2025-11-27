// Design System - Asset Management App
// Colors inspired by Shamlan Tobacco company logo

export const colors = {
  // Primary Colors (from logo)
  primary: {
    navy: '#1E3A8A',      // Deep navy blue
    navyDark: '#1E293B',  // Darker navy
    gold: '#F59E0B',      // Golden/amber
    goldLight: '#FCD34D', // Light gold
  },
  
  // Semantic Colors
  background: {
    light: '#F8FAFC',
    white: '#FFFFFF',
    dark: '#0F172A',
  },
  
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    inverse: '#FFFFFF',
    gold: '#F59E0B',
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // UI Elements
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },
  
  input: {
    background: '#F1F5F9',
    border: '#CBD5E1',
    focus: '#F59E0B',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

import { Brand } from '@/constants/theme';

export const AuthGradients = {
  white: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  light: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  hybrid: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] as const,
  primary: [Brand.primary, '#49011f', '#081023', '#020617'] as const,
} as const;

export const AuthBrandMark = require('../../assets/images/icon3.png');

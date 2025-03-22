import type { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'Inter, sans-serif',
  components: {
    Container: {
      defaultProps: {
        size: 'lg',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
    },
  },
  colors: {
    // Custom color palette
    brand: [
      '#E6F6FF',
      '#BAE3FF',
      '#7CC4FA',
      '#47A3F3',
      '#2186EB',
      '#0967D2',
      '#0552B5',
      '#03449E',
      '#01337D',
      '#002159',
    ],
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
    '2xl': '100em',
  },
}; 
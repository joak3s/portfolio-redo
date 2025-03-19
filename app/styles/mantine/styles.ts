import { createStyles } from '@mantine/styles';
import type { MantineThemeOverride } from '@mantine/core';

export const useGlassStyles = createStyles((theme) => ({
  glassCard: {
    background: `rgba(59, 130, 246, 0.1)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid rgba(37, 99, 235, 0.2)`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.md,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.lg,
    },
  },
}));

export const useGradientStyles = createStyles((theme) => ({
  gradientText: {
    background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  gradientBorder: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: theme.radius.lg,
      padding: '1px',
      background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
  },
}));

export const useGlowStyles = createStyles((theme) => ({
  glowCard: {
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: -1,
      borderRadius: theme.radius.lg,
      background: 'linear-gradient(45deg, rgba(37, 99, 235, 0.3), rgba(29, 78, 216, 0.3))',
      filter: 'blur(8px)',
      zIndex: -1,
    },
  },
})); 
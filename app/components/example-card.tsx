'use client';

import { Card, Text, Group } from '@mantine/core';
import { useGlassStyles, useGradientStyles, useGlowStyles } from '../styles/mantine/styles';

export function ExampleCard() {
  const { classes: glassClasses } = useGlassStyles();
  const { classes: gradientClasses } = useGradientStyles();
  const { classes: glowClasses } = useGlowStyles();

  return (
    <Card className={`${glassClasses.glassCard} ${glowClasses.glowCard}`}>
      <Group justify="space-between" mb="xs">
        <Text className={gradientClasses.gradientText} size="xl" fw={500}>
          Example Card
        </Text>
      </Group>
      <Text size="sm" c="dimmed">
        This card demonstrates the use of glassmorphic effects, gradient text, and glowing borders using Mantine styles.
      </Text>
    </Card>
  );
} 
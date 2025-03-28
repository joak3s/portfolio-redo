'use client';

import { useEffect, useState } from 'react';

interface MouseGradientOptions {
  gradientSize?: number;
  color?: string;
  secondaryColor?: string;
  opacity?: number;
  type?: 'radial' | 'linear';
  spread?: number;
}

export function useMouseGradient({
  gradientSize = 300,
  color = '147, 51, 234',
  secondaryColor,
  opacity = 0.15,
  type = 'radial',
  spread = 100,
}: MouseGradientOptions = {}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isActive) setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isActive]);

  const gradientStyle = {
    position: 'fixed',
    pointerEvents: 'none',
    width: `${gradientSize}px`,
    height: `${gradientSize}px`,
    borderRadius: '50%',
    left: `${position.x - gradientSize / 2}px`,
    top: `${position.y - gradientSize / 2}px`,
    background: secondaryColor
      ? `${type === 'radial' ? 'radial-gradient' : 'linear-gradient'}(
          circle at center,
          rgba(${color}, ${opacity}),
          rgba(${secondaryColor}, ${opacity}) ${spread}%,
          transparent 100%
        )`
      : `${type === 'radial' ? 'radial-gradient' : 'linear-gradient'}(
          circle at center,
          rgba(${color}, ${opacity}),
          transparent ${spread}%
        )`,
    zIndex: 99999,
    transform: 'translate3d(0, 0, 0)',
    transition: 'opacity 0.3s ease',
    opacity: isActive ? 1 : 0,
  } as const;

  return { position, isActive, gradientStyle };
} 
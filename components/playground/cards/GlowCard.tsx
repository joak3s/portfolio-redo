'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface GlowCardProps extends Omit<HTMLMotionProps<"div">, "title" | "children"> {
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

const cardVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

export function GlowCard({
  title,
  description,
  className,
  onClick,
  ...props
}: GlowCardProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      role="button"
      tabIndex={0}
      aria-label={`${title} - ${description}`}
      className={cn(
        'relative group cursor-pointer outline-none h-full',
        'focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-purple-400',
        className
      )}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{ willChange: 'transform' }}
      {...props}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-500"
        style={{ willChange: 'opacity' }}
      />
      <div 
        className="h-full relative p-6 dark:bg-neutral-950/90 bg-white/90 ring-1 dark:ring-neutral-800/50 ring-neutral-200/50 rounded-lg backdrop-blur-xl flex flex-col"
        style={{ willChange: 'transform' }}
      >
        <div className="space-y-2 flex flex-col flex-1">
          <h3 className="dark:text-white text-neutral-900 font-semibold text-base md:text-lg">
            {title}
          </h3>
          <p className="dark:text-neutral-300 text-neutral-600 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
} 
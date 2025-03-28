'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, Github } from 'lucide-react';
import Link from 'next/link';
import { useMouseGradient } from '@/hooks/useMouseGradient';

interface InteractiveProjectCardProps {
  title: string;
  description: string;
  link: string;
  github?: string;
  tags: string[];
  className?: string;
  onClick?: () => void;
}

export function InteractiveProjectCard({
  title,
  description,
  link,
  github,
  tags,
  className,
  onClick
}: InteractiveProjectCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const mouseGradient = useMouseGradient({
    gradientSize: 450,
    color: '147, 51, 234',
    secondaryColor: '59, 130, 246',
    opacity: 0.15,
    type: 'radial',
    spread: 80
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, []);

  useEffect(() => {
    let animationFrame: number;
    
    const animateGlow = () => {
      if (isHovered || isFocused) {
        setGlowPosition(prev => ({
          x: prev.x + (position.x - prev.x) * 0.1,
          y: prev.y + (position.y - prev.y) * 0.1
        }));
      }
      animationFrame = requestAnimationFrame(animateGlow);
    };

    animationFrame = requestAnimationFrame(animateGlow);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, isHovered, isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${title} - ${description}`}
      className={cn(
        "relative group cursor-pointer outline-none",
        "focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-purple-400",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPosition({ x: 50, y: 50 });
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        willChange: 'transform',
        contain: 'layout'
      }}
    >
      {/* Animated border container */}
      <div 
        className="absolute -inset-[1px] rounded-2xl overflow-hidden"
        style={{ willChange: 'opacity' }}
      >
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `
              radial-gradient(
                circle at ${glowPosition.x}% ${glowPosition.y}%,
                rgba(147, 51, 234, 0.5),
                rgba(59, 130, 246, 0.5) 50%,
                transparent 100%
              )
            `,
            opacity: (isHovered || isFocused) ? 1 : 0.3,
            willChange: 'background, opacity'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative rounded-2xl dark:bg-neutral-950/90 bg-white/90 backdrop-blur-xl border dark:border-white/10 border-black/10 p-6">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-white text-neutral-900">{title}</h3>
            <div className="flex gap-2">
              {github && (
                <Link
                  href={github}
                  className="p-2 -mr-2 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                  target="_blank"
                >
                  <Github className="w-5 h-5 dark:text-white text-neutral-900" />
                </Link>
              )}
              <Link
                href={link}
                className="p-2 -mr-2 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                target="_blank"
              >
                <ArrowUpRight className="w-5 h-5 dark:text-white text-neutral-900" />
              </Link>
            </div>
          </div>
          <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-4 flex-grow">{description}</p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs rounded-lg dark:bg-white/5 bg-black/5 dark:text-white text-neutral-900 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 
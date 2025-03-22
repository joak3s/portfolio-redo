'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from './utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 1200,
  height = 630,
  className,
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded-lg object-cover', className)}
      priority={false}
      quality={90}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
};

const ProjectImage: React.FC<Omit<OptimizedImageProps, 'width' | 'height'>> = ({
  src,
  alt,
  className,
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={className}
    />
  );
};

const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'width' | 'height'>> = ({
  src,
  alt,
  className,
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={className}
    />
  );
};

export { OptimizedImage, ProjectImage, ThumbnailImage }; 
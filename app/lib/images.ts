import Image from 'next/image';
import { cn } from '@/app/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width = 1200,
  height = 630,
  className,
}: OptimizedImageProps): JSX.Element {
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
}

export function ProjectImage({
  src,
  alt,
  className,
}: Omit<OptimizedImageProps, 'width' | 'height'>): JSX.Element {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={className}
    />
  );
}

export function ThumbnailImage({
  src,
  alt,
  className,
}: Omit<OptimizedImageProps, 'width' | 'height'>): JSX.Element {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={className}
    />
  );
} 
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { ProjectImage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProjectImageGalleryProps {
  images: ProjectImage[]
  className?: string
}

export function ProjectImageGallery({ images, className }: ProjectImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const handlePrevious = () => {
    if (selectedImageIndex === null) return
    setSelectedImageIndex(
      selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1
    )
  }

  const handleNext = () => {
    if (selectedImageIndex === null) return
    setSelectedImageIndex(
      selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') setSelectedImageIndex(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => setSelectedImageIndex(index)}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {image.caption && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => !open && setSelectedImageIndex(null)}
      >
        <DialogContent
          className="max-w-5xl p-0 bg-transparent border-none"
          onKeyDown={handleKeyDown}
        >
          {selectedImageIndex !== null && (
            <div className="relative">
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                <Image
                  src={images[selectedImageIndex].url}
                  alt={images[selectedImageIndex].alt}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {images[selectedImageIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
                  <p className="text-white text-sm">
                    {images[selectedImageIndex].caption}
                  </p>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white bg-black/20 hover:bg-black/40"
                onClick={() => setSelectedImageIndex(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white bg-black/20 hover:bg-black/40"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white bg-black/20 hover:bg-black/40"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
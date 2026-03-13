'use client'

import { useEffect } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt?: string
  analyzedUrl?: string
  onClose: () => void
}

export default function ScreenshotLightbox({ src, alt = 'Full page screenshot', analyzedUrl, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#1a1a1a] border border-[#333] rounded-full w-9 h-9 flex items-center justify-center text-xl transition-colors z-10"
        aria-label="Close"
      >
        ×
      </button>

      {/* Image container — stop click propagation so clicking the image doesn't close */}
      <div
        className="relative max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-auto border border-[#333] bg-[#0d0d0d]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {analyzedUrl && (
          <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur-sm px-5 py-3 border-b border-[#222] flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate">{analyzedUrl}</p>
            <a
              href={analyzedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-400 hover:text-orange-300 shrink-0 ml-4"
              onClick={(e) => e.stopPropagation()}
            >
              Open page ↗
            </a>
          </div>
        )}

        {/* Full image — natural height */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>
    </div>
  )
}

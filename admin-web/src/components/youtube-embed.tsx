'use client'

import { useState } from 'react'
import { getYouTubeId } from '@/lib/utils'
import { Play, X } from 'lucide-react'

export function YouTubeEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)
  const videoId = getYouTubeId(url)

  if (!videoId) {
    return (
      <div className="aspect-video rounded-lg bg-secondary/50 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">URL de video inválida</p>
      </div>
    )
  }

  if (!loaded) {
    return (
      <button
        onClick={() => setLoaded(true)}
        className="aspect-video w-full rounded-lg bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center group cursor-pointer border border-border/50 hover:border-primary/30 transition-all"
      >
        <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
          <Play className="h-6 w-6 text-white ml-1" />
        </div>
      </button>
    )
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <button
        onClick={() => setLoaded(false)}
        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  )
}

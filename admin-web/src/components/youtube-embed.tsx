'use client'

import { getYouTubeId } from '@/lib/utils'

export function YouTubeEmbed({ url }: { url: string }) {
  const videoId = getYouTubeId(url)
  if (!videoId) return null

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}

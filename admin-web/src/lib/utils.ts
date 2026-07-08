import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYouTubeId(url: string): string | null {
  if (!url) return null
  const trimmed = url.trim()
  // Si es solo un ID de 11 caracteres
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  const match = trimmed.match(regExp)
  return match ? match[1] : null
}

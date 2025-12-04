import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...options,
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function calculateMatchScore(
  userInterests: string[],
  targetInterests: string[]
): number {
  const intersection = userInterests.filter(i => 
    targetInterests.some(t => t.toLowerCase() === i.toLowerCase())
  )
  const union = [...new Set([...userInterests, ...targetInterests])]
  return Math.round((intersection.length / union.length) * 100)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateQRCodeData(userId: string, eventId: string): string {
  return JSON.stringify({
    type: 'eventx_badge',
    userId,
    eventId,
    timestamp: Date.now(),
  })
}

export function parseQRCodeData(data: string): { userId: string; eventId: string } | null {
  try {
    const parsed = JSON.parse(data)
    if (parsed.type === 'eventx_badge') {
      return { userId: parsed.userId, eventId: parsed.eventId }
    }
    return null
  } catch {
    return null
  }
}

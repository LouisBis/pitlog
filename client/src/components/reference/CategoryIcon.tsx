import type { ReactElement } from 'react'
import type { CategorySlug } from '@/types'

interface Props {
  slug: CategorySlug
  size?: number
}

const icons: Record<CategorySlug, ReactElement> = {
  engine: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="20" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="20" y="26" width="9" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="35" y="26" width="9" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="24" y1="16" x2="24" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="16" x2="40" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="28" x2="14" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="36" x2="14" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="50" y1="28" x2="56" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="50" y1="36" x2="56" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="26" y="44" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  cooling: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10 C24 22 18 30 18 38 a14 14 0 0 0 28 0 C46 30 40 22 32 10Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M26 40 a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="20" width="22" height="30" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M40 26 L48 22 L48 34 L44 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="24" y1="30" x2="34" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="36" x2="30" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="24" y="14" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  transmission: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="32" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="32" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="48" cy="32" r="7" stroke="currentColor" strokeWidth="2"/>
      <circle cx="48" cy="32" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="23" x2="48" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="41" x2="48" y2="39" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="26" y="29" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="34" y="29" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  brakes: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="32" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="32" r="3" fill="currentColor"/>
      <path d="M32 12 L32 22 M52 32 L42 32 M32 52 L32 42 M12 32 L22 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  chassis: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="20" x2="44" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="32" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="52" cy="32" r="4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  tires: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="32" r="4" fill="currentColor"/>
      <path d="M32 10 L32 20 M32 44 L32 54 M10 32 L20 32 M44 32 L54 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
}

/** Inline SVG icon for a catalog category. Color inherits from CSS (`color: var(--brand-accent)`). */
export default function CategoryIcon({ slug, size = 64 }: Props) {
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, color: 'var(--brand-accent)', flexShrink: 0 }}>
      {icons[slug]}
    </span>
  )
}

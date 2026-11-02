import type { CSSProperties } from 'react'
import type { AccentSwatch, UserMotorcycle } from '@/types'

interface AccentVars {
  '--brand-accent': string
  '--brand-accent-hover': string
}

/** Fixed accent per catalog brand — not user-customizable (see FAQ: "Fixe non modifiable").
 *  Keyed lowercase; looked up case-insensitively. A brand with no entry falls back to the
 *  default brass accent (no override). */
const BRAND_ACCENTS: Record<string, AccentVars> = {
  honda: { '--brand-accent': 'var(--red-500)', '--brand-accent-hover': 'var(--red-300)' },
  yamaha: { '--brand-accent': 'var(--moto-blue-500)', '--brand-accent-hover': 'var(--moto-blue-300)' },
  kawasaki: { '--brand-accent': 'var(--moto-lime-500)', '--brand-accent-hover': 'var(--moto-lime-300)' },
  suzuki: { '--brand-accent': 'var(--moto-teal-500)', '--brand-accent-hover': 'var(--moto-teal-300)' },
}

/** Swatch palette offered to custom motorcycles — rendered as color dots by AccentColorPicker. */
export const CUSTOM_SWATCHES: Record<AccentSwatch, AccentVars> = {
  red: { '--brand-accent': 'var(--red-500)', '--brand-accent-hover': 'var(--red-300)' },
  blue: { '--brand-accent': 'var(--moto-blue-500)', '--brand-accent-hover': 'var(--moto-blue-300)' },
  green: { '--brand-accent': 'var(--green-500)', '--brand-accent-hover': 'var(--green-300)' },
  lime: { '--brand-accent': 'var(--moto-lime-500)', '--brand-accent-hover': 'var(--moto-lime-300)' },
  teal: { '--brand-accent': 'var(--moto-teal-500)', '--brand-accent-hover': 'var(--moto-teal-300)' },
  purple: { '--brand-accent': 'var(--moto-purple-500)', '--brand-accent-hover': 'var(--moto-purple-300)' },
  orange: { '--brand-accent': 'var(--moto-orange-500)', '--brand-accent-hover': 'var(--moto-orange-300)' },
  pink: { '--brand-accent': 'var(--moto-pink-500)', '--brand-accent-hover': 'var(--moto-pink-300)' },
}

/** Ordered for the swatch picker UI. */
export const SWATCH_ORDER = Object.keys(CUSTOM_SWATCHES) as AccentSwatch[]

/** The solid accent value (a `var(--...)` string) for a catalog brand, or undefined if unmapped.
 *  Used by AccentColorPicker to render the fixed, non-interactive dot. */
export function getBrandAccentColor(brand: string): string | undefined {
  return BRAND_ACCENTS[brand.toLowerCase()]?.['--brand-accent']
}

/** Resolves the `--brand-accent`/`--brand-accent-hover` CSS var overrides for a motorcycle, to
 *  spread as inline `style` on a moto-scoped page's root element. Returns undefined when the
 *  default brass accent applies (unmapped catalog brand, or no swatch chosen for a custom moto). */
export function getAccentStyle(moto: UserMotorcycle): CSSProperties | undefined {
  const vars = moto.isCustom
    ? moto.accentColor
      ? CUSTOM_SWATCHES[moto.accentColor]
      : undefined
    : BRAND_ACCENTS[moto.brand.toLowerCase()]
  // CSSProperties has no index signature for custom properties — this is the standard cast for them.
  return vars as CSSProperties | undefined
}

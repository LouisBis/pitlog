import { EngineIcon, GasCanIcon, GearSixIcon, DiscIcon, MotorcycleIcon, TireIcon, ThermometerSimpleIcon } from '@phosphor-icons/react'
import type { CategorySlug } from '@/types'

interface Props {
  slug: CategorySlug
  size?: number
}

const phosphorStyle = { width: '100%', height: '100%' }

/** Inline icon for a catalog category. Color inherits from CSS (`color: var(--brand-accent)`). */
export default function CategoryIcon({ slug, size = 64 }: Props) {
  const style = { display: 'inline-flex', width: size, height: size, color: 'var(--brand-accent)', flexShrink: 0 } as const

  if (slug === 'engine')       return <span style={style}><EngineIcon style={phosphorStyle} /></span>
  if (slug === 'cooling')      return <span style={style}><ThermometerSimpleIcon style={phosphorStyle} /></span>
  if (slug === 'fuel')         return <span style={style}><GasCanIcon style={phosphorStyle} /></span>
  if (slug === 'transmission') return <span style={style}><GearSixIcon style={phosphorStyle} /></span>
  if (slug === 'brakes')       return <span style={style}><DiscIcon style={phosphorStyle} /></span>
  if (slug === 'chassis')      return <span style={style}><MotorcycleIcon style={phosphorStyle} /></span>
  if (slug === 'tires')        return <span style={style}><TireIcon style={phosphorStyle} /></span>
}

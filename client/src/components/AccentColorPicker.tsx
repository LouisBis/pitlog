import { useTranslation } from 'react-i18next'
import { useSetAccentColor } from '@/queries/useUserMotorcycles'
import { CUSTOM_SWATCHES, SWATCH_ORDER, getBrandAccentColor } from '@/lib/accentColors'
import type { UserMotorcycle } from '@/types'
import styles from './AccentColorPicker.module.css'

interface Props {
  moto: UserMotorcycle
}

/** For a custom motorcycle, a row of swatch dots to pick its accent color.
 *  For a catalog motorcycle, a single static dot showing the fixed brand color (non-interactive). */
export default function AccentColorPicker({ moto }: Props) {
  const { t } = useTranslation()
  const { mutate: setAccentColor } = useSetAccentColor()

  if (!moto.isCustom) {
    const color = getBrandAccentColor(moto.brand)
    if (!color) return null
    return <span className={styles.dot} style={{ background: color }} title={t('garage.accent_color.brand_fixed')} />
  }

  return (
    <div className={styles.swatches} onClick={(e) => e.stopPropagation()}>
      {SWATCH_ORDER.map((key) => {
        const selected = moto.accentColor === key
        return (
          <button
            key={key}
            type="button"
            className={selected ? styles.swatchSelected : styles.swatch}
            style={{ background: CUSTOM_SWATCHES[key]['--brand-accent'] }}
            aria-label={t('garage.accent_color.select', { color: t(`garage.accent_color.${key}`) })}
            aria-pressed={selected}
            onClick={() => setAccentColor({ userMotorcycleId: moto.id, accentColor: key })}
          />
        )
      })}
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { useCatalogEntry } from '@/queries/useCatalog'
import { getRelevantTorqueSpecs } from './torqueUtils'
import styles from './TorquePanel.module.css'

interface Props {
  catalogSlug: string
  intervalSlug: string
}

/** Inline panel showing torque specs relevant to the current ticket's catalog interval. */
export default function TorquePanel({ catalogSlug, intervalSlug }: Props) {
  const { t } = useTranslation()
  const { data: entry } = useCatalogEntry(catalogSlug)

  if (!entry) return null

  const specs = getRelevantTorqueSpecs(entry, intervalSlug)
  if (specs.length === 0) return null

  return (
    <ul className={styles.list}>
      {specs.map((spec) => (
        <li key={spec.slug} className={styles.item}>
          <span className={styles.component}>{spec.component}</span>
          <span className={styles.value}>{t('reference.nm', { count: spec.nm })}</span>
          {spec.note && <span className={styles.note}>{spec.note}</span>}
        </li>
      ))}
    </ul>
  )
}

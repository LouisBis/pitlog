import { useTranslation } from 'react-i18next'
import type { TorqueSpec } from '@/types'
import styles from './TorqueSection.module.css'

interface Props {
  specs: TorqueSpec[]
}

/** Displays the torque spec list with a wrench-icon section header. */
export default function TorqueSection({ specs }: Props) {
  const { t } = useTranslation()

  if (specs.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span style={{ display: 'inline-flex', width: 56, height: 56, color: 'var(--color-text-muted)', flexShrink: 0 }}>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M44 12 C50 18 50 28 44 34 L24 54 C21 57 17 57 14 54 C11 51 11 47 14 44 L34 24 C40 18 50 18 44 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="18" cy="50" r="3" fill="currentColor"/>
            <line x1="44" y1="12" x2="36" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <div className={styles.headerMeta}>
          <span className={styles.sectionLabel}>{t('reference.torque.label')}</span>
          <span className={styles.sectionName}>{t('reference.torque.title')}</span>
        </div>
      </div>

      <div className={styles.list}>
        {specs.map((spec) => (
          <div key={spec.slug} className={styles.row}>
            <span className={styles.component}>{spec.component}</span>
            <div className={styles.right}>
              <span className={styles.torqueValue}>{t('reference.nm', { count: spec.nm })}</span>
              {spec.note && <span className={styles.note}>{spec.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

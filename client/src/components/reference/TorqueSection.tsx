import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CategorySlug, TorqueSpec } from '@/types'
import styles from './TorqueSection.module.css'

interface Props {
  specs: TorqueSpec[]
}

/** Groups torque specs by category, preserving the order they appear. */
function groupByCategory(specs: TorqueSpec[]): [CategorySlug, TorqueSpec[]][] {
  const map = new Map<CategorySlug, TorqueSpec[]>()
  for (const spec of specs) {
    const list = map.get(spec.category) ?? []
    list.push(spec)
    map.set(spec.category, list)
  }
  return [...map.entries()]
}

/** Displays torque specs grouped by mechanical category, each group collapsible. */
export default function TorqueSection({ specs }: Props) {
  const { t } = useTranslation()
  const grouped = useMemo(() => groupByCategory(specs), [specs])

  if (specs.length === 0) return null

  return (
    <details open className={styles.details}>
      <summary className={styles.summary}>
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
        <span className={styles.chevron} aria-hidden>
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </summary>

      <div className={styles.groups}>
        {grouped.map(([cat, catSpecs]) => (
          <details key={cat} open className={styles.categoryDetails}>
            <summary className={styles.categorySummary}>
              <span className={styles.categoryName}>{t(`catalog.categories.${cat}`)}</span>
              <span className={styles.categoryChevron} aria-hidden>
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </summary>

            <div className={styles.list}>
              {catSpecs.map((spec) => (
                <div key={spec.slug} className={styles.row}>
                  <span className={styles.component}>{spec.component}</span>
                  <div className={styles.right}>
                    <span className={styles.torqueValue}>{t('reference.nm', { count: spec.nm })}</span>
                    {spec.note && <span className={styles.note}>{spec.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </details>
  )
}

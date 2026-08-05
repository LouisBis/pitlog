import { useTranslation } from 'react-i18next'
import { getOperationLabel } from '@/lib/catalogI18n'
import CategoryIcon from './CategoryIcon'
import type { CatalogCategory } from '@/types'
import styles from './CategorySection.module.css'

interface Props {
  category: CatalogCategory
}

/** Displays one mechanical category with its header illustration and interval rows. */
export default function CategorySection({ category }: Props) {
  const { t } = useTranslation()

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <CategoryIcon slug={category.slug} size={56} />
        <div className={styles.headerMeta}>
          <span className={styles.categoryLabel}>{t(`catalog.categories.${category.slug}`)}</span>
          <span className={styles.categoryName}>
            {category.intervals.length === 1
              ? t('reference.interval_count_one')
              : t('reference.interval_count', { count: category.intervals.length })}
          </span>
        </div>
      </div>

      <div className={styles.list}>
        {category.intervals.map((interval) => (
          <div key={interval.slug} className={styles.row}>
            <span className={styles.operation}>{getOperationLabel(interval, t)}</span>
            <div className={styles.stats}>
              {interval.km !== null && (
                <div className={styles.stat}>
                  <span className={styles.statValue}>{interval.km.toLocaleString('fr-FR')}</span>
                  <span className={styles.statUnit}>{t('reference.unit_km')}</span>
                </div>
              )}
              {interval.days !== null && (
                <div className={styles.stat}>
                  <span className={styles.statValue}>{interval.days}</span>
                  <span className={styles.statUnit}>{t('reference.unit_days')}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import { useCatalogEntry } from '@/queries/useCatalog'
import type { CatalogInterval, TorqueSpec } from '@/types'
import styles from './ReferencePage.module.css'

/** Single interval row in the reference table. */
function IntervalRow({ interval }: { interval: CatalogInterval }) {
  const { t } = useTranslation()
  return (
    <div className={styles.row}>
      <span className={styles.operation}>{interval.operation}</span>
      <div className={styles.recurrence}>
        {interval.km !== null && (
          <span className={styles.tag}>{t('reference.every_km', { count: interval.km })}</span>
        )}
        {interval.days !== null && (
          <span className={styles.tag}>{t('reference.every_days', { count: interval.days })}</span>
        )}
      </div>
    </div>
  )
}

/** Single torque spec row. */
function TorqueRow({ spec }: { spec: TorqueSpec }) {
  const { t } = useTranslation()
  return (
    <div className={styles.row}>
      <span className={styles.operation}>{spec.component}</span>
      <div className={styles.recurrence}>
        <span className={styles.torqueValue}>{t('reference.nm', { count: spec.nm })}</span>
        {spec.note && <span className={styles.note}>{spec.note}</span>}
      </div>
    </div>
  )
}

/** Reference page showing catalog intervals and torque specs for the current motorcycle. */
export default function ReferencePage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userMotoId = Number(id)
  const isValidId = Number.isInteger(userMotoId) && userMotoId > 0

  const { data: motos } = useUserMotorcycles()
  const moto = motos?.find((m) => m.id === userMotoId)

  const { data: entry, isLoading, isError } = useCatalogEntry(moto?.catalogSlug)

  useEffect(() => {
    if (!isValidId) navigate('/', { replace: true })
  }, [isValidId, navigate])

  useEffect(() => {
    if (motos && !moto) navigate('/', { replace: true })
  }, [motos, moto, navigate])

  // Custom motorcycles have no catalog — redirect to board
  useEffect(() => {
    if (moto && !moto.catalogSlug) navigate(`/board/${userMotoId}`, { replace: true })
  }, [moto, userMotoId, navigate])

  if (!isValidId) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.logo}>Pitlog</span>
          <div className={styles.meta}>
            <button type="button" className={styles.back} onClick={() => navigate(`/board/${userMotoId}`)}>
              {t('nav.back_to_board')}
            </button>
            {moto && (
              <>
                <span className={styles.separator}>·</span>
                <span className={styles.motoName}>
                  {moto.brand} {moto.model}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{t('reference.title')}</h1>

        {isLoading && <p className={styles.state}>{t('common.loading')}</p>}
        {isError && <p className={styles.state}>{t('common.error.loading')}</p>}

        {entry && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('reference.intervals.title')}</h2>
              {entry.intervals.length === 0 ? (
                <p className={styles.state}>{t('reference.empty.intervals')}</p>
              ) : (
                <div className={styles.list}>
                  {entry.intervals.map((interval) => (
                    <IntervalRow key={interval.slug} interval={interval} />
                  ))}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('reference.torque.title')}</h2>
              {entry.torque_specs.length === 0 ? (
                <p className={styles.state}>{t('reference.empty.torque')}</p>
              ) : (
                <div className={styles.list}>
                  {entry.torque_specs.map((spec) => (
                    <TorqueRow key={spec.slug} spec={spec} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

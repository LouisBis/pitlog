import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import { useCatalogEntry } from '@/queries/useCatalog'
import CategorySection from '@/components/reference/CategorySection'
import TorqueSection from '@/components/reference/TorqueSection'
import styles from './ReferencePage.module.css'

/** Technical reference page — catalog intervals grouped by category + torque specs. */
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
                <span className={styles.motoName}>{moto.brand} {moto.model}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>{t('reference.title')}</h1>
        {moto && (
          <p className={styles.pageSubtitle}>
            {moto.brand} {moto.model} · {entry?.year_start}–{entry?.year_end ?? '…'}
          </p>
        )}

        {isLoading && <p className={styles.state}>{t('common.loading')}</p>}
        {isError && <p className={styles.state}>{t('common.error.loading')}</p>}

        {entry && (
          <>
            {entry.categories.map((cat) => (
              <CategorySection key={cat.slug} category={cat} />
            ))}
            <TorqueSection specs={entry.torque_specs} />
          </>
        )}
      </main>
    </div>
  )
}

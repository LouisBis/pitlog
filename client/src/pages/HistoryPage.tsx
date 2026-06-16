import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import { useTickets } from '@/queries/useTickets'
import { Badge } from '@/components/ui/Badge'
import styles from './HistoryPage.module.css'

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function HistoryPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userMotoId = Number(id)
  const isValidId = Number.isInteger(userMotoId) && userMotoId > 0

  const { data: motos } = useUserMotorcycles()
  const moto = motos?.find((m) => m.id === userMotoId)
  const { data: tickets, isLoading, isError } = useTickets(userMotoId)

  useEffect(() => {
    if (!isValidId) navigate('/', { replace: true })
  }, [isValidId, navigate])

  useEffect(() => {
    if (motos && !moto) navigate('/', { replace: true })
  }, [motos, moto, navigate])

  if (!isValidId) return null

  const done = (tickets ?? [])
    .filter((tk) => tk.status === 'done' && tk.doneAt !== null)
    .sort((a, b) => new Date(b.doneAt!).getTime() - new Date(a.doneAt!).getTime())

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
        <h1 className={styles.title}>{t('history.title')}</h1>

        {isLoading && <p className={styles.state}>{t('common.loading')}</p>}
        {isError && <p className={styles.state}>{t('common.error.loading')}</p>}

        {!isLoading && !isError && done.length === 0 && (
          <p className={styles.state}>{t('history.empty')}</p>
        )}

        {done.length > 0 && (
          <div className={styles.list}>
            {done.map((tk) => (
              <div key={tk.id} className={styles.row}>
                <span className={styles.operation}>{tk.operation}</span>
                <div className={styles.meta}>
                  {tk.doneKm !== null && (
                    <Badge variant="done">{t('ticket.done.at_km', { count: tk.doneKm })}</Badge>
                  )}
                  {tk.doneAt && (
                    <span className={styles.date}>{DATE_FORMAT.format(new Date(tk.doneAt))}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

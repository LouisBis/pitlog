import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import { useTickets } from '@/queries/useTickets'
import { useTicketParts } from '@/queries/useTicketParts'
import { Badge } from '@/components/ui/Badge'
import type { Ticket } from '@/types'
import styles from './HistoryPage.module.css'

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function HistoryRow({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation()
  const { data: parts = [] } = useTicketParts(ticket.id)

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.operation}>{ticket.operation}</span>
        <div className={styles.meta}>
          {ticket.doneKm !== null && (
            <Badge variant="done">{t('ticket.done.at_km', { count: ticket.doneKm })}</Badge>
          )}
          {ticket.doneAt && (
            <span className={styles.date}>{DATE_FORMAT.format(new Date(ticket.doneAt))}</span>
          )}
        </div>
      </div>
      {parts.length > 0 && (
        <div className={styles.partsList}>
          <span className={styles.partsLabel}>{t('history.parts_used')}</span>
          <ul className={styles.parts}>
            {parts.map((part) => (
              <li key={part.id} className={styles.part}>
                {part.quantity > 1 && <span className={styles.partQty}>{part.quantity}×</span>}
                {part.url
                  ? <a href={part.url} target="_blank" rel="noopener noreferrer" className={styles.partLink}>{part.name}</a>
                  : <span>{part.name}</span>
                }
                {part.brand && <span className={styles.partMeta}> · {part.brand}</span>}
                {part.reference && <span className={styles.partMeta}> · {part.reference}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

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
              <HistoryRow key={tk.id} ticket={tk} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

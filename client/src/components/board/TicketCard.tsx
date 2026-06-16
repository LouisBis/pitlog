import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { Ticket } from '@/types'
import { getUrgency, getKmRemaining, getEstimatedDays } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  currentKm: number
  kmPerDay: number | null
  overlay?: boolean
}

export default function TicketCard({ ticket, currentKm, kmPerDay, overlay = false }: Props) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
    disabled: overlay,
  })

  const urgency = getUrgency(ticket, currentKm, kmPerDay)
  const remaining = getKmRemaining(ticket, currentKm)
  const kmLabel = remaining === null
    ? null
    : remaining <= 0
      ? t('ticket.urgency.overdue', { count: Math.abs(remaining) })
      : t('ticket.urgency.remaining', { count: remaining })
  const estimatedDays = kmPerDay ? getEstimatedDays(ticket, currentKm, kmPerDay) : null
  const daysLabel = estimatedDays !== null ? t('ticket.urgency.estimated_days', { count: estimatedDays }) : null

  const className = [
    styles.card,
    isDragging && !overlay && styles.dragging,
    overlay && styles.overlay,
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={className}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <p className={styles.operation}>{ticket.operation}</p>
      {ticket.status === 'done' && ticket.doneKm !== null
        ? (
          <div className={styles.badges}>
            <Badge variant="done">{t('ticket.done.at_km', { count: ticket.doneKm })}</Badge>
          </div>
        )
        : (kmLabel || daysLabel) && (
          <div className={styles.badges}>
            {kmLabel && <Badge variant={urgency}>{kmLabel}</Badge>}
            {daysLabel && <Badge variant="neutral">{daysLabel}</Badge>}
          </div>
        )
      }
    </div>
  )
}

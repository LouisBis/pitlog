import { useDraggable } from '@dnd-kit/core'
import type { Ticket } from '@/types'
import { getUrgency, formatKmRemaining, formatEstimatedDays } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  currentKm: number
  kmPerDay: number | null
  overlay?: boolean
}

export default function TicketCard({ ticket, currentKm, kmPerDay, overlay = false }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
    disabled: overlay,
  })

  const urgency = getUrgency(ticket, currentKm, kmPerDay)
  const kmLabel = formatKmRemaining(ticket, currentKm)
  const daysLabel = kmPerDay ? formatEstimatedDays(ticket, currentKm, kmPerDay) : null

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
      {(kmLabel || daysLabel) && (
        <div className={styles.badges}>
          {kmLabel && <Badge variant={urgency}>{kmLabel}</Badge>}
          {daysLabel && <Badge variant="neutral">{daysLabel}</Badge>}
        </div>
      )}
    </div>
  )
}

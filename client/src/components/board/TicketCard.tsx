import { useDraggable } from '@dnd-kit/core'
import type { Ticket } from '@/types'
import { getUrgency, formatKmRemaining, formatEstimatedDays } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  currentKm: number
  kmPerDay: number | null
}

export default function TicketCard({ ticket, currentKm, kmPerDay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
  })

  const urgency = getUrgency(ticket, currentKm, kmPerDay)
  const kmLabel = formatKmRemaining(ticket, currentKm)
  const daysLabel = kmPerDay ? formatEstimatedDays(ticket, currentKm, kmPerDay) : null

  const className = [
    styles.card,
    styles[urgency],
    isDragging && styles.dragging,
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      {...listeners}
      {...attributes}
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

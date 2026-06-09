import { useDraggable } from '@dnd-kit/core'
import type { Ticket } from '@/types'
import { getUrgency, formatKmRemaining } from '@/lib/urgency'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  currentKm: number
}

export default function TicketCard({ ticket, currentKm }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
  })

  const urgency = getUrgency(ticket, currentKm)
  const kmLabel = formatKmRemaining(ticket, currentKm)

  const className = [
    styles.card,
    styles[urgency],
    isDragging ? styles.dragging : '',
  ].join(' ')

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      {...listeners}
      {...attributes}
    >
      <p className={styles.operation}>{ticket.operation}</p>
      {kmLabel && (
        <span className={`${styles.kmRemaining} ${styles[urgency]}`}>{kmLabel}</span>
      )}
    </div>
  )
}

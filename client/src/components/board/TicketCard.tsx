import { useDraggable } from '@dnd-kit/core'
import type { Ticket } from '@/types'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
}

export default function TicketCard({ ticket }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.card}${isDragging ? ` ${styles.dragging}` : ''}`}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      {...listeners}
      {...attributes}
    >
      <p className={styles.operation}>{ticket.operation}</p>
      {ticket.targetKm != null && (
        <span className={styles.targetKm}>Target : {ticket.targetKm.toLocaleString('fr-FR')} km</span>
      )}
    </div>
  )
}

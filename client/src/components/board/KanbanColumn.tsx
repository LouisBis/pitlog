import { useDroppable } from '@dnd-kit/core'
import type { Ticket, TicketStatus } from '@/types'
import TicketCard from './TicketCard'
import styles from './KanbanColumn.module.css'

const COLUMN_LABELS: Record<TicketStatus, string> = {
  todo: 'À faire',
  part_ordered: 'Pièces commandées',
  in_progress: 'En cours',
  done: 'Terminé',
}

interface Props {
  status: TicketStatus
  tickets: Ticket[]
  currentKm: number
}

export default function KanbanColumn({ status, tickets, currentKm }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className={`${styles.column}${isOver ? ` ${styles.over}` : ''}`}>
      <div className={styles.header}>
        {COLUMN_LABELS[status]}
        <span className={styles.count}>{tickets.length}</span>
      </div>
      <div ref={setNodeRef} className={styles.dropZone}>
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} currentKm={currentKm} />
        ))}
      </div>
    </div>
  )
}

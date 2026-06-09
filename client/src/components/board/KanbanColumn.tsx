import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Ticket, TicketStatus } from '@/types'
import TicketCard from './TicketCard'
import CreateTicketForm from './CreateTicketForm'
import styles from './KanbanColumn.module.css'
import formStyles from './CreateTicketForm.module.css'

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
  kmPerDay: number | null
  userMotoId: number
}

export default function KanbanColumn({ status, tickets, currentKm, kmPerDay, userMotoId }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [showForm, setShowForm] = useState(false)

  return (
    <div className={`${styles.column}${isOver ? ` ${styles.over}` : ''}`}>
      <div className={styles.header}>
        {COLUMN_LABELS[status]}
        <span className={styles.count}>{tickets.length}</span>
      </div>
      <div ref={setNodeRef} className={styles.dropZone}>
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} currentKm={currentKm} kmPerDay={kmPerDay} />
        ))}
      </div>
      {status === 'todo' && (
        showForm
          ? <CreateTicketForm userMotoId={userMotoId} onClose={() => setShowForm(false)} />
          : <button type="button" className={formStyles.addButton} onClick={() => setShowForm(true)}>
              + Nouveau ticket
            </button>
      )}
    </div>
  )
}

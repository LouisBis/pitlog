import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { Ticket, TicketStatus } from '@/types'
import TicketCard from './TicketCard'
import CreateTicketForm from './CreateTicketForm'
import styles from './KanbanColumn.module.css'
import formStyles from './CreateTicketForm.module.css'

interface Props {
  status: TicketStatus
  tickets: Ticket[]
  currentKm: number
  kmPerDay: number | null
  userMotoId: number
}

export default function KanbanColumn({ status, tickets, currentKm, kmPerDay, userMotoId }: Props) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [showForm, setShowForm] = useState(false)

  return (
    <div className={`${styles.column}${isOver ? ` ${styles.over}` : ''}`}>
      <div className={styles.header}>
        {t(`board.column.${status}`)}
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
              {t('ticket.action.new')}
            </button>
      )}
    </div>
  )
}

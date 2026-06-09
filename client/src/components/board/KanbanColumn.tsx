import { useDroppable } from '@dnd-kit/core'
import type { Ticket, TicketStatus } from '@/types'
import TicketCard from './TicketCard'

const COLUMN_LABELS: Record<TicketStatus, string> = {
  todo: 'À faire',
  part_ordered: 'Pièces commandées',
  in_progress: 'En cours',
  done: 'Terminé',
}

interface Props {
  status: TicketStatus
  tickets: Ticket[]
}

export default function KanbanColumn({ status, tickets }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div style={{
      minWidth: '240px',
      flex: '1',
      borderRadius: '8px',
      padding: '12px',
      background: isOver ? '#eff6ff' : '#f8fafc',
      transition: 'background 150ms ease',
    }}>
      <h2 style={{
        fontSize: '13px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#475569',
        marginBottom: '12px',
      }}>
        {COLUMN_LABELS[status]}{' '}
        <span style={{ fontWeight: 400, color: '#94a3b8' }}>({tickets.length})</span>
      </h2>
      <div ref={setNodeRef} style={{ minHeight: '60px' }}>
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  )
}

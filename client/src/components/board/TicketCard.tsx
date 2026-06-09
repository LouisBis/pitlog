import { useDraggable } from '@dnd-kit/core'
import type { Ticket } from '@/types'

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
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '10px 12px',
        marginBottom: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>{ticket.operation}</p>
      {ticket.targetKm != null && (
        <small style={{ color: '#64748b' }}>Target: {ticket.targetKm} km</small>
      )}
    </div>
  )
}

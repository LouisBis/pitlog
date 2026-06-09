import type { Ticket } from '@/types'

interface Props {
  ticket: Ticket
}

export default function TicketCard({ ticket }: Props) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '10px 12px',
      marginBottom: '8px',
    }}>
      <p style={{ margin: 0, fontWeight: 500 }}>{ticket.operation}</p>
      {ticket.targetKm != null && (
        <small style={{ color: '#64748b' }}>Objectif : {ticket.targetKm} km</small>
      )}
    </div>
  )
}

import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { TICKET_STATUSES, type Ticket, type TicketStatus } from '@/types'
import { useTickets, usePatchTicketStatus } from '@/queries/useTickets'
import KanbanColumn from './KanbanColumn'

interface Props {
  userMotoId: number
}

export default function KanbanBoard({ userMotoId }: Props) {
  const { data: tickets, isLoading, isError } = useTickets(userMotoId)
  const { mutate: patchStatus } = usePatchTicketStatus(userMotoId)

  if (isLoading) return <p>Chargement…</p>
  if (isError) return <p>Erreur de chargement.</p>

  const byStatus = TICKET_STATUSES.reduce<Record<TicketStatus, Ticket[]>>(
    (acc, status) => {
      acc[status] = (tickets ?? []).filter((t) => t.status === status)
      return acc
    },
    {} as Record<TicketStatus, Ticket[]>,
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const targetStatus = over.id as TicketStatus
    const currentStatus = active.data.current?.status as TicketStatus
    if (currentStatus === targetStatus) return
    patchStatus({ id: Number(active.id), status: targetStatus })
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '12px', padding: '16px', overflowX: 'auto' }}>
        {TICKET_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tickets={byStatus[status]} />
        ))}
      </div>
    </DndContext>
  )
}

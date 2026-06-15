import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { TICKET_STATUSES, type Ticket, type TicketStatus } from '@/types'
import { useTickets, usePatchTicketStatus } from '@/queries/useTickets'
import KanbanColumn from './KanbanColumn'
import TicketCard from './TicketCard'
import styles from './KanbanBoard.module.css'

interface Props {
  userMotoId: number
  currentKm: number
  kmPerDay: number | null
}

export default function KanbanBoard({ userMotoId, currentKm, kmPerDay }: Props) {
  const { t } = useTranslation()
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  // PointerSensor: distance prevents accidental drag on click
  // TouchSensor: delay lets the user scroll without triggering a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const { data: tickets, isLoading, isError } = useTickets(userMotoId)
  const { mutate: patchStatus } = usePatchTicketStatus(userMotoId)

  if (isLoading) return <p>{t('common.loading')}</p>
  if (isError) return <p>{t('common.error.loading')}</p>

  const byStatus = useMemo(
    () => TICKET_STATUSES.reduce<Record<TicketStatus, Ticket[]>>(
      (acc, status) => {
        acc[status] = (tickets ?? []).filter((t) => t.status === status)
        return acc
      },
      {} as Record<TicketStatus, Ticket[]>,
    ),
    [tickets],
  )

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets?.find((t) => t.id === event.active.id)
    setActiveTicket(ticket ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null)
    const { active, over } = event
    if (!over) return
    const targetStatus = over.id as TicketStatus
    const currentStatus = active.data.current?.status as TicketStatus
    if (currentStatus === targetStatus) return
    patchStatus({ id: Number(active.id), status: targetStatus })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {TICKET_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tickets={byStatus[status]} currentKm={currentKm} kmPerDay={kmPerDay} userMotoId={userMotoId} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTicket && (
          <TicketCard ticket={activeTicket} currentKm={currentKm} kmPerDay={kmPerDay} overlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}

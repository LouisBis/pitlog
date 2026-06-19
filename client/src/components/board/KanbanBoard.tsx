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
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { TICKET_STATUSES, type Ticket, type TicketPart, type TicketStatus } from '@/types'
import { useTickets, usePatchTicketStatus, useImportIntervals } from '@/queries/useTickets'
import { Button } from '@/components/ui/Button'
import KanbanColumn from './KanbanColumn'
import TicketCard from './TicketCard'
import styles from './KanbanBoard.module.css'

interface Props {
  userMotoId: number
  currentKm: number
  kmPerDay: number | null
  isCustom: boolean
}

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  todo: ['part_ordered', 'in_progress'],
  part_ordered: ['todo', 'in_progress'],
  in_progress: ['todo', 'part_ordered', 'done'],
  done: [],
}

export default function KanbanBoard({ userMotoId, currentKm, kmPerDay, isCustom }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [forceEditId, setForceEditId] = useState<number | null>(null)

  // PointerSensor: distance prevents accidental drag on click
  // TouchSensor: delay lets the user scroll without triggering a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const { data: tickets, isLoading, isError } = useTickets(userMotoId)
  const { mutate: patchStatus } = usePatchTicketStatus(userMotoId)
  const { mutate: importIntervals, isPending: isImporting } = useImportIntervals(userMotoId)

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

  if (isLoading) return <p>{t('common.loading')}</p>
  if (isError) return <p>{t('common.error.loading')}</p>

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

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus)) return

    const ticketId = Number(active.id)

    if (targetStatus === 'part_ordered') {
      const cachedParts = queryClient.getQueryData<TicketPart[]>(['ticket-parts', ticketId])
      if (!cachedParts || cachedParts.length === 0) {
        setForceEditId(ticketId)
        return
      }
    }

    patchStatus({ id: ticketId, status: targetStatus })
  }

  return (
    <div className={styles.wrapper}>
      {tickets?.length === 0 && (
        <div className={styles.emptyBanner}>
          <p className={styles.emptyText}>
            {t(isCustom ? 'board.empty.custom' : 'board.empty.catalogue')}
          </p>
          {!isCustom && (
            <Button size="sm" onClick={() => importIntervals()} disabled={isImporting}>
              {t('board.empty.import')}
            </Button>
          )}
        </div>
      )}
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {TICKET_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={byStatus[status]}
            currentKm={currentKm}
            kmPerDay={kmPerDay}
            userMotoId={userMotoId}
            forceEditId={forceEditId}
            onForceEditDone={() => setForceEditId(null)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTicket && (
          <TicketCard ticket={activeTicket} currentKm={currentKm} kmPerDay={kmPerDay} overlay />
        )}
      </DragOverlay>
    </DndContext>
    </div>
  )
}

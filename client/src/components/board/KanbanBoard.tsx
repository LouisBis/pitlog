import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { TICKET_STATUSES, type Ticket, type TicketStatus } from '@/types'
import { useTickets, usePatchTicketStatus } from '@/queries/useTickets'
import KanbanColumn from './KanbanColumn'
import styles from './KanbanBoard.module.css'

interface Props {
  userMotoId: number
  currentKm: number
  kmPerDay: number | null
}

export default function KanbanBoard({ userMotoId, currentKm, kmPerDay }: Props) {
  const { t } = useTranslation()
  const { data: tickets, isLoading, isError } = useTickets(userMotoId)
  const { mutate: patchStatus } = usePatchTicketStatus(userMotoId)

  if (isLoading) return <p>{t('common.loading')}</p>
  if (isError) return <p>{t('common.error.loading')}</p>

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
      <div className={styles.board}>
        {TICKET_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tickets={byStatus[status]} currentKm={currentKm} kmPerDay={kmPerDay} userMotoId={userMotoId} />
        ))}
      </div>
    </DndContext>
  )
}

import { TICKET_STATUSES } from '@/types'
import { useTickets } from '@/queries/useTickets'
import KanbanColumn from './KanbanColumn'

interface Props {
  userMotoId: number
}

export default function KanbanBoard({ userMotoId }: Props) {
  const { data: tickets, isLoading, isError } = useTickets(userMotoId)

  if (isLoading) return <p>Chargement…</p>
  if (isError) return <p>Erreur de chargement.</p>

  const byStatus = TICKET_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tickets?.filter((t) => t.status === status) ?? []
      return acc
    },
    {} as Record<string, ReturnType<NonNullable<typeof tickets>['filter']>>,
  )

  return (
    <div style={{ display: 'flex', gap: '12px', padding: '16px', overflowX: 'auto' }}>
      {TICKET_STATUSES.map((status) => (
        <KanbanColumn key={status} status={status} tickets={byStatus[status]} />
      ))}
    </div>
  )
}

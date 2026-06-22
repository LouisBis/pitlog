import { Skeleton } from '@/components/ui/Skeleton'
import { TICKET_STATUSES, type TicketStatus } from '@/types'
import boardStyles from './KanbanBoard.module.css'
import styles from './KanbanBoardSkeleton.module.css'

const CARD_COUNTS: Record<TicketStatus, number> = {
  todo: 3,
  part_ordered: 1,
  in_progress: 2,
  done: 1,
}

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton height="1rem" width="75%" />
      <Skeleton height="1.25rem" width="5.5rem" />
    </div>
  )
}

function SkeletonColumn({ status }: { status: TicketStatus }) {
  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <Skeleton height="0.7rem" width="4.5rem" />
        <Skeleton height="1rem" width="1.25rem" />
      </div>
      {Array.from({ length: CARD_COUNTS[status] }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default function KanbanBoardSkeleton() {
  return (
    <div className={boardStyles.board}>
      {TICKET_STATUSES.map((status) => (
        <SkeletonColumn key={status} status={status} />
      ))}
    </div>
  )
}

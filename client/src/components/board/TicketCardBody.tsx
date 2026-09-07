import type { Ticket, TicketPart } from '@/types'
import type { Urgency } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import TorquePanel from './TorquePanel'
import TicketPhotoUpload from './TicketPhotoUpload'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  parts: TicketPart[]
  urgency: Urgency
  kmLabel: string | null
  daysLabel: string | null
  doneAtKmLabel: string
}

/** Read-mode body of a ticket card: urgency badges, torque panel, parts list, and photo. */
export default function TicketCardBody({ ticket, parts, urgency, kmLabel, daysLabel, doneAtKmLabel }: Props) {
  return (
    <>
      {ticket.status === 'done' && ticket.doneKm !== null ? (
        <div className={styles.badges}>
          <Badge variant="done">{doneAtKmLabel}</Badge>
        </div>
      ) : (
        (kmLabel || daysLabel) && (
          <div className={styles.badges}>
            {kmLabel && <Badge variant={urgency}>{kmLabel}</Badge>}
            {daysLabel && <Badge variant="neutral">{daysLabel}</Badge>}
          </div>
        )
      )}
      {ticket.catalogSlug && ticket.intervalSlug && ticket.status !== 'done' && (
        <TorquePanel catalogSlug={ticket.catalogSlug} intervalSlug={ticket.intervalSlug} />
      )}
      {parts.length > 0 && (
        <ul className={styles.partsReadList}>
          {parts.map((part) => (
            <li key={part.id} className={styles.partsReadItem}>
              {part.quantity > 1 && <span className={styles.partsQty}>{part.quantity}×</span>}
              {part.url ? (
                <a
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.partsLink}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {part.name}
                </a>
              ) : (
                <span>{part.name}</span>
              )}
              {part.brand && <span className={styles.partsMeta}> · {part.brand}</span>}
              {part.reference && <span className={styles.partsMeta}> · {part.reference}</span>}
            </li>
          ))}
        </ul>
      )}
      <TicketPhotoUpload ticket={ticket} />
    </>
  )
}

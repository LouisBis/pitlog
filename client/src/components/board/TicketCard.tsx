import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react'
import type { Ticket } from '@/types'
import { getUrgency, getKmRemaining, getEstimatedDays } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import { useDeleteTicket } from '@/queries/useTickets'
import { useTicketParts } from '@/queries/useTicketParts'
import TicketEditForm from './TicketEditForm'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  currentKm: number
  kmPerDay: number | null
  /** Required in all contexts except DragOverlay, where mutations are disabled. */
  userMotoId?: number
  /** True when rendered inside DragOverlay — disables drag handle and mutations. */
  overlay?: boolean
  /** Forces the edit form open (e.g. after a blocked drop to part_ordered). */
  forceEdit?: boolean
  onForceEditDone?: () => void
}

export default function TicketCard({ ticket, currentKm, kmPerDay, userMotoId, overlay = false, forceEdit = false, onForceEditDone }: Props) {
  const { t } = useTranslation()
  const [editingLocal, setEditingLocal] = useState(false)
  const editing = editingLocal || forceEdit
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket(userMotoId ?? 0)
  const { data: parts = [] } = useTicketParts(ticket.id)

  // --- Drag setup ---
  // Drag is disabled on overlay cards (they live inside DragOverlay and must not re-trigger dnd)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
    disabled: overlay || editing || ticket.status === 'done',
  })

  // --- Urgency computation ---
  const urgency = useMemo(() => getUrgency(ticket, currentKm, kmPerDay), [ticket, currentKm, kmPerDay])
  const remaining = useMemo(() => getKmRemaining(ticket, currentKm), [ticket, currentKm])
  const estimatedDays = useMemo(
    () => kmPerDay ? getEstimatedDays(ticket, currentKm, kmPerDay) : null,
    [ticket, currentKm, kmPerDay],
  )

  // --- Label formatting ---
  const kmLabel = remaining === null
    ? null
    : remaining <= 0
      ? t('ticket.urgency.overdue', { count: Math.abs(remaining) })
      : t('ticket.urgency.remaining', { count: remaining })
  const daysLabel = estimatedDays !== null ? t('ticket.urgency.estimated_days', { count: estimatedDays }) : null

  const className = [
    styles.card,
    isDragging && !overlay && styles.dragging,
    overlay && styles.overlay,
    editing && styles.editMode,
  ].filter(Boolean).join(' ')

  const openEdit = () => setEditingLocal(true)
  const closeEdit = () => {
    setEditingLocal(false)
    if (forceEdit) onForceEditDone?.()
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={className}
      {...(overlay || editing ? {} : { ...listeners, ...attributes })}
    >
      <div className={styles.header}>
        <p className={styles.operation}>{ticket.operation}</p>
        {ticket.status !== 'done' && !overlay && (
          <button
            type="button"
            className={styles.editBtn}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={editing ? closeEdit : openEdit}
            aria-label={t('ticket.edit.title')}
          >
            <PencilSimpleIcon size={14} weight="fill" />
          </button>
        )}
        {ticket.status === 'done' && !overlay && !confirmingDelete && (
          <button
            type="button"
            className={[styles.editBtn, styles.editBtnDanger].join(' ')}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setConfirmingDelete(true)}
            aria-label={t('ticket.edit.delete')}
          >
            <TrashIcon size={14} weight="fill" />
          </button>
        )}
        {ticket.status === 'done' && !overlay && confirmingDelete && (
          <div className={styles.deleteConfirm} onPointerDown={(e) => e.stopPropagation()}>
            <button type="button" className={styles.deleteConfirmYes} onClick={() => deleteTicket(ticket.id)} disabled={isDeleting}>
              {t('garage.delete_yes')}
            </button>
            <button type="button" className={styles.deleteConfirmNo} onClick={() => setConfirmingDelete(false)}>
              {t('garage.delete_no')}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <TicketEditForm
          ticket={ticket}
          userMotoId={userMotoId ?? 0}
          forceEdit={forceEdit}
          onClose={closeEdit}
        />
      )}

      {!editing && (
        <>
          {ticket.status === 'done' && ticket.doneKm !== null
            ? (
              <div className={styles.badges}>
                <Badge variant="done">{t('ticket.done.at_km', { count: ticket.doneKm })}</Badge>
              </div>
            )
            : (kmLabel || daysLabel) && (
              <div className={styles.badges}>
                {kmLabel && <Badge variant={urgency}>{kmLabel}</Badge>}
                {daysLabel && <Badge variant="neutral">{daysLabel}</Badge>}
              </div>
            )
          }
          {parts.length > 0 && (
            <ul className={styles.partsReadList}>
              {parts.map((part) => (
                <li key={part.id} className={styles.partsReadItem}>
                  {part.quantity > 1 && <span className={styles.partsQty}>{part.quantity}×</span>}
                  {part.url
                    ? (
                      <a
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.partsLink}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {part.name}
                      </a>
                    )
                    : <span>{part.name}</span>
                  }
                  {part.brand && <span className={styles.partsMeta}> · {part.brand}</span>}
                  {part.reference && <span className={styles.partsMeta}> · {part.reference}</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

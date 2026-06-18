import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { Ticket } from '@/types'
import { getUrgency, getKmRemaining, getEstimatedDays } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { usePatchTicketInterval } from '@/queries/useTickets'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  currentKm: number
  kmPerDay: number | null
  userMotoId?: number
  overlay?: boolean
}

export default function TicketCard({ ticket, currentKm, kmPerDay, userMotoId, overlay = false }: Props) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [intervalKm, setIntervalKm] = useState('')
  const [intervalDays, setIntervalDays] = useState('')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
    disabled: overlay || editing,
  })

  const { mutate: patchInterval, isPending } = usePatchTicketInterval(userMotoId ?? 0)

  const urgency = getUrgency(ticket, currentKm, kmPerDay)
  const remaining = getKmRemaining(ticket, currentKm)
  const kmLabel = remaining === null
    ? null
    : remaining <= 0
      ? t('ticket.urgency.overdue', { count: Math.abs(remaining) })
      : t('ticket.urgency.remaining', { count: remaining })
  const estimatedDays = kmPerDay ? getEstimatedDays(ticket, currentKm, kmPerDay) : null
  const daysLabel = estimatedDays !== null ? t('ticket.urgency.estimated_days', { count: estimatedDays }) : null

  const className = [
    styles.card,
    isDragging && !overlay && styles.dragging,
    overlay && styles.overlay,
    editing && styles.editMode,
  ].filter(Boolean).join(' ')

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!intervalKm && !intervalDays) return
    patchInterval(
      {
        id: ticket.id,
        operation: ticket.operation,
        customKm: intervalKm ? Number(intervalKm) : null,
        customDays: intervalDays ? Number(intervalDays) : null,
      },
      {
        onSuccess: () => {
          setEditing(false)
          setIntervalKm('')
          setIntervalDays('')
        },
      },
    )
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
            onClick={() => setEditing((v) => !v)}
            aria-label={t('ticket.interval.edit_title')}
          >
            ✎
          </button>
        )}
      </div>

      {editing && (
        <form className={styles.intervalForm} onSubmit={handleEditSubmit}>
          <p className={styles.intervalTitle}>{t('ticket.interval.edit_title')}</p>
          <Input
            type="number"
            placeholder={t('ticket.form.interval_km.placeholder')}
            value={intervalKm}
            onChange={(e) => setIntervalKm(e.target.value)}
            min={1}
          />
          <Input
            type="number"
            placeholder={t('ticket.form.interval_days.placeholder')}
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            min={1}
          />
          <div className={styles.intervalActions}>
            <Button type="submit" disabled={(!intervalKm && !intervalDays) || isPending}>
              {t('ticket.interval.save')}
            </Button>
            <Button variant="ghost" type="button" onClick={() => setEditing(false)}>
              {t('ticket.interval.cancel')}
            </Button>
          </div>
        </form>
      )}

      {!editing && (
        ticket.status === 'done' && ticket.doneKm !== null
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
      )}
    </div>
  )
}

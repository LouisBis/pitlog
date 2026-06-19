import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react'
import type { Ticket } from '@/types'
import { getUrgency, getKmRemaining, getEstimatedDays } from '@/lib/urgency'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { usePatchTicketInterval, useUpdateTicket, useDeleteTicket } from '@/queries/useTickets'
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

  const [operation, setOperation] = useState(ticket.operation)
  const [targetKm, setTargetKm] = useState(ticket.targetKm?.toString() ?? '')
  const [recurring, setRecurring] = useState(ticket.customKm != null || ticket.customDays != null)
  const [intervalKm, setIntervalKm] = useState(ticket.customKm?.toString() ?? '')
  const [intervalDays, setIntervalDays] = useState(ticket.customDays?.toString() ?? '')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { status: ticket.status },
    disabled: overlay || editing,
  })

  const { mutate: patchInterval, isPending: isPatchingInterval } = usePatchTicketInterval(userMotoId ?? 0)
  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket(userMotoId ?? 0)
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket(userMotoId ?? 0)

  const isPending = isPatchingInterval || isUpdating || isDeleting

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

  const openEdit = () => {
    setOperation(ticket.operation)
    setTargetKm(ticket.targetKm?.toString() ?? '')
    setRecurring(ticket.customKm != null || ticket.customDays != null)
    setIntervalKm(ticket.customKm?.toString() ?? '')
    setIntervalDays(ticket.customDays?.toString() ?? '')
    setEditing(true)
  }

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()

    const operationChanged = operation.trim() !== ticket.operation
    const targetKmChanged = (targetKm ? Number(targetKm) : null) !== ticket.targetKm

    if (operationChanged || targetKmChanged) {
      updateTicket(
        {
          id: ticket.id,
          ...(operationChanged && { operation: operation.trim() }),
          ...(targetKmChanged && { targetKm: targetKm ? Number(targetKm) : null }),
        },
        {
          onSuccess: () => {
            if (recurring && (intervalKm || intervalDays)) {
              patchInterval(
                {
                  id: ticket.id,
                  operation: operation.trim(),
                  customKm: intervalKm ? Number(intervalKm) : null,
                  customDays: intervalDays ? Number(intervalDays) : null,
                },
                { onSuccess: () => setEditing(false) },
              )
            } else {
              setEditing(false)
            }
          },
        },
      )
      return
    }

    if (recurring && (intervalKm || intervalDays)) {
      patchInterval(
        {
          id: ticket.id,
          operation: ticket.operation,
          customKm: intervalKm ? Number(intervalKm) : null,
          customDays: intervalDays ? Number(intervalDays) : null,
        },
        { onSuccess: () => setEditing(false) },
      )
    } else {
      setEditing(false)
    }
  }

  const handleDelete = () => {
    deleteTicket(ticket.id)
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
            onClick={editing ? () => setEditing(false) : openEdit}
            aria-label={t('ticket.edit.title')}
          >
            <PencilSimpleIcon size={14} weight="fill" />
          </button>
        )}
      </div>

      {editing && (
        <form className={styles.editForm} onSubmit={handleSubmit}>
          <Input
            placeholder={t('ticket.edit.operation.placeholder')}
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
          />
          <Input
            type="number"
            placeholder={t('ticket.edit.target_km.placeholder')}
            value={targetKm}
            onChange={(e) => setTargetKm(e.target.value)}
            min={0}
          />
          <label className={styles.editSection} style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            {t('ticket.form.recurrence')}
            <Switch id={`recurring-${ticket.id}`} checked={recurring} onCheckedChange={setRecurring} />
          </label>
          {recurring && (
            <>
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
            </>
          )}
          <div className={styles.editActions}>
            <Button type="submit" disabled={!operation.trim() || isPending}>
              {t('ticket.edit.save')}
            </Button>
            <Button variant="ghost" type="button" onClick={() => setEditing(false)}>
              {t('ticket.edit.cancel')}
            </Button>
          </div>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={t('ticket.edit.delete')}
          >
            <TrashIcon size={16} weight="fill" />
          </button>
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

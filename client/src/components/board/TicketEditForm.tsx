import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrashIcon } from '@phosphor-icons/react'
import type { Ticket } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useDeleteTicket } from '@/queries/useTickets'
import { useTicketParts, useAddTicketPart, useDeleteTicketPart } from '@/queries/useTicketParts'
import { useTicketForm } from '@/hooks/useTicketForm'
import styles from './TicketCard.module.css'

interface Props {
  ticket: Ticket
  userMotoId: number
  /** When true, the form was opened by a blocked drop to part_ordered — a hint is shown asking the user to add at least one part. */
  forceEdit: boolean
  onClose: () => void
}

interface PartForm {
  name: string
  brand: string
  reference: string
  quantity: string
  url: string
}

const EMPTY_PART: PartForm = { name: '', brand: '', reference: '', quantity: '1', url: '' }

export default function TicketEditForm({ ticket, userMotoId, forceEdit, onClose }: Props) {
  const { t } = useTranslation()
  const { form, set, handleSubmit, isPending } = useTicketForm(ticket, userMotoId, onClose)
  const [partForm, setPartForm] = useState<PartForm>(EMPTY_PART)

  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket(userMotoId)
  const { data: parts = [] } = useTicketParts(ticket.id)
  const { mutate: addPart, isPending: isAddingPart } = useAddTicketPart(ticket.id)
  const { mutate: deletePart } = useDeleteTicketPart(ticket.id)

  function setPart<K extends keyof PartForm>(key: K, value: string) {
    setPartForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddPart = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!partForm.name.trim()) return
    addPart(
      {
        name: partForm.name.trim(),
        ...(partForm.brand.trim() && { brand: partForm.brand.trim() }),
        ...(partForm.reference.trim() && { reference: partForm.reference.trim() }),
        ...(partForm.quantity && { quantity: Number(partForm.quantity) }),
        ...(partForm.url.trim() && { url: partForm.url.trim() }),
      },
      { onSuccess: () => setPartForm(EMPTY_PART) },
    )
  }

  return (
    <form className={styles.editForm} onSubmit={handleSubmit}>

      {/* --- Ticket fields --- */}
      <Input
        placeholder={t('ticket.edit.operation.placeholder')}
        value={form.operation}
        onChange={(e) => set('operation', e.target.value)}
      />
      <Input
        type="number"
        placeholder={t('ticket.edit.target_km.placeholder')}
        value={form.targetKm}
        onChange={(e) => set('targetKm', e.target.value)}
        min={0}
      />
      <label className={styles.editSection} style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
        {t('ticket.form.recurrence')}
        <Switch id={`recurring-${ticket.id}`} checked={form.recurring} onCheckedChange={(v) => set('recurring', v)} />
      </label>
      {form.recurring && (
        <>
          <Input
            type="number"
            placeholder={t('ticket.form.interval_km.placeholder')}
            value={form.intervalKm}
            onChange={(e) => set('intervalKm', e.target.value)}
            min={1}
          />
          <Input
            type="number"
            placeholder={t('ticket.form.interval_days.placeholder')}
            value={form.intervalDays}
            onChange={(e) => set('intervalDays', e.target.value)}
            min={1}
          />
        </>
      )}
      <div className={styles.editActions}>
        <Button type="submit" disabled={!form.operation.trim() || isPending}>
          {t('ticket.edit.save')}
        </Button>
        <Button variant="ghost" type="button" onClick={onClose}>
          {t('ticket.edit.cancel')}
        </Button>
      </div>

      {/* --- Parts section --- */}
      <div className={styles.partsSection}>
        <p className={styles.partsSectionTitle}>{t('ticket.parts.title')}</p>
        {forceEdit && parts.length === 0 && (
          <p className={styles.partsHint}>{t('board.part_ordered_hint')}</p>
        )}
        {parts.length > 0 && (
          <ul className={styles.partsList}>
            {parts.map((part) => (
              <li key={part.id} className={styles.partsItem}>
                <span className={styles.partsItemName}>
                  {part.quantity > 1 && <span className={styles.partsQty}>{part.quantity}×</span>}
                  {part.name}
                  {part.brand && <span className={styles.partsMeta}> · {part.brand}</span>}
                  {part.reference && <span className={styles.partsMeta}> · {part.reference}</span>}
                </span>
                <button
                  type="button"
                  className={styles.partsDeleteBtn}
                  onClick={() => deletePart(part.id)}
                  aria-label={t('ticket.parts.delete')}
                >
                  <TrashIcon size={12} weight="fill" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.partsAddForm}>
          <Input
            placeholder={t('ticket.parts.name.placeholder')}
            value={partForm.name}
            onChange={(e) => setPart('name', e.target.value)}
          />
          <div className={styles.partsAddRow}>
            <Input
              placeholder={t('ticket.parts.brand.placeholder')}
              value={partForm.brand}
              onChange={(e) => setPart('brand', e.target.value)}
            />
            <Input
              placeholder={t('ticket.parts.reference.placeholder')}
              value={partForm.reference}
              onChange={(e) => setPart('reference', e.target.value)}
            />
          </div>
          <div className={styles.partsAddRow}>
            <Input
              type="number"
              placeholder={t('ticket.parts.quantity.placeholder')}
              value={partForm.quantity}
              onChange={(e) => setPart('quantity', e.target.value)}
              min={1}
              className={styles.partsQtyInput}
            />
            <Input
              placeholder={t('ticket.parts.url.placeholder')}
              value={partForm.url}
              onChange={(e) => setPart('url', e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={!partForm.name.trim() || isAddingPart}
            onClick={handleAddPart}
          >
            {t('ticket.parts.add')}
          </Button>
        </div>
      </div>

      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => deleteTicket(ticket.id)}
        disabled={isDeleting}
        aria-label={t('ticket.edit.delete')}
      >
        <TrashIcon size={16} weight="fill" />
      </button>
    </form>
  )
}

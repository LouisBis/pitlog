import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateTicket } from '@/queries/useTickets'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import styles from './CreateTicketForm.module.css'

interface Props {
  userMotoId: number
  onClose: () => void
}

export default function CreateTicketForm({ userMotoId, onClose }: Props) {
  const { t } = useTranslation()
  const [operation, setOperation] = useState('')
  const [targetKm, setTargetKm] = useState('')
  const { mutate: createTicket, isPending } = useCreateTicket(userMotoId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!operation.trim()) return
    createTicket(
      {
        operation: operation.trim(),
        targetKm: targetKm ? Number(targetKm) : undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        placeholder={t('ticket.form.operation.placeholder')}
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
        autoFocus
      />
      <Input
        type="number"
        placeholder={t('ticket.form.target_km.placeholder')}
        value={targetKm}
        onChange={(e) => setTargetKm(e.target.value)}
        min={0}
      />
      <div className={styles.actions}>
        <Button type="submit" className={styles.submit} disabled={!operation.trim() || isPending}>
          {t('ticket.action.add')}
        </Button>
        <Button variant="ghost" type="button" onClick={onClose}>
          {t('ticket.action.cancel')}
        </Button>
      </div>
    </form>
  )
}

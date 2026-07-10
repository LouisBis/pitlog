import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateTicket, usePatchTicketInterval } from '@/queries/useTickets'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
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
  const [recurring, setRecurring] = useState(false)
  const [intervalKm, setIntervalKm] = useState('')
  const [intervalDays, setIntervalDays] = useState('')

  const { mutate: createTicket, isPending, isError } = useCreateTicket(userMotoId)
  const { mutate: patchInterval } = usePatchTicketInterval(userMotoId)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!operation.trim()) return

    createTicket(
      {
        operation: operation.trim(),
        targetKm: targetKm ? Number(targetKm) : undefined,
      },
      {
        onSuccess: (ticket) => {
          if (recurring && (intervalKm || intervalDays)) {
            patchInterval(
              {
                id: ticket.id,
                operation: operation.trim(),
                customKm: intervalKm ? Number(intervalKm) : null,
                customDays: intervalDays ? Number(intervalDays) : null,
              },
              { onSuccess: onClose },
            )
          } else {
            onClose()
          }
        },
      },
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
      <label className={styles.switchLabel} htmlFor="recurring">
        {t('ticket.form.recurrence')}
        <Switch id="recurring" checked={recurring} onCheckedChange={setRecurring} />
      </label>
      {recurring && (
        <div className={styles.recurrence}>
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
        </div>
      )}
      <div className={styles.actions}>
        <Button type="submit" className={styles.submit} disabled={!operation.trim() || isPending}>
          {t('ticket.action.add')}
        </Button>
        <Button variant="ghost" type="button" onClick={onClose}>
          {t('ticket.action.cancel')}
        </Button>
      </div>
      {isError && <span className={styles.error}>{t('common.error.server')}</span>}
    </form>
  )
}

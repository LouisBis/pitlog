import { useState } from 'react'
import { useCreateTicket } from '@/queries/useTickets'
import styles from './CreateTicketForm.module.css'

interface Props {
  userMotoId: number
  onClose: () => void
}

export default function CreateTicketForm({ userMotoId, onClose }: Props) {
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
      <input
        className={styles.input}
        placeholder="Opération (ex. : vidange)"
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
        autoFocus
      />
      <input
        className={styles.input}
        type="number"
        placeholder="Km cible (optionnel)"
        value={targetKm}
        onChange={(e) => setTargetKm(e.target.value)}
        min={0}
      />
      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={!operation.trim() || isPending}>
          Ajouter
        </button>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Annuler
        </button>
      </div>
    </form>
  )
}

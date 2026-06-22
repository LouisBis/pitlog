import { useState } from 'react'
import type { Ticket } from '@/types'
import { usePatchTicketInterval, useUpdateTicket } from '@/queries/useTickets'
import log from '@/lib/logger'

interface FormState {
  operation: string
  targetKm: string
  recurring: boolean
  intervalKm: string
  intervalDays: string
}

function fromTicket(ticket: Ticket): FormState {
  return {
    operation: ticket.operation,
    targetKm: ticket.targetKm?.toString() ?? '',
    recurring: ticket.customKm != null || ticket.customDays != null,
    intervalKm: ticket.customKm?.toString() ?? '',
    intervalDays: ticket.customDays?.toString() ?? '',
  }
}

export function useTicketForm(ticket: Ticket, userMotoId: number, onClose: () => void) {
  const [form, setForm] = useState<FormState>(() => fromTicket(ticket))

  const { mutate: patchInterval, isPending: isPatchingInterval } = usePatchTicketInterval(userMotoId)
  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket(userMotoId)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function submitInterval(operationName: string) {
    if (form.recurring && (form.intervalKm || form.intervalDays)) {
      patchInterval(
        {
          id: ticket.id,
          operation: operationName,
          customKm: form.intervalKm ? Number(form.intervalKm) : null,
          customDays: form.intervalDays ? Number(form.intervalDays) : null,
        },
        {
          onSuccess: onClose,
          onError: (err) => log.error('[useTicketForm] patchInterval failed', err),
        },
      )
    } else {
      onClose()
    }
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()

    const operationChanged = form.operation.trim() !== ticket.operation
    const targetKmChanged = (form.targetKm ? Number(form.targetKm) : null) !== ticket.targetKm

    if (operationChanged || targetKmChanged) {
      updateTicket(
        {
          id: ticket.id,
          ...(operationChanged && { operation: form.operation.trim() }),
          ...(targetKmChanged && { targetKm: form.targetKm ? Number(form.targetKm) : null }),
        },
        {
          onSuccess: () => submitInterval(form.operation.trim()),
          onError: (err) => log.error('[useTicketForm] updateTicket failed', err),
        },
      )
      return
    }

    submitInterval(form.operation.trim())
  }

  return {
    form,
    set,
    handleSubmit,
    isPending: isPatchingInterval || isUpdating,
  }
}

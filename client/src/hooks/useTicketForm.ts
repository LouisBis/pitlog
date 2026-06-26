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

/** Initializes form state from an existing ticket. Also used to reset on close. */
function fromTicket(ticket: Ticket): FormState {
  return {
    operation: ticket.operation,
    targetKm: ticket.targetKm?.toString() ?? '',
    recurring: ticket.customKm != null || ticket.customDays != null,
    intervalKm: ticket.customKm?.toString() ?? '',
    intervalDays: ticket.customDays?.toString() ?? '',
  }
}

/** Manages the edit form state and submission logic for a ticket.
 *  Handles the two-step save: ticket fields first, then recurrence interval. */
export function useTicketForm(ticket: Ticket, userMotoId: number, onClose: () => void) {
  const [form, setForm] = useState<FormState>(() => fromTicket(ticket))

  // --- Mutations ---
  const { mutate: patchInterval, isPending: isPatchingInterval } = usePatchTicketInterval(userMotoId)
  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket(userMotoId)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /** Saves the recurrence interval if the ticket is recurring, then closes the form.
   *  Receives the final operation name to keep it in sync when it changed in the same submit. */
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

  /** Two-step save: if operation or targetKm changed, PATCH the ticket first,
   *  then patch the interval on success. This prevents the interval from
   *  referencing a stale operation name if both changed in the same submit. */
  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()

    const operationChanged = form.operation.trim() !== ticket.operation
    const targetKmChanged = (form.targetKm ? Number(form.targetKm) : null) !== ticket.targetKm

    if (operationChanged || targetKmChanged) {
      updateTicket(
        {
          id: ticket.id,
          ...(operationChanged && { operation: form.operation.trim() }),
          ...(targetKmChanged && {
            targetKm: form.targetKm ? Number(form.targetKm) : null,
          }),
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

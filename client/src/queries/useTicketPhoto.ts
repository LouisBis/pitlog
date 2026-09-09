import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import log from '@/lib/logger'
import type { Ticket } from '@/types'

/** Uploads or replaces the photo on a done ticket and patches the cached ticket list. */
export const useUpdateTicketPhoto = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, photoBase64 }: { id: number; photoBase64: string }) => api.updateTicketPhoto(id, photoBase64),
    onSuccess: (updated) => {
      queryClient.setQueryData<Ticket[]>(['tickets', userMotorcycleId], (old) =>
        old?.map((t) => (t.id === updated.id ? updated : t)),
      )
    },
    onError: (err) => {
      log.error('[useUpdateTicketPhoto] failed', err)
    },
  })
}

/** Deletes the photo on a ticket and patches the cached ticket list. */
export const useDeleteTicketPhoto = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteTicketPhoto(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Ticket[]>(['tickets', userMotorcycleId], (old) =>
        old?.map((t) => (t.id === id ? { ...t, photoBase64: null } : t)),
      )
    },
    onError: (err) => {
      log.error('[useDeleteTicketPhoto] failed', err)
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import log from '@/lib/logger'

/** Uploads or replaces the photo on a done ticket and refreshes the ticket list. */
export const useUpdateTicketPhoto = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, photoBase64 }: { id: number; photoBase64: string }) => api.updateTicketPhoto(id, photoBase64),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useUpdateTicketPhoto] failed', err)
    },
  })
}

/** Deletes the photo on a ticket and refreshes the ticket list. */
export const useDeleteTicketPhoto = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteTicketPhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useDeleteTicketPhoto] failed', err)
    },
  })
}

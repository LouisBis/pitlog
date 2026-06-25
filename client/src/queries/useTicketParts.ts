import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import log from '@/lib/logger'
import type { CreatePartPayload } from '@/types'

/** Fetches the parts list for a given ticket. */
export const useTicketParts = (ticketId: number) =>
  useQuery({
    queryKey: ['ticket-parts', ticketId],
    queryFn: () => api.getTicketParts(ticketId),
  })

/** Adds a part to a ticket and refreshes the parts list. */
export const useAddTicketPart = (ticketId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePartPayload) => api.addTicketPart(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] })
    },
    onError: (err) => {
      log.error('[useAddTicketPart] failed', err)
    },
  })
}

/** Deletes a part from a ticket and refreshes the parts list. */
export const useDeleteTicketPart = (ticketId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (partId: number) => api.deleteTicketPart(ticketId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] })
    },
    onError: (err) => {
      log.error('[useDeleteTicketPart] failed', err)
    },
  })
}

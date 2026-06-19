import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreatePartPayload } from '@/types'

export const useTicketParts = (ticketId: number) =>
  useQuery({
    queryKey: ['ticket-parts', ticketId],
    queryFn: () => api.getTicketParts(ticketId),
  })

export const useAddTicketPart = (ticketId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePartPayload) => api.addTicketPart(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] })
    },
  })
}

export const useDeleteTicketPart = (ticketId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (partId: number) => api.deleteTicketPart(ticketId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] })
    },
  })
}

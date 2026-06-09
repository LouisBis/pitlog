import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TicketStatus } from '@/types'

export const useTickets = (userMotorcycleId: number) =>
  useQuery({
    queryKey: ['tickets', userMotorcycleId],
    queryFn: () => api.getTickets(userMotorcycleId),
    enabled: userMotorcycleId > 0,
  })

export const usePatchTicketStatus = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) =>
      api.patchTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
  })
}

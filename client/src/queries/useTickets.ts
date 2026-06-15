import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreateTicketPayload, Ticket, TicketStatus } from '@/types'

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
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', userMotorcycleId] })
      const previous = queryClient.getQueryData<Ticket[]>(['tickets', userMotorcycleId])
      queryClient.setQueryData<Ticket[]>(['tickets', userMotorcycleId], (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['tickets', userMotorcycleId], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
  })
}

export const useCreateTicket = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CreateTicketPayload, 'userMotorcycleId'>) =>
      api.createTicket({ ...data, userMotorcycleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
  })
}

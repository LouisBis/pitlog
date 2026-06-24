import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type UpdateTicketPayload } from '@/lib/api'
import log from '@/lib/logger'
import type { CreateTicketPayload, UpdateTicketIntervalPayload, Ticket, TicketStatus } from '@/types'

/** Fetches all tickets for a given user motorcycle. Disabled until a valid id is provided. */
export const useTickets = (userMotorcycleId: number) =>
  useQuery({
    queryKey: ['tickets', userMotorcycleId],
    queryFn: () => api.getTickets(userMotorcycleId),
    enabled: userMotorcycleId > 0,
  })

/** Patches a ticket's status with an optimistic update.
 *  Rolls back the cache if the server request fails. */
export const usePatchTicketStatus = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) =>
      api.patchTicketStatus(id, status),

    // --- Optimistic update ---
    onMutate: async ({ id, status }) => {
      // Cancel any in-flight refetch to prevent it from overwriting the optimistic state
      await queryClient.cancelQueries({ queryKey: ['tickets', userMotorcycleId] })
      const previous = queryClient.getQueryData<Ticket[]>(['tickets', userMotorcycleId])
      // Without a snapshot, onError would call setQueryData(key, undefined) and wipe the board
      if (!previous) return
      queryClient.setQueryData<Ticket[]>(['tickets', userMotorcycleId], (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['tickets', userMotorcycleId], context?.previous)
      log.error('[usePatchTicketStatus] failed, rolling back optimistic update')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
  })
}

/** Creates a ticket and refreshes the ticket list. */
export const useCreateTicket = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CreateTicketPayload, 'userMotorcycleId'>) =>
      api.createTicket({ ...data, userMotorcycleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useCreateTicket] failed', err)
    },
  })
}

/** Updates the recurrence interval (customKm / customDays) of a ticket. */
export const usePatchTicketInterval = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateTicketIntervalPayload) =>
      api.patchTicketInterval(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[usePatchTicketInterval] failed', err)
    },
  })
}

/** Updates a ticket's operation name and/or target km. */
export const useUpdateTicket = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateTicketPayload) =>
      api.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useUpdateTicket] failed', err)
    },
  })
}

/** Deletes a ticket and refreshes the ticket list. */
export const useDeleteTicket = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useDeleteTicket] failed', err)
    },
  })
}

/** Imports catalogue maintenance intervals as tickets for the given motorcycle. */
export const useImportIntervals = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.importIntervals(userMotorcycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useImportIntervals] failed', err)
    },
  })
}

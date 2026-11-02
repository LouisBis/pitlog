import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import log from '@/lib/logger'
import type { AccentSwatch, AddMotorcyclePayload, UserMotorcycle } from '@/types'

/** Fetches the current user's garage (all owned motorcycles). */
export const useUserMotorcycles = () =>
  useQuery({
    queryKey: ['user-motorcycles'],
    queryFn: api.getUserMotorcycles,
  })

/** Adds a motorcycle to the user's garage and refreshes the garage list. */
export const useAddMotorcycle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddMotorcyclePayload) => api.addMotorcycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-motorcycles'] })
    },
  })
}

/** Fetches the velocity estimate (km/day) for a given user motorcycle. */
export const useVelocity = (userMotorcycleId: number) =>
  useQuery({
    queryKey: ['velocity', userMotorcycleId],
    queryFn: () => api.getVelocity(userMotorcycleId),
    enabled: userMotorcycleId > 0,
  })

/** Updates the odometer and refreshes both the garage list and velocity estimate. */
export const useUpdateKm = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (km: number) => api.updateKm(userMotorcycleId, km),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-motorcycles'] })
      queryClient.invalidateQueries({
        queryKey: ['velocity', userMotorcycleId],
      })
    },
  })
}

/** Sets a custom motorcycle's accent swatch with an optimistic update.
 *  Rolls back the cache if the server request fails (e.g. the motorcycle turns out to be catalog-backed). */
export const useSetAccentColor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userMotorcycleId, accentColor }: { userMotorcycleId: number; accentColor: AccentSwatch | null }) =>
      api.setAccentColor(userMotorcycleId, accentColor),

    onMutate: async ({ userMotorcycleId, accentColor }) => {
      await queryClient.cancelQueries({ queryKey: ['user-motorcycles'] })
      const previous = queryClient.getQueryData<UserMotorcycle[]>(['user-motorcycles'])
      if (!previous) return
      queryClient.setQueryData<UserMotorcycle[]>(['user-motorcycles'], (old) =>
        old?.map((m) => (m.id === userMotorcycleId ? { ...m, accentColor } : m)),
      )
      return { previous }
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(['user-motorcycles'], context?.previous)
      log.error('[useSetAccentColor] failed, rolling back optimistic update', err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-motorcycles'] })
    },
  })
}

/** Removes a motorcycle from the user's garage and refreshes the garage list. */
export const useDeleteMotorcycle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userMotorcycleId: number) => api.deleteMotorcycle(userMotorcycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-motorcycles'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AddMotorcyclePayload } from '@/types'

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

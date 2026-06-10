import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useUserMotorcycles = () =>
  useQuery({
    queryKey: ['user-motorcycles'],
    queryFn: api.getUserMotorcycles,
  })

export const useVelocity = (userMotorcycleId: number) =>
  useQuery({
    queryKey: ['velocity', userMotorcycleId],
    queryFn: () => api.getVelocity(userMotorcycleId),
    enabled: userMotorcycleId > 0,
  })

export const useUpdateKm = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (km: number) => api.updateKm(userMotorcycleId, km),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-motorcycles'] })
      queryClient.invalidateQueries({ queryKey: ['velocity', userMotorcycleId] })
    },
  })
}

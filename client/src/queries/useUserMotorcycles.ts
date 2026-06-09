import { useQuery } from '@tanstack/react-query'
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

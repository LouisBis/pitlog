import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useUserMotorcycles = () =>
  useQuery({
    queryKey: ['user-motorcycles'],
    queryFn: api.getUserMotorcycles,
  })

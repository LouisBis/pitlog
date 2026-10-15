import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import log from '@/lib/logger'
import type { HistoryImportEntry } from '@/types'

/** Bulk-imports history entries for a motorcycle and refreshes its ticket list. */
export const useImportHistory = (userMotorcycleId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: HistoryImportEntry[]) => api.importHistory(userMotorcycleId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', userMotorcycleId] })
    },
    onError: (err) => {
      log.error('[useImportHistory] failed', err)
    },
  })
}

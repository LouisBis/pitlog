import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Fetches the list of all catalog summaries (slug, brand, model, year). */
export const useCatalogSummaries = () =>
  useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.getCatalogSummaries(),
    staleTime: Infinity,
  })

/** Fetches a full catalog entry including intervals and torque specs. Disabled until a slug is provided. */
export const useCatalogEntry = (slug: string | null | undefined) =>
  useQuery({
    queryKey: ['catalog', slug],
    queryFn: () => api.getCatalogEntry(slug!),
    enabled: !!slug,
    staleTime: Infinity,
  })

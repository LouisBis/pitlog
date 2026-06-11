const MS_PER_DAY = 1000 * 60 * 60 * 24

export interface KmEntry {
  km: number
  recordedAt: Date
}

export interface VelocityResult {
  kmPerDay: number
  dataPoints: number
  periodDays: number
}

export function computeVelocity(entries: KmEntry[], windowSize = 10): VelocityResult | null {
  const sorted = [...entries].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
  const window = sorted.slice(-windowSize)

  if (window.length < 2) return null

  const first = window[0]
  const last = window[window.length - 1]

  const periodMs = last.recordedAt.getTime() - first.recordedAt.getTime()
  const periodDays = periodMs / MS_PER_DAY

  if (periodDays === 0) return null

  const kmPerDay = (last.km - first.km) / periodDays

  return {
    kmPerDay: Math.round(kmPerDay * 100) / 100,
    dataPoints: window.length,
    periodDays: Math.round(periodDays * 10) / 10,
  }
}

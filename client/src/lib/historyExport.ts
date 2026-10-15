import Papa from 'papaparse'
import type { Ticket } from '@/types'
import { getOperationLabel } from './catalogI18n'

/** Builds a spreadsheet-readable CSV (date, operation, km) from a motorcycle's done tickets. */
export function buildCsvExport(tickets: Ticket[], t: (key: string, fallback: string) => string): string {
  const rows = tickets.map((tk) => ({
    date: tk.doneAt ? tk.doneAt.slice(0, 10) : '',
    operation: getOperationLabel(tk, t),
    km: tk.doneKm ?? '',
  }))
  return Papa.unparse(rows, { columns: ['date', 'operation', 'km'] })
}

/** Builds a full-fidelity JSON backup — the exact shape the JSON import path expects back. */
export function buildJsonExport(tickets: Ticket[]): string {
  const entries = tickets.map((tk) => ({
    operation: tk.operation,
    doneAt: tk.doneAt,
    doneKm: tk.doneKm,
    catalogSlug: tk.catalogSlug,
    intervalSlug: tk.intervalSlug,
    customIntervalId: tk.customIntervalId,
    photoBase64: tk.photoBase64,
  }))
  return JSON.stringify(entries, null, 2)
}

/** Triggers a browser download of the given text content. */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@/components/ui/Dialog'
import { useCatalogEntry } from '@/queries/useCatalog'
import { useImportHistory } from '@/queries/useHistoryImport'
import { getOperationLabel } from '@/lib/catalogI18n'
import type { MappedRow, IntervalCandidate } from '@/lib/csvHistory'
import type { HistoryImportEntry, Ticket, UserMotorcycle } from '@/types'
import UploadStep from './UploadStep'
import MappingStep from './MappingStep'
import MatchingStep from './MatchingStep'
import PreviewStep from './PreviewStep'
import styles from './ImportHistoryDialog.module.css'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  moto: UserMotorcycle
  existingTickets: Ticket[]
}

type Step =
  | { name: 'upload' }
  | { name: 'map'; headers: string[]; rows: Record<string, string>[] }
  | { name: 'match'; rows: MappedRow[] }
  | { name: 'preview'; entries: HistoryImportEntry[]; skipped: MappedRow[] }

/** Multi-step wizard: upload a CSV (map columns, match intervals) or a Pitlog JSON export, preview, confirm. */
export default function ImportHistoryDialog({ open, onOpenChange, moto, existingTickets }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>({ name: 'upload' })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { data: catalogEntry } = useCatalogEntry(moto.catalogSlug)
  const { mutate: importHistory, isPending, isError } = useImportHistory(moto.id)

  const candidates = useMemo<IntervalCandidate[]>(() => {
    if (moto.catalogSlug && catalogEntry) {
      return catalogEntry.categories
        .flatMap((c) => c.intervals)
        .map((i) => ({ label: getOperationLabel(i, t), catalogSlug: moto.catalogSlug!, intervalSlug: i.slug }))
    }
    const seen = new Map<number, string>()
    for (const tk of existingTickets) {
      if (tk.customIntervalId !== null) seen.set(tk.customIntervalId, tk.operation)
    }
    return [...seen.entries()].map(([customIntervalId, label]) => ({ label, customIntervalId }))
  }, [moto.catalogSlug, catalogEntry, existingTickets, t])

  const reset = () => {
    setStep({ name: 'upload' })
    setUploadError(null)
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleConfirm = (entries: HistoryImportEntry[]) => {
    importHistory(entries, {
      onSuccess: () => handleClose(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} closeLabel={t('history.import.close')} label={t('history.import.action')}>
      <div className={styles.container}>
        {step.name === 'upload' && (
          <UploadStep
            onCsvParsed={(headers, rows) => setStep({ name: 'map', headers, rows })}
            onJsonParsed={(entries) => setStep({ name: 'preview', entries, skipped: [] })}
            onError={setUploadError}
          />
        )}
        {step.name === 'map' && (
          <MappingStep headers={step.headers} rows={step.rows} onContinue={(rows) => setStep({ name: 'match', rows })} />
        )}
        {step.name === 'match' && (
          <MatchingStep
            rows={step.rows}
            candidates={candidates}
            onContinue={(entries, skipped) => setStep({ name: 'preview', entries, skipped })}
          />
        )}
        {step.name === 'preview' && (
          <PreviewStep
            entries={step.entries}
            skipped={step.skipped}
            isPending={isPending}
            isError={isError}
            onConfirm={() => handleConfirm(step.entries)}
            onCancel={() => handleClose(false)}
          />
        )}
        {uploadError && <span className={styles.error}>{uploadError}</span>}
      </div>
    </Dialog>
  )
}

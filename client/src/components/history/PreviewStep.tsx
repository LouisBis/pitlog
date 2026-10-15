import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { HistoryImportEntry } from '@/types'
import type { MappedRow } from '@/lib/csvHistory'
import styles from './PreviewStep.module.css'

interface Props {
  entries: HistoryImportEntry[]
  skipped: MappedRow[]
  isPending: boolean
  isError: boolean
  onConfirm: () => void
  onCancel: () => void
}

const ROW_ERROR_KEYS: Record<NonNullable<MappedRow['error']>, string> = {
  invalid_date: 'history.import.row_error_invalid_date',
  invalid_km: 'history.import.row_error_invalid_km',
  missing_operation: 'history.import.row_error_missing_operation',
}

/** Final recap before committing the import — valid entries, skipped rows with their reason. */
export default function PreviewStep({ entries, skipped, isPending, isError, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      <p className={styles.title}>{t('history.import.preview_title')}</p>
      <p className={styles.summary}>
        {t('history.import.preview_summary', { valid: entries.length, invalid: skipped.length })}
      </p>
      <ul className={styles.list}>
        {entries.map((e, i) => (
          <li key={i}>
            {e.doneAt.slice(0, 10)} — {e.operation} — {e.doneKm} km
          </li>
        ))}
      </ul>
      {skipped.length > 0 && (
        <ul className={styles.skippedList}>
          {skipped.map((s, i) => (
            <li key={i} className={styles.skippedRow}>
              {s.operation || '—'}: {t(s.error ? ROW_ERROR_KEYS[s.error] : '')}
            </li>
          ))}
        </ul>
      )}
      {isError && <span className={styles.error}>{t('history.import.error')}</span>}
      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('history.import.cancel')}
        </Button>
        <Button type="button" disabled={entries.length === 0 || isPending} onClick={onConfirm}>
          {t('history.import.confirm')}
        </Button>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { autoMatchInterval, type MappedRow, type IntervalCandidate } from '@/lib/csvHistory'
import type { HistoryImportEntry } from '@/types'
import styles from './MatchingStep.module.css'

interface Props {
  rows: MappedRow[]
  candidates: IntervalCandidate[]
  onContinue: (entries: HistoryImportEntry[], skipped: MappedRow[]) => void
}

const NONE_VALUE = '__none__'

function candidateKey(c: IntervalCandidate): string {
  return c.customIntervalId !== undefined ? `custom:${c.customIntervalId}` : `catalog:${c.catalogSlug}:${c.intervalSlug}`
}

/** For each valid row, shows the auto-matched recurring interval (or none) with a manual override. */
export default function MatchingStep({ rows, candidates, onContinue }: Props) {
  const { t } = useTranslation()
  const validRows = useMemo(() => rows.filter((r) => r.error === null), [rows])

  const [selections, setSelections] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    validRows.forEach((row, i) => {
      const match = autoMatchInterval(row.operation, candidates)
      initial[i] = match ? candidateKey(match) : NONE_VALUE
    })
    return initial
  })

  const handleContinue = () => {
    const skipped = rows.filter((r) => r.error !== null)
    const entries: HistoryImportEntry[] = validRows.map((row, i) => {
      const key = selections[i]
      const candidate = key === NONE_VALUE ? undefined : candidates.find((c) => candidateKey(c) === key)
      return {
        operation: row.operation,
        // validRows is freshly filtered to error === null, which mapRows only sets when both fields are non-null
        doneAt: row.doneAt as string,
        doneKm: row.doneKm as number,
        catalogSlug: candidate?.catalogSlug,
        intervalSlug: candidate?.intervalSlug,
        customIntervalId: candidate?.customIntervalId,
      }
    })
    onContinue(entries, skipped)
  }

  return (
    <div className={styles.container}>
      <p className={styles.title}>{t('history.import.matching_title')}</p>
      <ul className={styles.list}>
        {validRows.map((row, i) => (
          <li key={i} className={styles.row}>
            <span className={styles.operation}>{row.operation}</span>
            <Select
              size="sm"
              value={selections[i]}
              onChange={(e) => setSelections((prev) => ({ ...prev, [i]: e.target.value }))}
            >
              <option value={NONE_VALUE}>{t('history.import.matching_none')}</option>
              {candidates.map((c) => (
                <option key={candidateKey(c)} value={candidateKey(c)}>
                  {c.label}
                </option>
              ))}
            </Select>
          </li>
        ))}
      </ul>
      <Button type="button" onClick={handleContinue}>
        {t('history.import.confirm')}
      </Button>
    </div>
  )
}

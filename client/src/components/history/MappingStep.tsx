import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { guessColumnMapping, mapRows, type MappedRow } from '@/lib/csvHistory'
import styles from './MappingStep.module.css'

interface Props {
  headers: string[]
  rows: Record<string, string>[]
  onContinue: (mapped: MappedRow[]) => void
}

/** Lets the user assign CSV headers to date/operation/km, pre-filled with a best guess. */
export default function MappingStep({ headers, rows, onContinue }: Props) {
  const { t } = useTranslation()
  const [mapping, setMapping] = useState(() => guessColumnMapping(headers))

  const isComplete = mapping.date !== null && mapping.operation !== null && mapping.km !== null

  const handleContinue = () => {
    if (!isComplete) return
    onContinue(mapRows(rows, { date: mapping.date!, operation: mapping.operation!, km: mapping.km! }))
  }

  const field = (key: 'date' | 'operation' | 'km', label: string) => (
    <label className={styles.field}>
      {label}
      <Select
        size="sm"
        value={mapping[key] ?? ''}
        onChange={(e) => setMapping((prev) => ({ ...prev, [key]: e.target.value || null }))}
      >
        <option value="">—</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
    </label>
  )

  return (
    <div className={styles.container}>
      <p className={styles.title}>{t('history.import.mapping_title')}</p>
      {field('date', t('history.import.mapping_date'))}
      {field('operation', t('history.import.mapping_operation'))}
      {field('km', t('history.import.mapping_km'))}
      <Button type="button" disabled={!isComplete} onClick={handleContinue}>
        {t('history.import.confirm')}
      </Button>
    </div>
  )
}

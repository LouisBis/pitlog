import { useTranslation } from 'react-i18next'
import { parseCsvFile, jsonImportSchema } from '@/lib/csvHistory'
import type { HistoryImportEntry } from '@/types'

interface Props {
  onCsvParsed: (headers: string[], rows: Record<string, string>[]) => void
  onJsonParsed: (entries: HistoryImportEntry[]) => void
  onError: (message: string) => void
}

const MAX_ROWS = 2000

/** File-picker step: routes a .csv file to column mapping, a .json file straight to preview. */
export default function UploadStep({ onCsvParsed, onJsonParsed, onError }: Props) {
  const { t } = useTranslation()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text()
        const result = jsonImportSchema.safeParse(JSON.parse(text))
        if (!result.success) {
          onError(t('history.import.upload_error'))
          return
        }
        if (result.data.length > MAX_ROWS) {
          onError(t('history.import.too_many_rows'))
          return
        }
        onJsonParsed(result.data)
        return
      }

      const { headers, rows } = await parseCsvFile(file)
      if (rows.length > MAX_ROWS) {
        onError(t('history.import.too_many_rows'))
        return
      }
      onCsvParsed(headers, rows)
    } catch {
      onError(t('history.import.upload_error'))
    } finally {
      // Without this, picking the same file twice in a row (e.g. after an error) never fires
      // another `change` event, because the input's value hasn't changed.
      input.value = ''
    }
  }

  return (
    <div>
      <p>{t('history.import.upload_prompt')}</p>
      <input type="file" accept=".csv,.json" onChange={handleChange} />
    </div>
  )
}

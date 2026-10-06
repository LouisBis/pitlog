import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { buildCsvExport, buildJsonExport, downloadFile } from '@/lib/historyExport'
import ImportHistoryDialog from './ImportHistoryDialog'
import type { Ticket, UserMotorcycle } from '@/types'
import styles from './HistoryActions.module.css'

interface Props {
  moto: UserMotorcycle
  doneTickets: Ticket[]
}

/** Import/export controls for a motorcycle's history page. */
export default function HistoryActions({ moto, doneTickets }: Props) {
  const { t } = useTranslation()
  const [importOpen, setImportOpen] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const filenameBase = `pitlog-historique-${moto.brand}-${moto.model}`.toLowerCase().replace(/\s+/g, '-')

  const handleExportCsv = () => {
    downloadFile(buildCsvExport(doneTickets, t), `${filenameBase}.csv`, 'text/csv')
    setExportMenuOpen(false)
  }

  const handleExportJson = () => {
    downloadFile(buildJsonExport(doneTickets), `${filenameBase}.json`, 'application/json')
    setExportMenuOpen(false)
  }

  return (
    <div className={styles.container}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
        {t('history.import.action')}
      </Button>
      <div className={styles.exportWrapper}>
        <Button type="button" variant="ghost" size="sm" onClick={() => setExportMenuOpen((v) => !v)}>
          {t('history.export.action')}
        </Button>
        {exportMenuOpen && (
          <div className={styles.exportMenu} role="menu">
            <button type="button" role="menuitem" className={styles.exportMenuItem} onClick={handleExportCsv}>
              {t('history.export.csv')}
            </button>
            <button type="button" role="menuitem" className={styles.exportMenuItem} onClick={handleExportJson}>
              {t('history.export.json')}
            </button>
          </div>
        )}
      </div>
      <ImportHistoryDialog open={importOpen} onOpenChange={setImportOpen} moto={moto} existingTickets={doneTickets} />
    </div>
  )
}

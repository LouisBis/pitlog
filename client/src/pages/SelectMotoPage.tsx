import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash } from '@phosphor-icons/react'
import { useUserMotorcycles, useMotorcycles, useDeleteMotorcycle } from '@/queries/useUserMotorcycles'
import AddMotoForm from '@/components/AddMotoForm'
import { Button } from '@/components/ui/Button'
import type { UserMotorcycle } from '@/types'
import styles from './SelectMotoPage.module.css'

function MotoCard({ moto, onSelect }: { moto: UserMotorcycle; onSelect: () => void }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const { mutate: deleteMoto, isPending } = useDeleteMotorcycle()

  const handleDelete = () => {
    deleteMoto(moto.id)
  }

  return (
    <div className={styles.card} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()}>
      <div className={styles.cardInner}>
        <div>
          <p className={styles.brand}>{moto.brand}</p>
          <h2 className={styles.model}>{moto.model}</h2>
          <div className={styles.badges}>
            <span className={styles.badgeYear}>{moto.year}</span>
            <span className={styles.badgeKm}>{t('common.km', { count: moto.currentKm })}</span>
          </div>
        </div>
        <span className={styles.arrow}>→</span>
      </div>
      {confirming ? (
        <div className={styles.deleteConfirm} onClick={(e) => e.stopPropagation()}>
          <span className={styles.deleteConfirmText}>{t('garage.delete_confirm')}</span>
          <button className={styles.deleteConfirmYes} onClick={handleDelete} disabled={isPending}>
            {t('garage.delete_yes')}
          </button>
          <button className={styles.deleteConfirmNo} onClick={() => setConfirming(false)}>
            {t('garage.delete_no')}
          </button>
        </div>
      ) : (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
          aria-label={t('garage.delete')}
        >
          <Trash size={18} weight="fill" />
        </button>
      )}
    </div>
  )
}

export default function SelectMotoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const { data: motos, isLoading, isError } = useUserMotorcycles()
  const { data: catalogue = [] } = useMotorcycles()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Pitlog</span>
        <span className={styles.tagline}>{t('garage.tagline')}</span>
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('garage.title')}</h1>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {t('garage.add')}
          </Button>
        </div>
        <p className={styles.subtitle}>{t('garage.subtitle')}</p>

        {showForm && (
          <AddMotoForm catalogue={catalogue} onClose={() => setShowForm(false)} />
        )}

        {isLoading && <p>{t('common.loading')}</p>}
        {isError && <p className={styles.error}>{t('common.error.loading')}</p>}
        {motos?.length === 0 && !showForm && <p className={styles.empty}>{t('garage.empty')}</p>}

        <div className={styles.list}>
          {motos?.map((moto) => (
            <MotoCard key={moto.id} moto={moto} onSelect={() => navigate(`/board/${moto.id}`)} />
          ))}
        </div>
      </main>
    </div>
  )
}

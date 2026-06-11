import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import type { UserMotorcycle } from '@/types'
import styles from './SelectMotoPage.module.css'

function MotoCard({ moto, onClick }: { moto: UserMotorcycle; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button type="button" onClick={onClick} className={styles.card}>
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
    </button>
  )
}

export default function SelectMotoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: motos, isLoading, isError } = useUserMotorcycles()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Pitlog</span>
        <span className={styles.tagline}>{t('garage.tagline')}</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{t('garage.title')}</h1>
        <p className={styles.subtitle}>{t('garage.subtitle')}</p>

        {isLoading && <p>{t('common.loading')}</p>}
        {isError && <p className={styles.error}>{t('common.error.loading')}</p>}
        {motos?.length === 0 && <p className={styles.empty}>{t('garage.empty')}</p>}

        <div className={styles.list}>
          {motos?.map((moto) => (
            <MotoCard key={moto.id} moto={moto} onClick={() => navigate(`/board/${moto.id}`)} />
          ))}
        </div>
      </main>
    </div>
  )
}

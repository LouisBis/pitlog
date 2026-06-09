import { useNavigate } from 'react-router-dom'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import type { UserMotorcycle } from '@/types'
import styles from './SelectMotoPage.module.css'

function MotoCard({ moto, onClick }: { moto: UserMotorcycle; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={styles.card}>
      <div className={styles.cardInner}>
        <div>
          <p className={styles.brand}>{moto.brand}</p>
          <h2 className={styles.model}>{moto.model}</h2>
          <div className={styles.badges}>
            <span className={styles.badgeYear}>{moto.year}</span>
            <span className={styles.badgeKm}>{moto.currentKm.toLocaleString('fr-FR')} km</span>
          </div>
        </div>
        <span className={styles.arrow}>→</span>
      </div>
    </button>
  )
}

export default function SelectMotoPage() {
  const navigate = useNavigate()
  const { data: motos, isLoading, isError } = useUserMotorcycles()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Pitlog</span>
        <span className={styles.tagline}>Journal de bord de tes révisions</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Mes motos</h1>
        <p className={styles.subtitle}>Sélectionne une moto pour accéder à son tableau de bord.</p>

        {isLoading && <p>Chargement…</p>}
        {isError && <p className={styles.error}>Erreur de chargement.</p>}
        {motos?.length === 0 && <p className={styles.empty}>Aucune moto enregistrée.</p>}

        <div className={styles.list}>
          {motos?.map((moto) => (
            <MotoCard key={moto.id} moto={moto} onClick={() => navigate(`/board/${moto.id}`)} />
          ))}
        </div>
      </main>
    </div>
  )
}

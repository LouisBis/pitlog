import { useParams, useNavigate } from 'react-router-dom'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import KanbanBoard from '@/components/board/KanbanBoard'
import styles from './BoardPage.module.css'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const userMotoId = Number(id)
  const navigate = useNavigate()
  const { data: motos } = useUserMotorcycles()
  const moto = motos?.find((m) => m.id === userMotoId)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate('/')}>
          ← Mes motos
        </button>
        {moto && (
          <>
            <span className={styles.motoName}>{moto.brand} {moto.model} ({moto.year})</span>
            <span className={styles.km}>{moto.currentKm.toLocaleString('fr-FR')} km</span>
          </>
        )}
      </header>
      <KanbanBoard userMotoId={userMotoId} />
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'
import KanbanBoard from '@/components/board/KanbanBoard'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const userMotoId = Number(id)
  const navigate = useNavigate()
  const { data: motos } = useUserMotorcycles()
  const moto = motos?.find((m) => m.id === userMotoId)

  return (
    <div>
      <header style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button type="button" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          ← Mes motos
        </button>
        {moto && (
          <span style={{ fontWeight: 600 }}>
            {moto.brand} {moto.model} ({moto.year}) — {moto.currentKm} km
          </span>
        )}
      </header>
      <KanbanBoard userMotoId={userMotoId} />
    </div>
  )
}

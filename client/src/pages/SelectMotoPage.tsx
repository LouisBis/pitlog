import { useNavigate } from 'react-router-dom'
import { useUserMotorcycles } from '@/queries/useUserMotorcycles'

export default function SelectMotoPage() {
  const navigate = useNavigate()
  const { data: motos, isLoading, isError } = useUserMotorcycles()

  if (isLoading) return <p>Chargement…</p>
  if (isError) return <p>Erreur de chargement.</p>

  return (
    <main>
      <h1>Mes motos</h1>
      {motos?.length === 0 && <p>Aucune moto enregistrée.</p>}
      <ul>
        {motos?.map((moto) => (
          <li key={moto.id}>
            <button type="button" onClick={() => navigate(`/board/${moto.id}`)}>
              {moto.brand} {moto.model} ({moto.year}) — {moto.currentKm} km
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

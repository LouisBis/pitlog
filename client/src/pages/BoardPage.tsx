import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserMotorcycles, useVelocity } from '@/queries/useUserMotorcycles'
import KanbanBoard from '@/components/board/KanbanBoard'
import KmUpdateForm from '@/components/board/KmUpdateForm'
import styles from './BoardPage.module.css'

export default function BoardPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userMotoId = Number(id)
  const isValidId = Number.isInteger(userMotoId) && userMotoId > 0
  const [editingKm, setEditingKm] = useState(false)

  const { data: motos, isError } = useUserMotorcycles()
  const moto = motos?.find((m) => m.id === userMotoId)
  const { data: velocity } = useVelocity(userMotoId)

  useEffect(() => {
    if (!isValidId) navigate('/', { replace: true })
  }, [isValidId, navigate])

  useEffect(() => {
    if (motos && !moto) navigate('/', { replace: true })
  }, [motos, moto, navigate])

  if (!isValidId) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate('/')}>
          {t('nav.back_to_garage')}
        </button>
        {moto && (
          <>
            <span className={styles.motoName}>{moto.brand} {moto.model} ({moto.year})</span>
            {editingKm
              ? <KmUpdateForm userMotoId={userMotoId} currentKm={moto.currentKm} onClose={() => setEditingKm(false)} />
              : <button type="button" className={styles.km} onClick={() => setEditingKm(true)} title={t('km_update.label')}>
                  {t('common.km', { count: moto.currentKm })} ✎
                </button>
            }
          </>
        )}
        {isError && <span style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{t('common.error.server')}</span>}
      </header>
      {moto && <KanbanBoard userMotoId={userMotoId} currentKm={moto.currentKm} kmPerDay={velocity?.kmPerDay ?? null} />}
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateKm } from '@/queries/useUserMotorcycles'
import styles from './KmUpdateForm.module.css'

interface Props {
  userMotoId: number
  currentKm: number
  onClose: () => void
}

export default function KmUpdateForm({ userMotoId, currentKm, onClose }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const { mutate: updateKm, isPending } = useUpdateKm(userMotoId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const km = Number(value)
    if (!km || km <= currentKm) {
      setError(true)
      return
    }
    updateKm(km, { onSuccess: onClose })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={`${styles.input}${error ? ` ${styles.inputError}` : ''}`}
        type="number"
        placeholder={t('km_update.placeholder')}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(false) }}
        min={currentKm + 1}
        autoFocus
      />
      <button type="submit" className={styles.confirm} disabled={!value || isPending}>
        {t('km_update.confirm')}
      </button>
      <button type="button" className={styles.cancel} onClick={onClose}>
        {t('km_update.cancel')}
      </button>
      {error && <span className={styles.error}>{t('km_update.error.lower')}</span>}
    </form>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateKm } from '@/queries/useUserMotorcycles'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
      <Input
        type="number"
        size="sm"
        error={error}
        placeholder={t('km_update.placeholder')}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(false) }}
        min={currentKm + 1}
        autoFocus
      />
      <Button size="sm" type="submit" disabled={!value || isPending}>
        {t('km_update.confirm')}
      </Button>
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        {t('km_update.cancel')}
      </Button>
      {error && <span className={styles.error}>{t('km_update.error.lower')}</span>}
    </form>
  )
}

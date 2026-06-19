import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Motorcycle } from '@/types'
import { useAddMotorcycle } from '@/queries/useUserMotorcycles'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import styles from './AddMotoForm.module.css'

interface Props {
  catalogue: Motorcycle[]
  onClose: () => void
}

export default function AddMotoForm({ catalogue, onClose }: Props) {
  const { t } = useTranslation()
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [currentKm, setCurrentKm] = useState('')
  const { mutate: addMoto, isPending, isError } = useAddMotorcycle()

  const brands = [...new Set(catalogue.map((m) => m.brand))].sort()
  const models = [...new Set(
    catalogue.filter((m) => m.brand.toLowerCase() === brand.toLowerCase()).map((m) => m.model)
  )].sort()
  const years = [...new Set(
    catalogue
      .filter((m) => m.brand.toLowerCase() === brand.toLowerCase() && m.model.toLowerCase() === model.toLowerCase())
      .map((m) => m.year)
  )].sort((a, b) => b - a)

  const isValid = brand.trim() && model.trim() && Number(year) >= 1900 && Number(currentKm) >= 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    addMoto(
      { brand: brand.trim(), model: model.trim(), year: Number(year), currentKm: Number(currentKm) },
      { onSuccess: onClose },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>{t('add_moto.title')}</h2>

      <div className={styles.fields}>
        <Input
          placeholder={t('add_moto.brand')}
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setModel('') }}
          list="brand-list"
          autoFocus
        />
        <datalist id="brand-list">
          {brands.map((b) => <option key={b} value={b} />)}
        </datalist>

        <Input
          placeholder={t('add_moto.model')}
          value={model}
          onChange={(e) => { setModel(e.target.value); setYear('') }}
          list="model-list"
        />
        <datalist id="model-list">
          {models.map((m) => <option key={m} value={m} />)}
        </datalist>

        <Input
          placeholder={t('add_moto.year')}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          list="year-list"
        />
        <datalist id="year-list">
          {years.map((y) => <option key={y} value={y} />)}
        </datalist>

        <Input
          type="number"
          placeholder={t('add_moto.current_km')}
          value={currentKm}
          onChange={(e) => setCurrentKm(e.target.value)}
          min={0}
        />
      </div>

      {isError && <p className={styles.error}>{t('add_moto.error')}</p>}

      <div className={styles.actions}>
        <Button type="submit" disabled={!isValid || isPending}>
          {t('add_moto.submit')}
        </Button>
        <Button variant="ghost" type="button" onClick={onClose}>
          {t('add_moto.cancel')}
        </Button>
      </div>
    </form>
  )
}

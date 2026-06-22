import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrashIcon, MotorcycleIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserMotorcycles, useMotorcycles, useDeleteMotorcycle } from '@/queries/useUserMotorcycles'
import AddMotoForm from '@/components/AddMotoForm'
import { Button } from '@/components/ui/Button'
import type { UserMotorcycle } from '@/types'
import styles from './SelectMotoPage.module.css'

function MotoCard({ moto, onSelect }: { moto: UserMotorcycle; onSelect: () => void }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const { mutate: deleteMoto, isPending } = useDeleteMotorcycle()

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
          <button className={styles.deleteConfirmYes} onClick={() => deleteMoto(moto.id)} disabled={isPending}>
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
          <TrashIcon size={18} weight="fill" />
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

  const isEmpty = !isLoading && !isError && motos?.length === 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Pitlog</span>
        <span className={styles.tagline}>{t('garage.tagline')}</span>
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('garage.title')}</h1>
          {!isEmpty && (
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {t('garage.add')}
            </Button>
          )}
        </div>
        <p className={styles.subtitle}>{t('garage.subtitle')}</p>

        <AnimatePresence>
          {showForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <AddMotoForm catalogue={catalogue} onClose={() => setShowForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && <p>{t('common.loading')}</p>}
        {isError && <p className={styles.error}>{t('common.error.loading')}</p>}

        <AnimatePresence mode="wait">
          {isEmpty && !showForm ? (
            <motion.div
              key="empty"
              className={styles.emptyState}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MotorcycleIcon size={64} weight="thin" className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>{t('garage.empty_state.title')}</p>
              <p className={styles.emptySubtitle}>{t('garage.empty_state.subtitle')}</p>
              <Button onClick={() => setShowForm(true)}>{t('garage.add')}</Button>
            </motion.div>
          ) : (
            <motion.div key="list" className={styles.list}>
              <AnimatePresence>
                {motos?.map((moto, index) => (
                  <motion.div
                    key={moto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                    transition={{ delay: index * 0.07, duration: 0.25, ease: 'easeOut' }}
                  >
                    <MotoCard moto={moto} onSelect={() => navigate(`/board/${moto.id}`)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <span className={styles.code}>{t('not_found.code')}</span>
      <p className={styles.title}>{t('not_found.title')}</p>
      <p className={styles.subtitle}>{t('not_found.subtitle')}</p>
      <button type="button" className={styles.back} onClick={() => navigate('/')}>
        {t('nav.back_to_home')}
      </button>
    </div>
  )
}

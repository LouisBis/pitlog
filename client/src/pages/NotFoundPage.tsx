import { useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <span className={styles.code}>404</span>
      <p className={styles.title}>Page introuvable</p>
      <p className={styles.subtitle}>Cette URL n'existe pas.</p>
      <button type="button" className={styles.back} onClick={() => navigate('/')}>
        ← Retour à l'accueil
      </button>
    </div>
  )
}

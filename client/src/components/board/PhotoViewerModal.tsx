import { Dialog } from '@/components/ui/Dialog'
import styles from './PhotoViewerModal.module.css'

interface Props {
  photoBase64: string
  alt: string
  closeLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional replace/delete controls, shown below the image — omit for a read-only viewer. */
  actions?: React.ReactNode
}

/** Full-size photo viewer, opened from a ticket's thumbnail. */
export default function PhotoViewerModal({ photoBase64, alt, closeLabel, open, onOpenChange, actions }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} closeLabel={closeLabel} label={alt}>
      <img src={photoBase64} alt={alt} className={styles.image} />
      {actions && <div className={styles.actions}>{actions}</div>}
    </Dialog>
  )
}

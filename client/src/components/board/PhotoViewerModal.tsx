import { Dialog } from '@/components/ui/Dialog'
import styles from './PhotoViewerModal.module.css'

interface Props {
  photoBase64: string
  alt: string
  closeLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Full-size photo viewer, opened from a ticket's thumbnail. */
export default function PhotoViewerModal({ photoBase64, alt, closeLabel, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} closeLabel={closeLabel}>
      <img src={photoBase64} alt={alt} className={styles.image} />
    </Dialog>
  )
}

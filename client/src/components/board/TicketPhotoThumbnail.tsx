import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PhotoViewerModal from './PhotoViewerModal'
import styles from './TicketPhotoThumbnail.module.css'

interface Props {
  photoBase64: string
}

/** Clickable thumbnail for a ticket's photo; opens the full-size viewer on click. */
export default function TicketPhotoThumbnail({ photoBase64 }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.thumbnail}
        onClick={() => setOpen(true)}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={t('ticket.photo.view_alt')}
      >
        <img src={photoBase64} alt="" className={styles.image} />
      </button>
      <PhotoViewerModal
        photoBase64={photoBase64}
        alt={t('ticket.photo.view_alt')}
        closeLabel={t('ticket.photo.close')}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

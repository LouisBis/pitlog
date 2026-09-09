import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageSquareIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/Badge'
import PhotoViewerModal from './PhotoViewerModal'
import styles from './TicketPhotoThumbnail.module.css'

interface Props {
  photoBase64: string
  /** Optional replace/delete controls, shown in the viewer below the image — omit for read-only display. */
  actions?: React.ReactNode
  /** 'image' shows the actual photo as a small square (history). 'icon' shows a badge-style indicator instead — no preview on the card (kanban). @default 'image' */
  variant?: 'image' | 'icon'
}

/** Clickable thumbnail/indicator for a ticket's photo; opens the full-size viewer on click. */
export default function TicketPhotoThumbnail({ photoBase64, actions, variant = 'image' }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          className={styles.iconTrigger}
          onClick={() => setOpen(true)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t('ticket.photo.view_alt')}
        >
          <Badge variant="neutral">
            <ImageSquareIcon size={12} weight="fill" />
          </Badge>
        </button>
      ) : (
        <button
          type="button"
          className={styles.thumbnail}
          onClick={() => setOpen(true)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t('ticket.photo.view_alt')}
        >
          <img src={photoBase64} alt="" className={styles.image} />
        </button>
      )}
      <PhotoViewerModal
        photoBase64={photoBase64}
        alt={t('ticket.photo.view_alt')}
        closeLabel={t('ticket.photo.close')}
        open={open}
        onOpenChange={setOpen}
        actions={actions}
      />
    </>
  )
}

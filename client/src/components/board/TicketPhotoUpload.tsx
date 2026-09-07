import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CameraIcon, TrashIcon } from '@phosphor-icons/react'
import type { Ticket } from '@/types'
import { resizeImage } from '@/lib/imagePhoto'
import { useUpdateTicketPhoto, useDeleteTicketPhoto } from '@/queries/useTicketPhoto'
import TicketPhotoThumbnail from './TicketPhotoThumbnail'
import styles from './TicketPhotoUpload.module.css'

interface Props {
  ticket: Ticket
}

/** Add/replace/delete control for a done ticket's photo. Renders nothing on non-done tickets. */
export default function TicketPhotoUpload({ ticket }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: updatePhoto, isPending: isUploading, isError: isUploadError } = useUpdateTicketPhoto(ticket.userMotorcycleId)
  const { mutate: deletePhoto, isPending: isDeleting, isError: isDeleteError } = useDeleteTicketPhoto(ticket.userMotorcycleId)

  if (ticket.status !== 'done') return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const resized = await resizeImage(file)
      updatePhoto({ id: ticket.id, photoBase64: resized })
    } catch {
      // resizeImage's own errors (invalid_file_type, decode failures) share the same
      // inline error message as a failed upload — no separate state needed.
    }
  }

  return (
    <div className={styles.container} onPointerDown={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />
      {ticket.photoBase64 ? (
        <div className={styles.existing}>
          <TicketPhotoThumbnail photoBase64={ticket.photoBase64} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            {t('ticket.photo.replace')}
          </button>
          <button type="button" onClick={() => deletePhoto(ticket.id)} disabled={isDeleting}>
            <TrashIcon size={14} weight="fill" />
            {t('ticket.photo.delete')}
          </button>
        </div>
      ) : (
        <button type="button" className={styles.addBtn} onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <CameraIcon size={14} weight="fill" />
          {t('ticket.photo.add')}
        </button>
      )}
      {(isUploadError || isDeleteError) && <span className={styles.error}>{t('ticket.photo.error')}</span>}
    </div>
  )
}

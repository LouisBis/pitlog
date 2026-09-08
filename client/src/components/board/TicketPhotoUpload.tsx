import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CameraIcon, TrashIcon } from '@phosphor-icons/react'
import type { Ticket } from '@/types'
import { resizeImage } from '@/lib/imagePhoto'
import { useUpdateTicketPhoto, useDeleteTicketPhoto } from '@/queries/useTicketPhoto'
import { Button } from '@/components/ui/Button'
import TicketPhotoThumbnail from './TicketPhotoThumbnail'
import styles from './TicketPhotoUpload.module.css'

interface Props {
  ticket: Ticket
}

/** Add/replace/delete control for a done ticket's photo. Renders nothing on non-done tickets. */
export default function TicketPhotoUpload({ ticket }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    mutate: updatePhoto,
    isPending: isUploading,
    isError: isUploadError,
    reset: resetUpdate,
  } = useUpdateTicketPhoto(ticket.userMotorcycleId)
  const {
    mutate: deletePhoto,
    isPending: isDeleting,
    isError: isDeleteError,
    reset: resetDelete,
  } = useDeleteTicketPhoto(ticket.userMotorcycleId)
  const [localError, setLocalError] = useState<string | null>(null)

  if (ticket.status !== 'done') return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    resetUpdate()
    resetDelete()
    setLocalError(null)
    if (!file) return
    try {
      const resized = await resizeImage(file)
      updatePhoto({ id: ticket.id, photoBase64: resized })
    } catch (err) {
      // resizeImage's own errors (invalid_file_type, decode failures) get their own
      // inline message — they never reach the mutation, so isUploadError stays false.
      setLocalError(err instanceof Error ? err.message : 'image_decode_failed')
    }
  }

  const handleDeleteClick = () => {
    resetUpdate()
    resetDelete()
    setLocalError(null)
    deletePhoto(ticket.id)
  }

  const error =
    (isUploadError || isDeleteError) ? t('ticket.photo.error')
    : localError === 'invalid_file_type' ? t('ticket.photo.invalid_type')
    : localError ? t('ticket.photo.error')
    : null

  return (
    <div className={styles.container} onPointerDown={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />
      {ticket.photoBase64 ? (
        <TicketPhotoThumbnail
          photoBase64={ticket.photoBase64}
          actions={
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {t('ticket.photo.replace')}
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={handleDeleteClick} disabled={isDeleting}>
                <TrashIcon size={14} weight="fill" />
                {t('ticket.photo.delete')}
              </Button>
              {error && <span className={styles.error}>{error}</span>}
            </>
          }
        />
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <CameraIcon size={14} weight="fill" />
          {t('ticket.photo.add')}
        </Button>
      )}
      {!ticket.photoBase64 && error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

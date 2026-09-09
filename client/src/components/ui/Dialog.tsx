import * as RadixDialog from '@radix-ui/react-dialog'
import { XIcon } from '@phosphor-icons/react'
import styles from './Dialog.module.css'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  closeLabel: string
  /** Accessible name for the dialog itself (aria-label on the dialog content). */
  label: string
}

/** Centered modal overlay built on Radix Dialog. Closes on outside click, Escape, or the close button. */
export function Dialog({ open, onOpenChange, children, closeLabel, label }: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={styles.content} aria-label={label}>
          {children}
          <RadixDialog.Close className={styles.close} aria-label={closeLabel}>
            <XIcon size={16} weight="bold" />
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

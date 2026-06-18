import * as RadixSwitch from '@radix-ui/react-switch'
import styles from './Switch.module.css'

interface Props {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ id, checked, onCheckedChange, disabled }: Props) {
  return (
    <RadixSwitch.Root
      id={id}
      className={styles.root}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    >
      <RadixSwitch.Thumb className={styles.thumb} />
    </RadixSwitch.Root>
  )
}

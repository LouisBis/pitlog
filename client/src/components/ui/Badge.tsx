import styles from './Badge.module.css'

type Variant = 'urgent' | 'warning' | 'ok' | 'done' | 'neutral'

interface Props {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', className, ...props }: Props) {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ')
  return <span className={classes} {...props} />
}

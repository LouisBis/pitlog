import styles from './Input.module.css'

type Size = 'sm' | 'md'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean
  size?: Size
}

export function Input({ error, size = 'md', className, type, ...props }: Props) {
  const isNumeric = type === 'number'
  const classes = [
    styles.input,
    styles[size],
    error && styles.error,
    isNumeric && styles.mono,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <input className={classes} type={type} {...props} />
}

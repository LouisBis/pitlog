import styles from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'text'
type Size = 'sm' | 'md'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  const classes = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')

  return <button className={classes} {...props} />
}

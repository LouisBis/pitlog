import inputStyles from './Input.module.css'

type Size = 'sm' | 'md'

interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: Size
}

/** Styled native <select>, sharing Input's visual language (border, radius, focus ring). */
export function Select({ size = 'md', className, children, ...props }: Props) {
  const classes = [inputStyles.input, inputStyles[size], className].filter(Boolean).join(' ')
  return (
    <select className={classes} {...props}>
      {children}
    </select>
  )
}

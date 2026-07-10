import styles from './Skeleton.module.css'

interface Props {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({ width, height, className }: Props) {
  return <div className={[styles.skeleton, className].filter(Boolean).join(' ')} style={{ width, height }} />
}

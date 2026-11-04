import { useEffect, useState } from 'react'
import { useLocale } from '../i18n'
import styles from './GestureGuide.module.css'

type Phase = 'pinch' | 'rotate'

interface Props {
  open: boolean
  onClose: () => void
}

/** Motion-graphic gesture overlay. Shown either on first launch (parent
 *  manages the seen flag) or when the user taps the ? help button.
 *  Cycles pinch-to-resize → two-finger drag-to-rotate for 3.5 s, then
 *  auto-dismisses. Tapping the backdrop also closes it. The dots sit
 *  directly over the slime (no card / sheet) so the gesture reads
 *  against the thing it operates on. */
export default function GestureGuide({ open, onClose }: Props) {
  const { locale } = useLocale()
  const [phase, setPhase] = useState<Phase>('pinch')

  // Reset to pinch every time the overlay opens so returning users
  // don't catch the tail end of a previous rotate cycle.
  useEffect(() => {
    if (open) setPhase('pinch')
  }, [open])

  // Phase schedule: 2.5 s pinch, then 2.5 s rotate, auto-close at
  // 5 s total. Timers cleared on close / unmount to avoid flashing
  // state updates after the overlay is gone.
  useEffect(() => {
    if (!open) return
    const toRotate = window.setTimeout(() => setPhase('rotate'), 2500)
    const toClose = window.setTimeout(() => onClose(), 5000)
    return () => {
      window.clearTimeout(toRotate)
      window.clearTimeout(toClose)
    }
  }, [open, onClose])

  if (!open) return null

  const t = (ko: string, en: string) => (locale === 'ko' ? ko : en)

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      {phase === 'pinch' && (
        <div className={styles.stage}>
          <div className={`${styles.finger} ${styles.pinchA}`} />
          <div className={`${styles.finger} ${styles.pinchB}`} />
        </div>
      )}
      {phase === 'rotate' && (
        <div className={styles.stage}>
          <div className={`${styles.finger} ${styles.rotateA}`} />
          <div className={`${styles.finger} ${styles.rotateB}`} />
        </div>
      )}

      <div className={styles.captionWrap}>
        <div className={styles.captionTitle}>
          {phase === 'pinch'
            ? t('핀치 → 크기 조절', 'Pinch → Resize')
            : t('두 손가락 드래그 → 회전', 'Two-finger drag → Rotate')}
        </div>
        <div className={styles.captionHint}>
          {phase === 'pinch'
            ? t('두 손가락을 벌리거나 모으세요', 'Spread or pinch two fingers')
            : t('두 손가락을 함께 끌어 돌리세요', 'Drag two fingers together to turn')}
        </div>
      </div>
    </div>
  )
}

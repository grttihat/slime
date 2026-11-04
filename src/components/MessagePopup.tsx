import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { useLocale } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { ENV } from '../env'
import styles from './MessagePopup.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

/** Compact message form opened from the left drawer. Submits to
 *  EmailJS (frontend-only service) which routes the message to the
 *  developer's inbox. No separate mail-app round-trip. */
export default function MessagePopup({ open, onClose }: Props) {
  const { locale } = useLocale()
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const t = (ko: string, en: string) => (locale === 'ko' ? ko : en)

  if (!open) return null

  const close = () => {
    setBody('')
    setStatus('idle')
    setErrorMsg(null)
    onClose()
  }

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || status === 'sending') return
    if (
      !ENV.EMAILJS_PUBLIC_KEY ||
      !ENV.EMAILJS_SERVICE_ID ||
      !ENV.EMAILJS_TEMPLATE_ID
    ) {
      setStatus('error')
      setErrorMsg(
        t(
          '메시지 서비스 설정이 완료되지 않았어요.',
          'Message service is not configured yet.'
        )
      )
      return
    }
    setStatus('sending')
    setErrorMsg(null)
    try {
      await emailjs.send(
        ENV.EMAILJS_SERVICE_ID,
        ENV.EMAILJS_TEMPLATE_ID,
        {
          message: trimmed,
          locale,
          from_email: user?.email ?? '(anonymous)',
          from_name:
            (user?.user_metadata?.name as string | undefined) ??
            user?.email ??
            'anonymous'
        },
        { publicKey: ENV.EMAILJS_PUBLIC_KEY }
      )
      setStatus('sent')
      // Auto-close after a short "sent" confirmation flash so the
      // user sees it registered before the sheet drops.
      window.setTimeout(close, 1200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err instanceof Error
          ? err.message
          : t('전송에 실패했어요.', 'Failed to send.')
      )
    }
  }

  const sending = status === 'sending'
  const sent = status === 'sent'

  return (
    <div className={styles.backdrop} role="dialog" aria-modal onClick={close}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            {t('개발자에게 메시지', 'Message the developer')}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label={t('닫기', 'Close')}
          >
            ×
          </button>
        </div>

        <div className={styles.subtitle}>
          {t(
            '궁금한 점이나 피드백을 자유롭게 적어주세요.',
            'Share a question or feedback.'
          )}
        </div>

        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('메시지를 입력하세요…', 'Write your message…')}
          rows={6}
          disabled={sending || sent}
          autoFocus
        />

        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        <button
          type="button"
          className={styles.send}
          onClick={handleSend}
          disabled={!body.trim() || sending || sent}
        >
          {sent
            ? t('전송 완료', 'Sent')
            : sending
              ? t('전송 중…', 'Sending…')
              : t('보내기', 'Send')}
        </button>
      </div>
    </div>
  )
}

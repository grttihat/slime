import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { usePremium } from '../hooks/usePremium'
import { useLocale } from '../i18n'
import { restorePurchases } from '../lib/revenuecat'
import Paywall from './Paywall'
import styles from './AccountDrawerSection.module.css'

const BENEFITS = [
  '무제한 슬라임 저장 & 공유',
  '광고 없이 매끄러운 경험'
]

function initialFor(name: string | null | undefined, email: string | null | undefined): string {
  const base = (name && name.trim()) || (email && email.split('@')[0]) || '?'
  return base.charAt(0).toUpperCase()
}

interface Props { onCloseDrawer?: () => void }

/** Top slot is empty by design — all premium entry points now live in the
 *  footer status pill. Kept exported so SlimeApp's drawer layout keeps
 *  working without changes. */
export function AccountDrawerTop(_: Props) {
  return null
}

/** Bottom slot: profile row (avatar + name + clickable status pill) +
 *  logout, with a modal that opens from the pill to show benefits and the
 *  purchase / restore actions. */
export function AccountDrawerFooter({ onCloseDrawer }: Props) {
  const { user, signOut } = useAuth()
  const { isPremium, refresh } = usePremium()
  const { locale } = useLocale()
  const [signingOut, setSigningOut] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null)

  const profile = user?.user_metadata ?? {}
  const displayName = (profile.name as string | undefined) ?? (profile.full_name as string | undefined) ?? null
  const avatarUrl = (profile.avatar_url as string | undefined) ?? (profile.picture as string | undefined) ?? null
  const email = user?.email ?? null

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      sessionStorage.removeItem('wakbu.usage.consumed')
      await signOut()
    } finally {
      setSigningOut(false)
      onCloseDrawer?.()
    }
  }

  const handleSubscribe = () => {
    setDetailsOpen(false)
    setPaywallOpen(true)
  }

  const handleRestore = async () => {
    setRestoring(true)
    setRestoreMsg(null)
    try {
      await restorePurchases()
      await refresh()
      setRestoreMsg('구매 상태를 다시 불러왔어요.')
    } catch (err) {
      setRestoreMsg(err instanceof Error ? err.message : '복원에 실패했어요.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className={styles.footer}>
      {/* TEMPORARY: profile row click is disabled while payments are
          off — opening the premium panel would surface a purchase CTA
          that currently has no live payment flow behind it. Rendered as
          a plain div so it looks the same but doesn't react to taps.
          Revert to <button onClick=...> when the paywall ships. */}
      <div className={styles.profile} aria-label="계정">
        <div className={styles.avatar}>
          {avatarUrl ? <img src={avatarUrl} alt="" /> : initialFor(displayName, email)}
        </div>
        <div className={styles.profileText}>
          <div className={styles.name}>{displayName ?? email ?? '사용자'}</div>
          {email && displayName && <div className={styles.email}>{email}</div>}
        </div>
      </div>

      <button className={styles.logout} onClick={handleSignOut} disabled={signingOut}>
        <span>
          {signingOut
            ? locale === 'ko' ? '로그아웃 중…' : 'Signing out…'
            : locale === 'ko' ? '로그아웃' : 'Sign out'}
        </span>
        <span className={styles.chevron}>›</span>
      </button>

      {detailsOpen && (
        <aside className={styles.premiumPanel} role="dialog" aria-label="프리미엄">
          <div className={styles.premiumHeader}>
            <button
              type="button"
              className={styles.premiumBack}
              onClick={() => setDetailsOpen(false)}
              aria-label="뒤로"
            >
              ‹
            </button>
            <div className={styles.premiumTitle}>플랜</div>
          </div>

          <div className={styles.premiumStatusRow}>
            <span className={styles.cardTitle}>현재 상태</span>
            <span className={isPremium ? styles.badgePro : styles.badgeFree}>
              {isPremium ? '프리미엄' : '일반'}
            </span>
          </div>

          <div className={styles.premiumSubtitle}>soundslime 프리미엄</div>
          <ul className={styles.benefitList}>
            {BENEFITS.map((b) => <li key={b}>{b}</li>)}
          </ul>

          {restoreMsg && <div className={styles.subLine}>{restoreMsg}</div>}

          <div className={styles.premiumActions}>
            {!isPremium && (
              <button className={styles.primaryBtn} onClick={handleSubscribe}>
                프리미엄 구매하기
              </button>
            )}
            {isPremium && (
              <button
                className={styles.secondaryBtn}
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring ? '적용 중…' : '프리미엄 재적용'}
              </button>
            )}
          </div>
        </aside>
      )}

      <Paywall
        open={paywallOpen}
        onClose={async () => {
          setPaywallOpen(false)
          await refresh()
          onCloseDrawer?.()
        }}
      />
    </div>
  )
}

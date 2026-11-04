import { useCallback, useEffect, useState } from 'react'
import { usePremium } from './usePremium'
import { useAuth } from '../auth/AuthContext'

const SAVE_LIMIT = 2
const SHARE_LIMIT = 2

function saveKey(userId: string | null | undefined): string {
  return `wakbu.freeTier.saveCount:${userId ?? '__anon__'}`
}
function shareKey(userId: string | null | undefined): string {
  return `wakbu.freeTier.shareCount:${userId ?? '__anon__'}`
}

function readCount(key: string): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(key)
  const n = raw ? parseInt(raw, 10) : 0
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function writeCount(key: string, n: number) {
  try { window.localStorage.setItem(key, String(n)) } catch { /* private mode */ }
}

/** Lifetime save / share counters for the free tier. Persisted in
 *  localStorage, scoped to the signed-in user so switching accounts on
 *  the same device doesn't carry one user's quota onto another. Resets
 *  if the user clears app data — acceptable loophole given the price
 *  point. Premium always allows. */
export function useFreeTierLimits() {
  const { isPremium } = usePremium()
  const { user } = useAuth()
  const sk = saveKey(user?.id)
  const shk = shareKey(user?.id)
  const [saveCount, setSaveCount] = useState(() => readCount(sk))
  const [shareCount, setShareCount] = useState(() => readCount(shk))

  // Re-hydrate whenever the active user changes OR premium flips (the
  // latter happens via the restore flow). The keys depend on user.id,
  // so switching accounts loads that user's own counters without
  // leaking the previous user's quota.
  useEffect(() => {
    setSaveCount(readCount(sk))
    setShareCount(readCount(shk))
  }, [sk, shk, isPremium])

  // TEMPORARY: payments are disabled while we iterate on the IAP flow,
  // so free-tier users would be stuck at the 2-save / 2-share cap with
  // no way to upgrade. Hard-code unlimited until the paywall ships; the
  // counters stay wired so re-enabling is a one-line revert.
  const canSave = true
  const canShare = true

  const incrementSave = useCallback(() => {
    if (isPremium) return
    setSaveCount((n) => {
      const next = n + 1
      writeCount(sk, next)
      return next
    })
  }, [isPremium, sk])

  const incrementShare = useCallback(() => {
    if (isPremium) return
    setShareCount((n) => {
      const next = n + 1
      writeCount(shk, next)
      return next
    })
  }, [isPremium, shk])

  return {
    saveCount,
    shareCount,
    saveLimit: SAVE_LIMIT,
    shareLimit: SHARE_LIMIT,
    canSave,
    canShare,
    incrementSave,
    incrementShare
  }
}

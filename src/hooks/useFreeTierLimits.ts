import { useCallback, useEffect, useState } from 'react'
import { usePremium } from './usePremium'

const SAVE_LIMIT = 2
const SHARE_LIMIT = 2
const SAVE_KEY = 'wakbu.freeTier.saveCount'
const SHARE_KEY = 'wakbu.freeTier.shareCount'

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
 *  localStorage — resets if the user clears app data, which is an
 *  acceptable loophole given the low price point. Premium always allows. */
export function useFreeTierLimits() {
  const { isPremium } = usePremium()
  const [saveCount, setSaveCount] = useState(() => readCount(SAVE_KEY))
  const [shareCount, setShareCount] = useState(() => readCount(SHARE_KEY))

  // Re-read on premium flip in case we were off-device for the actual
  // purchase (restore flow) — keeps counts in sync with storage.
  useEffect(() => {
    setSaveCount(readCount(SAVE_KEY))
    setShareCount(readCount(SHARE_KEY))
  }, [isPremium])

  const canSave = isPremium || saveCount < SAVE_LIMIT
  const canShare = isPremium || shareCount < SHARE_LIMIT

  const incrementSave = useCallback(() => {
    if (isPremium) return
    setSaveCount((n) => {
      const next = n + 1
      writeCount(SAVE_KEY, next)
      return next
    })
  }, [isPremium])

  const incrementShare = useCallback(() => {
    if (isPremium) return
    setShareCount((n) => {
      const next = n + 1
      writeCount(SHARE_KEY, next)
      return next
    })
  }, [isPremium])

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
